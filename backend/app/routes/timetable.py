from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.config.database import get_db
from app.models.timetable import TIMETABLE
from app.security.permissions import require_student
from app.security.portal_credentials import (
    decrypt_portal_password,
)
from app.services.base import serialize_document
from app.services.timetable_service import TimetableService
from app.services.ams.ams_adapter import AmsAdapter
from app.models.user import USERS


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/timetable",
    tags=["timetable"],
)


# =========================================================
# STUDENT TIMETABLE
# =========================================================

@router.get("")
def get_timetable(
    current_user: dict = Depends(
        require_student
    ),
    db: Database = Depends(get_db),
):
    """
    Return the authenticated student's active timetable.

    Timetable source:
        AMS / TimeTable.aspx

    This route ONLY reads timetable data.

    IMPORTANT:
        Attendance is not handled here.
    """

    # =====================================================
    # 1. GET AUTHENTICATED STUDENT ID
    # =====================================================

    student_id = str(
        current_user["id"]
    )

    # =====================================================
    # 2. FETCH ONLY THIS STUDENT'S TIMETABLE
    # =====================================================

    records = (
        db[TIMETABLE]
        .find(
            {
                "studentId": student_id,
                "active": True,
            }
        )
        .sort(
            [
                ("day", 1),
                ("startTime", 1),
            ]
        )
    )

    return [
        serialize_document(record)
        for record in records
    ]


# =========================================================
# SYNC TIMETABLE FROM AMS
# =========================================================

