from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd

CLASS_ALIASES = {
    "informal": "informal_iron_sheet",
    "iron sheet": "informal_iron_sheet",
    "iron-sheet": "informal_iron_sheet",
    "mabati": "informal_iron_sheet",
    "semi permanent": "semi_permanent",
    "semi-permanent": "semi_permanent",
    "masonry": "permanent_masonry",
    "stone": "permanent_masonry",
    "permanent": "permanent_masonry",
    "concrete": "concrete_rcc",
    "rcc": "concrete_rcc",
    "apartment": "concrete_rcc",
}


def _housing(text: str) -> tuple[str, bool]:
    lowered = text.lower()
    for alias, klass in CLASS_ALIASES.items():
        if alias in lowered:
            return klass, True
    return "semi_permanent", False


def _count(text: str) -> tuple[int, bool]:
    match = re.search(r"(\d+)\s+(buildings?|houses?|dwellings?|units?|properties|shops?)", text.lower())
    if match:
        return max(1, min(int(match.group(1)), 80)), True
    return 10, False


def _tiv(text: str) -> tuple[float, bool]:
    match = re.search(r"(kes|ksh|kshs)?\s*([0-9][0-9,]*(?:\.\d+)?)\s*(m|million|bn|billion)?", text.lower())
    if not match:
        return 2_000_000.0, False
    raw = float(match.group(2).replace(",", ""))
    suffix = (match.group(3) or "").lower()
    if suffix in {"m", "million"}:
        raw *= 1_000_000
    if suffix in {"bn", "billion"}:
        raw *= 1_000_000_000
    return raw, True


def _place(text: str, hotspots: pd.DataFrame) -> tuple[str, bool]:
    lowered = text.lower()
    for name in hotspots["name"].tolist():
        if name.lower() in lowered:
            return name, True
    return "Kibera", False


def parse_free_text(text: str, hotspots: pd.DataFrame, seed: int = 7) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Turn a plain-English portfolio snippet into extra synthetic exposure rows.

    This is the free-text ingestion path in the problem statement. It changes
    total TIV and therefore the EP curve. Rows are labelled synthetic.
    """
    notes: list[str] = []
    if not text or not text.strip():
        return pd.DataFrame(), {"parsed": False, "rows_added": 0, "notes": ["No extra text supplied."]}

    chunks = re.split(r"\bplus\b|\band also\b|;|\n", text, flags=re.I)
    rng = np.random.default_rng(seed)
    records: list[dict] = []
    seq = 0
    places: list[str] = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        housing, got_class = _housing(chunk)
        count, got_count = _count(chunk)
        tiv, got_tiv = _tiv(chunk)
        place, got_place = _place(chunk, hotspots)
        if not got_class:
            notes.append(f"No construction type in “{chunk.strip()[:40]}…”; defaulted to semi_permanent (assumption).")
        if not got_count:
            notes.append("No count found in a clause; defaulted to 10 buildings (assumption).")
        if not got_tiv:
            notes.append("No TIV found in a clause; defaulted to KES 2,000,000 (assumption).")
        if not got_place:
            notes.append("No named hotspot in a clause; sited buildings at Kibera (assumption).")
        row = hotspots.loc[hotspots["name"] == place].iloc[0]
        places.append(place)
        for _ in range(count):
            records.append(
                {
                    "loc_id": f"TXT-{seq:04d}",
                    "lat": float(row["lat"] + rng.uniform(-0.008, 0.008)),
                    "lon": float(row["lon"] + rng.uniform(-0.008, 0.008)),
                    "housing_class": housing,
                    "floor_area_m2": 40,
                    "cost_per_m2_kes": int(tiv / 40),
                    "tiv_kes": float(tiv),
                    "synthetic": True,
                    "source": "parsed from underwriter free text",
                    "hazard_score_common": 0.0,
                    "hazard_score_occasional": 0.0,
                    "hazard_score_moderate": 0.0,
                    "hazard_score_severe": 0.0,
                    "hazard_score_extreme": 0.0,
                }
            )
            seq += 1
        notes.append(f"Added {count} synthetic {housing} buildings near {place} at KES {tiv:,.0f} TIV each.")

    return pd.DataFrame(records), {
        "parsed": True,
        "rows_added": len(records),
        "place": ", ".join(sorted(set(places))),
        "notes": notes,
    }
