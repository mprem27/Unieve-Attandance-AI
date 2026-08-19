from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.config.database import get_db
from app.schemas.user import (
    PortalCredentialsPublic,
    PortalCredentialsUpdate,
    ProfileUpdate,
    UserPublic,
)
from app.security.permissions import get_current_user
from app.services.user_service import UserService
from app.services.base import serialize_document


# =========================================================
# ROUTER
# =========================================================

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
    """
    Return the complete authenticated user's profile.

    IMPORTANT IDENTIFIER MAPPING

        VTU number:
            VTU26381

        Roll / registration number:
            23UECS1039

        AMS username:
            VTU26381

        Parent Portal login:
            VTU26381

        Parent Portal password:
            NOT REQUIRED

    Passwords are never returned.
    """

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
    """
    Update student-controlled application settings.

    Currently supported:

        - smsEnabled
        - notificationsEnabled

    College identity information is not changed here.
    """

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
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Save or update Veltech AMS credentials.

    IMPORTANT:

        AMS username = VTU number

    Example:

        VTU number  = VTU26381
        Roll number = 23UECS1039

    Therefore:

        portalUsername = VTU26381

    NOT:

        portalUsername = 23UECS1039

    Parent Portal does not require a password.

    The AMS password is encrypted by UserService
    before being stored in MongoDB.

    Passwords are never returned.

    ---------------------------------------------------------
    ERROR BEHAVIOUR
    ---------------------------------------------------------

    Correct AMS credentials:

        validate AMS
            ↓
        save encrypted credentials
            ↓
        return 200

    Wrong AMS credentials:

        validate AMS
            ↓
        HTTP 400
            ↓
        frontend displays error
            ↓
        student remains logged in

    IMPORTANT:

    This endpoint must NEVER use HTTP 401 for an invalid
    AMS username/password.

    HTTP 401 is reserved for an invalid/expired application
    authentication token.
    """

    # =====================================================
    # BASIC VALIDATION
    # =====================================================

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AMS credentials are required.",
        )

    # =====================================================
    # NORMALIZE USERNAME
    # =====================================================

    portal_username = (
        str(
            payload.portalUsername
            or ""
        )
        .strip()
        .upper()
    )

    if not portal_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VTU number is required.",
        )

    # =====================================================
    # CREATE CLEAN PAYLOAD
    # =====================================================

    payload.portalUsername = (
        portal_username
    )

    # =====================================================
    # VALIDATE + SAVE AMS CREDENTIALS
    # =====================================================
    #
    # UserService performs the live AMS validation.
    #
    # IMPORTANT:
    #
    # HTTPException from UserService is deliberately
    # allowed to propagate.
    #
    # Therefore if UserService raises:
    #
    #     HTTPException(400, "Invalid AMS credentials.")
    #
    # FastAPI returns exactly:
    #
    #     HTTP 400
    #
    # and the frontend does NOT logout.
    #
    # =====================================================

    try:

        result = await UserService(
            db
        ).update_portal_credentials(
            current_user["id"],
            payload,
        )

    except HTTPException:
        # -------------------------------------------------
        # DO NOT CHANGE THE STATUS CODE.
        #
        # Especially do not convert 400 -> 401.
        # -------------------------------------------------
        raise

    except ValueError as exc:
        # -------------------------------------------------
        # Invalid credential/input errors should be shown
        # to the student instead of becoming a server error.
        # -------------------------------------------------

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
            or "Invalid AMS credentials.",
        ) from exc

    except Exception as exc:
        # -------------------------------------------------
        # Unexpected errors remain server errors.
        #
        # This is NOT treated as invalid credentials because
        # we should not hide real backend/database problems.
        # -------------------------------------------------

        import logging

        logging.getLogger(__name__).exception(
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

    # =====================================================
    # USER NOT FOUND
    # =====================================================

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unable to update portal credentials.",
        )

    # =====================================================
    # SUCCESS
    # =====================================================

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
    """
    Return the student's AMS credential status.

    Example:

        {
            "configured": true,
            "portalUsername": "VTU26381"
        }

    OR:

        {
            "configured": false,
            "portalUsername": null
        }

    The password is NEVER returned.

    Parent Portal password is not required.
    """

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