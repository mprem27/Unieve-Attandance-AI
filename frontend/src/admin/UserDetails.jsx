import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

// =====================================================
// CONSTANTS
// =====================================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const TIME_SLOTS = [
  { key: "08:45", start: 525, end: 575, label: "8:45 AM - 9:35 AM" },
  { key: "09:45", start: 585, end: 635, label: "9:45 AM - 10:35 AM" },
  { key: "10:45", start: 645, end: 695, label: "10:45 AM - 11:35 AM" },
  { key: "11:45", start: 705, end: 755, label: "11:45 AM - 12:35 PM" },
  { key: "13:45", start: 825, end: 875, label: "1:45 PM - 2:35 PM" },
  { key: "14:45", start: 885, end: 935, label: "2:45 PM - 3:35 PM" },
  { key: "15:45", start: 945, end: 995, label: "3:45 PM - 4:35 PM" },
  { key: "16:45", start: 1005, end: 1055, label: "4:45 PM - 5:35 PM" },
];

const TABS = [
  "Overview",
  "Attendance",
  "Enrolled Subjects",
  "Timetable",
];

// =====================================================
// BASIC HELPERS
// =====================================================

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const displayValue = (value) => clean(value) || "—";

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      clean(value) !== ""
    ) {
      return value;
    }
  }
  return "";
};

const normalizeText = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeKey = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const isUsableValue = (value) =>
  value !== null &&
  value !== undefined &&
  typeof value !== "object" &&
  clean(value) !== "";

// =====================================================
// DEEP FIELD SEARCH
// =====================================================

const findFieldValue = (
  sources,
  aliases,
  maxDepth = 6
) => {
  const aliasSet = new Set(
    aliases.map(normalizeKey)
  );

  const visited = new Set();

  const search = (value, depth) => {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "object" ||
      depth > maxDepth
    ) {
      return "";
    }

    if (visited.has(value)) return "";
    visited.add(value);

    for (const [key, fieldValue] of Object.entries(value)) {
      if (
        aliasSet.has(normalizeKey(key)) &&
        isUsableValue(fieldValue)
      ) {
        return clean(fieldValue);
      }
    }

    for (const nested of Object.values(value)) {
      if (
        nested &&
        typeof nested === "object"
      ) {
        const result = search(
          nested,
          depth + 1
        );

        if (result) return result;
      }
    }

    return "";
  };

  for (const source of sources) {
    const result = search(source, 0);
    if (result) return result;
  }

  return "";
};

// =====================================================
// SUBJECT FIELD HELPERS
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
    item?.title,

    item?.course?.subjectName,
    item?.course?.subject_name,
    item?.course?.courseName,
    item?.course?.course_name,
    item?.course?.name,
    item?.course?.title
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
    item?.course?.subject_code,
    item?.course?.courseCode,
    item?.course?.course_code,
    item?.course?.code
  );

const getCategory = (item) =>
  firstValue(
    item?.category,
    item?.courseCategory,
    item?.course_category,
    item?.courseType,
    item?.course_type,
    item?.type,

    item?.course?.category,
    item?.course?.courseCategory,
    item?.course?.course_category
  );

const getCredit = (item) =>
  firstValue(
    item?.credit,
    item?.credits,
    item?.creditHours,
    item?.credit_hours,

    item?.course?.credit,
    item?.course?.credits,
    item?.course?.creditHours,
    item?.course?.credit_hours
  );

const getFaculty = (item) =>
  firstValue(
    item?.faculty,
    item?.facultyName,
    item?.faculty_name,
    item?.teacher,
    item?.teacherName,
    item?.teacher_name,
    item?.staff,
    item?.staffName,
    item?.staff_name,

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
    item?.staff_id,

    item?.course?.facultyId,
    item?.course?.faculty_id,
    item?.course?.staffId
  );

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
// IMPORTANT: CANONICAL SUBJECT ID
// =====================================================
//
// The old code used:
//   code:10211CS212
//
// for one record and:
//   name:webandmobile...
//
// for another record.
//
// Those are actually the SAME subject.
//
// This version uses the normalized SUBJECT NAME as the
// primary identity and uses the code as an alias.
//
// Therefore:
//
//   10211CS212 + Web and Mobile Application Development
//   empty code + Web and Mobile Application Development
//
// become ONE subject.
//
// =====================================================

const getSubjectNameKey = (item) =>
  normalizeText(
    getSubjectName(item)
  );

const getSubjectCodeKey = (item) =>
  normalizeText(
    getSubjectCode(item)
  );

