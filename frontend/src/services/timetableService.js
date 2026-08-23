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
//
// DO NOT CHANGE THIS WORKING ENDPOINT.
// =========================================================

export const syncTimetable = async () => {
  const response = await api.post("/timetable/sync");

  return response.data;
};

// =========================================================
// HELPERS
// =========================================================

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const clean = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "object" ||
    Array.isArray(value)
  ) {
    return "";
  }

  return String(value).trim();
};

const firstValue = (...values) => {
  for (const value of values) {
    if (clean(value)) {
      return value;
    }
  }

  return null;
};

const normalizeKey = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findValue = (
  source,
  aliases,
  maxDepth = 8
) => {
  if (
    source === null ||
    source === undefined ||
    maxDepth < 0
  ) {
    return null;
  }

  const aliasSet = new Set(
    aliases.map(normalizeKey)
  );

  const visited = new WeakSet();

  const search = (value, depth) => {
    if (
      value === null ||
      value === undefined ||
      depth < 0 ||
      typeof value !== "object"
    ) {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = search(
          item,
          depth - 1
        );

        if (clean(result)) {
          return result;
        }
      }

      return null;
    }

    // ---------------------------------------------------
    // Direct keys first
    // ---------------------------------------------------

    for (const [
      key,
      fieldValue,
    ] of Object.entries(value)) {
      if (
        aliasSet.has(
          normalizeKey(key)
        ) &&
        fieldValue !== null &&
        fieldValue !== undefined &&
        typeof fieldValue !== "object" &&
        clean(fieldValue)
      ) {
        return fieldValue;
      }
    }

    // ---------------------------------------------------
    // Nested search
    // ---------------------------------------------------

    for (const fieldValue of Object.values(
      value
    )) {
      if (
        fieldValue &&
        typeof fieldValue === "object"
      ) {
        const result = search(
          fieldValue,
          depth - 1
        );

        if (clean(result)) {
          return result;
        }
      }
    }

    return null;
  };

  return search(
    source,
    maxDepth
  );
};

// =========================================================
// EXTRACT ARRAY
// =========================================================

const findArray = (
  source,
  aliases,
  maxDepth = 8
) => {
  if (
    source === null ||
    source === undefined ||
    maxDepth < 0
  ) {
    return [];
  }

  const aliasSet = new Set(
    aliases.map(normalizeKey)
  );

  const visited = new WeakSet();

  const search = (value, depth) => {
    if (
      value === null ||
      value === undefined ||
      depth < 0 ||
      typeof value !== "object"
    ) {
      return [];
    }

    if (visited.has(value)) {
      return [];
    }

    visited.add(value);

    if (Array.isArray(value)) {
      return value;
    }

    // ---------------------------------------------------
    // Search matching arrays first
    // ---------------------------------------------------

    for (const [
      key,
      fieldValue,
    ] of Object.entries(value)) {
      if (
        aliasSet.has(
          normalizeKey(key)
        ) &&
        Array.isArray(fieldValue)
      ) {
        return fieldValue;
      }
    }

    // ---------------------------------------------------
    // Nested search
    // ---------------------------------------------------

    for (const fieldValue of Object.values(
      value
    )) {
      if (
        fieldValue &&
        typeof fieldValue === "object"
      ) {
        const result = search(
          fieldValue,
          depth - 1
        );

        if (result.length) {
          return result;
        }
      }
    }

    return [];
  };

  return search(
    source,
    maxDepth
  );
};

// =========================================================
// EXTRACT TIMETABLE RECORDS
// =========================================================
//
// The backend may return:
//
// data
// timetable
// records
// timetableRecords
// items
//
// Keep all supported forms.
// =========================================================

const extractTimetableRecords = (
  response
) => {
  const records = findArray(
    response,
    [
      "data",
      "timetable",
      "records",
      "timetableRecords",
      "timetable_records",
      "items",
      "rows",
      "results",
    ]
  );

  return Array.isArray(records)
    ? records.filter(
        (item) =>
          item &&
          typeof item === "object"
      )
    : [];
};

// =========================================================
// COURSE FIELD HELPERS
// =========================================================

const getSubjectCode = (record) =>
  firstValue(
    record?.subjectCode,
    record?.subject_code,
    record?.courseCode,
    record?.course_code,
    record?.subjectId,
    record?.subject_id,
    record?.courseId,
    record?.course_id,
    findValue(record, [
      "subjectCode",
      "subject_code",
      "courseCode",
      "course_code",
    ])
  );

