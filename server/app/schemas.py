from pydantic import BaseModel, Field, model_validator
from typing import Literal


class PreviewRequest(BaseModel):
    free_text: str = Field(max_length=4000)


class VoiceTurn(BaseModel):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=2000)


class VoiceChatRequest(BaseModel):
    run_id: str | None = None
    history: list[VoiceTurn] = Field(min_length=1, max_length=12)
    property_calculation: dict | None = None


class RunRequest(BaseModel):
    apply_drainage_correction: bool = False
    free_text: str = Field("", max_length=4000)
    preview_id: str | None = None
    exposure_reviewed: bool = False
    coordinate_preview_id: str | None = None
    coordinates_reviewed: bool = False
    deductible_pct: float = Field(0, ge=0, le=100)
    policy_limit_pct: float = Field(100, ge=0, le=100)
    quota_share_ceded_pct: float = Field(0, ge=0, le=100)
    cat_xol_applies: bool = False
    cat_xol_attachment_kes: float | None = Field(None, ge=0)
    cat_xol_limit_kes: float | None = Field(None, ge=0)

    @model_validator(mode='after')
    def require_portfolio_layer_if_applicable(self):
        if self.cat_xol_applies and (self.cat_xol_attachment_kes is None or self.cat_xol_limit_kes is None):
            raise ValueError('Portfolio catastrophe excess of loss requires attachment and layer limit.')
        return self
