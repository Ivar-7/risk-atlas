from __future__ import annotations

from typing import Any


def underwriter_briefing(result: dict[str, Any]) -> str:
    m = result["metrics"]
    interventions = result["interventions"]
    loss_100 = next(s for s in result["scenarios"] if s["return_period_years"] == 100)
    loss_250 = next(s for s in result["scenarios"] if s["return_period_years"] == 250)
    top_class = result["by_housing_class"][0]
    flags = ", ".join(interventions["drainage"]["sensitivity_missed_hotspots"][:6]) or "none"
    delta = interventions["drainage_delta_1_in_100_kes"]
    direction = "higher" if delta > 0 else "lower"
    text_note = " ".join(interventions["free_text"].get("notes") or [])
    return (
        f"Nairobi pluvial flood — underwriter note (prototype).\n\n"
        f"Portfolio: {m['locations']} buildings, total insured value {m['total_tiv_kes']:,.0f} KES. "
        f"This is a sample portfolio, not a cedant submission.\n\n"
        f"At the assumed 1-in-100 level (occasional proxy mask), modelled ground-up loss is "
        f"{loss_100['ground_up_loss_kes']:,.0f} KES and gross insured loss is {loss_100['loss_kes']:,.0f} KES. "
        f"At the assumed 1-in-250 level (common proxy mask), gross insured loss is "
        f"{loss_250['loss_kes']:,.0f} KES. Gross insured annual average loss implied by the assumed EP mapping is "
        f"{m['aal_kes']:,.0f} KES ({m['loss_cost_pct']:.2f}% of TIV).\n\n"
        f"Assumed property terms: deductible {result['controls']['deductible_pct']:g}% of each building's TIV; "
        f"policy limit {result['controls']['policy_limit_pct']:g}% of each building's TIV. "
        f"No verified policy terms or reinsurance are included.\n\n"
        f"Accumulation: {top_class['housing_class'].replace('_', ' ')} contributes the largest share of AAL "
        f"({top_class['aal_kes']:,.0f} KES).\n\n"
        f"Unvalidated drainage sensitivity is {'included in this run' if interventions['drainage']['enabled'] else 'excluded from this run'}. "
        f"It is centred on proxy misses ({flags}). "
        f"Its illustrative 1-in-100 loss is {direction} by {abs(delta):,.0f} KES versus the proxy-only run. "
        f"{interventions['drainage']['sensitivity_buildings_uplifted']} buildings would receive an uplift. "
        f"Those same centres cannot independently demonstrate improved predictive accuracy.\n\n"
        f"Free-text exposure: {text_note}\n\n"
        f"Limitations: hazard is a terrain/river PROXY; depth uses score×4 m (assumption); "
        f"vulnerability is JRC Africa residential adapted by construction class, not Kenya claims; "
        f"return periods are assumed. Drainage-driven flooding remains only partly captured."
    )
