from datetime import datetime

from pydantic import BaseModel


class NotificationPublic(BaseModel):
    id: str
    studentId: str

    subjectId: str | None = None
    subjectName: str | None = None
    date: str | None = None

    type: str
    title: str | None = None
    message: str

    priority: str = "NORMAL"

    read: bool
    smsStatus: str = "NOT_REQUIRED"
    smsMessageId: str | None = None

    source: str = "system"

    createdAt: datetime
    updatedAt: datetime | None = None


class MarkReadResponse(BaseModel):
    id: str
    read: bool