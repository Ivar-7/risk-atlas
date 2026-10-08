from pydantic import BaseModel, Field


class PreviewRequest(BaseModel):
    free_text: str = Field(max_length=4000)


class RunRequest(BaseModel):
    apply_drainage_correction: bool = True
    free_text: str = Field("", max_length=4000)
    preview_id: str | None = None
