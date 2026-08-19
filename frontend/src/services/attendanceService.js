import api from "./api";

// =====================================================
// RESPONSE HELPERS
// =====================================================

const toArray = (data, possibleKeys = []) => {
  // Direct array
  if (Array.isArray(data)) {
    return data;
  }

  // Common API response formats
  if (data && typeof data === "object") {
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    // Sometimes backend wraps data inside "data"
    if (Array.isArray(data.data)) {
      return data.data;
    }

    // Sometimes backend returns "results"
    if (Array.isArray(data.results)) {
      return data.results;
    }
  }

  return [];
};

// =====================================================
// ATTENDANCE
// =====================================================

export const getAttendance = async () => {
  try {
    const response = await api.get("/attendance");
    return toArray(response.data, [
      "attendance",
      "records",
      "items",
      "data",
      "results",
    ]);
  } catch (error) {
    const status = error.response?.status;
    console.warn(`Attendance request failed${status ? ` (${status})` : ""}:`, error);
    return [];
  }
};

// =====================================================
// TODAY'S ATTENDANCE
// =====================================================

export const getTodayAttendance = async () => {
  try {
    const response = await api.get("/attendance/today");
    return toArray(response.data, [
      "attendance",
      "records",
      "items",
      "data",
      "results",
    ]);
  } catch (error) {
    const status = error.response?.status;
    console.warn(`Today's attendance request failed${status ? ` (${status})` : ""}:`, error);
    return [];
  }
};

// =====================================================
// ATTENDANCE SUMMARY
// =====================================================

export const getAttendanceSummary = async () => {
  try {
    const response = await api.get("/attendance/summary");
    return toArray(response.data, [
      "summary",
      "attendance",
      "records",
      "items",
      "data",
      "results",
    ]);
  } catch (error) {
    const status = error.response?.status;
    console.warn(`Attendance summary request failed${status ? ` (${status})` : ""}:`, error);
    return [];
  }
};

// =====================================================
// ATTENDANCE CHANGES
// =====================================================

export const getAttendanceChanges = async () => {
  try {
    const response = await api.get("/attendance/changes");
    return toArray(response.data, [
      "changes",
      "attendance",
      "records",
      "items",
      "data",
      "results",
    ]);
  } catch (error) {
    const status = error.response?.status;
    console.warn(`Attendance changes request failed${status ? ` (${status})` : ""}:`, error);
    return [];
  }
};

// =====================================================
// SUBJECT DETAILS
// =====================================================

export const getSubjectDetails = async (subjectId) => {
  if (!subjectId) {
    throw new Error("Subject ID is required.");
  }

  const response = await api.get(
    `/attendance/subject/${encodeURIComponent(subjectId)}`
  );

  /*
   * Do NOT convert this response into an array.
   *
   * The subject endpoint may return an object containing:
   *
   * {
   *   subject: {...},
   *   attendance: [...],
   *   summary: {...}
   * }
   *
   * The page can use the complete response.
   */

  return response.data;
};

// =====================================================
// GET ATTENDANCE + TODAY + SUMMARY + CHANGES
// =====================================================
//
// This helper is optional but useful for the attendance
// hook. Each request is independent, so one failed endpoint
// does not prevent the others from loading.
// =====================================================

export const getAttendanceDashboardData = async () => {
  const results = await Promise.allSettled([
    getAttendance(),
    getAttendanceSummary(),
    getAttendanceChanges(),
    getTodayAttendance(),
  ]);

  return {
    attendance:
      results[0].status === "fulfilled" ? results[0].value : [],

    summary:
      results[1].status === "fulfilled" ? results[1].value : [],

    changes:
      results[2].status === "fulfilled" ? results[2].value : [],

    today:
      results[3].status === "fulfilled" ? results[3].value : [],

    errors: results
      .map((result, index) => {
        if (result.status === "rejected") {
          return {
            index,
            error: result.reason,
          };
        }
        return null;
      })
      .filter(Boolean),
  };
};

// =====================================================
// EXPORT
// =====================================================

export default {
  getAttendance,
  getTodayAttendance,
  getAttendanceSummary,
  getAttendanceChanges,
  getSubjectDetails,
  getAttendanceDashboardData,
};
