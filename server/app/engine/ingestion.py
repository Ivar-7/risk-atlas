from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np
import pandas as pd

from app.engine.geo import attach_hotspots
from app.paths import DATA_DIR, EXPOSURE_PATH, HOTSPOTS_PATH

REQUIRED_EXPOSURE = {
    "loc_id",
    "lat",
    "lon",
    "housing_class",
    "floor_area_m2",
    "cost_per_m2_kes",
    "tiv_kes",
    "synthetic",
    "hazard_score_common",
    "hazard_score_occasional",
    "hazard_score_moderate",
    "hazard_score_severe",
    "hazard_score_extreme",
}


def file_sha256(path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


@dataclass(frozen=True)
class IngestedData:
    exposure: pd.DataFrame
    hotspots: pd.DataFrame
    exposure_hash: str
    hotspots_hash: str
    row_count: int
    total_tiv_kes: float


def load_portfolio() -> IngestedData:
    exposure = pd.read_csv(EXPOSURE_PATH)
    missing = REQUIRED_EXPOSURE - set(exposure.columns)
    if missing:
        raise ValueError(f"Exposure file missing columns: {sorted(missing)}")
    synthetic = exposure["synthetic"].astype(str).str.strip().str.lower()
    if not synthetic.isin({"true", "false"}).all():
        raise ValueError("Exposure synthetic column must explicitly contain true or false for every location")
    exposure["synthetic"] = synthetic.eq("true")
    if "source" not in exposure.columns:
        exposure["source"] = EXPOSURE_PATH.name
    if exposure["loc_id"].duplicated().any():
        raise ValueError("Duplicate loc_id in exposure file")
    for field in ("tiv_kes", "floor_area_m2", "cost_per_m2_kes"):
        if not np.isfinite(exposure[field]).all() or (exposure[field] <= 0).any():
            raise ValueError(f"Exposure {field} must contain positive finite numbers")
    if EXPOSURE_PATH.resolve() == (DATA_DIR / "exposure_nairobi_with_hazard.csv").resolve():
        expected_tiv = exposure["floor_area_m2"] * exposure["cost_per_m2_kes"]
        invalid_value = (exposure["tiv_kes"] - expected_tiv).abs() > 2_500
        if invalid_value.any():
            example = exposure.loc[invalid_value, "loc_id"].iloc[0]
            raise ValueError(f"Starter TIV does not match floor area × rebuilding cost (within KES 2,500 rounding) at {example}")
    hotspots = pd.read_csv(HOTSPOTS_PATH)
    exposure = attach_hotspots(exposure, hotspots)
    return IngestedData(
        exposure=exposure,
        hotspots=hotspots,
        exposure_hash=file_sha256(EXPOSURE_PATH),
        hotspots_hash=file_sha256(HOTSPOTS_PATH),
        row_count=int(len(exposure)),
        total_tiv_kes=float(exposure["tiv_kes"].sum()),
    )
