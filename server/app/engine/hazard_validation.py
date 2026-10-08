"""Sample the supplied proxy rasters at approximate named-hotspot centres."""
from __future__ import annotations

from functools import lru_cache

from PIL import Image

from app.paths import DATA_DIR

TIERS = ('common', 'occasional', 'moderate', 'severe', 'extreme')


@lru_cache(maxsize=5)
def _raster(tier: str):
    if tier not in TIERS:
        raise ValueError('Unknown proxy tier')
    image = Image.open(DATA_DIR / f'nairobi_pluvial_proxy_{tier}.tif')
    scale = image.tag_v2[33550]
    origin = image.tag_v2[33922]
    return image, float(origin[3]), float(origin[4]), float(scale[0]), float(scale[1])


def proxy_score(lat: float, lon: float, tier: str) -> float:
    image, west, north, pixel_width, pixel_height = _raster(tier)
    x = int((lon - west) / pixel_width)
    y = int((north - lat) / pixel_height)
    if not (0 <= x < image.width and 0 <= y < image.height):
        return 0.0
    return max(0.0, float(image.getpixel((x, y))))


def hotspot_validation(hotspots) -> dict:
    rows = []
    for _, row in hotspots.iterrows():
        scores = {tier: proxy_score(float(row['lat']), float(row['lon']), tier) for tier in TIERS}
        rows.append({'name': str(row['name']), 'lat': float(row['lat']), 'lon': float(row['lon']), 'proxy_scores': scores, 'proxy_detected_common': scores['common'] > 0})
    hit_count = sum(row['proxy_detected_common'] for row in rows)
    return {'hotspots': rows, 'checked': len(rows), 'detected_common': hit_count, 'missed_common': len(rows) - hit_count, 'county_named': 37, 'coordinate_method': 'Approximate OpenStreetMap neighbourhood centres; point score can miss nearby flooded streets.'}
