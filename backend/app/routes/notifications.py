from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.config.database import get_db
from app.schemas.notification import (
    MarkReadResponse,
    NotificationPublic,
)
from app.security.permissions import get_current_user
from app.services.notification_service import NotificationService


router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)


@router.get(
    "",
    response_model=list[NotificationPublic],
)
def list_notifications(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return NotificationService(db).list_notifications(
        current_user["id"]
    )


@router.patch(
    "/{notification_id}/read",
    response_model=MarkReadResponse,
)
def mark_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return NotificationService(db).mark_read(
        notification_id,
        current_user["id"],
    )