const getCanonicalSubjectKey = (item) => {
  const nameKey =
    getSubjectNameKey(item);

  const codeKey =
    getSubjectCodeKey(item);

  // Prefer the name because the duplicate records
  // from the portal can have the same name but only
  // one of them has the course code.
  if (nameKey) {
    return `name:${nameKey}`;
  }

  if (codeKey) {
    return `code:${codeKey}`;
  }

  return "";
};

// =====================================================
// MERGE SUBJECT RECORDS
// =====================================================
//
// Never allow a weaker duplicate record to overwrite
// useful information.
//
// Example:
//
// Full:
// code = 10211CS212
// faculty = Dr. MANIKANDAN
//
// Duplicate:
// code = ""
// faculty = ""
//
// Result:
// code = 10211CS212
// faculty = Dr. MANIKANDAN
//
// =====================================================

const mergeSubjectRecord = (existing = {}, incoming = {}) => {
  const result = {
    ...existing,
    ...incoming,
  };

  // Keep the best value from either source. The AMS portal can return
  // the same subject more than once, with different fields populated
  // in each record. We explicitly merge the canonical fields instead
  // of relying only on identical raw property names.
  const canonicalFields = [
    ["subjectName", getSubjectName],
    ["subjectCode", getSubjectCode],
    ["category", getCategory],
    ["credit", getCredit],
    ["faculty", getFaculty],
    ["facultyId", getFacultyId],
    ["room", getRoom],
    ["slot", getSlot],
  ];

  for (const [field, getter] of canonicalFields) {
    const currentValue = getter(existing);
    const incomingValue = getter(incoming);

    if (clean(currentValue)) {
      result[field] = currentValue;
    } else if (clean(incomingValue)) {
      result[field] = incomingValue;
    }
  }

  // Preserve timetable-specific values because they are needed by the
  // timetable grid and may not exist in the registered-course response.
  const timetableFields = [
    ["day", firstValue(incoming?.day, incoming?.weekday, incoming?.weekDay, incoming?.dayName)],
    ["startTime", getStartTime(incoming)],
    ["endTime", getEndTime(incoming)],
    ["period", firstValue(incoming?.period, incoming?.periodName, incoming?.period_name)],
  ];

  for (const [field, value] of timetableFields) {
    if (!clean(result[field]) && clean(value)) {
      result[field] = value;
    }
  }

  if (
    existing?.course &&
    typeof existing.course === "object"
  ) {
    result.course = {
      ...existing.course,
    };
  }

  if (
    incoming?.course &&
    typeof incoming.course === "object"
  ) {
    result.course = {
      ...(result.course || {}),
      ...incoming.course,
    };
  }

  return result;
};

// =====================================================
// DAY HELPERS
// =====================================================

const normalizeDay = (value) => {
  const text =
    clean(value).toLowerCase();

  return (
    DAYS.find(
      (day) =>
        text ===
          day.toLowerCase() ||
        text.includes(
          day.toLowerCase()
        )
    ) || ""
  );
};

// =====================================================
// TIME HELPERS
// =====================================================

const normalizeTime = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/\./g, ":")
    .replace(/\s+/g, " ")
    .trim();

const clockToMinutes = (
  hour,
  minute,
  period = ""
) => {
  let h = Number(hour);
  const m = Number(minute || 0);
  const p =
    clean(period).toLowerCase();

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

  if (
    p === "pm" &&
    h !== 12 &&
    h < 12
  ) {
    h += 12;
  }

  return h * 60 + m;
};

