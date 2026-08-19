from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., min_length=6)
    newPassword: str = Field(..., min_length=8)


class CurrentUserResponse(BaseModel):
    id: str

    name: str
    email: str
    role: str

    vtuNumber: str | None = None
    phoneNumber: str | None = None

    parentName: str | None = None
    parentPhone: str | None = None

    branch: str | None = None
    year: str | None = None
    semester: str | None = None
    section: str | None = None
    batch: str | None = None

    photoUrl: str | None = None

    smsEnabled: bool = True
    notificationsEnabled: bool = True

    active: bool = True

    forcePasswordChange: bool = False

    portalSynced: bool = False
    lastSyncedAt: str | None = None