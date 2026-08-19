from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.config.database import get_db
from app.models.subject import SUBJECTS
from app.security.permissions import require_student
from app.services.base import serialize_document


router = APIRouter(
    prefix="/subjects",
    tags=["subjects"],
)


# =========================================================
# STUDENT SUBJECTS
# =========================================================


@router.get("")
def list_subjects(
    _current_user: dict = Depends(
        require_student
    ),
    db: Database = Depends(get_db),
):
    subjects = (
        db[SUBJECTS]
        .find(
            {
                "active": True,
            }
        )
        .sort(
            "name",
            1,
        )
    )

    return [
        serialize_document(subject)
        for subject in subjects
    ]