import re

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

ROLE_PATTERN = r"^(institution|student|employer)$"


class SignupRequest(BaseModel):
    """Signup accepts email (preferred) and/or name."""

    name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=300)
    role: str = Field(pattern=ROLE_PATTERN)
    password: str = Field(min_length=8, max_length=200)

    @model_validator(mode="after")
    def _check(self):
        self.name = (self.name or "").strip() or None
        self.email = (self.email or "").strip().lower() or None
        if self.email and not _EMAIL_RE.match(self.email):
            raise ValueError("Enter a valid email address")
        if not self.name and not self.email:
            raise ValueError("Name or email is required")
        if not self.name:
            self.name = self.email.split("@")[0]
        return self


class LoginRequest(BaseModel):
    """Login works with email OR name (the frontend sends email)."""

    name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=300)
    role: str = Field(pattern=ROLE_PATTERN)
    password: str = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def _check(self):
        self.name = (self.name or "").strip() or None
        self.email = (self.email or "").strip().lower() or None
        if not self.name and not self.email:
            raise ValueError("Email is required")
        return self


class SessionResponse(BaseModel):
    id: str | None = None
    name: str
    email: str | None = None
    role: str
    token: str | None = None


class IssueCertificateRequest(BaseModel):
    # Accepts both snake_case (API) and camelCase (current React client).
    model_config = ConfigDict(populate_by_name=True)

    student_name: str = Field(
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("student_name", "studentName"),
    )

    student_email: str = Field(
        min_length=3,
        max_length=300,
        validation_alias=AliasChoices("student_email", "studentEmail"),
    )

    course: str = Field(
        min_length=1,
        max_length=300
    )

    certificate_title: str = Field(
        default="Certificate of Completion",
        min_length=1,
        max_length=300,
        validation_alias=AliasChoices("certificate_title", "certificateTitle"),
    )

    issue_date: str = Field(
        min_length=8,
        max_length=20,
        validation_alias=AliasChoices("issue_date", "issueDate"),
    )

    status: str = Field(
        default="ACTIVE",
        pattern=r"^(ACTIVE|PENDING|REVOKED)$"
    )

    verification_type: str = Field(
        default="BLOCKCHAIN_NATIVE",
        pattern=(
            r"^(BLOCKCHAIN_NATIVE|LOCAL_CRYPTOGRAPHIC|"
            r"EXTERNAL_VERIFIED|"
            r"EXTERNAL_PENDING)$"
        )
    )


class CertificateResponse(BaseModel):
    id: str

    hash: str

    student_name: str
    student_email: str

    course: str
    certificate_title: str

    institution: str
    institution_id: str

    issue_date: str

    status: str

    verification_type: str

    blockchain_tx_hash: str | None = None
    blockchain_network: str | None = None
    blockchain_timestamp: str | None = None

    created_at: int


class VerifyResponse(BaseModel):
    status: str

    entry: CertificateResponse | None = None