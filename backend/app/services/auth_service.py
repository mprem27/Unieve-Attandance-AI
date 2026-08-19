from __future__ import annotations

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

from app.models.user import USERS
from app.schemas.user import UserCreate
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify_password
from app.security.portal_credentials import (
    encrypt_portal_password,
)
from app.services.base import (
    public_user,
    serialize_document,
)
from app.utils.validators import require_student_role


class AuthService:

    def __init__(
        self,
        db: Database,
    ):
        self.db = db

    # =========================================================
    # LOGIN
    # =========================================================

    def authenticate(
        self,
        email: str,
        password: str,
    ) -> dict:

        normalized_email = (
            email.strip().lower()
        )

        user = self.db[
            USERS
        ].find_one(
            {
                "email": normalized_email,
                "active": True,
            }
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        password_hash = user.get(
            "passwordHash"
        )

        if not password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(
            password,
            password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        serialized = serialize_document(
            user
        )

        token = create_access_token(
            serialized["id"],
            serialized["role"],
        )

        return {
            "accessToken": token,
            "tokenType": "bearer",
        }

    # =========================================================
    # CREATE STUDENT
    # =========================================================

    def create_user(
        self,
        payload: UserCreate,
    ) -> dict:

        # -----------------------------------------------------
        # Admin can create student accounts only
        # -----------------------------------------------------

        require_student_role(
            payload.role
        )

        # -----------------------------------------------------
        # BASIC VALUES
        # -----------------------------------------------------

        email = (
            payload.email
            .strip()
            .lower()
        )

        vtu_number = (
            payload.vtuNumber.strip()
            if payload.vtuNumber
            else None
        )

        portal_username = (
            payload.portalUsername.strip()
            if payload.portalUsername
            else None
        )

        portal_password = (
            payload.portalPassword.strip()
            if payload.portalPassword
            else None
        )

        # =====================================================
        # EMAIL UNIQUENESS
        # =====================================================

        existing_email = self.db[
            USERS
        ].find_one(
            {
                "email": email,
            }
        )

        if existing_email:
            raise HTTPException(
                status_code=409,
                detail="Email already exists",
            )

        # =====================================================
        # VTU NUMBER UNIQUENESS
        # =====================================================

        if vtu_number:

            existing_vtu = self.db[
                USERS
            ].find_one(
                {
                    "vtuNumber": vtu_number,
                }
            )

            if existing_vtu:

                raise HTTPException(
                    status_code=409,
                    detail="VTU number already exists",
                )

        # =====================================================
        # PORTAL CREDENTIALS
        # =====================================================
        #
        # IMPORTANT:
        #
        # portalUsername:
        #     Parent/college portal login username.
        #
        # vtuNumber:
        #     Student/college roll number.
        #
        # Example:
        #
        #     portalUsername = VTU26381
        #     vtuNumber      = 23UECS1122
        #
        # NEVER store portalPassword as plain text.
        #
        # =====================================================

        portal_password_encrypted = None

        if portal_password:

            try:

                portal_password_encrypted = (
                    encrypt_portal_password(
                        portal_password
                    )
                )

            except Exception as exc:

                print(
                    "Portal password encryption failed:",
                    repr(exc),
                )

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Failed to encrypt portal password."
                    ),
                ) from exc

            if not portal_password_encrypted:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Portal password encryption "
                        "returned an empty value."
                    ),
                )

        portal_credentials_configured = bool(
            portal_username
            and portal_password_encrypted
        )

        # =====================================================
        # CREATE STUDENT DOCUMENT
        # =====================================================

        user = {
            # -------------------------------------------------
            # BASIC INFORMATION
            # -------------------------------------------------

            "name": payload.name.strip(),

            "email": email,

            "passwordHash": hash_password(
                payload.temporaryPassword
            ),

            "role": "student",

            # -------------------------------------------------
            # STUDENT IDENTIFICATION
            # -------------------------------------------------

            "vtuNumber": vtu_number,

            # -------------------------------------------------
            # PORTAL CREDENTIALS
            # -------------------------------------------------

            "portalUsername": portal_username,

            "portalPasswordEncrypted": (
                portal_password_encrypted
            ),

            "portalCredentialsConfigured": (
                portal_credentials_configured
            ),

            # -------------------------------------------------
            # CONTACT
            # -------------------------------------------------

            "phoneNumber": (
                payload.phoneNumber.strip()
                if payload.phoneNumber
                else None
            ),

            "parentName": (
                payload.parentName.strip()
                if payload.parentName
                else None
            ),

            "parentPhone": (
                payload.parentPhone.strip()
                if payload.parentPhone
                else None
            ),

            # -------------------------------------------------
            # ACADEMIC INFORMATION
            # -------------------------------------------------

            "branch": (
                payload.branch.strip()
                if payload.branch
                else None
            ),

            "year": (
                payload.year.strip()
                if payload.year
                else None
            ),

            "semester": (
                payload.semester.strip()
                if payload.semester
                else None
            ),

            "section": (
                payload.section.strip()
                if payload.section
                else None
            ),

            "batch": (
                payload.batch.strip()
                if payload.batch
                else None
            ),

            # -------------------------------------------------
            # PHOTO
            # -------------------------------------------------

            "photoUrl": (
                payload.photoUrl.strip()
                if payload.photoUrl
                else None
            ),

            # -------------------------------------------------
            # NOTIFICATIONS
            # -------------------------------------------------

            "smsEnabled": (
                payload.smsEnabled
            ),

            "notificationsEnabled": (
                payload.notificationsEnabled
            ),

            # -------------------------------------------------
            # ACCOUNT
            # -------------------------------------------------

            "active": payload.active,

            "forcePasswordChange": True,

            # -------------------------------------------------
            # PORTAL SYNC
            # -------------------------------------------------

            "portalSynced": False,

            "lastSyncedAt": None,

            # -------------------------------------------------
            # SOURCE
            # -------------------------------------------------

            "source": "admin",
        }

        # =====================================================
        # INSERT INTO MONGODB
        # =====================================================

        result = self.db[
            USERS
        ].insert_one(
            user
        )

        user["_id"] = (
            result.inserted_id
        )

        # =====================================================
        # VERIFY INSERTED DOCUMENT
        # =====================================================

        saved_user = self.db[
            USERS
        ].find_one(
            {
                "_id": result.inserted_id,
            }
        )

        if not saved_user:

            raise HTTPException(
                status_code=500,
                detail=(
                    "Student was created but could "
                    "not be read back from MongoDB."
                ),
            )

        # =====================================================
        # VERIFY PORTAL CREDENTIALS
        # =====================================================

        if portal_username:

            saved_portal_username = (
                saved_user.get(
                    "portalUsername"
                )
            )

            saved_encrypted_password = (
                saved_user.get(
                    "portalPasswordEncrypted"
                )
            )

            saved_configured = (
                saved_user.get(
                    "portalCredentialsConfigured",
                    False,
                )
            )

            if not (
                saved_portal_username
                and saved_encrypted_password
                and saved_configured
            ):

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Student was created, but "
                        "portal credentials were not "
                        "saved correctly."
                    ),
                )

            print("")
            print(
                "========================================"
            )
            print(
                "STUDENT CREATED"
            )
            print(
                f"Student ID: "
                f"{result.inserted_id}"
            )
            print(
                f"Name: "
                f"{saved_user.get('name')}"
            )
            print(
                f"Email: "
                f"{saved_user.get('email')}"
            )
            print(
                f"Portal Username: "
                f"{saved_portal_username}"
            )
            print(
                f"VTU Number: "
                f"{saved_user.get('vtuNumber')}"
            )
            print(
                "Portal Password: ENCRYPTED"
            )
            print(
                "Portal Credentials Configured: TRUE"
            )
            print(
                "========================================"
            )
            print("")

        else:

            print("")
            print(
                "========================================"
            )
            print(
                "STUDENT CREATED"
            )
            print(
                f"Student ID: "
                f"{result.inserted_id}"
            )
            print(
                f"Name: "
                f"{saved_user.get('name')}"
            )
            print(
                f"Email: "
                f"{saved_user.get('email')}"
            )
            print(
                "Portal Username: NOT PROVIDED"
            )
            print(
                f"VTU Number: "
                f"{saved_user.get('vtuNumber')}"
            )
            print(
                "Portal Credentials Configured: FALSE"
            )
            print(
                "========================================"
            )
            print("")

        # =====================================================
        # RETURN PUBLIC USER
        # =====================================================

        return public_user(
            serialize_document(
                saved_user
            )
        )

    # =========================================================
    # CHANGE PASSWORD
    # =========================================================

    def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
    ) -> None:

        object_id = self._object_id(
            user_id
        )

        user = self.db[
            USERS
        ].find_one(
            {
                "_id": object_id,
                "active": True,
            }
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found or inactive",
            )

        password_hash = user.get(
            "passwordHash"
        )

        if not password_hash:

            raise HTTPException(
                status_code=400,
                detail="Password is not configured",
            )

        if not verify_password(
            current_password,
            password_hash,
        ):

            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect",
            )

        self.db[
            USERS
        ].update_one(
            {
                "_id": object_id,
            },
            {
                "$set": {
                    "passwordHash": hash_password(
                        new_password
                    ),
                    "forcePasswordChange": False,
                }
            },
        )

    # =========================================================
    # ADMIN PASSWORD RESET
    # =========================================================

    def reset_password(
        self,
        user_id: str,
        new_password: str,
    ) -> None:

        object_id = self._object_id(
            user_id
        )

        user = self.db[
            USERS
        ].find_one(
            {
                "_id": object_id,
            }
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        self.db[
            USERS
        ].update_one(
            {
                "_id": object_id,
            },
            {
                "$set": {
                    "passwordHash": hash_password(
                        new_password
                    ),
                    "forcePasswordChange": True,
                }
            },
        )

    # =========================================================
    # DEFAULT ADMIN
    # =========================================================

    def ensure_default_admin(
        self,
        email: str,
        password: str,
        name: str,
    ) -> None:

        existing_admin = self.db[
            USERS
        ].find_one(
            {
                "role": "admin",
            }
        )

        if existing_admin:
            return

        self.db[
            USERS
        ].insert_one(
            {
                "name": name.strip(),

                "email": (
                    email
                    .strip()
                    .lower()
                ),

                "passwordHash": hash_password(
                    password
                ),

                "role": "admin",

                "vtuNumber": None,

                "portalUsername": None,

                "portalPasswordEncrypted": None,

                "portalCredentialsConfigured": False,

                "phoneNumber": None,

                "parentName": None,

                "parentPhone": None,

                "branch": None,

                "year": None,

                "semester": None,

                "section": None,

                "batch": None,

                "photoUrl": None,

                "smsEnabled": False,

                "notificationsEnabled": True,

                "active": True,

                "forcePasswordChange": False,

                "portalSynced": False,

                "lastSyncedAt": None,

                "source": "system",
            }
        )

    # =========================================================
    # OBJECT ID HELPER
    # =========================================================

    def _object_id(
        self,
        user_id: str,
    ) -> ObjectId:

        try:

            return ObjectId(
                user_id
            )

        except Exception as exc:

            raise HTTPException(
                status_code=400,
                detail="Invalid user ID",
            ) from exc