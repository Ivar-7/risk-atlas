from __future__ import annotations

import numpy as np
import pandas as pd

from app.engine.config_load import load_parameters, scenario_order
from app.engine.geo import haversine_km
from app.engine.hazard_validation import proxy_score


def _unflagged_hotspots(hotspots: pd.DataFrame) -> list[str]:
    return [str(row["name"]) for _, row in hotspots.iterrows()
            if proxy_score(float(row["lat"]), float(row["lon"]), "common") <= 0]


def apply_drainage_correction(
    exposure: pd.DataFrame,
    hotspots: pd.DataFrame,
    enabled: bool,
    parameters: dict | None = None,
) -> tuple[pd.DataFrame, dict]:
    """Apply an unvalidated sensitivity centred on proxy-missed hotspot points."""
    params = parameters or load_parameters()
    frame = exposure.copy()
    names = scenario_order(params)
    meta = {
        "enabled": enabled,
        "missed_hotspots": [],
        "buildings_uplifted": 0,
        "mean_uplift_common": 0.0,
        "validation_status": "unvalidated sensitivity",
        "method": "Deterministic distance kernel around named hotspots missed by the common proxy raster; hotspot coordinates are approximate. These same centres cannot independently validate predictive accuracy.",
    }
    if not enabled:
        frame["drainage_uplift"] = 0.0
        return frame, meta

    cfg = params["drainage_rule"]
    missed_names = _unflagged_hotspots(hotspots)
    missed = hotspots[hotspots["name"].isin(missed_names)]
    sigma = float(cfg["kernel_sigma_km"])
    if missed.empty:
        frame["drainage_uplift"] = 0.0
        meta["missed_hotspots"] = missed_names
        return frame, meta

    loc_lat = frame["lat"].to_numpy()[:, None]
    loc_lon = frame["lon"].to_numpy()[:, None]
    hs_lat = missed["lat"].to_numpy()[None, :]
    hs_lon = missed["lon"].to_numpy()[None, :]
    dist = haversine_km(loc_lat, loc_lon, hs_lat, hs_lon)
    kernel = np.exp(-(dist**2) / (2 * sigma**2)).max(axis=1)
    kernel = np.where(kernel > 0.05, kernel, 0.0)
    frame["drainage_uplift"] = kernel
    for name in names:
        col = f"hazard_score_{name}"
        scale = float(cfg["tier_scale"][name])
        frame[col] = np.clip(frame[col] + kernel * scale, 0.0, 1.0)
    for previous, current in zip(names, names[1:]):
        frame[f"hazard_score_{current}"] = np.maximum(frame[f"hazard_score_{current}"], frame[f"hazard_score_{previous}"])
    meta.update(
        {
            "missed_hotspots": missed_names,
            "buildings_uplifted": int((kernel > 0).sum()),
            "mean_uplift_common": float((kernel * float(cfg["tier_scale"]["common"])).mean()),
        }
    )
    return frame, meta
