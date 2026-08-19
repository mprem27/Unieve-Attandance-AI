from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from pymongo.database import Database

from app.config.database import get_db
from app.models.user import USERS
from app.security.jwt import decode_access_token
from app.services.base import serialize_document


# =========================================================
# HTTP BEARER AUTHENTICATION
# =========================================================

bearer_scheme = HTTPBearer(
    auto_error=False
)


# =========================================================
# HELPER: NORMALIZE USER ID
# =========================================================

def _normalize_user_id(
    user: dict[str, Any],
) -> str | None:

    value = (
        user.get("id")
        or user.get("_id")
        or user.get("userId")
        or user.get("user_id")
    )

    if value is None:
        return None

    return str(value)


# =========================================================
# HELPER: NORMALIZE ROLE
# =========================================================

def _normalize_role(
    user: dict[str, Any],
) -> str:

    role = (
        user.get("role")
        or user.get("userRole")
        or user.get("user_role")
        or ""
    )

    return str(
        role
    ).strip().lower()


# =========================================================
# GET CURRENT AUTHENTICATED USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Database = Depends(get_db),
) -> dict:
    """
    Return the authenticated MongoDB user.

    The JWT identifies the user using `sub`.

    The returned dictionary always contains:

        id
        role

    so downstream routes such as attendance can
    reliably use:

        current_user["id"]
        current_user["role"]

    Portal credentials are never returned.
    """

    # =====================================================
    # CHECK BEARER TOKEN
    # =====================================================

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    token = str(
        credentials.credentials
    ).strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty bearer token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # DECODE JWT
    # =====================================================

    try:
        payload = decode_access_token(
            token
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not isinstance(
        payload,
        dict,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # GET JWT SUBJECT
    # =====================================================

    subject = (
        payload.get("sub")
        or payload.get("userId")
        or payload.get("user_id")
        or payload.get("id")
    )

    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a user identity",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    subject = str(
        subject
    ).strip()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identity",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # CONVERT USER ID
    # =====================================================

    try:
        user_id = ObjectId(
            subject
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identity",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # FETCH USER
    # =====================================================

    user = db[USERS].find_one(
        {
            "_id": user_id,
            "active": True,
        }
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # SERIALIZE USER
    # =====================================================

    serialized_user = serialize_document(
        user
    )

    if not isinstance(
        serialized_user,
        dict,
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to serialize authenticated user",
        )

    # =====================================================
    # FORCE CONSISTENT ID
    # =====================================================

    normalized_id = _normalize_user_id(
        serialized_user
    )

    if not normalized_id:
        normalized_id = str(
            user_id
        )

    serialized_user["id"] = (
        normalized_id
    )

    # =====================================================
    # FORCE CONSISTENT ROLE
    # =====================================================

    role = _normalize_role(
        serialized_user
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role is not configured",
        )

    serialized_user["role"] = role

    # =====================================================
    # REMOVE SENSITIVE APPLICATION PASSWORDS
    # =====================================================

    serialized_user.pop(
        "password",
        None,
    )

    serialized_user.pop(
        "passwordHash",
        None,
    )

    # =====================================================
    # REMOVE SENSITIVE PORTAL PASSWORDS
    # =====================================================

    serialized_user.pop(
        "portalPassword",
        None,
    )

    serialized_user.pop(
        "portalPasswordEncrypted",
        None,
    )

    serialized_user.pop(
        "portal_password",
        None,
    )

    serialized_user.pop(
        "portal_password_encrypted",
        None,
    )

    return serialized_user


# =========================================================
# REQUIRE ADMIN
# =========================================================

def require_admin(
    current_user: dict = Depends(
        get_current_user
    ),
) -> dict:
    """
    Allow only admin users.
    """

    role = _normalize_role(
        current_user
    )

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


# =========================================================
# REQUIRE STUDENT
# =========================================================

def require_student(
    current_user: dict = Depends(
        get_current_user
    ),
) -> dict:
    """
    Allow only student users.
    """

    role = _normalize_role(
        current_user
    )

    if role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )

    return current_user


# =========================================================
# REQUIRE SELF OR ADMIN
# =========================================================

def require_self_or_admin(
    user_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
) -> dict:
    """
    Admin can access any user.

    Students can access only their own data.
    """

    current_role = _normalize_role(
        current_user
    )

    current_id = _normalize_user_id(
        current_user
    )

    requested_id = str(
        user_id
    ).strip()

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if current_role == "admin":
        return current_user

    # -----------------------------------------------------
    # STUDENT
    # -----------------------------------------------------

    if current_role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # -----------------------------------------------------
    # ID CHECK
    # -----------------------------------------------------

    if not current_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user identity is missing",
        )

    if current_id != requested_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own data",
        )

    return current_user