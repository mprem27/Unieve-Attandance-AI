import api from "./api";

// =====================================================
// RESPONSE HELPERS
// =====================================================

const toArray = (data, possibleKeys = []) => {
  // ---------------------------------------------------
  // Direct array
  // ---------------------------------------------------

  if (Array.isArray(data)) {
    return data;
  }

  // ---------------------------------------------------
  // Object response
  // ---------------------------------------------------

  if (
    data &&
    typeof data === "object"
  ) {
    // -----------------------------------------------
    // Check known keys
    // -----------------------------------------------

    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    // -----------------------------------------------
    // data
    // -----------------------------------------------

    if (Array.isArray(data.data)) {
      return data.data;
    }

    // -----------------------------------------------
    // results
    // -----------------------------------------------

    if (Array.isArray(data.results)) {
      return data.results;
    }

    // -----------------------------------------------
    // items
    // -----------------------------------------------

    if (Array.isArray(data.items)) {
      return data.items;
    }

    // -----------------------------------------------
    // records
    // -----------------------------------------------

    if (Array.isArray(data.records)) {
      return data.records;
    }

    // -----------------------------------------------
    // attendance
    // -----------------------------------------------

    if (Array.isArray(data.attendance)) {
      return data.attendance;
    }
  }

  return [];
};

// =====================================================
// DATE HELPERS
// =====================================================
//
// These helpers are only used as a fallback for
// Today's Attendance.
//
// Existing attendance API functions are preserved.
// =====================================================

const getTodayDate = () => {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// NORMALIZE ATTENDANCE DATE
// =====================================================

const normalizeAttendanceDate = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  const text = String(value).trim();

  if (!text) {
    return "";
  }

  // ---------------------------------------------------
  // YYYY-MM-DD
  // ---------------------------------------------------

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (isoMatch) {
    return (
      `${isoMatch[1]}-` +
      `${isoMatch[2]}-` +
      `${isoMatch[3]}`
    );
  }

  // ---------------------------------------------------
  // YYYY/MM/DD
  // ---------------------------------------------------

  const ymdSlash = text.match(
    /^(\d{4})\/(\d{2})\/(\d{2})$/
  );

  if (ymdSlash) {
    return (
      `${ymdSlash[1]}-` +
      `${ymdSlash[2]}-` +
      `${ymdSlash[3]}`
    );
  }

  // ---------------------------------------------------
  // DD-MM-YYYY
  // ---------------------------------------------------

  const dmyDash = text.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (dmyDash) {
    return (
      `${dmyDash[3]}-` +
      `${dmyDash[2]}-` +
      `${dmyDash[1]}`
    );
  }

  // ---------------------------------------------------
  // DD/MM/YYYY
  // ---------------------------------------------------

  const dmySlash = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (dmySlash) {
    return (
      `${dmySlash[3]}-` +
      `${dmySlash[2]}-` +
      `${dmySlash[1]}`
    );
  }

  // ---------------------------------------------------
  // ISO DATETIME
  // ---------------------------------------------------

  if (text.includes("T")) {
    return text.substring(0, 10);
  }

  return text;
};

// =====================================================
// GET ATTENDANCE RECORD DATE
// =====================================================

const getAttendanceRecordDate = (
  record
) => {
  if (
    !record ||
    typeof record !== "object"
  ) {
    return "";
  }

  const value =
    record.date ??
    record.attendanceDate ??
    record.attendance_date ??
    record.attendedDate ??
    record.attended_date ??
    record.classDate ??
    record.class_date ??
    "";

  return normalizeAttendanceDate(
    value
  );
};

// =====================================================
// FILTER TODAY'S RECORDS
// =====================================================

const filterTodayRecords = (
  records
) => {
  if (!Array.isArray(records)) {
    return [];
  }

  const today = getTodayDate();

  return records.filter(
    (record) => {
      return (
        getAttendanceRecordDate(
          record
        ) === today
      );
    }
  );
};

// =====================================================
// ATTENDANCE
// =====================================================

