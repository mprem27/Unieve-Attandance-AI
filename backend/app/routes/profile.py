from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pymongo.database import Database

from app.config.database import get_db
from app.schemas.user import (
    PortalCredentialsPublic,
    PortalCredentialsUpdate,
    ProfileUpdate,
    UserPublic,
)
from app.security.permissions import get_current_user
from app.services.base import serialize_document
from app.services.user_service import UserService
from app.scheduler.attendance_sync import AttendanceSyncRunner

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


# =========================================================
# GET CURRENT USER PROFILE
# =========================================================

@router.get(
    "",
    response_model=UserPublic,
)
def get_profile(
    current_user: dict = Depends(get_current_user),
):
    return current_user


# =========================================================
# UPDATE APPLICATION PROFILE SETTINGS
# =========================================================

@router.put(
    "",
    response_model=UserPublic,
)
def update_profile(
    payload: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    updated_user = UserService(
        db
    ).update_profile(
        current_user["id"],
        payload,
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    return serialize_document(
        updated_user
    )


# =========================================================
# UPDATE AMS CREDENTIALS
# =========================================================

@router.put(
    "/portal-credentials",
    response_model=PortalCredentialsPublic,
)
async def update_portal_credentials(
    payload: PortalCredentialsUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Save or update AMS credentials.

    AMS credentials are optional during Admin student creation.

    A student can configure or update AMS credentials later.

    AMS username:
        VTU number

    Parent Portal:
        VTU number
        Password not required
    """

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AMS credentials are required.",
        )

    vtu_number = str(
        current_user.get("vtuNumber")
        or ""
    ).strip().upper()

    if not vtu_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Student VTU number is required "
                "before configuring AMS."
            ),
        )

    portal_username = str(
        payload.portalUsername
        or vtu_number
    ).strip().upper()

    portal_password = str(
        payload.portalPassword
        or ""
    ).strip()

    if portal_username != vtu_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "AMS username must be the student's "
                "VTU number."
            ),
        )

    if not portal_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AMS password is required.",
        )

    payload.portalUsername = vtu_number
    payload.portalPassword = portal_password

    try:
        result = await UserService(
            db
        ).update_portal_credentials(
            current_user["id"],
            payload,
        )

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
            or "Invalid AMS credentials.",
        ) from exc

    except Exception as exc:
        logger.exception(
            "AMS credential update failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to update AMS credentials. "
                "Please try again."
            ),
        ) from exc

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Unable to update portal credentials."
            ),
        )

    async def _sync_student():
        try:
            sync_result = await AttendanceSyncRunner(
                db
            ).sync_single_student(
                current_user["id"]
            )

            logger.info(
                "Student AMS sync completed: "
                "student=%s success=%s attendance=%s "
                "subjects=%s records=%s errors=%s",
                current_user["id"],
                sync_result.get(
                    "success",
                    False,
                ),
                sync_result.get(
                    "attendanceFetched",
                    0,
                ),
                sync_result.get(
                    "subjectsFetched",
                    0,
                ),
                sync_result.get(
                    "recordsProcessed",
                    0,
                ),
                sync_result.get(
                    "errorsCount",
                    0,
                ),
            )

        except Exception as exc:
            logger.exception(
                "Student AMS sync failed after "
                "credentials were saved: student=%s "
                "error=%s",
                current_user["id"],
                exc,
            )

    background_tasks.add_task(
        _sync_student
    )

    return result


# =========================================================
# GET AMS CREDENTIAL STATUS
# =========================================================

@router.get(
    "/portal-credentials",
    response_model=PortalCredentialsPublic,
)
def get_portal_credentials(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    result = UserService(
        db
    ).get_portal_credentials_status(
        current_user["id"]
    )

    if not result:
        return {
            "configured": False,
            "portalUsername": None,
        }

    return result