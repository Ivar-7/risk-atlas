from __future__ import annotations

from copy import deepcopy
import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

from app.engine.drainage_rule import apply_drainage_correction
from app.engine.exposure_rules import exposure_from_groups, parse_free_text
from app.engine.coordinate_schedule import coordinate_exposure, validate_coordinate_rows
from app.engine.briefing import underwriter_briefing
from app.engine.config_load import load_assumptions, load_parameters, scenario_order
from app.engine.financial import insured_losses, location_aal, portfolio_aal, portfolio_reinsurance, scenario_losses
from app.engine.hazard_validation import hotspot_validation, proxy_score
from app.engine.geo import haversine_km
from app.engine.ingestion import IngestedData, load_portfolio
from app.engine.shap_explainer import LocationExplainer
from app.engine.simulated_ep import simulated_ep
from app.engine.vulnerability import vulnerability_matrix


def _attach_hotspots(exposure: pd.DataFrame, hotspots: pd.DataFrame) -> pd.DataFrame:
    loc_lat = exposure["lat"].to_numpy()[:, None]
    loc_lon = exposure["lon"].to_numpy()[:, None]
    hs_lat = hotspots["lat"].to_numpy()[None, :]
    hs_lon = hotspots["lon"].to_numpy()[None, :]
    dist = haversine_km(loc_lat, loc_lon, hs_lat, hs_lon)
    nearest = dist.argmin(axis=1)
    out = exposure.copy()
    out["nearest_hotspot"] = hotspots["name"].to_numpy()[nearest]
    out["distance_to_hotspot_km"] = dist.min(axis=1)
    return out


def _fill_hazard_from_rasters(extra: pd.DataFrame, names: list[str]) -> pd.DataFrame:
    if extra.empty:
        return extra
    filled = extra.copy()
    for name in names:
        col = f"hazard_score_{name}"
        filled[col] = [proxy_score(float(row["lat"]), float(row["lon"]), name) for _, row in extra.iterrows()]
    return filled


def _class_rows(exposure: pd.DataFrame, aal: np.ndarray, ground_up_aal: np.ndarray, losses: dict[str, np.ndarray], ground_up_losses: dict[str, np.ndarray], names: list[str]) -> list[dict]:
    rows = []
    for klass, group in exposure.groupby("housing_class"):
        idx = group.index.to_numpy()
        rec = {
            "housing_class": klass,
            "locations": int(len(group)),
            "tiv_kes": float(group["tiv_kes"].sum()),
            "aal_kes": float(aal[idx].sum()),
            "ground_up_aal_kes": float(ground_up_aal[idx].sum()),
            "loss_cost_pct": float(100 * aal[idx].sum() / max(group["tiv_kes"].sum(), 1.0)),
        }
        for name in names:
            rec[f"loss_{name}_kes"] = float(losses[name][idx].sum())
            rec[f"ground_up_loss_{name}_kes"] = float(ground_up_losses[name][idx].sum())
        rows.append(rec)
    return sorted(rows, key=lambda r: r["aal_kes"], reverse=True)