export const getAttendance = async () => {
  const response = await api.get(
    "/attendance"
  );

  const records = toArray(
    response.data,
    [
      "attendance",
      "records",
      "items",
      "data",
      "results",
    ]
  );

  return records;
};

// =====================================================
// TODAY'S ATTENDANCE
// =====================================================

export const getTodayAttendance =
  async () => {
    try {
      // -------------------------------------------------
      // FIRST:
      // Use the dedicated today's endpoint.
      // -------------------------------------------------

      const response =
        await api.get(
          "/attendance/today"
        );

      const records =
        toArray(
          response.data,
          [
            "attendance",
            "records",
            "items",
            "data",
            "results",
          ]
        );

      // -------------------------------------------------
      // If today's endpoint has records,
      // return them immediately.
      // -------------------------------------------------

      if (records.length > 0) {
        return records;
      }

      // -------------------------------------------------
      // FALLBACK:
      // Fetch the main attendance records.
      // -------------------------------------------------

      const attendanceResponse =
        await api.get(
          "/attendance"
        );

      const allRecords =
        toArray(
          attendanceResponse.data,
          [
            "attendance",
            "records",
            "items",
            "data",
            "results",
          ]
        );

      // -------------------------------------------------
      // Filter main attendance using today's date.
      // -------------------------------------------------

      return filterTodayRecords(
        allRecords
      );

    } catch (error) {
      // -------------------------------------------------
      // If /today fails completely,
      // try the main attendance endpoint.
      // -------------------------------------------------

      try {
        const response =
          await api.get(
            "/attendance"
          );

        const allRecords =
          toArray(
            response.data,
            [
              "attendance",
              "records",
              "items",
              "data",
              "results",
            ]
          );

        return filterTodayRecords(
          allRecords
        );
      } catch (fallbackError) {
        return [];
      }
    }
  };

// =====================================================
// ATTENDANCE SUMMARY
// =====================================================

export const getAttendanceSummary =
  async () => {
    try {
      const response =
        await api.get(
          "/attendance/summary"
        );

      const records =
        toArray(
          response.data,
          [
            "summary",
            "attendance",
            "records",
            "items",
            "data",
            "results",
          ]
        );

      return records;
    } catch (error) {
      return [];
    }
  };

// =====================================================
// ATTENDANCE CHANGES
// =====================================================

export const getAttendanceChanges =
  async () => {
    try {
      const response =
        await api.get(
          "/attendance/changes"
        );

      const records =
        toArray(
          response.data,
          [
            "changes",
            "attendance",
            "records",
            "items",
            "data",
            "results",
          ]
        );

      return records;
    } catch (error) {
      return [];
    }
  };

// =====================================================
// SUBJECT DETAILS
// =====================================================

export const getSubjectDetails =
  async (subjectId) => {
    if (!subjectId) {
      throw new Error(
        "Subject ID is required."
      );
    }

    const response =
      await api.get(
        `/attendance/subject/${encodeURIComponent(
          subjectId
        )}`
      );

    return response.data;
  };

// =====================================================
// GET ATTENDANCE DASHBOARD DATA
// =====================================================

export const getAttendanceDashboardData =
  async () => {
    const results =
      await Promise.allSettled([
        getAttendance(),
        getAttendanceSummary(),
        getAttendanceChanges(),
        getTodayAttendance(),
      ]);

    return {
      attendance:
        results[0].status ===
        "fulfilled"
          ? results[0].value
          : [],

      summary:
        results[1].status ===
        "fulfilled"
          ? results[1].value
          : [],

      changes:
        results[2].status ===
        "fulfilled"
          ? results[2].value
          : [],

      today:
        results[3].status ===
        "fulfilled"
          ? results[3].value
          : [],

      errors: results
        .map(
          (
            result,
            index
          ) => {
            if (
              result.status ===
              "rejected"
            ) {
              return {
                index,
                error:
                  result.reason,
              };
            }

            return null;
          }
        )
        .filter(Boolean),
    };
  };

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getAttendance,
  getTodayAttendance,
  getAttendanceSummary,
  getAttendanceChanges,
  getSubjectDetails,
  getAttendanceDashboardData,
};