const getSubjectName = (record) =>
  firstValue(
    record?.subjectName,
    record?.subject_name,
    record?.courseName,
    record?.course_name,
    record?.subject,
    record?.course,
    record?.courseTitle,
    record?.course_title,
    findValue(record, [
      "subjectName",
      "subject_name",
      "courseName",
      "course_name",
      "subject",
      "course",
    ])
  );

const getFaculty = (record) =>
  firstValue(
    record?.faculty,
    record?.facultyName,
    record?.faculty_name,
    record?.teacher,
    record?.teacherName,
    record?.teacher_name,
    record?.staff,
    record?.staffName,
    record?.staff_name,
    findValue(record, [
      "faculty",
      "facultyName",
      "teacher",
      "teacherName",
      "staff",
      "staffName",
    ])
  );

const getFacultyId = (record) =>
  firstValue(
    record?.facultyId,
    record?.faculty_id,
    record?.staffId,
    record?.staff_id,
    record?.teacherId,
    record?.teacher_id,
    findValue(record, [
      "facultyId",
      "faculty_id",
      "staffId",
      "staff_id",
      "teacherId",
      "teacher_id",
    ])
  );

const getCredits = (record) =>
  firstValue(
    record?.credit,
    record?.credits,
    record?.creditHours,
    record?.credit_hours,
    record?.courseCredits,
    record?.course_credits,
    findValue(record, [
      "credit",
      "credits",
      "creditHours",
      "courseCredits",
    ])
  );

const getCategory = (record) =>
  firstValue(
    record?.category,
    record?.courseCategory,
    record?.course_category,
    record?.courseType,
    record?.course_type,
    record?.type,
    findValue(record, [
      "category",
      "courseCategory",
      "courseType",
      "type",
    ])
  );

const getSlot = (record) =>
  firstValue(
    record?.slot,
    record?.slotName,
    record?.slot_name,
    record?.timeSlot,
    record?.time_slot,
    record?.period,
    record?.periodName,
    record?.period_name,
    findValue(record, [
      "slot",
      "slotName",
      "timeSlot",
      "period",
    ])
  );

const getRoom = (record) =>
  firstValue(
    record?.room,
    record?.roomNo,
    record?.room_no,
    record?.roomNumber,
    record?.room_number,
    record?.classroom,
    findValue(record, [
      "room",
      "roomNo",
      "roomNumber",
      "classroom",
    ])
  );

// =========================================================
// BUILD COURSES
// =========================================================

const buildCourses = (
  timetableData
) => {
  const courseMap = new Map();

  for (const record of timetableData) {
    if (
      !record ||
      typeof record !== "object"
    ) {
      continue;
    }

    const subjectCode =
      getSubjectCode(record);

    const subjectName =
      getSubjectName(record);

    if (
      !subjectCode &&
      !subjectName
    ) {
      continue;
    }

    const key = (
      subjectCode ||
      subjectName ||
      ""
    )
      .toString()
      .trim()
      .toUpperCase();

    if (!key) {
      continue;
    }

    const existing =
      courseMap.get(key);

    // ---------------------------------------------------
    // First occurrence
    // ---------------------------------------------------

    if (!existing) {
      courseMap.set(
        key,
        {
          subjectId: firstValue(
            record?.subjectId,
            record?.subject_id
          ),

          subjectCode,

          subjectName,

          courseName: firstValue(
            record?.courseName,
            record?.course_name,
            subjectName
          ),

          faculty:
            getFaculty(record),

          facultyId:
            getFacultyId(record),

          category:
            getCategory(record),

          credit:
            getCredits(record),

          slot:
            getSlot(record),

          room:
            getRoom(record),
        }
      );

      continue;
    }

    // ---------------------------------------------------
    // Fill missing fields from later timetable rows
    // ---------------------------------------------------

    existing.subjectId =
      firstValue(
        existing.subjectId,
        record?.subjectId,
        record?.subject_id
      );

    existing.subjectCode =
      firstValue(
        existing.subjectCode,
        subjectCode
      );

    existing.subjectName =
      firstValue(
        existing.subjectName,
        subjectName
      );

    existing.courseName =
      firstValue(
        existing.courseName,
        record?.courseName,
        record?.course_name,
        subjectName
      );

    existing.faculty =
      firstValue(
        existing.faculty,
        getFaculty(record)
      );

    existing.facultyId =
      firstValue(
        existing.facultyId,
        getFacultyId(record)
      );

    existing.category =
      firstValue(
        existing.category,
        getCategory(record)
      );

    existing.credit =
      firstValue(
        existing.credit,
        getCredits(record)
      );

    existing.slot =
      firstValue(
        existing.slot,
        getSlot(record)
      );

    existing.room =
      firstValue(
        existing.room,
        getRoom(record)
      );
  }

  return Array.from(
    courseMap.values()
  );
};

