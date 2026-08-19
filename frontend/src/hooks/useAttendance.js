import {
  useCallback,
  useEffect,
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

const getErrorMessage = (
  error,
  fallback
) => {
  if (!error) {
    return fallback;
  }

  const detail =
    error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return (
      detail[0]?.msg ||
      fallback
    );
  }

  if (
    typeof detail === "string" &&
    detail.trim()
  ) {
    return detail;
  }

  const message =
    error?.response?.data?.message;

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

// =====================================================
// USE ATTENDANCE
// =====================================================

export default function useAttendance() {
  // ===================================================
  // STATE
  // ===================================================

  const [attendance, setAttendance] =
    useState([]);

  const [todayAttendance, setTodayAttendance] =
    useState([]);

  const [summary, setSummary] =
    useState([]);

  const [changes, setChanges] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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

  const loadAttendance = useCallback(
    async () => {
      const requestId =
        ++requestIdRef.current;

      if (mountedRef.current) {
        setLoading(true);
        setError("");
      }

      try {
        /*
         * Run all attendance requests independently.
         *
         * Main attendance is the important endpoint.
         *
         * Today / changes / summary are optional.
         */
        const results =
          await Promise.allSettled([
            getAttendance(),
            getAttendanceSummary(),
            getTodayAttendance(),
            getAttendanceChanges(),
          ]);

        // ---------------------------------------------
        // Ignore old request
        // ---------------------------------------------

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

        // ---------------------------------------------
        // MAIN ATTENDANCE
        // ---------------------------------------------

        if (
          attendanceResult.status ===
            "fulfilled" &&
          Array.isArray(
            attendanceResult.value
          )
        ) {
          setAttendance(
            attendanceResult.value
          );
        } else {
          setAttendance([]);

          /*
           * Main attendance is the only required
           * request. If it fails, show an error.
           */
          setError(
            getErrorMessage(
              attendanceResult.reason,
              "Unable to load attendance data."
            )
          );
        }

        // ---------------------------------------------
        // SUMMARY
        // ---------------------------------------------

        if (
          summaryResult.status ===
            "fulfilled" &&
          Array.isArray(
            summaryResult.value
          )
        ) {
          setSummary(
            summaryResult.value
          );
        } else {
          /*
           * Summary failure should NOT prevent
           * attendance from displaying.
           */
          setSummary([]);
        }

        // ---------------------------------------------
        // TODAY
        // ---------------------------------------------

        if (
          todayResult.status ===
            "fulfilled" &&
          Array.isArray(
            todayResult.value
          )
        ) {
          setTodayAttendance(
            todayResult.value
          );
        } else {
          /*
           * Today endpoint is optional.
           */
          setTodayAttendance([]);
        }

        // ---------------------------------------------
        // CHANGES
        // ---------------------------------------------

        if (
          changesResult.status ===
            "fulfilled" &&
          Array.isArray(
            changesResult.value
          )
        ) {
          setChanges(
            changesResult.value
          );
        } else {
          /*
           * Changes endpoint is optional.
           */
          setChanges([]);
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
        /*
         * IMPORTANT:
         *
         * Always stop loading even if one of the
         * optional endpoints fails.
         */
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ===================================================
  // SUBJECT ATTENDANCE
  // ===================================================

  const getSubjectAttendance =
    useCallback(
      async (subjectId) => {
        if (!subjectId) {
          throw new Error(
            "Subject ID is required."
          );
        }

        try {
          /*
           * Do not set the main attendance loading
           * state here.
           *
           * Subject loading is handled by the
           * subject page/component.
           */

          const result =
            await getSubjectDetails(
              subjectId
            );

          return result;

        } catch (err) {
          const message =
            getErrorMessage(
              err,
              "Unable to load subject attendance."
            );

          /*
           * Keep the error available to the UI,
           * but don't modify the main attendance
           * data.
           */
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

  const refresh = useCallback(
    async () => {
      await loadAttendance();
    },
    [loadAttendance]
  );

  // ===================================================
  // RETURN
  // ===================================================

  return {
    // Main attendance
    attendance,

    // Today's attendance
    todayAttendance,

    // Attendance summary
    summary,

    // Attendance changes
    changes,

    // Main loading state
    loading,

    // Error
    error,

    // Refresh
    refresh,

    // Subject attendance
    getSubjectAttendance,
  };
}