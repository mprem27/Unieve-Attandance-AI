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
// DEBUG HELPER
// =====================================================

const logAttendanceResponse = (
  label,
  responseData,
  parsedData
) => {
  console.log(
    `[Attendance Service] ${label} raw response:`,
    responseData
  );

  console.log(
    `[Attendance Service] ${label} parsed records:`,
    parsedData
  );

  console.log(
    `[Attendance Service] ${label} record count:`,
    parsedData.length
  );

  if (parsedData.length > 0) {
    console.log(
      `[Attendance Service] ${label} first record:`,
      parsedData[0]
    );
  }
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

  // ---------------------------------------------------
  // Debug
  // ---------------------------------------------------

  logAttendanceResponse(
    "MAIN ATTENDANCE",
    response.data,
    records
  );

  return records;
};

// =====================================================
// TODAY'S ATTENDANCE
// =====================================================

export const getTodayAttendance =
  async () => {
    try {
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

      // ---------------------------------------------
      // Debug
      // ---------------------------------------------

      logAttendanceResponse(
        "TODAY ATTENDANCE",
        response.data,
        records
      );

      return records;
    } catch (error) {
      const status =
        error?.response?.status;

      console.warn(
        `Today's attendance request failed${
          status
            ? ` (${status})`
            : ""
        }:`,
        error
      );

      return [];
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

      // ---------------------------------------------
      // Debug
      // ---------------------------------------------

      logAttendanceResponse(
        "ATTENDANCE SUMMARY",
        response.data,
        records
      );

      return records;
    } catch (error) {
      const status =
        error?.response?.status;

      console.warn(
        `Attendance summary request failed${
          status
            ? ` (${status})`
            : ""
        }:`,
        error
      );

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

      // ---------------------------------------------
      // Debug
      // ---------------------------------------------

      logAttendanceResponse(
        "ATTENDANCE CHANGES",
        response.data,
        records
      );

      return records;
    } catch (error) {
      const status =
        error?.response?.status;

      console.warn(
        `Attendance changes request failed${
          status
            ? ` (${status})`
            : ""
        }:`,
        error
      );

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

export default {
  getAttendance,
  getTodayAttendance,
  getAttendanceSummary,
  getAttendanceChanges,
  getSubjectDetails,
  getAttendanceDashboardData,
};