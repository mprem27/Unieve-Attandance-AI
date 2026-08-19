import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getTimetable,
  syncTimetable,
} from "../services/timetableService";

import useAuth from "../hooks/useAuth";

// =====================================================
// DAYS
// =====================================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

// =====================================================
// FIXED AMS TIME SLOTS
// =====================================================

const TIME_SLOTS = [
  {
    key: "08:45",
    start: 525,
    end: 575,
    label: "8:45 AM - 9:35 AM",
  },
  {
    key: "09:45",
    start: 585,
    end: 635,
    label: "9:45 AM - 10:35 AM",
  },
  {
    key: "10:45",
    start: 645,
    end: 695,
    label: "10:45 AM - 11:35 AM",
  },
  {
    key: "11:45",
    start: 705,
    end: 755,
    label: "11:45 AM - 12:35 PM",
  },
  {
    key: "13:45",
    start: 825,
    end: 875,
    label: "1:45 PM - 2:35 PM",
  },
  {
    key: "14:45",
    start: 885,
    end: 935,
    label: "2:45 PM - 3:35 PM",
  },
  {
    key: "15:45",
    start: 945,
    end: 995,
    label: "3:45 PM - 4:35 PM",
  },
  {
    key: "16:45",
    start: 1005,
    end: 1055,
    label: "4:45 PM - 5:35 PM",
  },
];

// =====================================================
// HELPERS
// =====================================================

const clean = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const displayValue = (value) => {
  const text = clean(value);

  return text || "—";
};

// =====================================================
// DAY
// =====================================================

const normalizeDay = (value) => {
  const text = clean(value).toLowerCase();

  for (const day of DAYS) {
    if (
      text === day.toLowerCase() ||
      text.includes(day.toLowerCase())
    ) {
      return day;
    }
  }

  return "";
};

// =====================================================
// SUBJECT
// =====================================================

const getSubjectName = (item) =>
  firstValue(
    item?.subjectName,
    item?.subject_name,
    item?.courseName,
    item?.course_name,
    item?.course_name_text,
    item?.subject,
    item?.courseTitle,
    item?.course_title,
    item?.name,
    item?.courseNameText,
    item?.course_name_text,
    item?.course?.subjectName,
    item?.course?.courseName,
    item?.course?.course_name,
    item?.course?.name,
    item?.course,
    item?.title
  );

const getSubjectCode = (item) =>
  firstValue(
    item?.subjectCode,
    item?.subject_code,
    item?.courseCode,
    item?.course_code,
    item?.coursecode,
    item?.code,
    item?.course?.subjectCode,
    item?.course?.courseCode,
    item?.course?.course_code,
    item?.course?.code
  );

// =====================================================
// FACULTY
// =====================================================

const getFaculty = (item) =>
  firstValue(
    item?.faculty,
    item?.facultyName,
    item?.faculty_name,
    item?.facultyname,
    item?.teacher,
    item?.teacherName,
    item?.staff,
    item?.staffName,
    item?.course?.faculty,
    item?.course?.facultyName,
    item?.course?.faculty_name
  );

const getFacultyId = (item) =>
  firstValue(
    item?.facultyId,
    item?.faculty_id,
    item?.facultyID,
    item?.staffId,
    item?.staff_id
  );

// =====================================================
// ROOM
// =====================================================

const getRoom = (item) =>
  firstValue(
    item?.room,
    item?.roomNo,
    item?.room_no,
    item?.roomNumber,
    item?.room_number,
    item?.classroom,
    item?.course?.room,
    item?.course?.roomNo,
    item?.course?.roomNumber
  );

// =====================================================
// COURSE DETAILS
// =====================================================

const getCategory = (item) =>
  firstValue(
    item?.category,
    item?.courseCategory,
    item?.course_category,
    item?.courseType,
    item?.course_type,
    item?.type,
    item?.course?.category,
    item?.course?.courseCategory
  );

const getCredit = (item) =>
  firstValue(
    item?.credit,
    item?.credits,
    item?.creditHours,
    item?.credit_hours,
    item?.course?.credit,
    item?.course?.credits
  );

