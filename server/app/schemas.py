from pydantic import BaseModel, EmailStr, Field


class PreviewRequest(BaseModel):
    free_text: str = Field(max_length=4000)


class RunRequest(BaseModel):
    apply_drainage_correction: bool = True
    free_text: str = Field("", max_length=4000)
    preview_id: str | None = None


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
