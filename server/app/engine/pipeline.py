from __future__ import annotations

from copy import deepcopy
import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

from app.engine.drainage_rule import apply_drainage_correction
from app.engine.exposure_rules import exposure_from_groups, parse_free_text
from app.engine.briefing import underwriter_briefing
from app.engine.config_load import load_assumptions, load_parameters, scenario_order
from app.engine.financial import location_aal, scenario_losses
from app.engine.hazard_validation import hotspot_validation, proxy_score
from app.engine.geo import haversine_km
from app.engine.ingestion import IngestedData, load_portfolio
from app.engine.shap_explainer import LocationExplainer
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


def _class_rows(exposure: pd.DataFrame, aal: np.ndarray, losses: dict[str, np.ndarray], names: list[str]) -> list[dict]:
    rows = []
    for klass, group in exposure.groupby("housing_class"):
        idx = group.index.to_numpy()
        rec = {
            "housing_class": klass,
            "locations": int(len(group)),
            "tiv_kes": float(group["tiv_kes"].sum()),
            "aal_kes": float(aal[idx].sum()),
            "loss_cost_pct": float(100 * aal[idx].sum() / max(group["tiv_kes"].sum(), 1.0)),
        }
        for name in names:
            rec[f"loss_{name}_kes"] = float(losses[name][idx].sum())
        rows.append(rec)
    return sorted(rows, key=lambda r: r["aal_kes"], reverse=True)