@router.post("/sync")
async def sync_timetable(
    current_user: dict = Depends(
        require_student
    ),
    db: Database = Depends(get_db),
):
    """
    Login to AMS using ONLY the authenticated
    student's saved AMS credentials.

    Fetch ONLY timetable information.

    IMPORTANT:
        - Attendance is NOT fetched.
        - Parent Portal is NOT used.
        - Other students' credentials are NOT used.
        - Only the authenticated student's data is returned.
    """

    # =====================================================
    # 1. GET AUTHENTICATED STUDENT ID
    # =====================================================

    student_id = str(
        current_user["id"]
    )

    if not student_id:
        raise HTTPException(
            status_code=401,
            detail=(
                "Student identity is missing."
            ),
        )

    # =====================================================
    # 2. FIND ONLY THIS STUDENT
    # =====================================================

    student = None

    try:

        student = db[USERS].find_one(
            {
                "_id": ObjectId(
                    student_id
                ),
                "role": "student",
                "active": True,
            }
        )

    except Exception:

        student = None

    # -----------------------------------------------------
    # Fallback for projects where the application user ID
    # is stored as a normal "id" field.
    # -----------------------------------------------------

    if student is None:

        student = db[USERS].find_one(
            {
                "id": student_id,
                "role": "student",
                "active": True,
            }
        )

    if not student:

        raise HTTPException(
            status_code=404,
            detail=(
                "Authenticated student was not found."
            ),
        )

    # =====================================================
    # 3. GET THIS STUDENT'S AMS USERNAME
    # =====================================================

    username = (
        student.get(
            "portalUsername"
        )
        or student.get(
            "vtuNumber"
        )
    )

    username = str(
        username or ""
    ).strip().upper()

    if not username:

        raise HTTPException(
            status_code=400,
            detail=(
                "AMS credentials are not configured "
                "for this student."
            ),
        )

    # =====================================================
    # 4. GET THIS STUDENT'S ENCRYPTED PASSWORD
    # =====================================================

    encrypted_password = student.get(
        "portalPasswordEncrypted"
    )

    if not encrypted_password:

        raise HTTPException(
            status_code=400,
            detail=(
                "AMS password is not configured "
                "for this student."
            ),
        )

    # =====================================================
    # 5. DECRYPT THIS STUDENT'S PASSWORD
    # =====================================================

    try:

        password = decrypt_portal_password(
            encrypted_password
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to decrypt this student's "
                "AMS password."
            ),
        ) from exc

    if not password:

        raise HTTPException(
            status_code=400,
            detail=(
                "AMS password is not configured "
                "for this student."
            ),
        )

    # =====================================================
    # 6. CREATE AMS ADAPTER
    # =====================================================

    adapter = AmsAdapter()

    session = None

    try:

        # =================================================
        # 7. LOGIN USING ONLY THIS STUDENT
        # =================================================

        session = await adapter.login(
            username=username,
            password=password,
            vtu_number=username,
        )

        if not session:

            raise HTTPException(
                status_code=502,
                detail=(
                    "AMS login failed. "
                    "No valid AMS session was created."
                ),
            )

        # =================================================
        # 8. SYNC ONLY TIMETABLE
        # =================================================

        service = TimetableService(
            db=db,
            ams_adapter=adapter,
        )

        result = await service.sync_timetable(
            student_id=student_id,
            session=session,
            profile={
                "semester": student.get(
                    "semester"
                ),

                "branch": student.get(
                    "branch"
                ),

                "section": student.get(
                    "section"
                ),
            },
        )

        # =================================================
        # 9. HANDLE SERVICE RESULT
        # =================================================
        #
        # The updated service returns a dictionary.
        #
        # Older versions may return a list.
        # Keep compatibility with both.
        # =================================================

        if isinstance(
            result,
            dict,
        ):

            records = result.get(
                "timetable",
                [],
            )

            # -------------------------------------------------
            # If timetable wasn't included in the result,
            # fetch the authenticated student's stored records.
            # -------------------------------------------------

            if not isinstance(
                records,
                list,
            ):

                records = []

            if not records:

                stored_records = (
                    db[TIMETABLE]
                    .find(
                        {
                            "studentId": student_id,
                            "active": True,
                        }
                    )
                    .sort(
                        [
                            ("day", 1),
                            ("startTime", 1),
                        ]
                    )
                )

                records = list(
                    stored_records
                )

            # -------------------------------------------------
            # Profile
            # -------------------------------------------------

            profile = result.get(
                "profile",
                {},
            )

            if not isinstance(
                profile,
                dict,
            ):
                profile = {}

            # -------------------------------------------------
            # Bucket
            # -------------------------------------------------

            bucket = result.get(
                "bucket"
            )

            # -------------------------------------------------
            # Courses
            # -------------------------------------------------

            courses = result.get(
                "courses",
                [],
            )

            if not isinstance(
                courses,
                list,
            ):
                courses = []

            # -------------------------------------------------
            # Sync statistics
            # -------------------------------------------------

            inserted = result.get(
                "inserted",
                0,
            )

            updated = result.get(
                "updated",
                0,
            )

            deactivated = result.get(
                "deactivated",
                0,
            )

        else:

            # -------------------------------------------------
            # Backward compatibility with the previous service
            # which returned only a list.
            # -------------------------------------------------

            records = (
                result
                if isinstance(
                    result,
                    list,
                )
                else []
            )

            profile = {}

            bucket = None

            courses = []

            inserted = 0

            updated = 0

            deactivated = 0

        # =================================================
        # 10. SERIALIZE ONLY THIS STUDENT'S RECORDS
        # =================================================

        serialized_records = [
            serialize_document(
                record
            )
            for record in records
            if isinstance(
                record,
                dict,
            )
            and str(
                record.get(
                    "studentId",
                    ""
                )
            ) == student_id
        ]

        # =================================================
        # 11. RETURN COMPLETE TIMETABLE INFORMATION
        # =================================================

        return {
            "success": True,

            "message": (
                "Timetable synchronized successfully."
            ),

            "studentId": student_id,

            "username": username,

            "total": len(
                serialized_records
            ),

            "inserted": inserted,

            "updated": updated,

            "deactivated": deactivated,

            # -------------------------------------------------
            # Student Profile
            # -------------------------------------------------

            "profile": profile,

            # -------------------------------------------------
            # Your Bucket
            # -------------------------------------------------

            "bucket": bucket,

            # -------------------------------------------------
            # Course Registered Details
            # -------------------------------------------------

            "courses": courses,

            # -------------------------------------------------
            # Time Table
            # -------------------------------------------------

            "data": serialized_records,
        }

    except HTTPException:

        raise

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to synchronize timetable "
                f"from AMS: {str(exc)}"
            ),
        ) from exc

    finally:

        # =====================================================
        # 12. ALWAYS LOGOUT FROM AMS
        # =====================================================

        if session:

            try:

                await adapter.logout(
                    session
                )

            except Exception:

                pass