from pydantic import BaseModel, Field


class RunRequest(BaseModel):
    apply_drainage_correction: bool = True
    free_text: str = Field("", max_length=4000)
