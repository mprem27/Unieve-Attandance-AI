from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.config.database import get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    CurrentUserResponse,
    LoginRequest,
    TokenResponse,
)
from app.security.permissions import get_current_user
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Database = Depends(get_db),
):
    return AuthService(db).authenticate(
        payload.email,
        payload.password,
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def me(
    current_user: dict = Depends(get_current_user),
):
    return current_user


@router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    AuthService(db).change_password(
        current_user["id"],
        payload.currentPassword,
        payload.newPassword,
    )

    return None