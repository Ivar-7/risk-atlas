"""Build the browser snapshot from the supplied synthetic Nairobi exposure CSV."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data" / "exposure_nairobi_with_hazard.csv"
OUTPUT = ROOT / "client" / "src" / "data" / "nairobi-exposure.json"
CLASSES = ["informal_iron_sheet", "semi_permanent", "permanent_masonry", "concrete_rcc"]
TIERS = ["common", "occasional", "moderate", "severe", "extreme"]


def main() -> None:
    with SOURCE.open(newline="", encoding="utf-8") as source:
        records = list(csv.DictReader(source))

    if any(record["synthetic"].lower() != "true" for record in records):
        raise ValueError("The dashboard snapshot must contain only synthetic exposure rows")

    snapshot = [
        [
            record["loc_id"],
            round(float(record["lat"]), 6),
            round(float(record["lon"]), 6),
            CLASSES.index(record["housing_class"]),
            round(float(record["tiv_kes"])),
            *[round(float(record[f"hazard_score_{tier}"]), 6) for tier in TIERS],
        ]
        for record in records
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(snapshot, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(snapshot)} synthetic locations to {OUTPUT}")


if __name__ == "__main__":
    main()
