import api from "./api";

// =========================================================
// GET STUDENT TIMETABLE
// =========================================================

export const getTimetable = async () => {
  const response = await api.get("/timetable");

  return response.data;
};

// =========================================================
// SYNC TIMETABLE FROM AMS
// =========================================================

export const syncTimetable = async () => {
  const response = await api.post("/timetable/sync");

  return response.data;
};

// =========================================================
// GET COMPLETE AMS STUDENT DETAILS
// =========================================================
//
// AMS currently returns the student academic information
// inside each object of response.data.
//
// Example:
//
// data[0] = {
//   idNumber,
//   studentName,
//   rollNumber,
//   degree,
//   batch,
//   regulation,
//   semester,
//   branch,
//   bucket,
//   ...
// }
//
// Therefore:
// - First timetable record -> student profile
// - All timetable records -> timetable
// - Unique subjectCode -> registered courses
// - bucket -> student bucket
//
// =========================================================

export const syncStudentAcademicDetails = async () => {
  const response = await syncTimetable();

  const timetableData = Array.isArray(response?.data)
    ? response.data
    : [];

  // =======================================================
  // FIRST RECORD
  // =======================================================

  const firstRecord =
    timetableData.length > 0
      ? timetableData[0]
      : {};

  // =======================================================
  // STUDENT PROFILE
  // =======================================================

  const profile = {
    idNumber:
      firstRecord?.idNumber ??
      response?.studentId ??
      null,

    studentName:
      firstRecord?.studentName ??
      null,

    rollNumber:
      firstRecord?.rollNumber ??
      null,

    degree:
      firstRecord?.degree ??
      null,

    batch:
      firstRecord?.batch ??
      null,

    regulation:
      firstRecord?.regulation ??
      null,

    semester:
      firstRecord?.semester ??
      null,

    branch:
      firstRecord?.branch ??
      null,

    section:
      firstRecord?.section ??
      null,

    bucket:
      firstRecord?.bucket ??
      null,
  };

  // =======================================================
  // BUCKET
  // =======================================================

  const bucket =
    response?.bucket ??
    firstRecord?.bucket ??
    null;

  // =======================================================
  // REGISTERED COURSES
  // =======================================================
  //
  // The same subject can appear multiple times because
  // it can have multiple timetable periods.
  //
  // Example:
  //
  // Web and Mobile Application Development
  // appears in multiple slots.
  //
  // We keep only one course entry for each subjectCode.
  // =======================================================

  const courseMap = new Map();

  timetableData.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const subjectCode =
      record?.subjectCode ||
      record?.subjectId ||
      record?.courseCode;

    const subjectName =
      record?.courseName ||
      record?.subjectName ||
      record?.subject;

    // Ignore records which don't contain course data.
    if (!subjectCode && !subjectName) {
      return;
    }

    const courseKey =
      subjectCode ||
      subjectName;

    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        subjectId:
          record?.subjectId ??
          null,

        subjectCode:
          record?.subjectCode ??
          record?.courseCode ??
          null,

        subjectName:
          subjectName ??
          null,

        courseName:
          record?.courseName ??
          record?.subjectName ??
          null,

        faculty:
          record?.faculty ??
          null,

        facultyId:
          record?.facultyId ??
          null,

        category:
          record?.category ??
          null,

        credit:
          record?.credit ??
          null,
      });
    }
  });

  const courses = Array.from(
    courseMap.values()
  );

  // =======================================================
  // RETURN NORMALIZED DATA
  // =======================================================

  return {
    success:
      response?.success ?? false,

    message:
      response?.message ?? null,

    studentId:
      response?.studentId ??
      firstRecord?.studentId ??
      null,

    username:
      response?.username ??
      firstRecord?.idNumber ??
      null,

    profile,

    bucket,

    courses,

    timetable: timetableData,

    total:
      response?.total ??
      timetableData.length,

    inserted:
      response?.inserted ??
      0,

    updated:
      response?.updated ??
      0,

    deactivated:
      response?.deactivated ??
      0,
  };
};