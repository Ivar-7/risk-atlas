from __future__ import annotations

import numpy as np
import pandas as pd

from app.engine.config_load import load_parameters, scenario_order
from app.engine.vulnerability import damage_ratio


def scenario_losses(exposure: pd.DataFrame, parameters: dict | None = None) -> dict[str, np.ndarray]:
    params = parameters or load_parameters()
    tiv = exposure["tiv_kes"].to_numpy(dtype=float)
    housing = exposure["housing_class"].to_numpy()
    losses: dict[str, np.ndarray] = {}
    for name in scenario_order(params):
        score = exposure[f"hazard_score_{name}"].to_numpy(dtype=float)
        losses[name] = damage_ratio(name, score, housing, params) * tiv
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


def portfolio_reinsurance(
    gross_losses: dict[str, float],
    quota_share_ceded_pct: float,
    cat_xol_applies: bool,
    cat_xol_attachment_kes: float | None,
    cat_xol_limit_kes: float | None,
) -> dict[str, dict[str, float]]:
    """Apply quota share, then one aggregate cat XOL layer to each event scenario."""
    if not np.isfinite(quota_share_ceded_pct) or not 0 <= quota_share_ceded_pct <= 100:
        raise ValueError("Quota share percentage must be finite and between 0 and 100")
    if cat_xol_applies and (cat_xol_attachment_kes is None or cat_xol_limit_kes is None):
        raise ValueError("Portfolio cat XOL requires attachment and layer limit")
    if cat_xol_applies and (not np.isfinite(cat_xol_attachment_kes) or not np.isfinite(cat_xol_limit_kes) or cat_xol_attachment_kes < 0 or cat_xol_limit_kes < 0):
        raise ValueError("Portfolio cat XOL attachment and limit must be finite nonnegative amounts")
    results = {}
    for tier, gross in gross_losses.items():
        if not np.isfinite(gross) or gross < 0:
            raise ValueError("Gross scenario loss must be finite and nonnegative")
        quota_recovery = gross * quota_share_ceded_pct / 100.0
        retained = gross - quota_recovery
        cat_recovery = min(max(retained - cat_xol_attachment_kes, 0.0), cat_xol_limit_kes) if cat_xol_applies else 0.0
        results[tier] = {
            "quota_share_recovery_kes": quota_recovery,
            "retained_before_cat_kes": retained,
            "cat_xol_recovery_kes": cat_recovery,
            "net_loss_kes": retained - cat_recovery,
        }
    return results


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


def portfolio_aal(scenario_loss: dict[str, float], parameters: dict | None = None) -> float:
    """Integrate aggregate event losses; cat XOL must be applied before this step."""
    return float(location_aal({tier: np.array([loss], dtype=float) for tier, loss in scenario_loss.items()}, parameters)[0])