const getSlot = (item) =>
  firstValue(
    item?.slot,
    item?.slotName,
    item?.slot_name,
    item?.timeSlot,
    item?.time_slot,
    item?.period,
    item?.periodName,
    item?.period_name,
    item?.course?.slot,
    item?.course?.slotName
  );

// =====================================================
// PROFILE / AMS DETAILS
// =====================================================

const normalizeKey = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const isUsableValue = (value) =>
  value !== null &&
  value !== undefined &&
  typeof value !== "object" &&
  String(value).trim() !== "";

// Searches the complete response tree for a matching field.
// This keeps the timetable untouched while making profile
// details tolerant of AMS field-name variations.
const findFieldValue = (
  sources,
  aliases,
  maxDepth = 5
) => {
  const aliasSet = new Set(
    aliases.map(normalizeKey)
  );

  const visited = new Set();

  const search = (value, depth) => {
    if (
      value === null ||
      value === undefined ||
      depth > maxDepth
    ) {
      return "";
    }

    if (
      typeof value !== "object"
    ) {
      return "";
    }

    if (visited.has(value)) {
      return "";
    }

    visited.add(value);

    // Prefer exact normalized key matches at this object level.
    for (const [key, fieldValue] of Object.entries(value)) {
      if (
        aliasSet.has(
          normalizeKey(key)
        ) &&
        isUsableValue(fieldValue)
      ) {
        return String(fieldValue).trim();
      }
    }

    // Then search nested objects.
    for (const nestedValue of Object.values(value)) {
      if (
        nestedValue &&
        typeof nestedValue === "object"
      ) {
        const result = search(
          nestedValue,
          depth + 1
        );

        if (result) {
          return result;
        }
      }
    }

    return "";
  };

  for (const source of sources) {
    const result = search(source, 0);

    if (result) {
      return result;
    }
  }

  return "";
};

const getStudentName = (source) =>
  findFieldValue(
    [source],
    [
      "name",
      "studentName",
      "student_name",
      "fullName",
      "full_name",
      "student",
      "studentNameText",
      "candidateName",
    ]
  );

const getVtuNumber = (source) =>
  findFieldValue(
    [source],
    [
      "vtuNumber",
      "vtu_number",
      "vtuNo",
      "vtu_no",
      "portalUsername",
      "portal_username",
      "username",
      "registrationNo",
      "registrationNumber",
      "registerNumber",
      "registerNo",
      "regNo",
    ]
  );

const getRollNumber = (source) =>
  findFieldValue(
    [source],
    [
      "rollNumber",
      "roll_number",
      "rollNo",
      "roll_no",
      "roll",
      "rollNumberText",
      "studentRollNumber",
      "studentRollNo",
      "classRollNumber",
      "classRollNo",
    ]
  );

const getDegree = (source) =>
  findFieldValue(
    [source],
    [
      "degree",
      "degreeName",
      "degree_name",
      "program",
      "programName",
      "program_name",
      "course",
      "courseName",
      "course_name",
      "programme",
      "programmeName",
      "programme_name",
    ]
  );

const getBranch = (source) =>
  findFieldValue(
    [source],
    [
      "branch",
      "branchName",
      "branch_name",
      "department",
      "departmentName",
      "department_name",
      "dept",
      "deptName",
      "specialization",
      "specialisation",
    ]
  );

const getBatch = (source) =>
  findFieldValue(
    [source],
    [
      "batch",
      "batchYear",
      "batch_year",
      "academicYear",
      "academic_year",
      "academicBatch",
      "academic_batch",
      "year",
      "admissionYear",
      "admission_year",
    ]
  );

const getSemester = (source) =>
  findFieldValue(
    [source],
    [
      "semester",
      "sem",
      "semesterName",
      "semester_name",
      "semesterNo",
      "semester_no",
      "semNo",
      "sem_no",
    ]
  );

const getRegulation = (source) =>
  findFieldValue(
    [source],
    [
      "regulation",
      "regulationName",
      "regulation_name",
      "reg",
      "regulationNo",
      "regulation_no",
      "regulationCode",
      "regulation_code",
    ]
  );

const getSection = (source) =>
  findFieldValue(
    [source],
    [
      "section",
      "sectionName",
      "section_name",
      "classSection",
      "class_section",
      "sectionCode",
      "section_code",
      "division",
      "divisionName",
    ]
  );

