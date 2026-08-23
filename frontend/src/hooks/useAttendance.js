import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAttendance,
  getAttendanceChanges,
  getAttendanceSummary,
  getTodayAttendance,
  getSubjectDetails,
} from "../services/attendanceService";

// =====================================================
// ERROR MESSAGE HELPER
// =====================================================

const getErrorMessage = (error, fallback) => {
  if (!error) {
    return fallback;
  }

  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail[0]?.msg || fallback;
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const message = error?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

// =====================================================
// ARRAY NORMALIZER
// =====================================================
//
// Handles:
// [] 
//
// { data: [] }
//
// { records: [] }
//
// { attendance: [] }
//
// { results: [] }
//
// { items: [] }
//
// { today: [] }
//
// { data: { attendance: [] } }
//
// =====================================================

const extractArray = (value, depth = 0) => {
  if (depth > 5 || value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "object") {
    return [];
  }

  const keys = [
    "attendance",
    "todayAttendance",
    "today_attendance",
    "records",
    "items",
    "results",
    "entries",
    "classes",
    "data",
    "today",
    "attendanceRecords",
    "attendance_records",
  ];

  for (const key of keys) {
    if (!(key in value)) {
      continue;
    }

    const result = extractArray(value[key], depth + 1);

    if (result.length > 0) {
      return result;
    }
  }

  return [];
};

// =====================================================
// DATE NORMALIZATION
// =====================================================

const normalizeDate = (value) => {
  if (!value) {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const text = String(value).trim();

  if (!text) {
    return "";
  }

  // YYYY-MM-DD
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // YYYY/MM/DD
  match = text.match(/^(\d{4})\/(\d{2})\/(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // DD-MM-YYYY
  match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // DD/MM/YYYY
  match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // DD.MM.YYYY
  match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // ISO date with timezone
  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0"),
    ].join("-");
  }

  return "";
};

// =====================================================
// GET RECORD DATE
// =====================================================

const getRecordDate = (record) => {
  if (!record || typeof record !== "object") {
    return "";
  }

  const possibleDates = [
    record.date,
    record.attendanceDate,
    record.attendance_date,
    record.attendedDate,
    record.attended_date,
    record.classDate,
    record.class_date,
    record.recordDate,
    record.record_date,
    record.sessionDate,
    record.session_date,
    record.dayDate,
    record.day_date,
    record.createdAt,
    record.created_at,
    record.updatedAt,
    record.updated_at,
  ];

  for (const value of possibleDates) {
    const normalized = normalizeDate(value);

    if (normalized) {
      return normalized;
    }
  }

  // Nested attendance object
  if (
    record.attendance &&
    typeof record.attendance === "object" &&
    !Array.isArray(record.attendance)
  ) {
    const nestedDate = getRecordDate(record.attendance);

    if (nestedDate) {
      return nestedDate;
    }
  }

  // Nested record object
  if (
    record.record &&
    typeof record.record === "object" &&
    !Array.isArray(record.record)
  ) {
    const nestedDate = getRecordDate(record.record);

    if (nestedDate) {
      return nestedDate;
    }
  }

  // Nested class object
  if (
    record.class &&
    typeof record.class === "object" &&
    !Array.isArray(record.class)
  ) {
    const nestedDate = getRecordDate(record.class);

    if (nestedDate) {
      return nestedDate;
    }
  }

  return "";
};

// =====================================================
// TODAY KEY
// =====================================================

const getTodayKey = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

// =====================================================
// FIND TODAY'S RECORDS FROM MAIN ATTENDANCE
// =====================================================
//
// This is the important fallback.
//
// If /attendance/today returns [] but /attendance
// contains today's records, use those records.
// =====================================================

const getTodayFromAttendance = (attendance) => {
  if (!Array.isArray(attendance) || attendance.length === 0) {
    return [];
  }

  const todayKey = getTodayKey();

  return attendance.filter((record) => {
    const recordDate = getRecordDate(record);

    return recordDate === todayKey;
  });
};

// =====================================================
// REMOVE DUPLICATE RECORDS
// =====================================================

const getRecordIdentity = (record, index) => {
  if (!record || typeof record !== "object") {
    return `unknown-${index}`;
  }

  return (
    record._id ||
    record.id ||
    record.attendanceId ||
    record.attendance_id ||
    [
      getRecordDate(record),
      record.subjectId ||
        record.subject_id ||
        record.subjectCode ||
        record.subject_code ||
        record.courseCode ||
        record.course_code ||
        record.subjectName ||
        record.subject_name ||
        "",
      record.status ||
        record.attendanceStatus ||
        record.attendance_status ||
        record.attendance ||
        "",
    ].join("|")
  );
};

const removeDuplicates = (records) => {
  if (!Array.isArray(records)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  records.forEach((record, index) => {
    const identity = getRecordIdentity(record, index);

    if (seen.has(identity)) {
      return;
    }

    seen.add(identity);
    result.push(record);
  });

  return result;
};

// =====================================================
// USE ATTENDANCE
// =====================================================

export default function useAttendance() {
  // ===================================================
  // STATE
  // ===================================================

  const [attendance, setAttendance] = useState([]);

  const [todayAttendance, setTodayAttendance] = useState([]);

  const [summary, setSummary] = useState([]);

  const [changes, setChanges] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ===================================================
  // REQUEST CONTROL
  // ===================================================

  const mountedRef = useRef(true);

  const requestIdRef = useRef(0);

  // ===================================================
  // MOUNT / UNMOUNT
  // ===================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ===================================================
  // LOAD ATTENDANCE
  // ===================================================

  const loadAttendance = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (mountedRef.current) {
      setLoading(true);
      setError("");
    }

    try {
      // =================================================
      // FETCH ALL ATTENDANCE DATA
      // =================================================

      const results = await Promise.allSettled([
        getAttendance(),
        getAttendanceSummary(),
        getTodayAttendance(),
        getAttendanceChanges(),
      ]);

      // =================================================
      // IGNORE OLD REQUEST
      // =================================================

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const [
        attendanceResult,
        summaryResult,
        todayResult,
        changesResult,
      ] = results;

      // =================================================
      // MAIN ATTENDANCE
      // =================================================

      let mainAttendance = [];

      if (attendanceResult.status === "fulfilled") {
        mainAttendance = extractArray(
          attendanceResult.value
        );

        mainAttendance = removeDuplicates(
          mainAttendance
        );

        setAttendance(mainAttendance);
      } else {
        setAttendance([]);

        setError(
          getErrorMessage(
            attendanceResult.reason,
            "Unable to load attendance data."
          )
        );
      }

      // =================================================
      // SUMMARY
      // =================================================

      if (summaryResult.status === "fulfilled") {
        const summaryData = extractArray(
          summaryResult.value
        );

        setSummary(summaryData);
      } else {
        setSummary([]);
      }

      // =================================================
      // TODAY'S ATTENDANCE
      // =================================================

      let todayData = [];

      if (todayResult.status === "fulfilled") {
        todayData = extractArray(
          todayResult.value
        );
      }

      // =================================================
      // IMPORTANT FALLBACK
      // =================================================
      //
      // If /attendance/today doesn't return records,
      // use today's records from /attendance.
      //
      // This prevents:
      //
      // Present 0
      // Absent 0
      // Recorded 0
      //
      // when today's records actually exist in the
      // main attendance endpoint.
      // =================================================

      if (todayData.length === 0) {
        todayData = getTodayFromAttendance(
          mainAttendance
        );
      }

      todayData = removeDuplicates(todayData);

      setTodayAttendance(todayData);

      // =================================================
      // CHANGES
      // =================================================

      if (changesResult.status === "fulfilled") {
        const changesData = extractArray(
          changesResult.value
        );

        setChanges(changesData);
      } else {
        setChanges([]);
      }

      // =================================================
      // CLEAR ERROR WHEN MAIN DATA IS AVAILABLE
      // =================================================

      if (mainAttendance.length > 0) {
        setError("");
      }
    } catch (err) {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setError(
          getErrorMessage(
            err,
            "Unable to load attendance data."
          )
        );
      }
    } finally {
      // =================================================
      // STOP LOADING
      // =================================================

      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ===================================================
  // SUBJECT ATTENDANCE
  // ===================================================

  const getSubjectAttendance = useCallback(
    async (subjectId) => {
      if (!subjectId) {
        throw new Error(
          "Subject ID is required."
        );
      }

      try {
        const result =
          await getSubjectDetails(
            subjectId
          );

        return result;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Unable to load subject attendance."
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      }
    },
    []
  );

  // ===================================================
  // REFRESH
  // ===================================================

  const refresh = useCallback(async () => {
    await loadAttendance();
  }, [loadAttendance]);

  // ===================================================
  // TODAY RECORDS FALLBACK
  // ===================================================
  //
  // Expose a guaranteed array.
  // ===================================================

  const safeTodayAttendance = useMemo(() => {
    if (
      Array.isArray(todayAttendance) &&
      todayAttendance.length > 0
    ) {
      return todayAttendance;
    }

    return getTodayFromAttendance(attendance);
  }, [todayAttendance, attendance]);

  // ===================================================
  // RETURN
  // ===================================================

  return {
    // -------------------------------------------------
    // Main attendance
    // -------------------------------------------------

    attendance,

    // -------------------------------------------------
    // Today's attendance
    // -------------------------------------------------

    todayAttendance: safeTodayAttendance,

    // -------------------------------------------------
    // Summary
    // -------------------------------------------------

    summary,

    // -------------------------------------------------
    // Changes
    // -------------------------------------------------

    changes,

    // -------------------------------------------------
    // Loading
    // -------------------------------------------------

    loading,

    // -------------------------------------------------
    // Error
    // -------------------------------------------------

    error,

    // -------------------------------------------------
    // Refresh
    // -------------------------------------------------

    refresh,

    // -------------------------------------------------
    // Subject attendance
    // -------------------------------------------------

    getSubjectAttendance,
  };
}