from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from app.models.notification import NOTIFICATIONS
from app.models.user import USERS
from app.services.base import serialize_document
from app.services.sms_service import SMSService
from app.utils.dates import utc_now


class NotificationService:
    def __init__(self, db: Database):
        self.db = db
        self.sms_service = SMSService(db)

    def list_notifications(
        self,
        student_id: str,
    ) -> list[dict]:
        cursor = (
            self.db[NOTIFICATIONS]
            .find({"studentId": student_id})
            .sort("createdAt", -1)
            .limit(100)
        )

        return [
            serialize_document(item)
            for item in cursor
        ]

    def list_all_notifications(self) -> list[dict]:
        cursor = (
            self.db[NOTIFICATIONS]
            .find()
            .sort("createdAt", -1)
            .limit(500)
        )

        return [
            serialize_document(item)
            for item in cursor
        ]

    def mark_read(
        self,
        notification_id: str,
        student_id: str,
    ) -> dict:
        try:
            object_id = ObjectId(notification_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid notification ID",
            )

        result = self.db[NOTIFICATIONS].update_one(
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
                detail="Notification not found",
            )

        return {
            "id": notification_id,
            "read": True,
        }

    def create_attendance_notification(
        self,
        student_id: str,
        subject_id: str,
        subject_name: str,
        date: str,
        old_status: str,
        new_status: str,
    ) -> dict:
        if new_status == "ABSENT":
            notification_type = "ATTENDANCE_ABSENT"
            title = "Attendance Alert"
            message = (
                f"You were marked absent for "
                f"{subject_name} on {date}."
            )
            priority = "HIGH"
        else:
            notification_type = "ATTENDANCE_CORRECTED"
            title = "Attendance Corrected"
            message = (
                f"Attendance corrected for "
                f"{subject_name} on {date}: "
                f"{old_status} to {new_status}."
            )
            priority = "NORMAL"

        try:
            student_object_id = ObjectId(student_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid student ID",
            )

        student = self.db[USERS].find_one(
            {
                "_id": student_object_id,
                "role": "student",
            }
        )

        sms_status = "NOT_REQUIRED"
        sms_message_id = None

        if (
            student
            and student.get("smsEnabled", True)
            and student.get("phoneNumber")
            and new_status == "ABSENT"
        ):
            sms_result = self.sms_service.send_sms(
                student_id=student_id,
                phone_number=student.get("phoneNumber"),
                message=message,
            )

            if isinstance(sms_result, dict):
                sms_status = sms_result.get(
                    "status",
                    "FAILED",
                )
                sms_message_id = sms_result.get(
                    "messageId"
                )
            else:
                sms_status = sms_result

        now = utc_now()

        doc = {
            "studentId": student_id,
            "subjectId": subject_id,
            "subjectName": subject_name,
            "date": date,
            "type": notification_type,
            "title": title,
            "message": message,
            "priority": priority,
            "read": False,
            "smsStatus": sms_status,
            "smsMessageId": sms_message_id,
            "source": "college_portal",
            "createdAt": now,
            "updatedAt": now,
        }

        result = self.db[NOTIFICATIONS].insert_one(doc)
        doc["_id"] = result.inserted_id

        return serialize_document(doc)