const extractClockTimes = (
  value
) => {
  const text =
    normalizeTime(value);

  if (!text) return [];

  const pattern =
    /(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?/gi;

  const matches = [];

  let match;

  while (
    (match =
      pattern.exec(text)) !== null
  ) {
    matches.push({
      hour: Number(match[1]),
      minute: Number(match[2]),
      period: clean(
        match[3]
      ).toLowerCase(),
    });
  }

  for (
    let index = 0;
    index < matches.length;
    index += 1
  ) {
    if (
      matches[index].period
    ) {
      continue;
    }

    if (
      matches[index + 1]?.period
    ) {
      matches[index].period =
        matches[index + 1].period;
    }
  }

  return matches
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

const getStartTime = (item) =>
  firstValue(
    item?.startTime,
    item?.start_time,
    item?.from,
    item?.start,
    item?.startTimeFormatted,
    item?.start_time_formatted,
    item?.fromTime,
    item?.from_time
  );

const getEndTime = (item) =>
  firstValue(
    item?.endTime,
    item?.end_time,
    item?.to,
    item?.end,
    item?.endTimeFormatted,
    item?.end_time_formatted,
    item?.toTime,
    item?.to_time
  );

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
    const text =
      clean(value).toLowerCase();

    const match =
      text.match(
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

const getExactSlot = (item) => {
  const start =
    firstValue(
      getStartTime(item),
      item?.time,
      item?.timeSlot,
      item?.time_slot
    );

  const startTimes =
    extractClockTimes(start);

  if (startTimes.length) {
    const startMinutes =
      startTimes[0];

    const exact =
      TIME_SLOTS.find(
        (slot) =>
          slot.start ===
          startMinutes
      );

    if (exact) return exact;

    const nearest =
      TIME_SLOTS.reduce(
        (best, slot) => {
          const distance =
            Math.abs(
              slot.start -
                startMinutes
            );

          if (
            !best ||
            distance <
              best.distance
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
    return PERIOD_TO_SLOT[
      period
    ];
  }

  return null;
};

// =====================================================
// NORMALIZE TIMETABLE RECORD
// =====================================================

const normalizeTimetableRecord = (
  item,
  index
) => {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const day =
    normalizeDay(
      firstValue(
        item?.day,
        item?.weekday,
        item?.weekDay,
        item?.dayName
      )
    );

  if (!day) return null;

  const slot =
    getExactSlot(item);

  const subjectName =
    getSubjectName(item);

  if (!subjectName) {
    return null;
  }

  return {
    ...item,
    _index: index,
    _day: day,
    _slotKey:
      slot?.key || null,
    _slotStart:
      slot?.start ?? null,
    _subjectNameKey:
      getSubjectNameKey(item),
    _subjectCodeKey:
      getSubjectCodeKey(item),
    _canonicalSubjectKey:
      getCanonicalSubjectKey(item),
  };
};

// =====================================================
// TIMETABLE DUPLICATE REMOVAL
// =====================================================
//
// KEY:
//
//     DAY + TIME SLOT + SUBJECT NAME
//
// This is the important fix.
//
// The portal can return:
//
// Monday | 8:45 | Coding Practices-I | 10218CS902
// Monday | 8:45 | Coding Practices-I | empty
//
// Both become:
//
// Monday|08:45|codingpracticesi
//
// So only ONE card is displayed.
//
// =====================================================

const deduplicateTimetable = (
  records = []
) => {
  const map = new Map();

  records.forEach(
    (rawItem, index) => {
      const item =
        normalizeTimetableRecord(
          rawItem,
          index
        );

      if (!item) return;

      if (!item._slotKey) {
        return;
      }

      const key = [
        item._day,
        item._slotKey,
        item._subjectNameKey ||
          item._subjectCodeKey,
      ].join("|");

      const existing =
        map.get(key);

      if (!existing) {
        map.set(
          key,
          item
        );
        return;
      }

      // Merge the duplicate instead of displaying it.
      map.set(
        key,
        mergeSubjectRecord(
          existing,
          item
        )
      );
    }
  );

  return Array.from(
    map.values()
  )
    .map((item) => ({
      ...item,
      _day:
        item._day ||
        normalizeDay(item.day),
      _slotKey:
        item._slotKey ||
        getExactSlot(item)?.key ||
        null,
      _slotStart:
        item._slotStart ??
        getExactSlot(item)?.start ??
        null,
      _subjectNameKey:
        getSubjectNameKey(item),
      _subjectCodeKey:
        getSubjectCodeKey(item),
      _canonicalSubjectKey:
        getCanonicalSubjectKey(item),
    }))
    .sort(
      (a, b) => {
        const dayDifference =
          DAYS.indexOf(a._day) -
          DAYS.indexOf(b._day);

        if (
          dayDifference !== 0
        ) {
          return dayDifference;
        }

        return (
          (a._slotStart ?? 9999) -
          (b._slotStart ?? 9999)
        );
      }
    );
};

// =====================================================
// ENROLLED SUBJECTS
// =====================================================
//
// Registered-course data from the SAME timetable response is
// merged with timetable rows. A subjects endpoint is used only
// as a safe fallback. All sources are grouped by subject name,
// so repeated timetable periods never create duplicate rows.
//
// =====================================================

const buildRegisteredCourses = (
  courseRecords = [],
  timetableRecords = []
) => {
  const map = new Map();

  const addRecord = (record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const subjectName = getSubjectName(record);
    const subjectCode = getSubjectCode(record);

    const nameKey = normalizeText(subjectName);
    const codeKey = normalizeText(subjectCode);

    if (!nameKey && !codeKey) {
      return;
    }

    const key = nameKey
      ? `name:${nameKey}`
      : `code:${codeKey}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...record,
        subjectName: subjectName || record.subjectName,
        subjectCode: subjectCode || record.subjectCode,
      });
      return;
    }

    map.set(
      key,
      mergeSubjectRecord(existing, record)
    );
  };

  // The timetable page can return registered-course details in
  // `courses` / `registeredCourses` as well as timetable rows.
  // Use those records first because they normally contain category,
  // credit, faculty ID, slot and room.
  courseRecords.forEach(addRecord);

  // Then merge every timetable row. This fills any missing fields
  // without creating duplicate subject rows.
  timetableRecords.forEach(addRecord);

  return Array.from(map.values())
    .filter(
      (course) =>
        getSubjectName(course) ||
        getSubjectCode(course)
    )
    .sort((a, b) =>
      clean(getSubjectName(a)).localeCompare(
        clean(getSubjectName(b))
      )
    );
};

// =====================================================
// ARRAY RESPONSE HELPER
// =====================================================

const extractArray = (
  response,
  keys = []
) => {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (
      Array.isArray(
        response?.[key]
      )
    ) {
      return response[key];
    }
  }

  return [];
};

// =====================================================
// UI COMPONENTS
// =====================================================

function StatCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-700">
        {displayValue(value)}
      </p>
    </div>
  );
}

function ClassCard({
  item,
}) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50">

      <p
        className="line-clamp-3 text-[11px] font-bold leading-4 text-slate-900"
        title={clean(
          getSubjectName(item)
        )}
      >
        {displayValue(
          getSubjectName(item)
        )}
      </p>

      {getSubjectCode(item) && (
        <p className="mt-1 truncate text-[9px] font-bold text-indigo-600">
          {getSubjectCode(item)}
        </p>
      )}

      {getFaculty(item) && (
        <p className="mt-2 line-clamp-2 text-[9px] font-medium leading-3 text-slate-500">
          {getFaculty(item)}
        </p>
      )}

      {getRoom(item) && (
        <p className="mt-1 text-[9px] font-medium text-slate-400">
          Room: {getRoom(item)}
        </p>
      )}

    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function UserDetails() {
  const { userId } =
    useParams();

  const navigate =
    useNavigate();

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [student, setStudent] =
    useState(null);

  const [overview, setOverview] =
    useState(null);

  const [courseData, setCourseData] =
    useState([]);

  const [timetable, setTimetable] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [attendanceSearch, setAttendanceSearch] =
    useState("");

  const [attendanceSubject, setAttendanceSubject] =
    useState("all");

  const [attendanceStatus, setAttendanceStatus] =
    useState("all");

  const [attendanceView, setAttendanceView] =
    useState("rows");

  // ===================================================
  // LOAD STUDENT
  // ===================================================

  const loadStudent =
    useCallback(
      async () => {
        if (!userId) return;

        try {
          setLoading(true);
          setError("");

          const [
            userResponse,
            overviewResponse,
            timetableResponse,
            subjectsResponse,
            attendanceResponse,
          ] =
            await Promise.allSettled([
              api.get(
                `/admin/users/${userId}`
              ),

              api.get(
                `/admin/students/${userId}/overview`
              ),

              api.get(
                `/admin/students/${userId}/timetable`
              ),

              // Fallback only. If the timetable response already
              // contains registered courses, those records are used
              // first. A 404 here does not break the page.
              api.get(
                `/admin/students/${userId}/subjects`
              ),

              api.get(
                `/admin/students/${userId}/attendance`
              ),
            ]);

          if (
            userResponse.status ===
            "fulfilled"
          ) {
            setStudent(
              userResponse.value?.data
            );
          }

          if (
            overviewResponse.status ===
            "fulfilled"
          ) {
            setOverview(
              overviewResponse.value?.data
            );
          }

          // ===========================================
          // TIMETABLE + REGISTERED COURSES
          // ===========================================

          let timetablePayload = {};
          let timetableRecords = [];
          let registeredCourseRecords = [];

          if (
            timetableResponse.status ===
            "fulfilled"
          ) {
            timetablePayload =
              timetableResponse.value?.data;

            timetableRecords =
              extractArray(
                timetablePayload,
                [
                  "data",
                  "timetable",
                  "records",
                  "items",
                ]
              );

            // IMPORTANT: the student timetable page can return the
            // registered-course list beside the timetable. Read it
            // from the SAME response so User Details shows the same
            // academic information.
            registeredCourseRecords.push(
              ...extractArray(
                timetablePayload,
                [
                  "courses",
                  "course",
                  "registeredCourses",
                  "registered_courses",
                  "registeredSubjects",
                  "registered_subjects",
                  "enrolledSubjects",
                  "enrolled_subjects",
                  "courseRegisteredDetails",
                  "course_registered_details",
                ]
              )
            );
          }

          // Fallback registered-course endpoint. It is allowed to fail
          // because the timetable response may already contain all data.
          if (
            subjectsResponse.status ===
            "fulfilled"
          ) {
            registeredCourseRecords.push(
              ...extractArray(
                subjectsResponse.value?.data,
                [
                  "data",
                  "courses",
                  "subjects",
                  "registeredCourses",
                  "registered_courses",
                  "registeredSubjects",
                  "registered_subjects",
                  "items",
                ]
              )
            );
          }

          // Overview can also carry the registered-course list in some
          // backend versions. Use it only as another fallback.
          if (
            overviewResponse.status ===
            "fulfilled"
          ) {
            registeredCourseRecords.push(
              ...extractArray(
                overviewResponse.value?.data,
                [
                  "courses",
                  "subjects",
                  "registeredCourses",
                  "registered_courses",
                  "registeredSubjects",
                  "registered_subjects",
                  "enrolledSubjects",
                  "enrolled_subjects",
                ]
              )
            );
          }

          // Remove duplicate course records while preserving the best
          // details from every source.
          const uniqueCourseData =
            buildRegisteredCourses(
              registeredCourseRecords,
              timetableRecords
            );

          setCourseData(
            uniqueCourseData
          );

          // Enrich timetable rows with the complete registered-course
          // fields before deduplication. This keeps the timetable UI
          // unchanged while making its records complete.
          const enrichedTimetable =
            timetableRecords.map(
              (record) => {
                const nameKey =
                  normalizeText(
                    getSubjectName(record)
                  );

                const codeKey =
                  normalizeText(
                    getSubjectCode(record)
                  );

                const course =
                  uniqueCourseData.find(
                    (item) =>
                      (nameKey &&
                        normalizeText(
                          getSubjectName(item)
                        ) === nameKey) ||
                      (codeKey &&
                        normalizeText(
                          getSubjectCode(item)
                        ) === codeKey)
                  );

                return course
                  ? mergeSubjectRecord(
                      course,
                      record
                    )
                  : record;
              }
            );

          // THIS IS THE ONLY TIMETABLE ARRAY USED BY UI.
          const uniqueTimetable =
            deduplicateTimetable(
              enrichedTimetable
            );

          setTimetable(
            uniqueTimetable
          );

          // ===========================================
          // ATTENDANCE
          // ===========================================

          if (
            attendanceResponse.status ===
            "fulfilled"
          ) {
            setAttendance(
              extractArray(
                attendanceResponse
                  .value?.data,
                [
                  "data",
                  "attendance",
                  "records",
                  "items",
                ]
              )
            );
          }
        } catch (err) {
          console.error(
            "Student details loading error:",
            err
          );

          setError(
            err?.response?.data
              ?.detail ||
            err?.response?.data
              ?.message ||
            err?.message ||
            "Unable to load student details."
          );
        } finally {
          setLoading(false);
        }
      },
      [userId]
    );

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  // ===================================================
  // SYNC
  // ===================================================

  const handleSync =
    async () => {
      if (!userId) return;

      try {
        setSyncing(true);
        setError("");

        await api.post(
          `/admin/students/${userId}/sync-profile`
        );

        await loadStudent();
      } catch (err) {
        console.error(
          "Student sync error:",
          err
        );

        setError(
          err?.response?.data
            ?.detail ||
          err?.response?.data
            ?.message ||
          err?.message ||
          "Unable to synchronize student data."
        );
      } finally {
        setSyncing(false);
      }
    };

  // ===================================================
  // PROFILE
  // ===================================================

  const profileSources =
    [
      student,
      overview,
      overview?.profile,
      overview?.student,
      overview?.studentDetails,
      overview?.academic,
      overview?.details,
    ].filter(Boolean);

  const studentName =
    findFieldValue(
      profileSources,
      [
        "name",
        "studentName",
        "student_name",
        "fullName",
        "full_name",
        "candidateName",
      ]
    );

  const email =
    findFieldValue(
      profileSources,
      [
        "email",
        "emailAddress",
        "email_address",
      ]
    );

  const vtuNumber =
    findFieldValue(
      profileSources,
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
      profileSources,
      [
        "rollNumber",
        "roll_number",
        "rollNo",
        "roll_no",
        "studentRollNumber",
        "studentRollNo",
      ]
    );

  const degree =
    findFieldValue(
      profileSources,
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
      profileSources,
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
      profileSources,
      [
        "batch",
        "batchYear",
        "batch_year",
        "academicYear",
        "academic_year",
        "academicBatch",
        "academic_batch",
        "admissionYear",
        "admission_year",
      ]
    );

  const semester =
    findFieldValue(
      profileSources,
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
      profileSources,
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
      profileSources,
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
    findFieldValue(
      [
        ...profileSources,
        overview?.bucket,
        overview?.yourBucket,
        overview?.academicBucket,
        timetable[0],
      ],
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

  // ===================================================
  // REGISTERED COURSES
  // ===================================================
  // Registered-course data and timetable data are merged by
  // normalized subject name. Timetable data fills any missing
  // faculty, code, slot and room values.
  // ===================================================

  const registeredCourses =
    useMemo(
      () =>
        buildRegisteredCourses(
          courseData,
          timetable
        ),
      [courseData, timetable]
    );

  // ===================================================
  // GET CLASSES
  // ===================================================

  const getClasses = (
    day,
    slot
  ) =>
    timetable.filter(
      (item) =>
        item._day === day &&
        item._slotKey ===
          slot.key
    );

  // ===================================================
  // ATTENDANCE SUBJECTS
  // ===================================================

  const attendanceSubjects =
    useMemo(() => {
      const map = new Map();

      attendance.forEach(
        (record) => {
          const name =
            getSubjectName(
              record
            );

          const code =
            getSubjectCode(
              record
            );

          const key =
            normalizeText(
              name || code
            );

          if (!key) return;

          if (
            !map.has(key)
          ) {
            map.set(key, {
              name,
              code,
            });
          }
        }
      );

      registeredCourses.forEach(
        (course) => {
          const name =
            getSubjectName(
              course
            );

          const code =
            getSubjectCode(
              course
            );

          const key =
            normalizeText(
              name || code
            );

          if (!key) return;

          if (
            !map.has(key)
          ) {
            map.set(key, {
              name,
              code,
            });
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      attendance,
      registeredCourses,
    ]);

  // ===================================================
  // ATTENDANCE FILTER
  // ===================================================

  const filteredAttendance =
    useMemo(() => {
      const query =
        attendanceSearch
          .toLowerCase()
          .trim();

      return attendance.filter(
        (record) => {
          const subject =
            getSubjectName(
              record
            );

          const code =
            getSubjectCode(
              record
            );

          const status =
            clean(
              firstValue(
                record?.status,
                record?.attendanceStatus,
                record?.attendance_status
              )
            );

          const searchable =
            [
              subject,
              code,
              status,
              record?.date,
              record?.attendanceDate,
              getFaculty(record),
            ]
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const subjectKey =
            code || subject;

          const matchesSubject =
            attendanceSubject ===
              "all" ||
            normalizeText(
              subjectKey
            ) ===
              normalizeText(
                attendanceSubject
              );

          const normalizedStatus =
            status.toLowerCase();

          const matchesStatus =
            attendanceStatus ===
              "all" ||
            normalizedStatus ===
              attendanceStatus.toLowerCase();

          return (
            matchesSearch &&
            matchesSubject &&
            matchesStatus
          );
        }
      );
    }, [
      attendance,
      attendanceSearch,
      attendanceSubject,
      attendanceStatus,
    ]);

  // ===================================================
  // ATTENDANCE SUMMARY
  // ===================================================

  const calculatedAttendance =
    useMemo(() => {
      const map = new Map();

      attendance.forEach(
        (record) => {
          const name =
            getSubjectName(
              record
            );

          const code =
            getSubjectCode(
              record
            );

          const key =
            normalizeText(
              name || code
            );

          if (!key) return;

          if (
            !map.has(key)
          ) {
            map.set(key, {
              name,
              code,
              present: 0,
              absent: 0,
              total: 0,
            });
          }

          const item =
            map.get(key);

          const status =
            clean(
              firstValue(
                record?.status,
                record?.attendanceStatus,
                record?.attendance_status
              )
            ).toLowerCase();

          const present =
            status === "present" ||
            status === "p" ||
            record?.present === true;

          const absent =
            status === "absent" ||
            status === "a" ||
            record?.present === false;

          if (present) {
            item.present += 1;
            item.total += 1;
          } else if (absent) {
            item.absent += 1;
            item.total += 1;
          }
        }
      );

      return Array.from(
        map.values()
      ).map((item) => ({
        ...item,
        percentage:
          item.total > 0
            ? Math.round(
                (item.present /
                  item.total) *
                  100
              )
            : 0,
      }));
    }, [attendance]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
          <div className="h-16 animate-pulse rounded-2xl bg-white" />
          <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/users"
                )
              }
              className="mb-3 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Students
            </button>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {displayValue(
                studentName
              )}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                {displayValue(
                  vtuNumber
                )}
              </span>

              {email && (
                <>
                  <span>•</span>
                  <span>{email}</span>
                </>
              )}

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  student?.active === false
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {student?.active === false
                  ? "INACTIVE"
                  : "ACTIVE"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users/${userId}/edit`
                )
              }
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
            >
              Edit Student
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              {syncing
                ? "Synchronizing..."
                : "Sync Portal Data"}
            </button>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* TABS */}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">

          <div className="flex min-w-max">

            {TABS.map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab
                    )
                  }
                  className={`border-b-2 px-6 py-4 text-sm font-bold transition ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}

                  {tab ===
                    "Attendance" && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[10px]">
                      {
                        attendance.length
                      }
                    </span>
                  )}

                  {tab ===
                    "Enrolled Subjects" && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[10px]">
                      {
                        registeredCourses.length
                      }
                    </span>
                  )}
                </button>
              )
            )}

          </div>
        </div>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activeTab ===
          "Overview" && (
          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                label="Registered Courses"
                value={
                  registeredCourses.length
                }
              />

              <StatCard
                label="Timetable Classes"
                value={
                  timetable.length
                }
              />

              <StatCard
                label="Attendance Records"
                value={
                  attendance.length
                }
              />

              <StatCard
                label="Bucket"
                value={
                  displayValue(
                    bucket
                  )
                }
              />

            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

              <div className="border-b border-slate-100 px-6 py-5">

                <h2 className="text-xl font-black text-slate-900">
                  Student Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete academic information available for this student.
                </p>

              </div>

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

                <DetailItem
                  label="Bucket"
                  value={
                    bucket
                  }
                />

                <DetailItem
                  label="Email"
                  value={
                    email
                  }
                />

              </div>
            </section>
          </div>
        )}

        {/* =================================================
            ATTENDANCE
        ================================================= */}

        {activeTab ===
          "Attendance" && (
          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                label="Records"
                value={
                  attendance.length
                }
              />

              <StatCard
                label="Subjects"
                value={
                  attendanceSubjects.length
                }
              />

              <StatCard
                label="Present"
                value={calculatedAttendance.reduce(
                  (total, item) =>
                    total +
                    item.present,
                  0
                )}
              />

              <StatCard
                label="Absent"
                value={calculatedAttendance.reduce(
                  (total, item) =>
                    total +
                    item.absent,
                  0
                )}
              />

            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

              <div className="border-b border-slate-100 p-5">

                <div className="flex flex-col gap-4 lg:flex-row">

                  <input
                    value={
                      attendanceSearch
                    }
                    onChange={(event) =>
                      setAttendanceSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search subject, code, date, faculty..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <select
                    value={
                      attendanceSubject
                    }
                    onChange={(event) =>
                      setAttendanceSubject(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="all">
                      All Subjects
                    </option>

                    {attendanceSubjects.map(
                      (
                        subject,
                        index
                      ) => (
                        <option
                          key={
                            subject.code ||
                            subject.name ||
                            index
                          }
                          value={
                            subject.code ||
                            subject.name
                          }
                        >
                          {subject.code
                            ? `${subject.code} - `
                            : ""}
                          {
                            subject.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={
                      attendanceStatus
                    }
                    onChange={(event) =>
                      setAttendanceStatus(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="all">
                      All Status
                    </option>
                    <option value="present">
                      Present
                    </option>
                    <option value="absent">
                      Absent
                    </option>
                  </select>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">

                  {[
                    ["rows", "Row Wise"],
                    ["columns", "Column Wise"],
                    ["summary", "Subject Summary"],
                  ].map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setAttendanceView(
                            value
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-bold ${
                          attendanceView ===
                          value
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}

                </div>
              </div>

              {attendanceView ===
                "rows" && (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Date
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Subject
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Code
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Status
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Faculty
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredAttendance.map(
                        (
                          record,
                          index
                        ) => {
                          const status =
                            clean(
                              firstValue(
                                record?.status,
                                record?.attendanceStatus,
                                record?.attendance_status
                              )
                            );

                          const present =
                            status.toLowerCase() ===
                              "present" ||
                            status.toLowerCase() ===
                              "p" ||
                            record?.present ===
                              true;

                          return (
                            <tr
                              key={
                                record?._id ||
                                record?.id ||
                                index
                              }
                              className="border-t border-slate-100"
                            >

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {displayValue(
                                  firstValue(
                                    record?.date,
                                    record?.attendanceDate,
                                    record?.attendance_date
                                  )
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-slate-800">
                                {displayValue(
                                  getSubjectName(
                                    record
                                  )
                                )}
                              </td>

                              <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-600">
                                {displayValue(
                                  getSubjectCode(
                                    record
                                  )
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    present
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {present
                                    ? "Present"
                                    : "Absent"}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {displayValue(
                                  getFaculty(
                                    record
                                  )
                                )}
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>
                  </table>
                </div>
              )}

              {attendanceView ===
                "summary" && (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[800px]">

                    <thead>
                      <tr className="bg-slate-50">

                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Subject
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold text-slate-500">
                          Code
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                          Present
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                          Absent
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                          Total
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                          Percentage
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {calculatedAttendance.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.code ||
                              item.name ||
                              index
                            }
                            className="border-t border-slate-100"
                          >

                            <td className="px-5 py-4 text-sm font-bold text-slate-800">
                              {item.name}
                            </td>

                            <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-600">
                              {displayValue(
                                item.code
                              )}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-emerald-600">
                              {item.present}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-rose-600">
                              {item.absent}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-slate-700">
                              {item.total}
                            </td>

                            <td className="px-5 py-4 text-center">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  item.percentage >=
                                  75
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {
                                  item.percentage
                                }
                                %
                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>
                  </table>
                </div>
              )}

              {filteredAttendance.length ===
                0 && (
                <div className="p-12 text-center">
                  <h3 className="text-lg font-bold text-slate-900">
                    No Attendance Records
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    No records match the selected filters.
                  </p>
                </div>
              )}

            </section>
          </div>
        )}

        {/* =================================================
            ENROLLED SUBJECTS
        ================================================= */}

        {activeTab ===
          "Enrolled Subjects" && (

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

            <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Course Registered Details
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Exact unique subjects displayed in the student's timetable.
                </p>
              </div>

              <span className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                {
                  registeredCourses.length
                }{" "}
                {registeredCourses.length ===
                1
                  ? "Course"
                  : "Courses"}
              </span>

            </div>

            {registeredCourses.length ===
            0 ? (
              <div className="p-14 text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  No Registered Courses
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  No timetable subjects are currently available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                  <thead>
                    <tr className="bg-slate-50">

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Course Code
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Course Name
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Credit
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Faculty Name
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Faculty ID
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Slot
                      </th>

                      <th className="border-b border-slate-200 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Room
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {registeredCourses.map(
                      (
                        course,
                        index
                      ) => (
                        <tr
                          key={
                            getCanonicalSubjectKey(
                              course
                            ) ||
                            index
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-5 text-sm text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {displayValue(
                              getCategory(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 font-mono text-sm font-bold text-indigo-600">
                            {displayValue(
                              getSubjectCode(
                                course
                              )
                            )}
                          </td>

                          <td className="max-w-[320px] px-5 py-5 text-sm font-bold text-slate-800">
                            {displayValue(
                              getSubjectName(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {displayValue(
                              getCredit(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {displayValue(
                              getFaculty(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {displayValue(
                              getFacultyId(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {displayValue(
                              getSlot(
                                course
                              )
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
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

          </section>
        )}

        {/* =================================================
            TIMETABLE
        ================================================= */}

        {activeTab ===
          "Timetable" && (

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="text-xl font-black text-slate-900">
                Time Table
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Same subjects and periods from the student's timetable, with duplicate portal records removed.
              </p>

            </div>

            {timetable.length ===
            0 ? (
              <div className="p-14 text-center">

                <h3 className="text-lg font-bold text-slate-900">
                  No Timetable Available
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Synchronize portal data to load the timetable.
                </p>

              </div>
            ) : (

              <div className="overflow-x-auto">

                <div className="min-w-[1280px]">

                  {/* HEADER */}

                  <div
                    className="grid border-b border-slate-200 bg-slate-50"
                    style={{
                      gridTemplateColumns:
                        "120px repeat(8, minmax(145px, 1fr))",
                    }}
                  >

                    <div className="flex min-h-[76px] items-center justify-center border-r border-slate-200 px-2 text-center">

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
                          className="flex min-h-[76px] items-center justify-center border-r border-slate-200 px-2 text-center last:border-r-0"
                        >
                          <span className="whitespace-nowrap text-[10px] font-bold text-slate-800">
                            {
                              slot.label
                            }
                          </span>
                        </div>
                      )
                    )}

                  </div>

                  {/* DAYS */}

                  {DAYS.map(
                    (day) => (
                      <div
                        key={day}
                        className="grid border-b border-slate-200"
                        style={{
                          gridTemplateColumns:
                            "120px repeat(8, minmax(145px, 1fr))",
                        }}
                      >

                        <div className="flex min-h-[145px] items-center justify-center border-r border-slate-200 bg-slate-50 px-3">
                          <span className="text-sm font-bold text-slate-800">
                            {day}
                          </span>
                        </div>

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
                                        item
                                      ) => (
                                        <ClassCard
                                          key={`${day}-${slot.key}-${getCanonicalSubjectKey(item)}`}
                                          item={
                                            item
                                          }
                                        />
                                      )
                                    )}

                                  </div>
                                ) : (
                                  <div className="flex min-h-[125px] items-center justify-center">
                                    <span className="text-[10px] text-slate-300">
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

          </section>
        )}

      </div>
    </div>
  );
}