const getBucket = (source) =>
  findFieldValue(
    [source],
    [
      "bucket",
      "bucketName",
      "bucket_name",
      "bucketCode",
      "bucket_code",
      "yourBucket",
      "your_bucket",
      "yourBucketName",
      "your_bucket_name",
      "academicBucket",
      "academic_bucket",
      "academicBucketName",
      "academic_bucket_name",
      "academicGroup",
      "academic_group",
    ]
  );

// =====================================================
// TIME HELPERS
// =====================================================

const getStartTime = (item) =>
  firstValue(
    item?.startTime,
    item?.start_time,
    item?.from,
    item?.start,
    item?.course?.startTime,
    item?.course?.start_time,
    item?.schedule?.startTime,
    item?.schedule?.start_time
  );

const getEndTime = (item) =>
  firstValue(
    item?.endTime,
    item?.end_time,
    item?.to,
    item?.end,
    item?.course?.endTime,
    item?.course?.end_time,
    item?.schedule?.endTime,
    item?.schedule?.end_time
  );

const getTimeValues = (item) => {
  const values = [
    getStartTime(item),
    getEndTime(item),
    item?.time,
    item?.timeSlot,
    item?.time_slot,
    item?.slot,
    item?.slotName,
    item?.slot_name,
    item?.period,
    item?.periodName,
    item?.period_name,
    item?.lectureTime,
    item?.lecture_time,
    item?.schedule?.time,
    item?.schedule?.timeSlot,
  ];

  // AMS responses can use slightly different field names.
  // Check only keys that are clearly related to time.
  Object.entries(item || {}).forEach(
    ([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        typeof value === "object"
      ) {
        return;
      }

      if (
        /(time|slot|period)/i.test(key)
      ) {
        values.push(value);
      }
    }
  );

  return values
    .map(clean)
    .filter(Boolean);
};

// =====================================================
// NORMALIZE TIME TEXT
// =====================================================

const normalizeTime = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[.]/g, ":")
    .replace(/\s+/g, " ")
    .replace(/\b(a\.m\.|am)\b/gi, "am")
    .replace(/\b(p\.m\.|pm)\b/gi, "pm")
    .trim();

// =====================================================
// CONVERT ONE CLOCK VALUE TO MINUTES
// =====================================================

const clockToMinutes = (
  hour,
  minute,
  period = ""
) => {
  let h = Number(hour);
  const m = Number(minute || 0);
  const p = clean(period).toLowerCase();

  if (
    !Number.isFinite(h) ||
    !Number.isFinite(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }

  if (p === "am" && h === 12) {
    h = 0;
  }

  if (p === "pm" && h !== 12 && h < 12) {
    h += 12;
  }

  if (h > 23) {
    return null;
  }

  return h * 60 + m;
};

// =====================================================
// EXTRACT CLOCK TIMES
// =====================================================
//
// Handles all common AMS formats:
//
// 8:45 AM - 9:35 AM
// 8.45 AM - 9.35 AM
// 8:45-9:35 AM
// 8.45-9.35 AM
// 1:45-2:35 PM
// 08:45:00
// 8:45 AM
// =====================================================

const extractClockTimes = (value) => {
  const text = normalizeTime(value);

  if (!text) {
    return [];
  }

  const pattern =
    /(\d{1,2})(?:[:](\d{2})(?::\d{2})?)(?:\s*(am|pm))?/gi;

  const times = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    times.push({
      hour: Number(match[1]),
      minute: Number(match[2]),
      period: clean(match[3]).toLowerCase(),
      index: match.index,
    });
  }

  // Support dot format after normalization:
  // normalizeTime converts 8.45 -> 8:45, so no second
  // parser is necessary.
  if (!times.length) {
    return [];
  }

  // If a time has no AM/PM, use the period from the
  // nearest explicit time in the same range.
  for (let i = 0; i < times.length; i += 1) {
    if (times[i].period) {
      continue;
    }

    const next = times[i + 1];
    const previous = times[i - 1];

    if (next?.period) {
      times[i].period = next.period;
    } else if (previous?.period) {
      times[i].period = previous.period;
    }
  }

  return times
    .map((time) =>
      clockToMinutes(
        time.hour,
        time.minute,
        time.period
      )
    )
    .filter(
      (value) =>
        value !== null
    );
};