def run_model(payload: dict[str, Any] | None = None, ingested: IngestedData | None = None) -> dict[str, Any]:
    params = load_parameters()
    names = scenario_order(params)
    body = payload or {}
    apply_drainage = bool(body.get("apply_drainage_correction", params["defaults"]["apply_drainage_correction"]))
    free_text = str(body.get("free_text") or "")
    deductible_pct = float(body.get("deductible_pct", params["defaults"]["deductible_pct"]))
    policy_limit_pct = float(body.get("policy_limit_pct", params["defaults"]["policy_limit_pct"]))
    quota_share_ceded_pct = float(body.get("quota_share_ceded_pct", params["defaults"]["quota_share_ceded_pct"]))
    cat_xol_applies = bool(body.get("cat_xol_applies", params["defaults"]["cat_xol_applies"]))
    cat_xol_attachment_kes = body.get("cat_xol_attachment_kes")
    cat_xol_limit_kes = body.get("cat_xol_limit_kes")
    cat_xol_attachment_kes = float(cat_xol_attachment_kes) if cat_xol_attachment_kes is not None else None
    cat_xol_limit_kes = float(cat_xol_limit_kes) if cat_xol_limit_kes is not None else None
    if not np.isfinite(deductible_pct) or not np.isfinite(policy_limit_pct) or not 0 <= deductible_pct <= 100 or not 0 <= policy_limit_pct <= 100:
        raise ValueError("Policy percentages must be finite values between 0 and 100")

    data = ingested or load_portfolio()
    reviewed_groups = body.get("exposure_groups")
    if reviewed_groups is not None:
        if body.get('coordinate_rows') is not None:
            coordinate_rows = validate_coordinate_rows(body['coordinate_rows'], reviewed_groups, data.hotspots)
            extra = coordinate_exposure(coordinate_rows)
            parse_meta = {'parsed': bool(coordinate_rows), 'rows_added': len(coordinate_rows),
                          'groups': reviewed_groups, 'notes': ['Rows use reviewed, user-supplied coordinates; address accuracy is not independently verified.']}
        else:
            extra, parse_meta = exposure_from_groups(reviewed_groups, data.hotspots)
        parse_meta["source"] = body.get("exposure_source", "reviewed")
    else:
        extra, parse_meta = parse_free_text(free_text, data.hotspots)
        parse_meta["source"] = "rules" if len(extra) else "none"
    extra = _fill_hazard_from_rasters(extra, names)
    exposure = pd.concat([data.exposure, extra], ignore_index=True)
    exposure = _attach_hotspots(exposure, data.hotspots)

    baseline_ground_up = scenario_losses(exposure, params)
    sensitivity_exposure, sensitivity_meta = apply_drainage_correction(exposure, data.hotspots, True, params)
    corrected, drainage_meta = apply_drainage_correction(exposure, data.hotspots, apply_drainage, params)
    ground_up_losses = scenario_losses(corrected, params)
    original_corrected, _ = apply_drainage_correction(_attach_hotspots(data.exposure, data.hotspots), data.hotspots, apply_drainage, params)
    original_ground_up = scenario_losses(original_corrected, params)
    tiv = corrected["tiv_kes"].to_numpy(dtype=float)
    baseline_losses = insured_losses(baseline_ground_up, tiv, deductible_pct, policy_limit_pct)
    sensitivity_losses = insured_losses(scenario_losses(sensitivity_exposure, params), tiv, deductible_pct, policy_limit_pct)
    losses = insured_losses(ground_up_losses, tiv, deductible_pct, policy_limit_pct)
    reinsurance = portfolio_reinsurance(
        {name: float(losses[name].sum()) for name in names},
        quota_share_ceded_pct, cat_xol_applies, cat_xol_attachment_kes, cat_xol_limit_kes,
    )
    net_losses = {name: reinsurance[name]["net_loss_kes"] for name in names}
    net_aal = portfolio_aal(net_losses, params)
    drainage_meta["sensitivity_buildings_uplifted"] = sensitivity_meta["buildings_uplifted"]
    drainage_meta["sensitivity_missed_hotspots"] = sensitivity_meta["missed_hotspots"]
    original_losses = insured_losses(original_ground_up, original_corrected["tiv_kes"].to_numpy(dtype=float), deductible_pct, policy_limit_pct)
    original_reinsurance = portfolio_reinsurance(
        {name: float(original_losses[name].sum()) for name in names},
        quota_share_ceded_pct, cat_xol_applies, cat_xol_attachment_kes, cat_xol_limit_kes,
    )
    original_net_losses = {name: original_reinsurance[name]["net_loss_kes"] for name in names}
    aal = location_aal(losses, params)
    ground_up_aal = location_aal(ground_up_losses, params)
    original_aal = location_aal(original_losses, params)

    scenarios = []
    for name in names:
        spec = params["return_periods"][name]
        scenarios.append(
            {
                "tier": name,
                "return_period_years": spec["years"],
                "annual_exceedance": spec["annual_exceedance"],
                "meaning": spec["meaning"],
                "return_period_provenance": "ASSUMPTION",
                "loss_kes": float(losses[name].sum()),
                "ground_up_loss_kes": float(ground_up_losses[name].sum()),
                **reinsurance[name],
                "baseline_loss_kes": float(baseline_losses[name].sum()),
                "drainage_sensitivity_loss_kes": float(sensitivity_losses[name].sum()),
                "affected_locations": int((ground_up_losses[name] > 0).sum()),
                "affected_tiv_kes": float(tiv[ground_up_losses[name] > 0].sum()),
            }
        )
    if any(later["loss_kes"] + 0.01 < earlier["loss_kes"] for earlier, later in zip(scenarios, scenarios[1:])):
        raise ValueError("Scenario losses must increase with assumed return period")

    explainer = LocationExplainer(corrected, aal)
    explanations = {
        loc_id: explainer.explain_row(i, loc_id, float(aal[i]))
        for i, loc_id in enumerate(corrected["loc_id"].tolist())
    }

    locations = []
    for i, row in corrected.iterrows():
        i = int(i)
        rec = {
            "loc_id": row["loc_id"],
            "lat": float(row["lat"]),
            "lon": float(row["lon"]),
            "housing_class": row["housing_class"],
            "floor_area_m2": float(row["floor_area_m2"]),
            "tiv_kes": float(row["tiv_kes"]),
            "deductible_kes": float(row["tiv_kes"] * deductible_pct / 100),
            "policy_limit_kes": float(row["tiv_kes"] * policy_limit_pct / 100),
            "synthetic": bool(row["synthetic"]),
            "source": str(row.get("source", "starter kit")),
            "coordinate_source": str(row["coordinate_source"]) if "coordinate_source" in row and pd.notna(row["coordinate_source"]) else "",
            "address": str(row["address"]) if "address" in row and pd.notna(row["address"]) else "",
            "nearest_hotspot": row["nearest_hotspot"],
            "distance_to_hotspot_km": float(row["distance_to_hotspot_km"]),
            "drainage_uplift": float(row.get("drainage_uplift", 0.0)),
            "aal_kes": float(aal[i]),
            "ground_up_aal_kes": float(ground_up_aal[i]),
            "loss_cost_pct": float(100 * aal[i] / max(row["tiv_kes"], 1.0)),
            "scenario_losses_kes": {name: float(losses[name][i]) for name in names},
            "ground_up_scenario_losses_kes": {name: float(ground_up_losses[name][i]) for name in names},
            "hazard_scores": {name: float(row[f"hazard_score_{name}"]) for name in names},
        }
        for name in names:
            rec[f"loss_{name}_kes"] = float(losses[name][i])
            rec[f"ground_up_loss_{name}_kes"] = float(ground_up_losses[name][i])
            rec[f"hazard_{name}"] = float(row[f"hazard_score_{name}"])
        locations.append(rec)

    loss_100 = next(s for s in scenarios if s["return_period_years"] == 100)
    loss_250 = next(s for s in scenarios if s["return_period_years"] == 250)
    class_rows = _class_rows(corrected.reset_index(drop=True), aal, ground_up_aal, losses, ground_up_losses, names)
    synthetic_count = int(corrected["synthetic"].sum())
    location_frame = pd.DataFrame(locations)
    location_frame["area"] = np.where(location_frame["distance_to_hotspot_km"] <= 1.5, location_frame["nearest_hotspot"], "Outside 1.5 km of named centres")
    hotspot_rows = (
        location_frame
        .groupby("area", as_index=False)
        .agg(locations=("loc_id", "count"), tiv_kes=("tiv_kes", "sum"), aal_kes=("aal_kes", "sum"))
        .sort_values("aal_kes", ascending=False)
        .to_dict(orient="records")
    )
    validation = hotspot_validation(data.hotspots)
    frequency_sensitivity = []
    for multiplier in (0.5, 1.0, 2.0):
        alternate = deepcopy(params)
        for spec in alternate["return_periods"].values():
            spec["years"] *= multiplier
            spec["annual_exceedance"] = 1.0 / spec["years"]
        frequency_sensitivity.append({"return_period_multiplier": multiplier, "aal_kes": float(location_aal(losses, alternate).sum()), "net_aal_kes": portfolio_aal(net_losses, alternate)})

    result = {
        "run_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model": params["model"],
        "controls": {"apply_drainage_correction": apply_drainage, "free_text": free_text, "exposure_source": parse_meta["source"], "deductible_pct": deductible_pct, "policy_limit_pct": policy_limit_pct, "quota_share_ceded_pct": quota_share_ceded_pct, "cat_xol_applies": cat_xol_applies, "cat_xol_attachment_kes": cat_xol_attachment_kes if cat_xol_applies else None, "cat_xol_limit_kes": cat_xol_limit_kes if cat_xol_applies else None},
        "exposure_review": body.get("exposure_review"),
        "coordinate_review": body.get("coordinate_review"),
        "exposure_comparison": {
            "basis": "Same starter portfolio, drainage setting, hazard, vulnerability, property terms and portfolio treaty; only the reviewed synthetic rows differ.",
            "without_added": {
                "locations": int(len(data.exposure)),
                "total_tiv_kes": float(data.exposure["tiv_kes"].sum()),
                "aal_kes": float(original_aal.sum()),
                "scenarios": {name: float(original_losses[name].sum()) for name in names},
                "net_aal_kes": portfolio_aal(original_net_losses, params),
                "net_scenarios": original_net_losses,
            },
            "with_added": {
                "locations": int(len(corrected)),
                "total_tiv_kes": float(tiv.sum()),
                "aal_kes": float(aal.sum()),
                "scenarios": {name: float(losses[name].sum()) for name in names},
                "net_aal_kes": net_aal,
                "net_scenarios": net_losses,
            },
        },
        "input_hashes": {"exposure": data.exposure_hash, "hotspots": data.hotspots_hash},
        "labels": {
            "exposure": f"{synthetic_count} of {len(corrected)} rows are sample exposure records from the input CSV or free-text parser; provenance is not independently verified",
            "hotspots": f"{len(data.hotspots)} geocoded named hotspots from the input CSV",
            "hazard": "PROXY (not measured flood depth)",
            "severity_mapping": "ASSUMPTION (positive score activates the fixed construction × source-tier damage ratio; zero score gives zero damage)",
            "return_periods": "ASSUMPTION (tiers have no years in the kit)",
            "drainage": "UNVALIDATED SENSITIVITY; uplift centres are the proxy-missed hotspots used to construct the rule, so their uplift is not an independent accuracy test",
            "vulnerability": "ASSUMED five-tier construction damage matrix, informed by the JRC Africa residential reference",
            "loss": f"MODELLED ground-up, gross insured and net portfolio loss; each property has an assumed {deductible_pct:g}% TIV deductible and {policy_limit_pct:g}% TIV policy limit. Aggregate gross is ceded {quota_share_ceded_pct:g}% to quota share, then an optional catastrophe layer applies to the retained event loss.",
        },
        "disclaimer": (
            f"{synthetic_count} of {len(corrected)} exposure locations are sample records. "
            "Hazard is a constructed pluvial proxy. Return periods and class-by-tier damage ratios are assumptions. "
            "Property policy and portfolio treaty terms are synthetic assumptions. The drainage uplift is an unvalidated sensitivity, not evidence of predictive accuracy. Portfolio provenance must be verified before operational use."
        ),
        "metrics": {
            "locations": int(len(corrected)),
            "synthetic_locations": synthetic_count,
            "starter_kit_locations": int(len(data.exposure)),
            "free_text_locations": int(len(extra)),
            "total_tiv_kes": float(tiv.sum()),
            "aal_kes": float(aal.sum()),
            "ground_up_aal_kes": float(ground_up_aal.sum()),
            "net_aal_kes": net_aal,
            "loss_cost_pct": float(100 * aal.sum() / max(float(tiv.sum()), 1.0)),
            "loss_1_in_100_kes": loss_100["loss_kes"],
            "ground_up_loss_1_in_100_kes": loss_100["ground_up_loss_kes"],
            "net_loss_1_in_100_kes": loss_100["net_loss_kes"],
            "loss_1_in_250_kes": loss_250["loss_kes"],
            "ground_up_loss_1_in_250_kes": loss_250["ground_up_loss_kes"],
            "net_loss_1_in_250_kes": loss_250["net_loss_kes"],
            "baseline_1_in_100_kes": loss_100["baseline_loss_kes"],
            "drainage_delta_1_in_100_kes": loss_100["drainage_sensitivity_loss_kes"] - loss_100["baseline_loss_kes"],
            "exposure_delta_1_in_100_kes": loss_100["loss_kes"] - float(original_losses["occasional"].sum()),
        },
        "scenarios": scenarios,
        "ep_curve": [
            {
                "tier": s["tier"],
                "return_period_years": s["return_period_years"],
                "annual_exceedance": s["annual_exceedance"],
                "loss_kes": s["loss_kes"],
                "ground_up_loss_kes": s["ground_up_loss_kes"],
                "quota_share_recovery_kes": s["quota_share_recovery_kes"],
                "retained_before_cat_kes": s["retained_before_cat_kes"],
                "cat_xol_recovery_kes": s["cat_xol_recovery_kes"],
                "net_loss_kes": s["net_loss_kes"],
                "baseline_loss_kes": s["baseline_loss_kes"],
                "drainage_sensitivity_loss_kes": s["drainage_sensitivity_loss_kes"],
                "provenance": "ASSUMPTION",
            }
            for s in scenarios
        ],
        "simulated_ep": simulated_ep(scenarios, float(tiv.sum()), seed=int(params["defaults"]["random_seed"])),
        "by_housing_class": class_rows,
        "by_hotspot": hotspot_rows,
        "vulnerability_matrix": vulnerability_matrix(params),
        "sensitivity": {"return_periods": frequency_sensitivity},
        "interventions": {
            "drainage": drainage_meta,
            "free_text": parse_meta,
            "drainage_delta_1_in_100_kes": loss_100["drainage_sensitivity_loss_kes"] - loss_100["baseline_loss_kes"],
            "effect": (
                "The optional drainage uplift is an unvalidated sensitivity constructed around proxy-missed hotspot centres; those same centres cannot show improved predictive accuracy. "
                + ("Model-extracted, reviewed exposure changes TIV and loss. " if parse_meta["source"] == "openai" and len(extra) else "No model-backed exposure was used in this run. ")
                + "SHAP explains a surrogate after the loss calculation."
            ),
        },
        "explainability": {
            "surrogate_r2": explainer.r2,
            "global_shap": explainer.global_importance(),
            "note": "Physics loss is authoritative. SHAP explains a surrogate of location AAL.",
        },
        "top_locations": sorted(locations, key=lambda r: r["aal_kes"], reverse=True)[:15],
        "locations": locations,
        "explanations": explanations,
        "hazard_validation": {key: value for key, value in validation.items() if key != "hotspots"},
        "hotspots": validation["hotspots"],
        "assumptions": load_assumptions()["assumptions"],
    }
    result["briefing"] = underwriter_briefing(result)
    return result
