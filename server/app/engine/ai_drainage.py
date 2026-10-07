from __future__ import annotations

import numpy as np
import pandas as pd

from app.engine.config_load import load_parameters, scenario_order
from app.engine.geo import haversine_km


def _unflagged_hotspots(exposure: pd.DataFrame, hotspots: pd.DataFrame, parameters: dict) -> list[str]:
    cfg = parameters["ai_drainage"]
    radius = float(cfg["search_radius_km"])
    threshold = float(cfg["unflagged_max_hazard"])
    hazard_cols = [f"hazard_score_{n}" for n in scenario_order(parameters)]
    named = set(cfg["named_misses"])
    found: list[str] = []
    for _, row in hotspots.iterrows():
        dist = haversine_km(exposure["lat"].to_numpy(), exposure["lon"].to_numpy(), row["lat"], row["lon"])
        near = exposure.loc[dist <= radius]
        mx = float(near[hazard_cols].to_numpy().max()) if len(near) else 0.0
        if row["name"] in named or mx < threshold:
            found.append(str(row["name"]))
    return found


def apply_drainage_correction(
    exposure: pd.DataFrame,
    hotspots: pd.DataFrame,
    enabled: bool,
    parameters: dict | None = None,
) -> tuple[pd.DataFrame, dict]:
    """Increase proxy scores near drainage-driven misses. This changes modelled loss."""
    params = parameters or load_parameters()
    frame = exposure.copy()
    names = scenario_order(params)
    meta = {
        "enabled": enabled,
        "missed_hotspots": [],
        "buildings_uplifted": 0,
        "mean_uplift_common": 0.0,
        "method": "Distance kernel around proxy-missed government hotspots (problem statement limitation).",
    }
    if not enabled:
        frame["drainage_uplift"] = 0.0
        return frame, meta

    cfg = params["ai_drainage"]
    missed_names = _unflagged_hotspots(frame, hotspots, params)
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
    frame["drainage_uplift"] = kernel
    for name in names:
        col = f"hazard_score_{name}"
        scale = float(cfg["tier_scale"][name])
        frame[col] = np.clip(frame[col] + kernel * scale, 0.0, 1.0)
    meta.update(
        {
            "missed_hotspots": missed_names,
            "buildings_uplifted": int((kernel > 0.05).sum()),
            "mean_uplift_common": float((kernel * float(cfg["tier_scale"]["common"])).mean()),
        }
    )
    return frame, meta
