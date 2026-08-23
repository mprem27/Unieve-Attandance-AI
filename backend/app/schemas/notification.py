from datetime import datetime

from pydantic import BaseModel, Field


# =========================================================
# NOTIFICATION PUBLIC RESPONSE
# =========================================================

class NotificationPublic(BaseModel):
    id: str

    studentId: str

    subjectId: str | None = None
    subjectName: str | None = None
    subjectCode: str | None = None

    date: str | None = None
    attendanceStatus: str | None = None
    attendancePercentage: float | None = None

    type: str

    title: str | None = None

    message: str

    priority: str = "NORMAL"

    read: bool = False

    smsStatus: str = "NOT_REQUIRED"

    smsMessageId: str | None = None

    smsSentAt: datetime | None = None

    source: str = "system"

    createdAt: datetime

    updatedAt: datetime | None = None


# =========================================================
# MARK READ RESPONSE
# =========================================================

class MarkReadResponse(BaseModel):
    id: str

    read: bool


# =========================================================
# PUSH SUBSCRIPTION KEYS
# =========================================================

class PushSubscriptionKeys(BaseModel):
    p256dh: str = Field(
        ...,
        min_length=1,
    )

    auth: str = Field(
        ...,
        min_length=1,
    )


# =========================================================
# CREATE PUSH SUBSCRIPTION
# =========================================================

class PushSubscriptionCreate(BaseModel):
    endpoint: str = Field(
        ...,
        min_length=1,
    )

    keys: PushSubscriptionKeys


# =========================================================
# PUSH SUBSCRIPTION RESPONSE
# =========================================================

class PushSubscriptionResponse(BaseModel):
    success: bool

    message: str


# =========================================================
# PUSH NOTIFICATION STATUS
# =========================================================

class PushNotificationStatus(BaseModel):
    success: bool

    enabled: bool

    subscriptions: int