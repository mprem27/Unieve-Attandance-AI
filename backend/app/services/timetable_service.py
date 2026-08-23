from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from pymongo.database import Database

from app.models.timetable import TIMETABLE
from app.services.ams.ams_adapter import AmsAdapter


logger = logging.getLogger(__name__)


class TimetableService:

    def __init__(
        self,
        db: Database,
        ams_adapter: AmsAdapter | None = None,
    ) -> None:
        self.db = db
        self.ams_adapter = (
            ams_adapter or AmsAdapter()
        )

    def get_student_timetable(
        self,
        student_id: str,
    ) -> list[dict[str, Any]]:

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

    def get_student_timetable_details(
        self,
        student_id: str,
    ) -> dict[str, Any]:

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

        if not isinstance(
            metadata,
            dict,
        ):
            metadata = {}

        metadata.pop(
            "_id",
            None,
        )

        return {
            "profile": metadata.get(
                "profile",
                {},
            ),
            "bucket": metadata.get(
                "bucket",
            ),
            "courses": metadata.get(
                "courses",
                [],
            ),
            "timetable": timetable_records,
        }

    async def sync_timetable(
        self,
        student_id: str,
        session: dict[str, Any],
        profile: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        if not student_id:
            raise ValueError(
                "Student ID is required."
            )

        if not session:
            raise ValueError(
                "AMS session is required."
            )

        profile = (
            profile
            if isinstance(profile, dict)
            else {}
        )

        details = None

        try:
            details = await self.ams_adapter.get_timetable(
                session
            )
        except AttributeError:
            details = None

        if not isinstance(
            details,
            dict,
        ):
            try:
                details = (
                    await self.ams_adapter
                    .get_timetable_details(
                        session
                    )
                )
            except AttributeError as exc:
                raise ValueError(
                    "AMS timetable method is not available."
                ) from exc

        if not details:
            existing = (
                self.get_student_timetable_details(
                    student_id
                )
            )

            return {
                "profile": existing.get(
                    "profile",
                    {},
                ),
                "bucket": existing.get(
                    "bucket",
                ),
                "courses": existing.get(
                    "courses",
                    [],
                ),
                "timetable": existing.get(
                    "timetable",
                    [],
                ),
                "inserted": 0,
                "updated": 0,
                "deactivated": 0,
            }

        ams_profile = details.get(
            "profile",
            {},
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
            "courses",
            [],
        )

        if not isinstance(
            courses,
            list,
        ):
            courses = []

        ams_records = details.get(
            "timetable",
            [],
        )

        if not isinstance(
            ams_records,
            list,
        ):
            ams_records = []

        existing_metadata = (
            self.db["timetable_metadata"]
            .find_one(
                {
                    "studentId": student_id,
                    "active": True,
                }
            )
        )

        if not isinstance(
            existing_metadata,
            dict,
        ):
            existing_metadata = {}

        existing_profile = (
            existing_metadata.get(
                "profile",
                {},
            )
        )

        if not isinstance(
            existing_profile,
            dict,
        ):
            existing_profile = {}

        existing_bucket = (
            existing_metadata.get(
                "bucket"
            )
        )

        existing_courses = (
            existing_metadata.get(
                "courses",
                [],
            )
        )

        if not isinstance(
            existing_courses,
            list,
        ):
            existing_courses = []

        combined_profile = {
            **existing_profile,
            **profile,
            **ams_profile,
        }

        combined_profile[
            "studentId"
        ] = student_id

        if (
            bucket is None
            or str(bucket).strip() == ""
        ):
            bucket = existing_bucket

        if not courses:
            courses = existing_courses

        if not ams_records:

            self._save_metadata(
                student_id=student_id,
                profile=combined_profile,
                bucket=bucket,
                courses=courses,
            )

            existing_timetable = (
                self.get_student_timetable(
                    student_id
                )
            )

            return {
                "profile": combined_profile,
                "bucket": bucket,
                "courses": courses,
                "timetable": existing_timetable,
                "inserted": 0,
                "updated": 0,
                "deactivated": 0,
            }

        semester = (
            combined_profile.get(
                "semester"
            )
        )

        branch = (
            combined_profile.get(
                "branch"
            )
        )

        section = (
            combined_profile.get(
                "section"
            )
        )

        documents = []
        seen_keys = set()
        now = datetime.utcnow()

        for record in ams_records:

            if not isinstance(
                record,
                dict,
            ):
                continue

            day = self._value(
                record,
                "day",
                "Day",
            )

            start_time = self._value(
                record,
                "startTime",
                "start_time",
                "StartTime",
                "start",
                "fromTime",
            )

            end_time = self._value(
                record,
                "endTime",
                "end_time",
                "EndTime",
                "end",
                "toTime",
            )

            slot = self._value(
                record,
                "slot",
                "period",
                "Period",
            )

            subject_code = self._value(
                record,
                "subjectCode",
                "subject_code",
                "courseCode",
                "course_code",
            )

            subject_name = self._value(
                record,
                "subjectName",
                "subject_name",
                "courseName",
                "course_name",
                "subject",
            )

            room = self._value(
                record,
                "room",
                "roomNumber",
                "roomNo",
            )

            faculty = self._value(
                record,
                "faculty",
                "facultyName",
                "faculty_name",
            )

            subject_id = self._value(
                record,
                "subjectId",
                "subject_id",
            )

            faculty_id = self._value(
                record,
                "facultyId",
                "faculty_id",
            )

            record_semester = (
                self._value(
                    record,
                    "semester",
                    "Semester",
                )
                or semester
            )

            record_branch = (
                self._value(
                    record,
                    "branch",
                    "Branch",
                )
                or branch
            )

            record_section = (
                self._value(
                    record,
                    "section",
                    "Section",
                )
                or section
            )

            key = (
                str(day or "").strip().lower(),
                str(subject_code or "").strip().lower(),
                str(subject_name or "").strip().lower(),
                str(start_time or "").strip().lower(),
                str(end_time or "").strip().lower(),
                str(slot or "").strip().lower(),
                str(room or "").strip().lower(),
            )

            if key in seen_keys:
                continue

            seen_keys.add(key)

            document = {
                "studentId": student_id,

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
                        "studentName"
                    )
                    or combined_profile.get(
                        "name"
                    )
                ),

                "rollNumber": (
                    combined_profile.get(
                        "rollNumber"
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

                "day": day,

                "slot": slot,

                "subjectId": subject_id,

                "subjectCode": subject_code,

                "subjectName": subject_name,

                "courseName": (
                    self._value(
                        record,
                        "courseName",
                        "course_name",
                    )
                    or subject_name
                ),

                "faculty": faculty,

                "facultyId": faculty_id,

                "startTime": start_time,

                "endTime": end_time,

                "room": room,

                "semester": record_semester,

                "branch": record_branch,

                "section": record_section,

                "bucket": bucket,

                "category": self._value(
                    record,
                    "category",
                ),

                "credit": self._value(
                    record,
                    "credit",
                    "credits",
                ),

                "active": True,

                "source": "ams",

                "createdAt": now,

                "updatedAt": now,
            }

            documents.append(
                document
            )

        if not documents:

            existing_timetable = (
                self.get_student_timetable(
                    student_id
                )
            )

            self._save_metadata(
                student_id=student_id,
                profile=combined_profile,
                bucket=bucket,
                courses=courses,
            )

            return {
                "profile": combined_profile,
                "bucket": bucket,
                "courses": courses,
                "timetable": existing_timetable,
                "inserted": 0,
                "updated": 0,
                "deactivated": 0,
            }

        deactivate_result = (
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
                        "updatedAt": now,
                    }
                },
            )
        )

        deactivated = (
            deactivate_result.modified_count
        )

        insert_result = (
            self.db[TIMETABLE]
            .insert_many(
                documents
            )
        )

        inserted = len(
            insert_result.inserted_ids
        )

        self._save_metadata(
            student_id=student_id,
            profile=combined_profile,
            bucket=bucket,
            courses=courses,
        )

        stored_timetable = (
            self.get_student_timetable(
                student_id
            )
        )

        return {
            "profile": combined_profile,
            "bucket": bucket,
            "courses": courses,
            "timetable": stored_timetable,
            "inserted": inserted,
            "updated": 0,
            "deactivated": deactivated,
        }

    @staticmethod
    def _value(
        record: dict[str, Any],
        *keys: str,
    ) -> Any:

        for key in keys:

            value = record.get(
                key
            )

            if value is None:
                continue

            if isinstance(
                value,
                str,
            ) and not value.strip():
                continue

            return value

        return None

    def _save_metadata(
        self,
        student_id: str,
        profile: dict[str, Any],
        bucket: Any,
        courses: list[dict[str, Any]],
    ) -> None:

        now = datetime.utcnow()

        existing = (
            self.db["timetable_metadata"]
            .find_one(
                {
                    "studentId": student_id,
                    "source": "ams",
                }
            )
        )

        existing_profile = {}

        if isinstance(
            existing,
            dict,
        ):
            existing_profile = (
                existing.get(
                    "profile",
                    {},
                )
            )

            if not isinstance(
                existing_profile,
                dict,
            ):
                existing_profile = {}

        merged_profile = {
            **existing_profile,
            **(
                profile
                if isinstance(
                    profile,
                    dict,
                )
                else {}
            ),
        }

        merged_profile[
            "studentId"
        ] = student_id

        final_bucket = bucket

        if (
            final_bucket is None
            or str(
                final_bucket
            ).strip() == ""
        ):

            if isinstance(
                existing,
                dict,
            ):
                final_bucket = (
                    existing.get(
                        "bucket"
                    )
                )

        final_courses = (
            courses
            if isinstance(
                courses,
                list,
            )
            else []
        )

        if (
            not final_courses
            and isinstance(
                existing,
                dict,
            )
        ):

            old_courses = (
                existing.get(
                    "courses",
                    [],
                )
            )

            if isinstance(
                old_courses,
                list,
            ):
                final_courses = (
                    old_courses
                )

        metadata = {
            "studentId": student_id,
            "profile": merged_profile,
            "bucket": final_bucket,
            "courses": final_courses,
            "active": True,
            "source": "ams",
            "updatedAt": now,
        }

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

    def deactivate_student_timetable(
        self,
        student_id: str,
    ) -> int:

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

        return result.modified_count