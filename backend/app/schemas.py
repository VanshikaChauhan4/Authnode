from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    role: str = Field(pattern=r"^(institution|student|employer)$")


class SessionResponse(BaseModel):
    token: str
    name: str
    role: str


class IssueCertificateRequest(BaseModel):
    student_name: str = Field(min_length=1, max_length=200)
    course: str = Field(min_length=1, max_length=300)
    issue_date: str = Field(min_length=8, max_length=20)


class CertificateResponse(BaseModel):
    id: str
    hash: str
    student_name: str
    course: str
    institution: str
    issue_date: str
    created_at: int


class VerifyResponse(BaseModel):
    status: str
    entry: CertificateResponse | None = None
