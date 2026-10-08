from pydantic import BaseModel, Field


class PreviewRequest(BaseModel):
    free_text: str = Field(max_length=4000)


class RunRequest(BaseModel):
    apply_drainage_correction: bool = False
    free_text: str = Field("", max_length=4000)
    preview_id: str | None = None
    exposure_reviewed: bool = False
    deductible_pct: float = Field(0, ge=0, le=100)
    policy_limit_pct: float = Field(100, ge=0, le=100)
