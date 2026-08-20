from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.config.database import get_db
from app.schemas.notification import (
    MarkReadResponse,
    NotificationPublic,
)
from app.security.permissions import get_current_user
from app.services.notification_service import NotificationService


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)


# =========================================================
# LIST NOTIFICATIONS
# =========================================================

@router.get(
    "",
    response_model=list[NotificationPublic],
)
def list_notifications(
    current_user: dict = Depends(
        get_current_user
    ),
    db: Database = Depends(get_db),
):
    """
    Return notifications belonging only to the
    authenticated user.

    Newest notifications are returned first.
    """

    return NotificationService(
        db
    ).list_notifications(
        current_user["id"]
    )


# =========================================================
# UNREAD NOTIFICATION COUNT
# =========================================================

@router.get(
    "/unread-count",
)
def unread_notification_count(
    current_user: dict = Depends(
        get_current_user
    ),
    db: Database = Depends(get_db),
):
    """
    Return the number of unread notifications
    belonging to the authenticated user.
    """

    count = NotificationService(
        db
    ).get_unread_count(
        current_user["id"]
    )

    return {
        "success": True,
        "count": count,
    }


# =========================================================
# MARK ONE NOTIFICATION AS READ
# =========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=MarkReadResponse,
)
def mark_read(
    notification_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
    db: Database = Depends(get_db),
):
    """
    Mark one notification as read.

    A user can only modify their own notification.
    """

    result = NotificationService(
        db
    ).mark_read(
        notification_id,
        current_user["id"],
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return result


# =========================================================
# MARK ALL NOTIFICATIONS AS READ
# =========================================================

@router.patch(
    "/read-all",
)
def mark_all_read(
    current_user: dict = Depends(
        get_current_user
    ),
    db: Database = Depends(get_db),
):
    """
    Mark all unread notifications belonging to
    the authenticated user as read.
    """

    modified_count = NotificationService(
        db
    ).mark_all_read(
        current_user["id"]
    )

    return {
        "success": True,
        "message": (
            "All notifications marked as read."
        ),
        "modified": modified_count,
    }


# =========================================================
# DELETE NOTIFICATION
# =========================================================

@router.delete(
    "/{notification_id}",
)
def delete_notification(
    notification_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
    db: Database = Depends(get_db),
):
    """
    Delete one notification belonging to the
    authenticated user.
    """

    deleted = NotificationService(
        db
    ).delete_notification(
        notification_id,
        current_user["id"],
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return {
        "success": True,
        "message": (
            "Notification deleted successfully."
        ),
    }