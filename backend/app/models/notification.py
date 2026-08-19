from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


NOTIFICATIONS = "notifications"
SMS_LOGS = "sms_logs"


NotificationType = Literal[
    "ATTENDANCE_ABSENT",
    "ATTENDANCE_CORRECTED",
    "LOW_ATTENDANCE",
    "SYSTEM_ALERT",
    "SYNC_UPDATE",
]


SMSStatus = Literal[
    "NOT_REQUIRED",
    "PENDING",
    "SENT",
    "FAILED",
    "SKIPPED_NO_PHONE",
    "TEST_LOGGED",
    "PROVIDER_NOT_CONFIGURED",
    "DISABLED",
]


NotificationPriority = Literal[
    "LOW",
    "NORMAL",
    "HIGH",
    "CRITICAL",
]


class NotificationDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    id: Optional[str] = None

    # =========================================================
    # STUDENT
    # =========================================================

    studentId: str

    # =========================================================
    # SUBJECT
    # =========================================================

    subjectId: Optional[str] = None
    subjectName: Optional[str] = None

    # =========================================================
    # ATTENDANCE DATE
    # =========================================================

    date: Optional[str] = None

    # =========================================================
    # NOTIFICATION
    # =========================================================

    type: NotificationType

    title: Optional[str] = None

    message: str

    priority: NotificationPriority = "NORMAL"

    read: bool = False

    # =========================================================
    # SMS
    # =========================================================

    smsStatus: SMSStatus = "NOT_REQUIRED"

    smsMessageId: Optional[str] = None

    # =========================================================
    # SOURCE
    # =========================================================

    source: str = "system"

    # =========================================================
    # TIMESTAMPS
    # =========================================================

    createdAt: datetime

    updatedAt: Optional[datetime] = None