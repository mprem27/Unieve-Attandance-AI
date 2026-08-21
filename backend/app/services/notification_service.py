from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from app.models.notification import NOTIFICATIONS
from app.models.user import USERS
from app.services.base import serialize_document
from app.services.sms_service import SMSService
from app.services.email_service import EmailService
from app.utils.dates import utc_now


class NotificationService:
    """
    Handles in-app notifications, email notifications,
    and SMS status.

    Attendance data itself is not modified here.
    """

    def __init__(self, db: Database):
        self.db = db

        # =================================================
        # EXISTING SMS SERVICE
        # =================================================

        self.sms_service = SMSService(db)

        # =================================================
        # EMAIL SERVICE
        # =================================================

        self.email_service = EmailService(db)

    # =====================================================
    # LIST STUDENT NOTIFICATIONS
    # =====================================================

    def list_notifications(
        self,
        student_id: str,
    ) -> list[dict]:

        cursor = (
            self.db[NOTIFICATIONS]
            .find(
                {
                    "studentId": student_id,
                }
            )
            .sort(
                "createdAt",
                -1,
            )
            .limit(100)
        )

        return [
            serialize_document(item)
            for item in cursor
        ]

    # =====================================================
    # LIST ALL NOTIFICATIONS
    # =====================================================

    def list_all_notifications(
        self,
    ) -> list[dict]:

        cursor = (
            self.db[NOTIFICATIONS]
            .find()
            .sort(
                "createdAt",
                -1,
            )
            .limit(500)
        )

        return [
            serialize_document(item)
            for item in cursor
        ]

    # =====================================================
    # UNREAD COUNT
    # =====================================================

    def get_unread_count(
        self,
        student_id: str,
    ) -> int:

        return self.db[
            NOTIFICATIONS
        ].count_documents(
            {
                "studentId": student_id,
                "read": False,
            }
        )

    # =====================================================
    # MARK ONE AS READ
    # =====================================================

    def mark_read(
        self,
        notification_id: str,
        student_id: str,
    ) -> dict:

        try:
            object_id = ObjectId(
                notification_id
            )

        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Invalid notification ID.",
            ) from exc

        result = self.db[
            NOTIFICATIONS
        ].update_one(
            {
                "_id": object_id,
                "studentId": student_id,
            },
            {
                "$set": {
                    "read": True,
                    "updatedAt": utc_now(),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Notification not found.",
            )

        return {
            "id": notification_id,
            "read": True,
        }

    # =====================================================
    # MARK ALL AS READ
    # =====================================================

    def mark_all_read(
        self,
        student_id: str,
    ) -> int:

        result = self.db[
            NOTIFICATIONS
        ].update_many(
            {
                "studentId": student_id,
                "read": False,
            },
            {
                "$set": {
                    "read": True,
                    "updatedAt": utc_now(),
                }
            },
        )

        return result.modified_count

    # =====================================================
    # DELETE ONE NOTIFICATION
    # =====================================================

    def delete_notification(
        self,
        notification_id: str,
        student_id: str,
    ) -> bool:

        try:
            object_id = ObjectId(
                notification_id
            )

        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Invalid notification ID.",
            ) from exc

        result = self.db[
            NOTIFICATIONS
        ].delete_one(
            {
                "_id": object_id,
                "studentId": student_id,
            }
        )

        return result.deleted_count > 0

    # =====================================================
    # CREATE ATTENDANCE NOTIFICATION
    # =====================================================

    def create_attendance_notification(
        self,
        student_id: str,
        subject_id: str,
        subject_name: str,
        date: str,
        old_status: str,
        new_status: str,
        subject_code: str | None = None,
        attendance_percentage: float | None = None,
    ) -> dict:
        """
        Create an attendance notification.

        Existing notification and SMS behaviour is preserved.

        For a new ABSENT event:
            1. Create in-app notification.
            2. Attempt email notification.
            3. Attempt SMS according to existing SMS configuration.

        Attendance data itself is not modified here.
        """

        normalized_new_status = (
            str(new_status or "")
            .strip()
            .upper()
        )

        normalized_old_status = (
            str(old_status or "")
            .strip()
            .upper()
        )

        # =================================================
        # DETERMINE NOTIFICATION
        # =================================================

        if normalized_new_status == "ABSENT":

            notification_type = (
                "ATTENDANCE_ABSENT"
            )

            title = "Attendance Alert"

            message = (
                f"You were marked absent for "
                f"{subject_name} on {date}."
            )

            priority = "HIGH"

        else:

            notification_type = (
                "ATTENDANCE_CORRECTED"
            )

            title = "Attendance Corrected"

            message = (
                f"Attendance corrected for "
                f"{subject_name} on {date}: "
                f"{normalized_old_status} "
                f"to {normalized_new_status}."
            )

            priority = "NORMAL"

        # =================================================
        # DUPLICATE EVENT KEY
        # =================================================

        event_key = (
            f"attendance:"
            f"{student_id}:"
            f"{subject_id}:"
            f"{date}:"
            f"{normalized_old_status}:"
            f"{normalized_new_status}"
        )

        # =================================================
        # CHECK EXISTING NOTIFICATION
        # =================================================

        existing = self.db[
            NOTIFICATIONS
        ].find_one(
            {
                "eventKey": event_key,
            }
        )

        if existing:
            return serialize_document(
                existing
            )

        # =================================================
        # FIND STUDENT
        # =================================================

        try:
            student_object_id = ObjectId(
                student_id
            )

        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Invalid student ID.",
            ) from exc

        student = self.db[
            USERS
        ].find_one(
            {
                "_id": student_object_id,
                "role": "student",
            }
        )

        # =================================================
        # SMS DEFAULT
        # =================================================

        sms_status = "NOT_REQUIRED"
        sms_message_id = None
        sms_error = None
        sms_phone = None
        sms_sent_at = None

        # =================================================
        # EMAIL DEFAULT
        # =================================================

        email_status = "NOT_REQUIRED"
        email_message_id = None
        email_error = None
        email_sent_at = None

        # =================================================
        # ABSENT EVENT
        # =================================================

        if (
            student
            and normalized_new_status == "ABSENT"
        ):

            # =================================================
            # EMAIL NOTIFICATION
            # =================================================

            email_address = (
                student.get("email")
            )

            if (
                email_address
                and student.get(
                    "notificationsEnabled",
                    True,
                )
            ):
                try:

                    email_result = (
                        self.email_service.send_attendance_email(
                            student_id=student_id,
                            email_address=str(
                                email_address
                            ).strip(),
                            student_name=str(
                                student.get(
                                    "name",
                                    "Student",
                                )
                            ).strip(),
                            subject_name=subject_name,
                            subject_code=subject_code,
                            date=date,
                            message=message,
                            attendance_percentage=(
                                attendance_percentage
                            ),
                        )
                    )

                    if isinstance(
                        email_result,
                        dict,
                    ):

                        email_status = (
                            email_result.get(
                                "status",
                                "FAILED",
                            )
                        )

                        email_message_id = (
                            email_result.get(
                                "messageId"
                            )
                        )

                        email_error = (
                            email_result.get(
                                "error"
                            )
                        )

                        email_sent_at = (
                            email_result.get(
                                "sentAt"
                            )
                        )

                    else:

                        email_status = str(
                            email_result
                        )

                except Exception as exc:

                    # Email failure must NOT break
                    # attendance notification creation.

                    email_status = "FAILED"
                    email_error = str(exc)

            elif not email_address:

                email_status = (
                    "SKIPPED_NO_EMAIL"
                )

            else:

                email_status = "DISABLED"

            # =================================================
            # EXISTING SMS LOGIC
            # =================================================

            if (
                student.get(
                    "smsEnabled",
                    True,
                )
                and student.get(
                    "phoneNumber"
                )
            ):

                sms_phone = str(
                    student.get(
                        "phoneNumber"
                    )
                ).strip()

                try:

                    sms_result = (
                        self.sms_service.send_sms(
                            student_id=student_id,
                            phone_number=sms_phone,
                            message=message,
                        )
                    )

                    if isinstance(
                        sms_result,
                        dict,
                    ):

                        sms_status = (
                            sms_result.get(
                                "status",
                                "FAILED",
                            )
                        )

                        sms_message_id = (
                            sms_result.get(
                                "messageId"
                            )
                        )

                        sms_error = (
                            sms_result.get(
                                "error"
                            )
                        )

                        sms_sent_at = (
                            sms_result.get(
                                "sentAt"
                            )
                        )

                    else:

                        sms_status = str(
                            sms_result
                        )

                except Exception as exc:

                    sms_status = "FAILED"
                    sms_error = str(exc)

        # =================================================
        # CREATE DOCUMENT
        # =================================================

        now = utc_now()

        doc = {
            "studentId": student_id,

            "subjectId": subject_id,

            "subjectName": subject_name,

            "subjectCode": subject_code,

            "date": date,

            "attendanceStatus": (
                normalized_new_status
            ),

            "attendancePercentage": (
                attendance_percentage
            ),

            "type": notification_type,

            "title": title,

            "message": message,

            "priority": priority,

            "read": False,

            # =================================================
            # EMAIL
            # =================================================

            "emailStatus": email_status,

            "emailMessageId": (
                email_message_id
            ),

            "emailError": email_error,

            "emailSentAt": email_sent_at,

            # =================================================
            # SMS
            # =================================================

            "smsStatus": sms_status,

            "smsMessageId": sms_message_id,

            "smsPhone": sms_phone,

            "smsError": sms_error,

            "smsSentAt": sms_sent_at,

            # =================================================
            # EVENT
            # =================================================

            "eventKey": event_key,

            "source": "college_portal",

            "createdAt": now,

            "updatedAt": now,
        }

        # =================================================
        # INSERT
        # =================================================

        result = self.db[
            NOTIFICATIONS
        ].insert_one(doc)

        doc["_id"] = result.inserted_id

        return serialize_document(doc)