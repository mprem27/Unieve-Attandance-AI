from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


TIMETABLE = "timetable"


class TimetableDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True
    )

    id: Optional[str] = None

    studentId: str

    day: str

    subjectId: Optional[str] = None
    subjectCode: Optional[str] = None
    subjectName: Optional[str] = None

    faculty: Optional[str] = None

    startTime: Optional[str] = None
    endTime: Optional[str] = None

    room: Optional[str] = None

    semester: Optional[str] = None
    branch: Optional[str] = None
    section: Optional[str] = None

    active: bool = True

    source: str = "college_portal"

    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None