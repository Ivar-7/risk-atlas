from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from app.paths import ASSUMPTIONS_PATH, PARAMETERS_PATH


def _read_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


@lru_cache(maxsize=1)
def load_parameters() -> dict[str, Any]:
    return _read_yaml(PARAMETERS_PATH)


@lru_cache(maxsize=1)
def load_assumptions() -> dict[str, Any]:
    return _read_yaml(ASSUMPTIONS_PATH)


def scenario_order(parameters: dict[str, Any] | None = None) -> list[str]:
    params = parameters or load_parameters()
    items = params["return_periods"].items()
    return [name for name, _ in sorted(items, key=lambda kv: kv[1]["years"])]