def run_model(payload: dict[str, Any] | None = None, ingested: IngestedData | None = None) -> dict[str, Any]:
    params = load_parameters()
    names = scenario_order(params)
    body = payload or {}
    apply_drainage = bool(body.get("apply_drainage_correction", True))
    free_text = str(body.get("free_text") or "")

    data = ingested or load_portfolio()
    reviewed_groups = body.get("exposure_groups")
    if reviewed_groups is not None:
        extra, parse_meta = exposure_from_groups(reviewed_groups, data.hotspots)
        parse_meta["source"] = body.get("exposure_source", "reviewed")
    else:
        extra, parse_meta = parse_free_text(free_text, data.hotspots)
        parse_meta["source"] = "rules" if len(extra) else "none"
    extra = _fill_hazard_from_rasters(extra, names)
    exposure = pd.concat([data.exposure, extra], ignore_index=True)
    exposure = _attach_hotspots(exposure, data.hotspots)

    baseline_losses = scenario_losses(exposure, params)
    corrected, drainage_meta = apply_drainage_correction(exposure, data.hotspots, apply_drainage, params)
    losses = scenario_losses(corrected, params)
    original_corrected, _ = apply_drainage_correction(_attach_hotspots(data.exposure, data.hotspots), data.hotspots, apply_drainage, params)
    original_losses = scenario_losses(original_corrected, params)
    aal = location_aal(losses, params)
    tiv = corrected["tiv_kes"].to_numpy(dtype=float)

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
                "baseline_loss_kes": float(baseline_losses[name].sum()),
                "affected_locations": int((losses[name] > 0).sum()),
                "affected_tiv_kes": float(tiv[losses[name] > 0].sum()),
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
            "synthetic": bool(row["synthetic"]),
            "source": str(row.get("source", "starter kit")),
            "nearest_hotspot": row["nearest_hotspot"],
            "distance_to_hotspot_km": float(row["distance_to_hotspot_km"]),
            "drainage_uplift": float(row.get("drainage_uplift", 0.0)),
            "aal_kes": float(aal[i]),
            "loss_cost_pct": float(100 * aal[i] / max(row["tiv_kes"], 1.0)),
            "scenario_losses_kes": {name: float(losses[name][i]) for name in names},
            "hazard_scores": {name: float(row[f"hazard_score_{name}"]) for name in names},
        }
        for name in names:
            rec[f"loss_{name}_kes"] = float(losses[name][i])
            rec[f"hazard_{name}"] = float(row[f"hazard_score_{name}"])
            rec[f"depth_{name}_m"] = float(np.clip(row[f"hazard_score_{name}"], 0, 1) * params["hazard"]["max_depth_m"])
        locations.append(rec)

    loss_100 = next(s for s in scenarios if s["return_period_years"] == 100)
    loss_250 = next(s for s in scenarios if s["return_period_years"] == 250)
    class_rows = _class_rows(corrected.reset_index(drop=True), aal, losses, names)
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
    depth_sensitivity = []
    for depth_m in (2.0, 4.0, 6.0):
        alternate = deepcopy(params)
        alternate["hazard"]["max_depth_m"] = depth_m
        alternate_losses = scenario_losses(corrected, alternate)
        depth_sensitivity.append({"depth_scale_m": depth_m, "loss_1_in_100_kes": float(alternate_losses["occasional"].sum()), "aal_kes": float(location_aal(alternate_losses, alternate).sum())})
    frequency_sensitivity = []
    for multiplier in (0.5, 1.0, 2.0):
        alternate = deepcopy(params)
        for spec in alternate["return_periods"].values():
            spec["years"] *= multiplier
            spec["annual_exceedance"] = 1.0 / spec["years"]
        frequency_sensitivity.append({"return_period_multiplier": multiplier, "aal_kes": float(location_aal(losses, alternate).sum())})

    result = {
        "run_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model": params["model"],
        "controls": {"apply_drainage_correction": apply_drainage, "free_text": free_text, "exposure_source": parse_meta["source"]},
        "input_hashes": {"exposure": data.exposure_hash, "hotspots": data.hotspots_hash},
        "labels": {
            "exposure": f"{synthetic_count} of {len(corrected)} rows declared synthetic by the input CSV or free-text parser; provenance is not independently verified",
            "hotspots": f"{len(data.hotspots)} geocoded named hotspots from the input CSV",
            "hazard": "PROXY (not measured flood depth)",
            "depth_conversion": "ASSUMPTION (score × 4 m, per problem statement example)",
            "return_periods": "ASSUMPTION (tiers have no years in the kit)",
            "vulnerability": "SOURCED JRC Africa residential + ASSUMED construction adaptations",
            "loss": "MODELLED ground-up (treaty layers out of scope)",
        },
        "disclaimer": (
            f"{synthetic_count} of {len(corrected)} exposure locations are declared synthetic. "
            "Hazard is a constructed pluvial proxy. Return periods and the 4 m depth scale are assumptions. "
            "Portfolio provenance must be verified before operational use."
        ),
        "metrics": {
            "locations": int(len(corrected)),
            "synthetic_locations": synthetic_count,
            "starter_kit_locations": int(len(data.exposure)),
            "free_text_locations": int(len(extra)),
            "total_tiv_kes": float(tiv.sum()),
            "aal_kes": float(aal.sum()),
            "loss_cost_pct": float(100 * aal.sum() / max(float(tiv.sum()), 1.0)),
            "loss_1_in_100_kes": loss_100["loss_kes"],
            "loss_1_in_250_kes": loss_250["loss_kes"],
            "baseline_1_in_100_kes": loss_100["baseline_loss_kes"],
            "drainage_delta_1_in_100_kes": loss_100["loss_kes"] - loss_100["baseline_loss_kes"],
            "exposure_delta_1_in_100_kes": loss_100["loss_kes"] - float(original_losses["occasional"].sum()),
        },
        "scenarios": scenarios,
        "ep_curve": [
            {
                "tier": s["tier"],
                "return_period_years": s["return_period_years"],
                "annual_exceedance": s["annual_exceedance"],
                "loss_kes": s["loss_kes"],
                "baseline_loss_kes": s["baseline_loss_kes"],
                "provenance": "ASSUMPTION",
            }
            for s in scenarios
        ],
        "by_housing_class": class_rows,
        "by_hotspot": hotspot_rows,
        "vulnerability_matrix": vulnerability_matrix(params),
        "sensitivity": {"depth_scale": depth_sensitivity, "return_periods": frequency_sensitivity},
        "interventions": {
            "drainage": drainage_meta,
            "free_text": parse_meta,
            "drainage_delta_1_in_100_kes": loss_100["loss_kes"] - loss_100["baseline_loss_kes"],
            "effect": (
                "The deterministic drainage rule changes susceptibility and losses. "
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
