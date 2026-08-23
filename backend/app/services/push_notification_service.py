import logging
import os

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database
from pywebpush import WebPushException, webpush

from app.models.push_subscription import PUSH_SUBSCRIPTIONS
from app.schemas.notification import PushSubscriptionCreate
from app.utils.dates import utc_now


logger = logging.getLogger(__name__)


class PushNotificationService:

    def __init__(self, db: Database):
        self.db = db

        self.vapid_public_key = (
            os.getenv("VAPID_PUBLIC_KEY")
            or ""
        ).strip()

        self.vapid_private_key = (
            os.getenv("VAPID_PRIVATE_KEY")
            or ""
        ).strip()

        self.vapid_subject = (
            os.getenv("VAPID_SUBJECT")
            or ""
        ).strip()

    # =====================================================
    # CHECK CONFIGURATION
    # =====================================================

    def is_configured(self) -> bool:
        return bool(
            self.vapid_public_key
            and self.vapid_private_key
            and self.vapid_subject
        )

    # =====================================================
    # SAVE SUBSCRIPTION
    # =====================================================

    def subscribe(
        self,
        user_id: str,
        payload: PushSubscriptionCreate,
    ) -> dict:

        endpoint = (
            payload.endpoint.strip()
        )

        p256dh = (
            payload.keys.p256dh.strip()
        )

        auth = (
            payload.keys.auth.strip()
        )

        if not endpoint:
            raise HTTPException(
                status_code=400,
                detail="Push endpoint is required.",
            )

        if not p256dh or not auth:
            raise HTTPException(
                status_code=400,
                detail="Push subscription keys are required.",
            )

        now = utc_now()

        existing = self.db[
            PUSH_SUBSCRIPTIONS
        ].find_one(
            {
                "userId": user_id,
                "endpoint": endpoint,
            }
        )

        if existing:

            self.db[
                PUSH_SUBSCRIPTIONS
            ].update_one(
                {
                    "_id": existing["_id"],
                },
                {
                    "$set": {
                        "p256dh": p256dh,
                        "auth": auth,
                        "enabled": True,
                        "updatedAt": now,
                    }
                },
            )

            return {
                "success": True,
                "message": (
                    "Push notifications enabled."
                ),
            }

        self.db[
            PUSH_SUBSCRIPTIONS
        ].insert_one(
            {
                "userId": user_id,
                "endpoint": endpoint,
                "p256dh": p256dh,
                "auth": auth,
                "enabled": True,
                "createdAt": now,
                "updatedAt": now,
            }
        )

        return {
            "success": True,
            "message": (
                "Push notifications enabled."
            ),
        }

    # =====================================================
    # UNSUBSCRIBE
    # =====================================================

    def unsubscribe(
        self,
        user_id: str,
        endpoint: str,
    ) -> dict:

        endpoint = (
            str(endpoint or "")
            .strip()
        )

        if not endpoint:
            raise HTTPException(
                status_code=400,
                detail="Push endpoint is required.",
            )

        result = self.db[
            PUSH_SUBSCRIPTIONS
        ].update_one(
            {
                "userId": user_id,
                "endpoint": endpoint,
            },
            {
                "$set": {
                    "enabled": False,
                    "updatedAt": utc_now(),
                }
            },
        )

        return {
            "success": True,
            "message": (
                "Push notifications disabled."
            ),
        }

    # =====================================================
    # STATUS
    # =====================================================

    def get_status(
        self,
        user_id: str,
    ) -> dict:

        count = self.db[
            PUSH_SUBSCRIPTIONS
        ].count_documents(
            {
                "userId": user_id,
                "enabled": True,
            }
        )

        return {
            "success": True,
            "enabled": count > 0,
            "subscriptions": count,
        }

    # =====================================================
    # SEND TO ONE USER
    # =====================================================

    def send_to_user(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "SYSTEM_ALERT",
        notification_id: str | None = None,
    ) -> dict:

        if not self.is_configured():

            logger.warning(
                "Web Push is not configured."
            )

            return {
                "success": False,
                "sent": 0,
                "failed": 0,
                "reason": (
                    "Web Push is not configured."
                ),
            }

        subscriptions = list(
            self.db[
                PUSH_SUBSCRIPTIONS
            ].find(
                {
                    "userId": user_id,
                    "enabled": True,
                }
            )
        )

        sent = 0
        failed = 0

        for subscription in subscriptions:

            endpoint = subscription.get(
                "endpoint"
            )

            p256dh = subscription.get(
                "p256dh"
            )

            auth = subscription.get(
                "auth"
            )

            if not endpoint or not p256dh or not auth:
                continue

            data = {
                "title": title,
                "message": message,
                "type": notification_type,
            }

            if notification_id:
                data["notificationId"] = (
                    notification_id
                )

            try:

                webpush(
                    subscription_info={
                        "endpoint": endpoint,
                        "keys": {
                            "p256dh": p256dh,
                            "auth": auth,
                        },
                    },
                    data=__import__(
                        "json"
                    ).dumps(data),
                    vapid_private_key=(
                        self.vapid_private_key
                    ),
                    vapid_claims={
                        "sub": (
                            self.vapid_subject
                        ),
                    },
                )

                sent += 1

            except WebPushException as exc:

                failed += 1

                status_code = getattr(
                    getattr(
                        exc,
                        "response",
                        None,
                    ),
                    "status_code",
                    None,
                )

                if status_code in (
                    404,
                    410,
                ):
                    self.db[
                        PUSH_SUBSCRIPTIONS
                    ].update_one(
                        {
                            "_id": subscription[
                                "_id"
                            ],
                        },
                        {
                            "$set": {
                                "enabled": False,
                                "updatedAt": utc_now(),
                            }
                        },
                    )

                logger.warning(
                    "Web Push delivery failed."
                )

            except Exception:

                failed += 1

                logger.exception(
                    "Unexpected Web Push error."
                )

        return {
            "success": sent > 0,
            "sent": sent,
            "failed": failed,
        }

    # =====================================================
    # SEND TEST
    # =====================================================

    def send_test(
        self,
        user_id: str,
    ) -> dict:

        return self.send_to_user(
            user_id=user_id,
            title="UniEve AI",
            message=(
                "Push notifications are "
                "working successfully."
            ),
            notification_type="SYSTEM_ALERT",
        )