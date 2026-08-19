from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from pymongo.database import Database

from app.models.timetable import TIMETABLE
from app.services.ams.ams_adapter import AmsAdapter


logger = logging.getLogger(__name__)


class TimetableService:
    """
    Service for synchronizing the student's complete timetable
    information from Vel Tech AMS into MongoDB.

    IMPORTANT:
    - AMS attendance is NOT handled here.
    - Existing attendance code is NOT touched.
    - Only timetable-related AMS data is handled here.

    Stored information:
    - Student profile
    - Bucket
    - Course registered details
    - Timetable
    """

    def __init__(
        self,
        db: Database,
        ams_adapter: AmsAdapter | None = None,
    ) -> None:
        self.db = db
        self.ams_adapter = (
            ams_adapter or AmsAdapter()
        )

    # =========================================================
    # GET STORED TIMETABLE
    # =========================================================

    def get_student_timetable(
        self,
        student_id: str,
    ) -> list[dict[str, Any]]:
        """
        Get the student's active timetable records
        from MongoDB.
        """

        records = (
            self.db[TIMETABLE]
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

        return list(records)

    # =========================================================
    # GET COMPLETE STORED AMS DETAILS
    # =========================================================

    def get_student_timetable_details(
        self,
        student_id: str,
    ) -> dict[str, Any]:
        """
        Return the complete stored timetable information.

        This includes:

        - Student profile
        - Bucket
        - Course registered details
        - Timetable
        """

        timetable_records = (
            self.get_student_timetable(
                student_id
            )
        )

        metadata = (
            self.db["timetable_metadata"]
            .find_one(
                {
                    "studentId": student_id,
                    "active": True,
                }
            )
        )

        if metadata:
            metadata.pop(
                "_id",
                None,
            )

        if not metadata:
            metadata = {}

        return {
            "profile": metadata.get(
                "profile",
                {},
            ),
            "bucket": metadata.get(
                "bucket"
            ),
            "courses": metadata.get(
                "courses",
                [],
            ),
            "timetable": timetable_records,
        }

    # =========================================================
    # SYNC COMPLETE AMS TIMETABLE
    # =========================================================

    async def sync_timetable(
        self,
        student_id: str,
        session: dict[str, Any],
        profile: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Fetch the complete timetable page from AMS and
        synchronize it into MongoDB.

        AMS data collected:

        1. Student Profile
        2. Bucket
        3. Course Registered Details
        4. Time Table

        Existing attendance data is never touched.
        """

        if not student_id:
            raise ValueError(
                "Student ID is required."
            )

        if not session:
            raise ValueError(
                "AMS session is required."
            )

        profile = profile or {}

        # =====================================================
        # 1. FETCH COMPLETE AMS TIMETABLE PAGE
        # =====================================================

        details = (
            await self.ams_adapter
            .get_timetable_details(
                session
            )
        )

        if not details:
            logger.warning(
                "No timetable details returned from AMS "
                "for student %s",
                student_id,
            )

            return []

        if not isinstance(
            details,
            dict,
        ):
            raise ValueError(
                "Invalid timetable response from AMS."
            )

        # =====================================================
        # 2. EXTRACT AMS DATA
        # =====================================================

        ams_profile = details.get(
            "profile"
        )

        if not isinstance(
            ams_profile,
            dict,
        ):
            ams_profile = {}

        bucket = details.get(
            "bucket"
        )

        courses = details.get(
            "courses"
        )

        if not isinstance(
            courses,
            list,
        ):
            courses = []

        ams_records = details.get(
            "timetable"
        )

        if not isinstance(
            ams_records,
            list,
        ):
            ams_records = []

        # =====================================================
        # 3. MERGE PROFILE
        # =====================================================
        #
        # AMS profile has priority.
        # Existing application profile is only a fallback.
        # =====================================================

        combined_profile = {
            **profile,
            **ams_profile,
        }

        # Keep application student ID separately.
        combined_profile[
            "studentId"
        ] = student_id

        # =====================================================
        # 4. DO NOT DESTROY OLD DATA ON EMPTY AMS RESPONSE
        # =====================================================
        #
        # This is important.
        #
        # If AMS temporarily returns an empty timetable,
        # existing timetable data should remain available.
        #
        # We also do not deactivate anything.
        # =====================================================

        if not ams_records:

            logger.warning(
                "AMS returned no timetable records for "
                "student %s. Existing timetable was not changed.",
                student_id,
            )

            # Still save profile/course metadata if AMS
            # successfully returned those sections.
            if (
                ams_profile
                or bucket is not None
                or courses
            ):
                self._save_metadata(
                    student_id=student_id,
                    profile=combined_profile,
                    bucket=bucket,
                    courses=courses,
                )

            return self.get_student_timetable(
                student_id
            )

        # =====================================================
        # 5. DEACTIVATE ONLY OLD AMS TIMETABLE
        # =====================================================
        #
        # IMPORTANT:
        #
        # Only documents:
        #     source = "ams"
        #
        # are touched.
        #
        # Attendance collections are not touched.
        # =====================================================

        now = datetime.utcnow()

        self.db[TIMETABLE].update_many(
            {
                "studentId": student_id,
                "source": "ams",
                "active": True,
            },
            {
                "$set": {
                    "active": False,
                    "updatedAt": now,
                }
            },
        )

        # =====================================================
        # 6. ACADEMIC FALLBACK VALUES
        # =====================================================

        semester = (
            combined_profile.get(
                "semester"
            )
            or combined_profile.get(
                "Semester"
            )
        )

        branch = (
            combined_profile.get(
                "branch"
            )
            or combined_profile.get(
                "Branch"
            )
        )

        section = (
            combined_profile.get(
                "section"
            )
            or combined_profile.get(
                "Section"
            )
        )

        # =====================================================
        # 7. PREPARE TIMETABLE DOCUMENTS
        # =====================================================

        documents: list[
            dict[str, Any]
        ] = []

        seen_keys: set[tuple] = set()

        for record in ams_records:

            if not isinstance(
                record,
                dict,
            ):
                continue

            day = (
                record.get("day")
                or ""
            )

            subject_code = (
                record.get(
                    "subjectCode"
                )
            )

            subject_name = (
                record.get(
                    "subjectName"
                )
                or record.get(
                    "courseName"
                )
            )

            start_time = (
                record.get(
                    "startTime"
                )
            )

            end_time = (
                record.get(
                    "endTime"
                )
            )

            slot = (
                record.get(
                    "slot"
                )
            )

            room = (
                record.get(
                    "room"
                )
            )

            # =================================================
            # UNIQUE RECORD KEY
            # =================================================

            key = (
                student_id,
                day,
                subject_code,
                subject_name,
                start_time,
                end_time,
                slot,
                room,
            )

            if key in seen_keys:
                continue

            seen_keys.add(key)

            # =================================================
            # CREATE DOCUMENT
            # =================================================

            document = {
                # ---------------------------------------------
                # APPLICATION STUDENT
                # ---------------------------------------------

                "studentId": student_id,

                # ---------------------------------------------
                # AMS PROFILE
                # ---------------------------------------------

                "idNumber": (
                    combined_profile.get(
                        "idNumber"
                    )
                    or combined_profile.get(
                        "vtuNumber"
                    )
                ),

                "studentName": (
                    combined_profile.get(
                        "name"
                    )
                    or combined_profile.get(
                        "studentName"
                    )
                ),

                "rollNumber": (
                    combined_profile.get(
                        "rollNumber"
                    )
                    or combined_profile.get(
                        "vtuNumber"
                    )
                ),

                "degree": (
                    combined_profile.get(
                        "degree"
                    )
                ),

                "batch": (
                    combined_profile.get(
                        "batch"
                    )
                ),

                "regulation": (
                    combined_profile.get(
                        "regulation"
                    )
                ),

                # ---------------------------------------------
                # ACADEMIC
                # ---------------------------------------------

                "semester": (
                    record.get(
                        "semester"
                    )
                    or semester
                ),

                "branch": (
                    record.get(
                        "branch"
                    )
                    or branch
                ),

                "section": (
                    record.get(
                        "section"
                    )
                    or section
                ),

                # ---------------------------------------------
                # BUCKET
                # ---------------------------------------------

                "bucket": bucket,

                # ---------------------------------------------
                # TIMETABLE
                # ---------------------------------------------

                "day": day,

                "slot": slot,

                "subjectId": (
                    record.get(
                        "subjectId"
                    )
                ),

                "subjectCode": subject_code,

                "subjectName": subject_name,

                "courseName": (
                    record.get(
                        "courseName"
                    )
                    or subject_name
                ),

                "faculty": (
                    record.get(
                        "faculty"
                    )
                    or record.get(
                        "facultyName"
                    )
                ),

                "facultyId": (
                    record.get(
                        "facultyId"
                    )
                ),

                "startTime": start_time,

                "endTime": end_time,

                "room": room,

                # ---------------------------------------------
                # COURSE INFORMATION
                # ---------------------------------------------

                "category": (
                    record.get(
                        "category"
                    )
                ),

                "credit": (
                    record.get(
                        "credit"
                    )
                ),

                # ---------------------------------------------
                # STATUS
                # ---------------------------------------------

                "active": True,

                "source": "ams",

                # ---------------------------------------------
                # TIMESTAMPS
                # ---------------------------------------------

                "createdAt": now,

                "updatedAt": now,
            }

            documents.append(
                document
            )

        # =====================================================
        # 8. INSERT NEW TIMETABLE
        # =====================================================

        if documents:

            result = (
                self.db[TIMETABLE]
                .insert_many(
                    documents
                )
            )

            logger.info(
                "AMS timetable synchronized for student %s: "
                "%s records",
                student_id,
                len(
                    result.inserted_ids
                ),
            )

        else:

            logger.warning(
                "AMS timetable contained no valid records "
                "for student %s",
                student_id,
            )

        # =====================================================
        # 9. SAVE PROFILE + BUCKET + COURSES
        # =====================================================

        self._save_metadata(
            student_id=student_id,
            profile=combined_profile,
            bucket=bucket,
            courses=courses,
        )

        # =====================================================
        # 10. RETURN STORED TIMETABLE
        # =====================================================

        return self.get_student_timetable(
            student_id
        )

    # =========================================================
    # SAVE AMS METADATA
    # =========================================================

    def _save_metadata(
        self,
        student_id: str,
        profile: dict[str, Any],
        bucket: Any,
        courses: list[dict[str, Any]],
    ) -> None:
        """
        Store the non-row timetable information separately.

        Collection:
            timetable_metadata

        This prevents the same student profile and course
        registration table from being duplicated into every
        timetable row.
        """

        now = datetime.utcnow()

        metadata = {
            "studentId": student_id,

            "profile": profile,

            "bucket": bucket,

            "courses": courses,

            "active": True,

            "source": "ams",

            "updatedAt": now,
        }

        existing = (
            self.db["timetable_metadata"]
            .find_one(
                {
                    "studentId": student_id,
                    "source": "ams",
                }
            )
        )

        if existing:

            self.db[
                "timetable_metadata"
            ].update_one(
                {
                    "_id": existing["_id"]
                },
                {
                    "$set": metadata
                },
            )

        else:

            metadata[
                "createdAt"
            ] = now

            self.db[
                "timetable_metadata"
            ].insert_one(
                metadata
            )

    # =========================================================
    # DEACTIVATE AMS TIMETABLE
    # =========================================================

    def deactivate_student_timetable(
        self,
        student_id: str,
    ) -> int:
        """
        Deactivate the student's AMS timetable.

        This does NOT delete the records.

        Only AMS timetable records are affected.
        """

        result = (
            self.db[TIMETABLE]
            .update_many(
                {
                    "studentId": student_id,
                    "source": "ams",
                    "active": True,
                },
                {
                    "$set": {
                        "active": False,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
        )

        logger.info(
            "Deactivated %s timetable records "
            "for student %s",
            result.modified_count,
            student_id,
        )

        return result.modified_count