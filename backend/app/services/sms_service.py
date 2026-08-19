from pymongo.database import Database

from app.config.settings import settings
from app.models.notification import SMS_LOGS
from app.utils.dates import utc_now


class SMSService:
    def __init__(self, db: Database):
        self.db = db

    def send_sms(
        self,
        student_id: str,
        phone_number: str | None,
        message: str,
    ) -> dict:

        mode = (
            settings.sms_mode
            .strip()
            .upper()
        )

        phone = (
            phone_number.strip()
            if phone_number
            else None
        )

        message = message.strip()

        # =====================================================
        # NO PHONE NUMBER
        # =====================================================

        if not phone:
            status = "SKIPPED_NO_PHONE"
            message_id = None

        # =====================================================
        # TEST MODE
        # =====================================================

        elif mode == "TEST":
            status = "TEST_LOGGED"
            message_id = None

        # =====================================================
        # PRODUCTION MODE
        # =====================================================

        elif mode == "PRODUCTION":

            # -------------------------------------------------
            # IMPORTANT:
            #
            # Do not pretend that an SMS was sent.
            # Configure the real SMS provider here later.
            # -------------------------------------------------

            status = "PROVIDER_NOT_CONFIGURED"
            message_id = None

        # =====================================================
        # DISABLED / UNKNOWN MODE
        # =====================================================

        else:
            status = "DISABLED"
            message_id = None

        # =====================================================
        # LOG SMS ATTEMPT
        # =====================================================

        self.db[
            SMS_LOGS
        ].insert_one(
            {
                "studentId": student_id,
                "phoneNumber": phone,
                "message": message,
                "mode": mode,
                "status": status,
                "messageId": message_id,
                "createdAt": utc_now(),
            }
        )

        return {
            "status": status,
            "messageId": message_id,
        }