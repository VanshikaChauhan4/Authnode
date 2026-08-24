from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)

    role: str = Field(
        pattern=r"^(institution|student|employer)$"
    )

    password: str = Field(
        min_length=8,
        max_length=200
    )


class LoginRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)

    role: str = Field(
        pattern=r"^(institution|student|employer)$"
    )

    password: str = Field(
        min_length=1,
        max_length=200
    )


class SessionResponse(BaseModel):
    name: str
    role: str


class IssueCertificateRequest(BaseModel):
    student_name: str = Field(
        min_length=1,
        max_length=200
    )

    student_email: str = Field(
        min_length=3,
        max_length=300
    )

    course: str = Field(
        min_length=1,
        max_length=300
    )

    certificate_title: str = Field(
        min_length=1,
        max_length=300
    )

    issue_date: str = Field(
        min_length=8,
        max_length=20
    )

    status: str = Field(
        default="ACTIVE",
        pattern=r"^(ACTIVE|PENDING|REVOKED)$"
    )

    verification_type: str = Field(
        default="BLOCKCHAIN_NATIVE",
        pattern=(
            r"^(BLOCKCHAIN_NATIVE|"
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