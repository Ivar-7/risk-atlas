from __future__ import annotations

import numpy as np
import pandas as pd

from app.engine.config_load import load_parameters, scenario_order
from app.engine.vulnerability import damage_ratio


def score_to_depth(score: np.ndarray, parameters: dict | None = None) -> np.ndarray:
    params = parameters or load_parameters()
    return np.clip(score, 0.0, 1.0) * float(params["hazard"]["max_depth_m"])


def scenario_losses(exposure: pd.DataFrame, parameters: dict | None = None) -> dict[str, np.ndarray]:
    params = parameters or load_parameters()
    tiv = exposure["tiv_kes"].to_numpy(dtype=float)
    housing = exposure["housing_class"].to_numpy()
    losses: dict[str, np.ndarray] = {}
    for name in scenario_order(params):
        depth = score_to_depth(exposure[f"hazard_score_{name}"].to_numpy(dtype=float), params)
        losses[name] = damage_ratio(depth, housing, params) * tiv
    return losses


def insured_losses(
    ground_up_losses: dict[str, np.ndarray],
    tiv: np.ndarray,
    deductible_pct: float,
    policy_limit_pct: float,
) -> dict[str, np.ndarray]:
    """Apply one assumed occurrence deductible and limit to each property, then aggregate."""
    if not 0 <= deductible_pct <= 100 or not 0 <= policy_limit_pct <= 100:
        raise ValueError("Policy percentages must be between 0 and 100")
    deductible = tiv * deductible_pct / 100.0
    limit = tiv * policy_limit_pct / 100.0
    return {
        tier: np.minimum(np.maximum(loss - deductible, 0.0), limit)
        for tier, loss in ground_up_losses.items()
    }


def location_aal(scenario_loss: dict[str, np.ndarray], parameters: dict | None = None) -> np.ndarray:
    """Trapezoidal integral of the discrete EP curve. Depends on the assumed return periods."""
    params = parameters or load_parameters()
    names = scenario_order(params)
    probs = [1.0] + [params["return_periods"][n]["annual_exceedance"] for n in names]
    layers = [np.zeros_like(next(iter(scenario_loss.values())))] + [scenario_loss[n] for n in names]
    aal = np.zeros_like(layers[0])
    for i in range(len(probs) - 1):
        aal += 0.5 * (layers[i] + layers[i + 1]) * (probs[i] - probs[i + 1])
    aal += layers[-1] * probs[-1]
    return aal