// =========================================================
// GET STUDENT PROFILE FROM TIMETABLE RESPONSE
// =========================================================

const buildAcademicProfile = (
  response,
  records
) => {
  const firstRecord =
    records[0] || {};

  return {
    idNumber: firstValue(
      findValue(response, [
        "idNumber",
        "id_number",
        "studentId",
        "student_id",
      ]),
      firstValue(
        firstRecord?.idNumber,
        firstRecord?.studentId
      )
    ),

    studentName: firstValue(
      findValue(response, [
        "studentName",
        "student_name",
        "name",
        "fullName",
      ]),
      firstValue(
        firstRecord?.studentName,
        firstRecord?.name
      )
    ),

    rollNumber: firstValue(
      findValue(response, [
        "rollNumber",
        "roll_number",
        "rollNo",
        "roll_no",
      ]),
      firstRecord?.rollNumber
    ),

    degree: firstValue(
      findValue(response, [
        "degree",
        "degreeName",
        "degree_name",
        "program",
        "programme",
      ]),
      firstRecord?.degree
    ),

    batch: firstValue(
      findValue(response, [
        "batch",
        "batchName",
        "batch_name",
        "academicBatch",
      ]),
      firstRecord?.batch
    ),

    regulation: firstValue(
      findValue(response, [
        "regulation",
        "regulationName",
        "regulation_name",
      ]),
      firstRecord?.regulation
    ),

    semester: firstValue(
      findValue(response, [
        "semester",
        "semesterName",
        "semester_name",
        "sem",
      ]),
      firstRecord?.semester
    ),

    branch: firstValue(
      findValue(response, [
        "branch",
        "branchName",
        "branch_name",
        "department",
        "departmentName",
      ]),
      firstRecord?.branch
    ),

    section: firstValue(
      findValue(response, [
        "section",
        "sectionName",
        "section_name",
        "division",
      ]),
      firstRecord?.section
    ),

    bucket: firstValue(
      findValue(response, [
        "bucket",
        "bucketName",
        "bucket_name",
        "bucketCode",
        "yourBucket",
        "academicBucket",
        "studentBucket",
      ]),
      firstRecord?.bucket
    ),
  };
};

// =========================================================
// COMPLETE AMS ACADEMIC DETAILS
// =========================================================
//
// IMPORTANT:
//
// This still uses the EXISTING timetable sync endpoint.
// No AMS authentication/scraping code is changed.
//
// =========================================================

export const syncStudentAcademicDetails =
  async () => {
    const response =
      await syncTimetable();

    // ---------------------------------------------------
    // Preserve the original response
    // ---------------------------------------------------

    const timetableData =
      extractTimetableRecords(
        response
      );

    // ---------------------------------------------------
    // Academic profile
    // ---------------------------------------------------

    const profile =
      buildAcademicProfile(
        response,
        timetableData
      );

    // ---------------------------------------------------
    // Bucket
    // ---------------------------------------------------

    const bucket =
      firstValue(
        findValue(response, [
          "bucket",
          "bucketName",
          "bucket_name",
          "bucketCode",
          "yourBucket",
          "your_bucket",
          "academicBucket",
          "academic_bucket",
          "studentBucket",
          "student_bucket",
        ]),
        profile.bucket
      );

    // ---------------------------------------------------
    // Courses
    // ---------------------------------------------------

    const courses =
      buildCourses(
        timetableData
      );

    // ---------------------------------------------------
    // Return
    // ---------------------------------------------------

    return {
      success:
        response?.success ??
        true,

      message:
        response?.message ??
        null,

      studentId:
        firstValue(
          response?.studentId,
          response?.student_id,
          profile.idNumber
        ),

      username:
        firstValue(
          response?.username,
          response?.portalUsername,
          profile.idNumber
        ),

      profile: {
        ...profile,
        bucket,
      },

      bucket,

      courses,

      timetable:
        timetableData,

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