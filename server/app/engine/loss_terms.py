"""Single-occurrence loss waterfall using explicit, verified contract inputs."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, model_validator

CENT = Decimal('0.01')


class LossTerms(BaseModel):
    ground_up_loss_kes: Decimal = Field(ge=0, max_digits=18, decimal_places=2)
    deductible_kes: Decimal = Field(ge=0, max_digits=18, decimal_places=2)
    policy_limit_kes: Decimal = Field(ge=0, max_digits=18, decimal_places=2)
    quota_share_ceded_pct: Decimal = Field(ge=0, le=100, max_digits=5, decimal_places=2)
    cat_xol_applies: bool
    cat_xol_attachment_kes: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    cat_xol_limit_kes: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)

    @model_validator(mode='after')
    def require_layer_if_applicable(self):
        if self.cat_xol_applies and (self.cat_xol_attachment_kes is None or self.cat_xol_limit_kes is None):
            raise ValueError('Catastrophe excess of loss requires both attachment and layer limit.')
        return self


def calculate_loss(terms: LossTerms) -> dict:
    """Order: loss, policy deductible/limit, quota share, applicable cat XOL."""
    gross = min(max(terms.ground_up_loss_kes - terms.deductible_kes, Decimal(0)), terms.policy_limit_kes)
    quota_recovery = (gross * terms.quota_share_ceded_pct / Decimal(100)).quantize(CENT, rounding=ROUND_HALF_UP)
    retained = gross - quota_recovery
    if terms.cat_xol_applies:
        cat_recovery = min(max(retained - terms.cat_xol_attachment_kes, Decimal(0)), terms.cat_xol_limit_kes)
    else:
        cat_recovery = Decimal(0)
    net = retained - cat_recovery
    return {
        'ground_up_loss_kes': terms.ground_up_loss_kes,
        'deductible_kes': terms.deductible_kes,
        'deductible_applied_kes': min(terms.ground_up_loss_kes, terms.deductible_kes),
        'policy_limit_kes': terms.policy_limit_kes,
        'gross_loss_kes': gross,
        'quota_share_ceded_pct': terms.quota_share_ceded_pct,
        'quota_share_recovery_kes': quota_recovery,
        'retained_before_cat_kes': retained,
        'cat_xol_applies': terms.cat_xol_applies,
        'cat_xol_attachment_kes': terms.cat_xol_attachment_kes if terms.cat_xol_applies else None,
        'cat_xol_limit_kes': terms.cat_xol_limit_kes if terms.cat_xol_applies else None,
        'cat_xol_recovery_kes': cat_recovery,
        'net_loss_kes': net,
        'basis': 'Single occurrence; policy deductible then limit, quota share cession, then applicable catastrophe excess of loss on retained loss.',
    }
