from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from app.models.notification import NOTIFICATIONS
from app.models.user import USERS
from app.services.base import serialize_document
from app.services.sms_service import SMSService
from app.utils.dates import utc_now


class NotificationService:
    """
    Handles in-app notifications and their SMS status.

    Attendance data itself is not modified here.
    """

    def __init__(self, db: Database):
        self.db = db
        self.sms_service = SMSService(db)

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

        SMS is sent only for a new ABSENT event.

        Existing attendance logic is not modified here.
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
        # SEND SMS ONLY FOR ABSENCE
        # =================================================

        if (
            student
            and student.get(
                "smsEnabled",
                True,
            )
            and student.get(
                "phoneNumber"
            )
            and normalized_new_status
            == "ABSENT"
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

            "smsStatus": sms_status,

            "smsMessageId": sms_message_id,

            "smsPhone": sms_phone,

            "smsError": sms_error,

            "smsSentAt": sms_sent_at,

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