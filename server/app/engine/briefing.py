from __future__ import annotations

from typing import Any


def underwriter_briefing(result: dict[str, Any]) -> str:
    m = result["metrics"]
    ai = result["ai"]
    loss_100 = next(s for s in result["scenarios"] if s["return_period_years"] == 100)
    loss_250 = next(s for s in result["scenarios"] if s["return_period_years"] == 250)
    top_class = result["by_housing_class"][0]
    flags = ", ".join(ai["drainage"]["missed_hotspots"][:6]) or "none"
    delta = ai["loss_delta_severe_kes"]
    direction = "higher" if delta > 0 else "lower"
    text_note = " ".join(ai["free_text"].get("notes") or [])
    return (
        f"Nairobi pluvial flood — underwriter note (prototype).\n\n"
        f"Portfolio: {m['locations']} buildings, total insured value {m['total_tiv_kes']:,.0f} KES. "
        f"This book is SYNTHETIC. Do not treat it as a cedant submission.\n\n"
        f"At the assumed 1-in-100 level (occasional proxy mask) modelled ground-up loss is "
        f"{loss_100['loss_kes']:,.0f} KES. At the assumed 1-in-250 level (common proxy mask) it is "
        f"{loss_250['loss_kes']:,.0f} KES. Average annual loss implied by the assumed EP mapping is "
        f"{m['aal_kes']:,.0f} KES ({m['loss_cost_pct']:.2f}% of TIV).\n\n"
        f"Accumulation: {top_class['housing_class'].replace('_', ' ')} contributes the largest share of AAL "
        f"({top_class['aal_kes']:,.0f} KES).\n\n"
        f"AI drainage correction is {'ON' if ai['drainage']['enabled'] else 'OFF'}. "
        f"When on, it raises susceptibility near proxy misses ({flags}). "
        f"1-in-100 loss is {direction} by {abs(delta):,.0f} KES versus the uncorrected proxy. "
        f"{ai['drainage']['buildings_uplifted']} buildings received an uplift.\n\n"
        f"Free-text exposure: {text_note}\n\n"
        f"Limitations: hazard is a terrain/river PROXY; depth uses score×4 m (assumption); "
        f"vulnerability is JRC Africa residential adapted by construction class, not Kenya claims; "
        f"return periods are assumed. Drainage-driven flooding remains only partly captured."
    )
