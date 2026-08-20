from datetime import datetime

from pydantic import BaseModel


# =========================================================
# NOTIFICATION PUBLIC RESPONSE
# =========================================================

class NotificationPublic(BaseModel):
    """
    Public notification response returned to the frontend.

    Sensitive internal information is not exposed here.
    """

    # =====================================================
    # IDENTIFICATION
    # =====================================================

    id: str

    studentId: str

    # =====================================================
    # SUBJECT
    # =====================================================

    subjectId: str | None = None

    subjectName: str | None = None

    subjectCode: str | None = None

    # =====================================================
    # ATTENDANCE
    # =====================================================

    date: str | None = None

    attendanceStatus: str | None = None

    attendancePercentage: float | None = None

    # =====================================================
    # NOTIFICATION
    # =====================================================

    type: str

    title: str | None = None

    message: str

    priority: str = "NORMAL"

    read: bool = False

    # =====================================================
    # SMS
    # =====================================================

    smsStatus: str = "NOT_REQUIRED"

    smsMessageId: str | None = None

    smsSentAt: datetime | None = None

    # =====================================================
    # SOURCE
    # =====================================================

    source: str = "system"

    # =====================================================
    # TIMESTAMPS
    # =====================================================

    createdAt: datetime

    updatedAt: datetime | None = None


# =========================================================
# MARK READ RESPONSE
# =========================================================

class MarkReadResponse(BaseModel):
    """
    Response returned after marking one notification
    as read.
    """

    id: str

    read: bool