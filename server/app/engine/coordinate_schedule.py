"""Review user-supplied building coordinates before model use."""
from __future__ import annotations

from collections import Counter
import csv
from io import StringIO
import math

import pandas as pd

from app.engine.hazard_validation import proxy_point_covered

MAX_COORDINATE_BYTES = 1_000_000
REQUIRED_COLUMNS = {'loc_id', 'place', 'housing_class', 'tiv_kes', 'lat', 'lon', 'coordinate_source'}


def validate_coordinate_rows(rows: list[dict], groups: list[dict], hotspots: pd.DataFrame) -> list[dict]:
    if not rows or len(rows) > 200:
        raise ValueError('Coordinate schedule must contain 1–200 building rows')
    places = set(hotspots['name'].astype(str))
    expected = Counter(
        (str(group['place']), str(group['housing_class']), round(float(group['tiv_each_kes']), 2))
        for group in groups for _ in range(int(group['count']))
    )
    found: Counter = Counter()
    ids: set[str] = set()
    checked = []
    for number, row in enumerate(rows, 2):
        loc_id = str(row.get('loc_id', '')).strip()
        place = str(row.get('place', '')).strip()
        klass = str(row.get('housing_class', '')).strip()
        source = str(row.get('coordinate_source', '')).strip()
        if not loc_id or loc_id in ids or not source:
            raise ValueError(f'Coordinate schedule row {number} needs a unique loc_id and coordinate_source')
        ids.add(loc_id)
        if place not in places:
            raise ValueError(f'Coordinate schedule row {number} has an unsupported named place')
        try:
            lat, lon, tiv = (float(row[key]) for key in ('lat', 'lon', 'tiv_kes'))
        except (TypeError, ValueError, KeyError) as exc:
            raise ValueError(f'Coordinate schedule row {number} has invalid coordinates or TIV') from exc
        if not all(math.isfinite(value) for value in (lat, lon, tiv)) or not 0 < tiv <= 1_000_000_000:
            raise ValueError(f'Coordinate schedule row {number} has invalid coordinates or TIV')
        if not (-90 <= lat <= 90 and -180 <= lon <= 180 and proxy_point_covered(lat, lon)):
            raise ValueError(f'Coordinate schedule row {number} falls outside the Nairobi hazard raster')
        found[(place, klass, round(tiv, 2))] += 1
        checked.append({'loc_id': loc_id, 'place': place, 'housing_class': klass, 'tiv_kes': tiv,
                        'lat': lat, 'lon': lon, 'coordinate_source': source,
                        'address': str(row.get('address') or '').strip()})
    if found != expected:
        raise ValueError('Coordinate schedule count, place, class and insured values must match the reviewed exposure preview')
    return checked


def parse_coordinate_csv(data: bytes, groups: list[dict], hotspots: pd.DataFrame) -> list[dict]:
    if not data or len(data) > MAX_COORDINATE_BYTES:
        raise ValueError('Upload a non-empty coordinate CSV smaller than 1 MB')
    try:
        source = StringIO(data.decode('utf-8-sig'))
        reader = csv.DictReader(source)
        if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(set(reader.fieldnames)):
            raise ValueError(f'Coordinate CSV requires columns: {", ".join(sorted(REQUIRED_COLUMNS))}')
        rows = list(reader)
    except UnicodeDecodeError as exc:
        raise ValueError('Coordinate CSV must be UTF-8') from exc
    return validate_coordinate_rows(rows, groups, hotspots)


def coordinate_exposure(rows: list[dict]) -> pd.DataFrame:
    records = []
    for row in rows:
        tiv = float(row['tiv_kes'])
        records.append({
            'loc_id': f"COORD-{row['loc_id']}", 'lat': float(row['lat']), 'lon': float(row['lon']),
            'housing_class': row['housing_class'], 'floor_area_m2': 40.0,
            'cost_per_m2_kes': tiv / 40, 'tiv_kes': tiv, 'synthetic': True,
            'source': 'reviewed coordinate schedule', 'coordinate_source': row['coordinate_source'],
            'address': row.get('address', ''),
        })
    return pd.DataFrame(records)
