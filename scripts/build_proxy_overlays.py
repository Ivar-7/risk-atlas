"""Create transparent map overlays from the supplied Nairobi GeoTIFF proxy rasters.

Run with: python3 scripts/build_proxy_overlays.py
Requires Pillow and numpy. The PNGs contain model proxy values, not observed flooding.
"""
from pathlib import Path

import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
out = root / 'client' / 'public' / 'assets'
out.mkdir(parents=True, exist_ok=True)
for tier in ('common', 'occasional', 'moderate', 'severe', 'extreme'):
    source = root / 'data' / f'nairobi_pluvial_proxy_{tier}.tif'
    with Image.open(source) as raster:
        values = np.asarray(raster, dtype=np.float32)
    strength = np.clip(values, 0, 1)
    rgba = np.zeros((*strength.shape, 4), dtype=np.uint8)
    low = np.array([253, 232, 238], dtype=np.float32)
    middle = np.array([216, 24, 75], dtype=np.float32)
    high = np.array([122, 12, 40], dtype=np.float32)
    lower_mix = np.clip(strength * 2, 0, 1)[..., None]
    upper_mix = np.clip((strength - 0.5) * 2, 0, 1)[..., None]
    colors = np.where(
        (strength <= 0.5)[..., None],
        low + (middle - low) * lower_mix,
        middle + (high - middle) * upper_mix,
    )
    rgba[..., :3] = np.rint(colors).astype(np.uint8)
    rgba[..., 3] = np.where(strength > 0, 65 + strength * 125, 0).astype(np.uint8)
    target = out / f'proxy-{tier}.png'
    Image.fromarray(rgba, 'RGBA').save(target, optimize=True)
    print(target.relative_to(root), target.stat().st_size)
