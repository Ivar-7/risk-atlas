from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

from app.engine.ai_drainage import apply_drainage_correction
from app.engine.ai_exposure import parse_free_text
from app.engine.briefing import underwriter_briefing
from app.engine.config_load import load_assumptions, load_parameters, scenario_order
from app.engine.financial import location_aal, scenario_losses
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


def _fill_hazard_from_neighbours(base: pd.DataFrame, extra: pd.DataFrame, names: list[str]) -> pd.DataFrame:
    if extra.empty:
        return extra
    filled = extra.copy()
    b_lat = base["lat"].to_numpy()[:, None]
    b_lon = base["lon"].to_numpy()[:, None]
    e_lat = extra["lat"].to_numpy()[None, :]
    e_lon = extra["lon"].to_numpy()[None, :]
    dist = haversine_km(b_lat, b_lon, e_lat, e_lon)
    nearest = dist.argmin(axis=0)
    for name in names:
        col = f"hazard_score_{name}"
        filled[col] = base[col].to_numpy()[nearest]
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
    apply_ai = bool(body.get("apply_drainage_correction", True))
    free_text = str(body.get("free_text") or "")

    data = ingested or load_portfolio()
    extra, parse_meta = parse_free_text(free_text, data.hotspots)
    extra = _fill_hazard_from_neighbours(data.exposure, extra, names)
    exposure = pd.concat([data.exposure, extra], ignore_index=True)
    exposure = _attach_hotspots(exposure, data.hotspots)

    baseline_losses = scenario_losses(exposure, params)
    corrected, drainage_meta = apply_drainage_correction(exposure, data.hotspots, apply_ai, params)
    losses = scenario_losses(corrected, params)
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
    hotspot_rows = (
        pd.DataFrame(locations)
        .groupby("nearest_hotspot", as_index=False)
        .agg(locations=("loc_id", "count"), tiv_kes=("tiv_kes", "sum"), aal_kes=("aal_kes", "sum"))
        .sort_values("aal_kes", ascending=False)
        .to_dict(orient="records")
    )

    result = {
        "run_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model": params["model"],
        "controls": {"apply_drainage_correction": apply_ai, "free_text": free_text},
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
            "ai_delta_1_in_100_kes": loss_100["loss_kes"] - loss_100["baseline_loss_kes"],
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
        "ai": {
            "drainage": drainage_meta,
            "free_text": parse_meta,
            "loss_delta_severe_kes": loss_100["loss_kes"] - loss_100["baseline_loss_kes"],
            "effect": (
                "Drainage correction changes location susceptibility then losses. "
                "Free-text rows change TIV and the EP curve. SHAP explains location AAL after those steps."
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
        "hotspots": data.hotspots.to_dict(orient="records"),
        "assumptions": load_assumptions()["assumptions"],
    }
    result["briefing"] = underwriter_briefing(result)
    return result
