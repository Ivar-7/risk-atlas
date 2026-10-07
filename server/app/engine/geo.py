from __future__ import annotations

import numpy as np
import pandas as pd


def haversine_km(lat1, lon1, lat2, lon2) -> np.ndarray:
    r = 6371.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlmb = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlmb / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


HAZARD_COLS = [
    "hazard_score_common",
    "hazard_score_occasional",
    "hazard_score_moderate",
    "hazard_score_severe",
    "hazard_score_extreme",
]


def attach_hotspots(exposure: pd.DataFrame, hotspots: pd.DataFrame) -> pd.DataFrame:
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


def copy_nearest_hazard(new_rows: pd.DataFrame, source: pd.DataFrame) -> pd.DataFrame:
    """Free-text buildings inherit the proxy score of the nearest starter-kit location."""
    if new_rows.empty:
        return new_rows
    out = new_rows.copy()
    src_lat = source["lat"].to_numpy()[None, :]
    src_lon = source["lon"].to_numpy()[None, :]
    dist = haversine_km(out["lat"].to_numpy()[:, None], out["lon"].to_numpy()[:, None], src_lat, src_lon)
    idx = dist.argmin(axis=1)
    for col in HAZARD_COLS:
        out[col] = source[col].to_numpy()[idx]
    return out
