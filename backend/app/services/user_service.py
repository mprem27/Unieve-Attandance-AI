from __future__ import annotations

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from app.models.user import USERS
from app.schemas.user import (
    PortalCredentialsUpdate,
    ProfileUpdate,
    UserCreate,
    UserUpdate,
)
from app.security.portal_credentials import (
    encrypt_portal_password,
)
from app.services.ams.ams_adapter import (
    AmsAdapter,
    AmsAuthenticationError,
)
from app.services.base import (
    public_user,
    serialize_document,
)


class UserService:

    def __init__(self, db: Database):
        self.db = db
        self.ams_adapter = AmsAdapter()

    # =========================================================
    # BASIC HELPERS
    # =========================================================

    @staticmethod
    def _clean_text(value):

        if value is None:
            return None

        if isinstance(value, str):
            value = value.strip()
            return value or None

        return value

    @staticmethod
    def _normalize_portal_username(
        value: str | None,
    ) -> str | None:

        value = str(
            value or ""
        ).strip().upper()

        if not value:
            return None

        return value

    @staticmethod
    def _normalize_vtu_number(
        value: str | None,
    ) -> str | None:

        value = str(
            value or ""
        ).strip().upper()

        if not value:
            return None

        return value

    @staticmethod
    def _is_vtu_number(
        value: str | None,
    ) -> bool:

        if not value:
            return False

        value = str(
            value
        ).strip().upper()

        return (
            value.startswith("VTU")
            and value[3:].isdigit()
        )

    def _object_id(
        self,
        user_id: str,
    ) -> ObjectId:

        try:
            return ObjectId(
                str(user_id)
            )

        except Exception as exc:

            raise HTTPException(
                status_code=400,
                detail="Invalid user ID",
            ) from exc

    # =========================================================
    # AMS CREDENTIAL VALIDATION
    # =========================================================

    async def validate_ams_credentials(
        self,
        username: str | None,
        password: str | None,
    ) -> None:

        """
        Validate AMS credentials against the live AMS.

        Username:
            VTU number

        Example:
            VTU26381

        IMPORTANT:

        This method is used when a student enters AMS
        credentials manually.

        Invalid AMS credentials are returned as HTTP 400
        instead of HTTP 401 because the frontend currently
        treats HTTP 401 as application-session logout.

        Therefore:

            Invalid AMS credentials
                    ↓
            HTTP 400
                    ↓
            Show error message
                    ↓
            Student stays logged in
        """

        username = (
            self._normalize_portal_username(
                username
            )
        )

        password = str(
            password or ""
        )

        # -----------------------------------------------------
        # USERNAME
        # -----------------------------------------------------

        if not username:

            raise HTTPException(
                status_code=400,
                detail="AMS VTU number is required.",
            )

        if not self._is_vtu_number(
            username
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid AMS username. "
                    "Use the VTU number, for example VTU26381."
                ),
            )

        # -----------------------------------------------------
        # PASSWORD
        # -----------------------------------------------------

        if not password:

            raise HTTPException(
                status_code=400,
                detail="AMS password is required.",
            )

        session = None

        try:

            session = (
                await self.ams_adapter.login(
                    username=username,
                    password=password,
                )
            )

        # =====================================================
        # INVALID AMS CREDENTIALS
        # =====================================================

        except AmsAuthenticationError as exc:

            print()
            print(
                "========================================"
            )
            print(
                "INVALID AMS CREDENTIALS"
            )
            print(
                f"Username: {username}"
            )
            print(
                "========================================"
            )
            print()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid AMS credentials. "
                    "Check the VTU number and AMS password."
                ),
            ) from exc

        # =====================================================
        # ALREADY HANDLED HTTP EXCEPTION
        # =====================================================

        except HTTPException:

            raise

        # =====================================================
        # OTHER AMS ERROR
        # =====================================================

        except Exception as exc:

            print()
            print(
                "========================================"
            )
            print(
                "AMS CREDENTIAL VALIDATION FAILED"
            )
            print(
                f"Username: {username}"
            )
            print(
                f"Error: {exc}"
            )
            print(
                "========================================"
            )
            print()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to verify AMS credentials "
                    "right now. Please try again."
                ),
            ) from exc

        finally:

            if session:

                try:

                    await self.ams_adapter.logout(
                        session
                    )

                except Exception:
                    pass

    # =========================================================
    # CREATE USER
    # =========================================================

    async def create_user(
        self,
        payload: UserCreate,
    ) -> dict:

        """
        Create a new user.

        Student AMS credentials are OPTIONAL.

        Example:

            VTU number:
                VTU26381

            Roll number:
                23UECS1039

            AMS username:
                VTU26381

        If AMS password is supplied:

            validate → encrypt → save

        If AMS password is not supplied:

            create student normally

        Student can configure AMS later.
        """

        email = (
            payload.email
            .strip()
            .lower()
        )

        # -----------------------------------------------------
        # EMAIL DUPLICATE
        # -----------------------------------------------------

        if self.db[
            USERS
        ].find_one(
            {
                "email": email
            }
        ):

            raise HTTPException(
                status_code=409,
                detail="Email already exists",
            )

        # -----------------------------------------------------
        # STUDENT IDENTIFIERS
        # -----------------------------------------------------

        vtu_number = (
            self._normalize_vtu_number(
                payload.vtuNumber
            )
        )

        roll_number = (
            self._clean_text(
                payload.rollNumber
            )
        )

        if payload.role == "student":

            # =================================================
            # VTU NUMBER REQUIRED
            # =================================================

            if not vtu_number:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "VTU number is required "
                        "for a student."
                    ),
                )

            if not self._is_vtu_number(
                vtu_number
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid VTU number. "
                        "Use a value such as VTU26381."
                    ),
                )

            # =================================================
            # AMS USERNAME = VTU NUMBER
            # =================================================

            ams_username = vtu_number

            # =================================================
            # AMS PASSWORD OPTIONAL
            # =================================================

            if payload.portalPassword:

                await self.validate_ams_credentials(
                    ams_username,
                    payload.portalPassword,
                )

        else:

            ams_username = (
                self._normalize_portal_username(
                    payload.portalUsername
                )
            )

        # -----------------------------------------------------
        # VTU DUPLICATE
        # -----------------------------------------------------

        if vtu_number:

            if self.db[
                USERS
            ].find_one(
                {
                    "vtuNumber": vtu_number
                }
            ):

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "VTU number already exists."
                    ),
                )

        # -----------------------------------------------------
        # PORTAL USERNAME DUPLICATE
        # -----------------------------------------------------

        if ams_username:

            if self.db[
                USERS
            ].find_one(
                {
                    "portalUsername": ams_username
                }
            ):

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Portal username already exists."
                    ),
                )

        # =====================================================
        # BUILD USER DOCUMENT
        # =====================================================

        data = payload.model_dump(
            exclude_none=True
        )

        data["name"] = (
            payload.name.strip()
        )

        data["email"] = email
        data["role"] = payload.role

        # -----------------------------------------------------
        # IDENTIFIERS
        # -----------------------------------------------------

        if vtu_number:
            data["vtuNumber"] = vtu_number

        if roll_number:
            data["rollNumber"] = roll_number

        # -----------------------------------------------------
        # STUDENT PORTAL USERNAME
        # -----------------------------------------------------

        if payload.role == "student":

            # -------------------------------------------------
            # AMS credentials are OPTIONAL.
            # Do not mark AMS as configured merely because the
            # student has a VTU number.
            #
            # No AMS password:
            #     portalUsername = None
            #     portalPasswordEncrypted = None
            #     portalCredentialsConfigured = False
            #
            # AMS password supplied:
            #     portalUsername = VTU number
            #     validate -> encrypt -> save
            # -------------------------------------------------
            if getattr(payload, "portalPassword", None):
                data["portalUsername"] = vtu_number
            else:
                data.pop("portalUsername", None)

        elif ams_username:

            data["portalUsername"] = (
                ams_username
            )

        # =====================================================
        # CLEAN TEXT FIELDS
        # =====================================================

        text_fields = [
            "name",
            "vtuNumber",
            "rollNumber",
            "gender",
            "fatherName",
            "motherName",
            "dateOfBirth",
            "degree",
            "community",
            "religion",
            "nationality",
            "aadhaarNumber",
            "academicBankCreditsId",
            "phoneNumber",
            "parentName",
            "parentPhone",
            "branch",
            "year",
            "semester",
            "section",
            "batch",
            "photoUrl",
            "portalUsername",
        ]

        for field in text_fields:

            if field not in data:
                continue

            value = self._clean_text(
                data[field]
            )

            if value is None:

                data.pop(
                    field,
                    None,
                )

            else:

                data[field] = value

        # =====================================================
        # APPLICATION PASSWORD
        # =====================================================

        temporary_password = data.pop(
            "temporaryPassword",
            None,
        )

        if not temporary_password:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Temporary password is required."
                ),
            )

        from app.security.password import (
            hash_password,
        )

        data["passwordHash"] = (
            hash_password(
                temporary_password
            )
        )

        # =====================================================
        # AMS PASSWORD
        # =====================================================

        portal_password = data.pop(
            "portalPassword",
            None,
        )

        if (
            payload.role == "student"
            and portal_password
            and vtu_number
        ):

            data[
                "portalPasswordEncrypted"
            ] = encrypt_portal_password(
                portal_password
            )

            data[
                "portalCredentialsConfigured"
            ] = True

        else:

            data[
                "portalPasswordEncrypted"
            ] = None

            data[
                "portalCredentialsConfigured"
            ] = False

        # =====================================================
        # DEFAULT STATUS
        # =====================================================

        data.setdefault(
            "portalSynced",
            False,
        )

        data.setdefault(
            "lastSyncedAt",
            None,
        )

        data.setdefault(
            "portalSyncInProgress",
            False,
        )

        data.setdefault(
            "portalSyncLastError",
            None,
        )

        data.setdefault(
            "active",
            True,
        )

        data.setdefault(
            "smsEnabled",
            True,
        )

        data.setdefault(
            "notificationsEnabled",
            True,
        )

        data.setdefault(
            "forcePasswordChange",
            True,
        )

        # =====================================================
        # INSERT
        # =====================================================

        result = self.db[
            USERS
        ].insert_one(
            data
        )

        print()
        print(
            "========================================"
        )
        print(
            "STUDENT CREATED"
        )
        print(
            f"Student ID: {result.inserted_id}"
        )
        print(
            f"VTU Number: {vtu_number or '-'}"
        )
        print(
            f"Roll Number: {roll_number or '-'}"
        )
        print(
            f"AMS Username: {ams_username or '-'}"
        )
        print(
            "AMS Credentials Configured:",
            bool(
                portal_password
            ),
        )
        print(
            "Parent Portal Username:",
            vtu_number or "-",
        )
        print(
            "Parent Portal Password: NOT REQUIRED"
        )
        print(
            "========================================"
        )
        print()

        return self.get_user(
            str(
                result.inserted_id
            )
        )

    # =========================================================
    # LIST USERS
    # =========================================================

    def list_users(
        self,
        active_only: bool = False,
    ) -> list[dict]:

        query = (
            {"active": True}
            if active_only
            else {}
        )

        users = (
            self.db[
                USERS
            ]
            .find(query)
            .sort(
                "name",
                1,
            )
        )

        return [
            public_user(
                serialize_document(
                    user
                )
            )
            for user in users
        ]

    # =========================================================
    # GET USER
    # =========================================================

    def get_user(
        self,
        user_id: str,
    ) -> dict:

        user = self.db[
            USERS
        ].find_one(
            {
                "_id": self._object_id(
                    user_id
                )
            }
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return public_user(
            serialize_document(
                user
            )
        )

    # =========================================================
    # UPDATE USER
    # =========================================================

    async def update_user(
        self,
        user_id: str,
        payload: UserUpdate,
    ) -> dict:

        object_id = self._object_id(
            user_id
        )

        existing = self.db[
            USERS
        ].find_one(
            {
                "_id": object_id
            }
        )

        if not existing:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        update = {
            key: value
            for key, value in (
                payload.model_dump().items()
            )
            if value is not None
        }

        if not update:

            return self.get_user(
                user_id
            )

        # =====================================================
        # CLEAN TEXT
        # =====================================================

        text_fields = [
            "name",
            "email",
            "vtuNumber",
            "rollNumber",
            "gender",
            "fatherName",
            "motherName",
            "dateOfBirth",
            "degree",
            "community",
            "religion",
            "nationality",
            "aadhaarNumber",
            "academicBankCreditsId",
            "phoneNumber",
            "parentName",
            "parentPhone",
            "branch",
            "year",
            "semester",
            "section",
            "batch",
            "photoUrl",
            "portalUsername",
        ]

        for field in text_fields:

            if field not in update:
                continue

            value = self._clean_text(
                update[field]
            )

            if (
                field == "email"
                and value
            ):

                value = value.lower()

            if (
                field == "vtuNumber"
                and value
            ):

                value = (
                    self._normalize_vtu_number(
                        value
                    )
                )

            if (
                field == "portalUsername"
                and value
            ):

                value = (
                    self._normalize_portal_username(
                        value
                    )
                )

            update[field] = value

        # =====================================================
        # VTU NUMBER CHANGE
        # =====================================================

        if "vtuNumber" in update:

            new_vtu = update.get(
                "vtuNumber"
            )

            if not new_vtu:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "VTU number cannot be empty."
                    ),
                )

            if not self._is_vtu_number(
                new_vtu
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid VTU number. "
                        "Use a value such as VTU26381."
                    ),
                )

            duplicate = self.db[
                USERS
            ].find_one(
                {
                    "vtuNumber": new_vtu,
                    "_id": {
                        "$ne": object_id
                    },
                }
            )

            if duplicate:

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "VTU number already exists."
                    ),
                )

            update[
                "portalUsername"
            ] = new_vtu

        # =====================================================
        # EMAIL DUPLICATE
        # =====================================================

        if update.get("email"):

            duplicate = self.db[
                USERS
            ].find_one(
                {
                    "email": update["email"],
                    "_id": {
                        "$ne": object_id
                    },
                }
            )

            if duplicate:

                raise HTTPException(
                    status_code=409,
                    detail="Email already exists",
                )

        # =====================================================
        # STUDENT PORTAL USERNAME
        # =====================================================

        if (
            existing.get("role")
            == "student"
        ):

            effective_vtu = (
                update.get(
                    "vtuNumber"
                )
                or existing.get(
                    "vtuNumber"
                )
            )

            if not effective_vtu:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Student VTU number is required."
                    ),
                )

            effective_vtu = (
                self._normalize_vtu_number(
                    effective_vtu
                )
            )

            if not self._is_vtu_number(
                effective_vtu
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid VTU number. "
                        "Use a value such as VTU26381."
                    ),
                )

            update[
                "vtuNumber"
            ] = effective_vtu

            update[
                "portalUsername"
            ] = effective_vtu

        # =====================================================
        # PORTAL USERNAME DUPLICATE
        # =====================================================

        if update.get(
            "portalUsername"
        ):

            duplicate = self.db[
                USERS
            ].find_one(
                {
                    "portalUsername": update[
                        "portalUsername"
                    ],
                    "_id": {
                        "$ne": object_id
                    },
                }
            )

            if duplicate:

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Portal username already exists."
                    ),
                )

        # =====================================================
        # AMS PASSWORD
        # =====================================================

        new_password = update.pop(
            "portalPassword",
            None,
        )

        if new_password is not None:

            username = (
                update.get(
                    "portalUsername"
                )
                or existing.get(
                    "portalUsername"
                )
                or update.get(
                    "vtuNumber"
                )
                or existing.get(
                    "vtuNumber"
                )
            )

            # -------------------------------------------------
            # VALIDATE AMS CREDENTIALS
            # -------------------------------------------------

            await self.validate_ams_credentials(
                username,
                new_password,
            )

            # -------------------------------------------------
            # ENCRYPT PASSWORD
            # -------------------------------------------------

            update[
                "portalPasswordEncrypted"
            ] = encrypt_portal_password(
                new_password
            )

            update[
                "portalCredentialsConfigured"
            ] = True

            update[
                "portalSynced"
            ] = False

            update[
                "lastSyncedAt"
            ] = None

            update[
                "portalSyncLastError"
            ] = None

        # =====================================================
        # VTU CHANGED WITHOUT NEW PASSWORD
        # =====================================================

        elif (
            "vtuNumber" in update
            and update["vtuNumber"]
            != existing.get(
                "vtuNumber"
            )
        ):

            update[
                "portalSynced"
            ] = False

            update[
                "lastSyncedAt"
            ] = None

            update[
                "portalSyncLastError"
            ] = (
                "VTU number changed. "
                "Please verify the AMS password "
                "before synchronization."
            )

        # =====================================================
        # PORTAL CREDENTIAL STATUS
        # =====================================================

        if (
            "portalUsername" in update
            or "portalPasswordEncrypted"
            in update
        ):

            username = update.get(
                "portalUsername",
                existing.get(
                    "portalUsername"
                ),
            )

            encrypted = update.get(
                "portalPasswordEncrypted",
                existing.get(
                    "portalPasswordEncrypted"
                ),
            )

            configured = bool(
                username
                and encrypted
            )

            update[
                "portalCredentialsConfigured"
            ] = configured

            if configured:

                update[
                    "portalSynced"
                ] = False

                update[
                    "lastSyncedAt"
                ] = None

        # =====================================================
        # SAVE
        # =====================================================

        self.db[
            USERS
        ].update_one(
            {
                "_id": object_id
            },
            {
                "$set": update
            },
        )

        return self.get_user(
            user_id
        )

    # =========================================================
    # UPDATE APPLICATION PROFILE
    # =========================================================

    def update_profile(
        self,
        user_id: str,
        payload: ProfileUpdate,
    ) -> dict:

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
                detail=(
                    "User not found or inactive"
                ),
            )

        update = {
            key: value
            for key, value in (
                payload.model_dump().items()
            )
            if value is not None
        }

        if update:

            self.db[
                USERS
            ].update_one(
                {
                    "_id": object_id
                },
                {
                    "$set": update
                },
            )

        return self.get_user(
            user_id
        )

    # =========================================================
    # UPDATE PORTAL CREDENTIALS
    # =========================================================

    async def update_portal_credentials(
        self,
        user_id: str,
        payload: PortalCredentialsUpdate,
    ) -> dict:

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
                detail=(
                    "User not found or inactive"
                ),
            )

        username = (
            self._normalize_portal_username(
                payload.portalUsername
            )
        )

        password = str(
            payload.portalPassword or ""
        )

        # =====================================================
        # STUDENT USERNAME MUST MATCH VTU
        # =====================================================

        if user.get(
            "role"
        ) == "student":

            stored_vtu = (
                self._normalize_vtu_number(
                    user.get(
                        "vtuNumber"
                    )
                )
            )

            if stored_vtu:

                if username != stored_vtu:

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "AMS username must match "
                            f"the student's VTU number "
                            f"({stored_vtu})."
                        ),
                    )

        # =====================================================
        # VALIDATE AMS
        # =====================================================

        await self.validate_ams_credentials(
            username,
            password,
        )

        # =====================================================
        # SAVE ENCRYPTED PASSWORD
        # =====================================================

        self.db[
            USERS
        ].update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "portalUsername": username,
                    "portalPasswordEncrypted": (
                        encrypt_portal_password(
                            password
                        )
                    ),
                    "portalCredentialsConfigured": True,
                    "portalSynced": False,
                    "lastSyncedAt": None,
                    "portalSyncLastError": None,
                }
            },
        )

        return {
            "configured": True,
            "portalUsername": username,
        }

    # =========================================================
    # GET PORTAL CREDENTIAL STATUS
    # =========================================================

    def get_portal_credentials_status(
        self,
        user_id: str,
    ) -> dict:

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
                detail=(
                    "User not found or inactive"
                ),
            )

        username = user.get(
            "portalUsername"
        )

        encrypted = user.get(
            "portalPasswordEncrypted"
        )

        configured = bool(
            username
            and encrypted
        )

        return {
            "configured": configured,
            "portalUsername": (
                username
                if configured
                else None
            ),
        }

    # =========================================================
    # REMOVE PORTAL CREDENTIALS
    # =========================================================

    def remove_portal_credentials(
        self,
        user_id: str,
    ) -> dict:

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
                detail=(
                    "User not found or inactive"
                ),
            )

        self.db[
            USERS
        ].update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "portalUsername": None,
                    "portalPasswordEncrypted": None,
                    "portalCredentialsConfigured": False,
                    "portalSynced": False,
                    "lastSyncedAt": None,
                    "portalSyncLastError": None,
                }
            },
        )

        return {
            "configured": False,
            "portalUsername": None,
        }

    # =========================================================
    # DELETE / DEACTIVATE
    # =========================================================

    def delete_user(
        self,
        user_id: str,
    ) -> None:

        result = self.db[
            USERS
        ].update_one(
            {
                "_id": self._object_id(
                    user_id
                )
            },
            {
                "$set": {
                    "active": False
                }
            },
        )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

    # =========================================================
    # ACTIVATE
    # =========================================================

    def activate_user(
        self,
        user_id: str,
    ) -> dict:

        result = self.db[
            USERS
        ].update_one(
            {
                "_id": self._object_id(
                    user_id
                )
            },
            {
                "$set": {
                    "active": True
                }
            },
        )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return self.get_user(
            user_id
        )