// =====================================================
// EXTRACT PERIOD NUMBER
// =====================================================

const getPeriodNumber = (item) => {
  const values = [
    item?.period,
    item?.periodName,
    item?.period_name,
    item?.slot,
    item?.slotName,
    item?.slot_name,
  ];

  for (const value of values) {
    const text = clean(value).toLowerCase();

    if (!text) {
      continue;
    }

    const match = text.match(
      /(?:period|p)\s*([1-8])\b/i
    );

    if (match) {
      return Number(match[1]);
    }

    if (/^[1-8]$/.test(text)) {
      return Number(text);
    }
  }

  return null;
};

// =====================================================
// EXTRACT START MINUTES
// =====================================================

const extractStartMinutes = (item) => {
  const directStart = getStartTime(item);
  const directEnd = getEndTime(item);

  // ---------------------------------------------------
  // 1. Dedicated startTime.
  // ---------------------------------------------------

  if (directStart) {
    const startText = normalizeTime(directStart);
    const startTimes = extractClockTimes(directStart);

    if (startTimes.length) {
      // If startTime is "1:45" and endTime is
      // "2:35 PM", infer PM for the start.
      if (
        !/\b(am|pm)\b/i.test(startText) &&
        directEnd
      ) {
        const endText = normalizeTime(directEnd);
        const endPeriod =
          endText.match(
            /\b(am|pm)\b/i
          )?.[1];

        if (endPeriod) {
          const firstMatch =
            startText.match(
              /^(\d{1,2}):(\d{2})/
            );

          if (firstMatch) {
            const inferred =
              clockToMinutes(
                firstMatch[1],
                firstMatch[2],
                endPeriod
              );

            if (inferred !== null) {
              return inferred;
            }
          }
        }
      }

      return startTimes[0];
    }
  }

  // ---------------------------------------------------
  // 2. Search all AMS time-related fields.
  // ---------------------------------------------------

  for (const value of getTimeValues(item)) {
    const times = extractClockTimes(value);

    if (times.length) {
      return times[0];
    }
  }

  return null;
};

// =====================================================
// PERIOD -> FIXED AMS SLOT
// =====================================================

const PERIOD_TO_SLOT = {
  1: TIME_SLOTS[0],
  2: TIME_SLOTS[1],
  3: TIME_SLOTS[2],
  4: TIME_SLOTS[3],
  5: TIME_SLOTS[4],
  6: TIME_SLOTS[5],
  7: TIME_SLOTS[6],
  8: TIME_SLOTS[7],
};

// =====================================================
// FIND AMS SLOT
// =====================================================
//
// Exact start time is preferred.
// Period number is the final fallback.
// A small tolerance handles minor AMS formatting differences.
// =====================================================

const getExactSlot = (item) => {
  const start = extractStartMinutes(item);

  if (start !== null) {
    const exact = TIME_SLOTS.find(
      (slot) =>
        slot.start === start
    );

    if (exact) {
      return exact;
    }

    const nearest = TIME_SLOTS.reduce(
      (best, slot) => {
        const distance = Math.abs(
          slot.start - start
        );

        if (
          !best ||
          distance < best.distance
        ) {
          return {
            slot,
            distance,
          };
        }

        return best;
      },
      null
    );

    if (
      nearest &&
      nearest.distance <= 5
    ) {
      return nearest.slot;
    }
  }

  const period =
    getPeriodNumber(item);

  if (
    period &&
    PERIOD_TO_SLOT[period]
  ) {
    return PERIOD_TO_SLOT[period];
  }

  return null;
};

// =====================================================
// NORMALIZE TIMETABLE RECORD
// =====================================================

const normalizeRecord = (
  item,
  index
) => {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const day = normalizeDay(
    firstValue(
      item?.day,
      item?.weekday,
      item?.weekDay,
      item?.dayName
    )
  );

  if (!day) {
    return null;
  }

  const slot = getExactSlot(item);

  return {
    ...item,
    _index: index,
    _day: day,
    _slotKey: slot?.key || null,
    _slotStart:
      slot?.start ?? null,
    _unmapped: !slot,
  };
};

// =====================================================
// SECTION
// =====================================================

