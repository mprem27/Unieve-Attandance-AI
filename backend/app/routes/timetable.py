from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.config.database import get_db
from app.models.timetable import TIMETABLE
from app.security.permissions import require_student
from app.services.base import serialize_document


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
    records = (
        db[TIMETABLE]
        .find(
            {
                "studentId": current_user["id"],
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