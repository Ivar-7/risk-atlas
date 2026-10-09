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
    return "", False


def _count(text: str) -> tuple[int, bool]:
    match = re.search(r"\b(\d{1,3})\s+(?:[a-z][a-z -]*?\s+)?(?:buildings?|houses?|dwellings?|units?|properties|shops?)\b", text.lower())
    if match:
        count = int(match.group(1))
        return count, 1 <= count <= 80
    spoken = re.search(r"\b(twenty|thirty|forty|fifty|sixty|seventy|eighty)(?:[ -](one|two|three|four|five|six|seven|eight|nine))?\s+(?:[a-z][a-z -]*?\s+)?(?:buildings?|houses?|dwellings?|units?|properties|shops?)\b", text.lower())
    if spoken:
        count = {'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80}[spoken.group(1)]
        count += {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9}.get(spoken.group(2) or '', 0)
        return count, 1 <= count <= 80
    return 0, False


def _tiv(text: str) -> tuple[float, bool]:
    match = re.search(r"\b(?:kes|kshs?|ksh)\s*([0-9][0-9,]*(?:\.\d+)?)\s*(m|million|bn|billion)?\b", text.lower())
    if not match:
        match = re.search(r"\b([0-9][0-9,]*(?:\.\d+)?)\s*(kenyan\s+shillings?|shillings?|kes|kshs?)\b", text.lower())
    if not match:
        return 0.0, False
    per_building = re.search(r"\b(each|apiece|per\s+(?:building|house|unit|property|dwelling))\b", text.lower())
    if not per_building:
        return 0.0, False
    raw = float(match.group(1).replace(",", ""))
    suffix = (match.group(2) or "").lower()
    if suffix in {"m", "million"}:
        raw *= 1_000_000
    if suffix in {"bn", "billion"}:
        raw *= 1_000_000_000
    return raw, raw > 0


def _place(text: str, hotspots: pd.DataFrame) -> tuple[str, bool]:
    lowered = text.lower()
    for name in hotspots["name"].tolist():
        if name.lower() in lowered:
            return name, True
    return "", False


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
    groups: list[dict] = []
    seq = 0
    places: list[str] = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        housing, got_class = _housing(chunk)
        count, got_count = _count(chunk)
        tiv, got_tiv = _tiv(chunk)
        place, got_place = _place(chunk, hotspots)
        missing = [label for label, valid in (("construction type", got_class), ("count from 1 to 80", got_count), ("explicit KES value per building", got_tiv), ("named hotspot", got_place)) if not valid]
        if missing:
            notes.append(f"Skipped “{chunk.strip()[:60]}”: specify {', '.join(missing)}.")
            continue
        row = hotspots.loc[hotspots["name"] == place].iloc[0]
        places.append(place)
        groups.append({"count": count, "housing_class": housing, "place": place, "tiv_each_kes": tiv, "total_tiv_kes": count * tiv})
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
        notes.append(f"Added {count} sample {housing} buildings near {place} at KES {tiv:,.0f} TIV each.")

    return pd.DataFrame(records), {
        "parsed": bool(records),
        "rows_added": len(records),
        "place": ", ".join(sorted(set(places))),
        "notes": notes,
        "groups": groups,
    }


def exposure_from_groups(groups: list[dict], hotspots: pd.DataFrame, seed: int = 7) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Place reviewed groups near approximate named hotspots as synthetic rows."""
    valid_classes = set(CLASS_ALIASES.values())
    names = set(hotspots["name"].tolist())
    rng = np.random.default_rng(seed)
    records = []
    checked = []
    for group in groups:
        count = int(group["count"])
        klass = str(group["housing_class"])
        place = str(group["place"])
        tiv = float(group["tiv_each_kes"])
        if not 1 <= count <= 80 or klass not in valid_classes or place not in names or not 0 < tiv <= 1_000_000_000:
            raise ValueError("Reviewed exposure contains an invalid group")
        if len(records) + count > 200:
            raise ValueError("Reviewed exposure exceeds 200 buildings")
        hotspot = hotspots.loc[hotspots["name"] == place].iloc[0]
        checked.append({"count": count, "housing_class": klass, "place": place, "tiv_each_kes": tiv, "total_tiv_kes": count * tiv})
        for _ in range(count):
            records.append({
                "loc_id": f"TXT-{len(records):04d}",
                "lat": float(hotspot["lat"] + rng.uniform(-0.008, 0.008)),
                "lon": float(hotspot["lon"] + rng.uniform(-0.008, 0.008)),
                "housing_class": klass, "floor_area_m2": 40, "cost_per_m2_kes": tiv / 40,
                "tiv_kes": tiv, "synthetic": True, "source": "reviewed free-text exposure",
            })
    return pd.DataFrame(records), {"parsed": bool(records), "rows_added": len(records), "groups": checked, "notes": ["Sample rows are placed near approximate hotspot centres."]}