function Section({
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}
    >
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

// =====================================================
// DETAIL ITEM
// =====================================================

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-700">
        {displayValue(value)}
      </p>
    </div>
  );
}

// =====================================================
// CLASS CARD
// =====================================================

function ClassCard({
  item,
}) {
  const subject =
    getSubjectName(item);

  const code =
    getSubjectCode(item);

  const faculty =
    getFaculty(item);

  const room =
    getRoom(item);

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-sm">

      <p
        className="line-clamp-3 text-[11px] font-bold leading-4 text-slate-900"
        title={clean(subject)}
      >
        {displayValue(
          subject
        )}
      </p>

      {code && (
        <p className="mt-1 truncate text-[9px] font-bold text-indigo-600">
          {code}
        </p>
      )}

      {faculty && (
        <p
          className="mt-2 line-clamp-2 text-[9px] font-medium leading-3 text-slate-500"
          title={clean(faculty)}
        >
          {faculty}
        </p>
      )}

      {room && (
        <p className="mt-1 text-[9px] font-medium text-slate-400">
          Room: {room}
        </p>
      )}

    </div>
  );
}

// =====================================================
// MAIN
// =====================================================

export default function Timetable() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    timetable,
    setTimetable,
  ] = useState([]);

  const [
    academicData,
    setAcademicData,
  ] = useState({});

  const [
    courseData,
    setCourseData,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    syncMessage,
    setSyncMessage,
  ] = useState("");

  // ===================================================
  // APPLY RESPONSE
  // ===================================================

  const applyResponseData =
    useCallback(
      (response) => {
        let records = [];

        if (
          Array.isArray(
            response
          )
        ) {
          records =
            response;
        } else if (
          Array.isArray(
            response?.data
          )
        ) {
          records =
            response.data;
        } else if (
          Array.isArray(
            response?.timetable
          )
        ) {
          records =
            response.timetable;
        } else if (
          Array.isArray(
            response?.records
          )
        ) {
          records =
            response.records;
        }

        setTimetable(
          records
        );

        const profile =
          response?.profile &&
          typeof response.profile === "object"
            ? response.profile
            : {};

        const student =
          response?.student &&
          typeof response.student === "object"
            ? response.student
            : {};

        const academic =
          response?.academic &&
          typeof response.academic === "object"
            ? response.academic
            : {};

        const studentDetails =
          response?.studentDetails &&
          typeof response.studentDetails === "object"
            ? response.studentDetails
            : {};

        const details =
          response?.details &&
          typeof response.details === "object"
            ? response.details
            : {};

        // Keep every response section available to the
        // detail resolver. Nothing is removed or renamed.
        setAcademicData({
          ...(user || {}),
          ...(response || {}),
          ...details,
          ...academic,
          ...studentDetails,
          ...student,
          ...profile,
        });

        const courses =
          response?.courses ||
          response?.registeredCourses ||
          response?.registered_courses ||
          response?.courseRegisteredDetails ||
          response?.course_registered_details;

        if (
          Array.isArray(
            courses
          )
        ) {
          setCourseData(
            courses
          );
        } else {
          setCourseData([]);
        }

        return records;
      },
      [user]
    );

  // ===================================================
  // LOAD
  // ===================================================

  const loadTimetable =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getTimetable();

          applyResponseData(
            response
          );
        } catch (err) {
          console.error(
            "Timetable loading failed:",
            err
          );

          setError(
            err?.response?.data
              ?.detail ||
              err?.response?.data
                ?.message ||
              "Unable to load timetable."
          );
        } finally {
          setLoading(false);
        }
      },
      [applyResponseData]
    );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!authLoading) {
      loadTimetable();
    }
  }, [
    authLoading,
    loadTimetable,
  ]);

  // ===================================================
  // SYNC
  // ===================================================

  const handleSync =
    async () => {
      try {
        setSyncing(true);
        setError("");
        setSyncMessage("");

        const response =
          await syncTimetable();

        applyResponseData(
          response
        );

        setSyncMessage(
          response?.message ||
            "Timetable synchronized successfully."
        );
      } catch (err) {
        console.error(
          "Timetable sync failed:",
          err
        );

        setError(
          err?.response?.data
            ?.detail ||
            err?.response?.data
              ?.message ||
            "Unable to synchronize timetable."
        );
      } finally {
        setSyncing(false);
      }
    };

  // ===================================================
  // NORMALIZED RECORDS
  // ===================================================

  const normalizedRecords =
    useMemo(() => {
      return timetable
        .map(
          normalizeRecord
        )
        .filter(Boolean)
        .sort(
          (a, b) => {
            if (
              a._day !==
              b._day
            ) {
              return (
                DAYS.indexOf(
                  a._day
                ) -
                DAYS.indexOf(
                  b._day
                )
              );
            }

            return (
              a._slotStart -
              b._slotStart
            );
          }
        );
    }, [
      timetable,
    ]);

  // ===================================================
  // GET EXACT CLASSES
  // ===================================================

  const unmappedRecords =
    useMemo(
      () =>
        normalizedRecords
          .filter(
            (item) =>
              item._unmapped
          )
          .sort(
            (a, b) =>
              a._index -
              b._index
          ),
      [normalizedRecords]
    );

  const getClasses =
    useCallback(
      (
        day,
        slot
      ) => {
        return normalizedRecords
          .filter(
            (item) =>
              item._day ===
                day &&
              item._slotKey ===
                slot.key
          )
          .sort(
            (a, b) =>
              a._index -
              b._index
          );
      },
      [normalizedRecords]
    );

  // ===================================================
  // COURSES
  // ===================================================

  const courses =
    useMemo(() => {
      const source = [
        ...courseData,
        ...timetable,
      ];

      const map = new Map();

      source.forEach((item) => {
        if (!item) {
          return;
        }

        const key =
          getSubjectCode(item) ||
          getSubjectName(item);

        if (!key) {
          return;
        }

        const existing = map.get(key);

        // Prefer the registered-course record because it
        // usually contains category, credit, faculty ID,
        // slot and room. Timetable records are still used
        // for subjects that are missing from courses.
        if (!existing) {
          map.set(key, item);
        } else {
          map.set(key, {
            ...existing,
            ...item,
          });
        }
      });

      return Array.from(map.values());
    }, [courseData, timetable]);

  // ===================================================
  // PROFILE
  // ===================================================

  // The AMS sync response may keep details inside different
  // containers. Build one read-only source containing all
  // of them. Timetable records are not modified.
  const detailSources = [
    academicData,
    academicData?.profile,
    academicData?.student,
    academicData?.studentDetails,
    academicData?.details,
    academicData?.academic,
    user,
  ].filter(Boolean);

  const detailSource =
    detailSources.length > 0
      ? detailSources
      : [academicData];

  const studentName =
    findFieldValue(
      detailSource,
      [
        "name",
        "studentName",
        "student_name",
        "fullName",
        "full_name",
        "candidateName",
      ]
    );

  const vtuNumber =
    findFieldValue(
      detailSource,
      [
        "vtuNumber",
        "vtu_number",
        "vtuNo",
        "vtu_no",
        "portalUsername",
        "portal_username",
        "username",
        "registrationNo",
        "registrationNumber",
        "registerNumber",
        "registerNo",
        "regNo",
      ]
    );

  const rollNumber =
    findFieldValue(
      detailSource,
      [
        "rollNumber",
        "roll_number",
        "rollNo",
        "roll_no",
        "roll",
        "studentRollNumber",
        "studentRollNo",
        "classRollNumber",
        "classRollNo",
      ]
    );

  const degree =
    findFieldValue(
      detailSource,
      [
        "degree",
        "degreeName",
        "degree_name",
        "program",
        "programName",
        "program_name",
        "programme",
        "programmeName",
        "programme_name",
      ]
    );

  const branch =
    findFieldValue(
      detailSource,
      [
        "branch",
        "branchName",
        "branch_name",
        "department",
        "departmentName",
        "department_name",
        "dept",
        "deptName",
        "specialization",
        "specialisation",
      ]
    );

  const batch =
    findFieldValue(
      detailSource,
      [
        "batch",
        "batchYear",
        "batch_year",
        "academicYear",
        "academic_year",
        "academicBatch",
        "academic_batch",
        "year",
        "admissionYear",
        "admission_year",
      ]
    );

  const semester =
    findFieldValue(
      detailSource,
      [
        "semester",
        "sem",
        "semesterName",
        "semester_name",
        "semesterNo",
        "semester_no",
        "semNo",
        "sem_no",
      ]
    );

  const regulation =
    findFieldValue(
      detailSource,
      [
        "regulation",
        "regulationName",
        "regulation_name",
        "reg",
        "regulationNo",
        "regulation_no",
        "regulationCode",
        "regulation_code",
      ]
    );

  const section =
    findFieldValue(
      detailSource,
      [
        "section",
        "sectionName",
        "section_name",
        "classSection",
        "class_section",
        "sectionCode",
        "section_code",
        "division",
        "divisionName",
      ]
    );

  const bucket =
    getBucket(academicData) ||
    getBucket(user) ||
    getBucket({
      bucket:
        academicData?.bucket,
      yourBucket:
        academicData?.yourBucket,
      bucketName:
        academicData?.bucketName,
    }) ||
    getBucket(timetable[0]);

  // ===================================================
  // LOADING
  // ===================================================

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="h-12 w-64 animate-pulse rounded-xl bg-slate-200" />

          <div className="h-32 animate-pulse rounded-3xl bg-white" />

          <div className="h-[500px] animate-pulse rounded-3xl bg-white" />

        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-[1550px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Academic Schedule
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Timetable
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Weekly timetable from 8:45 AM to 5:35 PM.
            </p>

          </div>

          <button
            type="button"
            onClick={
              handleSync
            }
            disabled={
              syncing
            }
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing
              ? "Synchronizing..."
              : "Synchronize Timetable"}
          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {syncMessage &&
          !error && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
              {syncMessage}
            </div>
          )}

        {/* =================================================
            STUDENT PROFILE
        ================================================= */}

        <Section
          title="Student Profile"
          description="Academic information associated with your account."
          className="mb-6"
        >

          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <DetailItem
              label="Name"
              value={
                studentName
              }
            />

            <DetailItem
              label="VTU Number"
              value={
                vtuNumber
              }
            />

            <DetailItem
              label="Roll Number"
              value={
                rollNumber
              }
            />

            <DetailItem
              label="Degree"
              value={
                degree
              }
            />

            <DetailItem
              label="Branch"
              value={
                branch
              }
            />

            <DetailItem
              label="Batch"
              value={
                batch
              }
            />

            <DetailItem
              label="Semester"
              value={
                semester
              }
            />

            <DetailItem
              label="Section"
              value={
                section
              }
            />

            <DetailItem
              label="Regulation"
              value={
                regulation
              }
            />

          </div>

        </Section>

        {/* =================================================
            BUCKET
        ================================================= */}

        <section className="mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">
                Academic Category
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Your Bucket
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your assigned academic bucket.
              </p>

            </div>

            <div className="min-w-[220px] rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-4 text-center">

              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Bucket
              </p>

              <p className="mt-1 text-lg font-black text-indigo-700">
                {displayValue(
                  bucket
                )}
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            COURSES
        ================================================= */}

        <Section
          title="Course Registered Details"
          description={`${courses.length} registered ${
            courses.length ===
            1
              ? "course"
              : "courses"
          }`}
          className="mb-6"
        >

          {courses.length ===
          0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">
              No registered course details available.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] border-collapse">

                <thead>
                  <tr>

                    {[
                      "#",
                      "Category",
                      "Course Code",
                      "Course Name",
                      "Credit",
                      "Faculty Name",
                      "Faculty ID",
                      "Slot",
                      "Room",
                    ].map(
                      (heading) => (
                        <th
                          key={
                            heading
                          }
                          className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      )
                    )}

                  </tr>
                </thead>

                <tbody>

                  {courses.map(
                    (
                      course,
                      index
                    ) => (
                      <tr
                        key={
                          course?._id ||
                          course?.id ||
                          getSubjectCode(
                            course
                          ) ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {index +
                            1}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getCategory(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 font-mono text-xs font-bold text-indigo-600">
                          {displayValue(
                            getSubjectCode(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs font-bold text-slate-800">
                          {displayValue(
                            getSubjectName(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getCredit(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getFaculty(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getFacultyId(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getSlot(
                              course
                            )
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-4 text-xs text-slate-600">
                          {displayValue(
                            getRoom(
                              course
                            )
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </Section>

        {/* =================================================
            TIMETABLE
        ================================================= */}

        <Section
          title="Time Table"
          description="Classes are arranged according to their exact AMS period."
        >

          {normalizedRecords.length ===
          0 ? (
            <div className="p-14 text-center">

              <h3 className="text-lg font-bold text-slate-900">
                No Timetable Available
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Synchronize your timetable to load the latest schedule.
              </p>

              <button
                type="button"
                onClick={
                  handleSync
                }
                disabled={
                  syncing
                }
                className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {syncing
                  ? "Synchronizing..."
                  : "Synchronize Timetable"}
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <div className="min-w-[1250px]">

                {/* =========================================
                    HEADER
                ========================================= */}

                <div
                  className="grid border-y border-slate-200 bg-slate-50"
                  style={{
                    gridTemplateColumns:
                      "120px repeat(8, minmax(140px, 1fr))",
                  }}
                >

                  <div className="flex min-h-[70px] items-center justify-center border-r border-slate-200 px-2 text-center">

                    <div>

                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Lectureday
                      </p>

                      <p className="mt-1 text-[10px] font-black text-slate-900">
                        8:45 AM - 5:35 PM
                      </p>

                    </div>

                  </div>

                  {TIME_SLOTS.map(
                    (slot) => (
                      <div
                        key={
                          slot.key
                        }
                        className="flex min-h-[70px] items-center justify-center border-r border-slate-200 px-2 text-center last:border-r-0"
                      >

                        <span className="whitespace-nowrap text-[10px] font-bold text-slate-800">
                          {slot.label}
                        </span>

                      </div>
                    )
                  )}

                </div>

                {/* =========================================
                    DAYS
                ========================================= */}

                {DAYS.map(
                  (day) => (
                    <div
                      key={day}
                      className="grid border-b border-slate-200 bg-white"
                      style={{
                        gridTemplateColumns:
                          "120px repeat(8, minmax(140px, 1fr))",
                      }}
                    >

                      {/* DAY */}

                      <div className="flex min-h-[145px] items-center justify-center border-r border-slate-200 bg-slate-50 px-3">

                        <span className="text-sm font-bold text-slate-800">
                          {day}
                        </span>

                      </div>

                      {/* PERIODS */}

                      {TIME_SLOTS.map(
                        (slot) => {
                          const classes =
                            getClasses(
                              day,
                              slot
                            );

                          return (
                            <div
                              key={`${day}-${slot.key}`}
                              className="min-h-[145px] border-r border-slate-200 p-2 last:border-r-0"
                            >

                              {classes.length >
                              0 ? (
                                <div className="flex h-full flex-col justify-center gap-2">

                                  {classes.map(
                                    (
                                      item,
                                      index
                                    ) => (
                                      <ClassCard
                                        key={
                                          item?._id ||
                                          item?.id ||
                                          `${day}-${slot.key}-${index}`
                                        }
                                        item={
                                          item
                                        }
                                      />
                                    )
                                  )}

                                </div>
                              ) : (
                                <div className="flex min-h-[125px] items-center justify-center">

                                  <span className="text-[10px] font-medium text-slate-300">
                                    —
                                  </span>

                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          {/* =================================================
              UNMAPPED AMS CLASSES
              =================================================
              Nothing received from AMS is silently discarded.
              If an unusual time format cannot be placed into
              one of the eight fixed periods, the class remains
              visible here instead of disappearing.
          */}

          {unmappedRecords.length > 0 && (
            <div className="border-t border-amber-100 bg-amber-50/60 p-5">
              <div className="mb-4">
                <p className="text-sm font-bold text-amber-900">
                  Additional AMS Classes
                </p>

                <p className="mt-1 text-xs font-medium text-amber-700">
                  These classes were received from AMS but their
                  time format could not be matched to one of the
                  fixed timetable periods.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unmappedRecords.map(
                  (item, index) => (
                    <ClassCard
                      key={
                        item?._id ||
                        item?.id ||
                        `unmapped-${item._index}-${index}`
                      }
                      item={item}
                    />
                  )
                )}
              </div>
            </div>
          )}

        </Section>

      </div>

    </div>
  );
}