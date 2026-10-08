"""Conditional year-loss simulation from the five assumed scenario anchors.

This quantifies finite-catalogue sampling variation only. It does not estimate
uncertainty in the hazard proxy, event frequencies, damage matrix, or exposure.
"""
from __future__ import annotations

import numpy as np


DISPLAY_PERIODS = (10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000)


def simulated_ep(scenarios: list[dict], total_tiv_kes: float, *, years: int = 10_000,
                 bootstraps: int = 200, seed: int = 42) -> dict:
    anchors = sorted(scenarios, key=lambda row: row['return_period_years'])
    periods = np.array([row['return_period_years'] for row in anchors], dtype=float)
    losses = np.array([row['loss_kes'] for row in anchors], dtype=float)
    if len(anchors) < 2 or not np.all(np.diff(periods) > 0) or not np.all(np.diff(losses) >= -0.01):
        raise ValueError('Simulation requires increasing scenario periods and nondecreasing gross losses')
    if years < 1000 or bootstraps < 20 or not np.isfinite(total_tiv_kes) or total_tiv_kes <= 0:
        raise ValueError('Invalid conditional simulation settings')

    rng = np.random.default_rng(seed)
    annual_exceedance = rng.random(years)
    annual_losses = np.zeros(years, dtype=float)
    active = annual_exceedance < 1 / periods[0]
    implied_periods = 1 / np.maximum(annual_exceedance[active], np.finfo(float).tiny)
    log_periods = np.log(periods)
    tail_slope = (losses[-1] - losses[-2]) / (log_periods[-1] - log_periods[-2])
    interpolated = np.interp(np.log(implied_periods), log_periods, losses)
    tail = implied_periods > periods[-1]
    interpolated[tail] = losses[-1] + tail_slope * (np.log(implied_periods[tail]) - log_periods[-1])
    annual_losses[active] = np.clip(interpolated, 0, total_tiv_kes)

    target_periods = np.array(DISPLAY_PERIODS, dtype=float)
    quantiles = 1 - 1 / target_periods
    estimate = np.quantile(annual_losses, quantiles, method='linear')
    bootstrap_quantiles = np.empty((bootstraps, len(target_periods)), dtype=float)
    for index in range(bootstraps):
        sample = annual_losses[rng.integers(0, years, years)]
        bootstrap_quantiles[index] = np.quantile(sample, quantiles, method='linear')
    low, high = np.quantile(bootstrap_quantiles, [0.05, 0.95], axis=0)

    return {
        'method': 'Inverse assumed gross EP, one maximum event loss per synthetic year; loss interpolated against log return period between the five anchors.',
        'tail_assumption': 'Beyond 1-in-250, extend the last log-period loss slope and cap at total portfolio TIV. The 1-in-500 and rarer values are extrapolations, not additional hazard scenarios.',
        'uncertainty_meaning': '5th–95th percentile of bootstrap resamples of the simulated 10,000 years; sampling variation conditional on assumed rates and losses only.',
        'years': years,
        'bootstrap_replicates': bootstraps,
        'seed': seed,
        'gross_only': True,
        'points': [
            {'return_period_years': int(period), 'annual_exceedance': 1 / period,
             'simulated_loss_kes': float(value), 'p05_kes': float(lo), 'p95_kes': float(hi),
             'extrapolated': bool(period > periods[-1])}
            for period, value, lo, hi in zip(target_periods, estimate, low, high)
        ],
    }
