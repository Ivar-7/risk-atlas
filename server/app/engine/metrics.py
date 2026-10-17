from __future__ import annotations

import numpy as np


def percentile_loss(losses: np.ndarray, return_period: float) -> float:
    if len(losses) == 0:
        return 0.0
    q = 1.0 - 1.0 / return_period
    q = min(max(q, 0.0), 1.0)
    return float(np.quantile(losses, q, method="linear"))


def tvar(losses: np.ndarray, return_period: float) -> float:
    threshold = percentile_loss(losses, return_period)
    tail = losses[losses >= threshold]
    if len(tail) == 0:
        return threshold
    return float(tail.mean())


def herfindahl(shares: np.ndarray) -> float:
    total = shares.sum()
    if total <= 0:
        return 0.0
    p = shares / total
    return float((p**2).sum())


def ep_curve(losses: np.ndarray, return_periods: list[float]) -> list[dict]:
    n = max(len(losses), 1)
    ordered = np.sort(losses)[::-1]
    rows = []
    for rp in return_periods:
        rank = max(int(np.ceil(n / rp)) - 1, 0)
        rank = min(rank, n - 1)
        rows.append(
            {
                "return_period_years": rp,
                "exceedance_probability": 1.0 / rp,
                "loss_kes": float(ordered[rank]) if n else 0.0,
                "pml_quantile_kes": percentile_loss(losses, rp),
            }
        )
    return rows
