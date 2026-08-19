import {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";

import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import AttendanceSummary from "../components/AttendanceSummary";

import { formatDate } from "../utils/dateUtils";

// =====================================================
// CONSTANTS
// =====================================================

const SYNC_POLL_INTERVAL = 5000;

// =====================================================
// HELPERS
// =====================================================

const normalizeArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  if (Array.isArray(data?.attendance)) {
    return data.attendance;
  }

  if (Array.isArray(data?.subjects)) {
    return data.subjects;
  }

  if (Array.isArray(data?.timetable)) {
    return data.timetable;
  }

  return [];
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function UserDetails() {
  const { userId: studentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  // =====================================================
  // SYNC STATE
  // =====================================================

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState("");

  const syncPollTimer = useRef(null);

  // =====================================================
  // LOAD STUDENT DATA
  // =====================================================

  const loadStudentData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      setError("Student ID is missing from the URL.");
      return;
    }

    try {
      setError("");

      const response = await api.get(
        `/admin/students/${studentId}/overview`,
        {
          timeout: 15000,
        }
      );

      const data = response?.data || {};

      if (data.success === false) {
        throw new Error(
          data.message ||
            "Failed to load student overview."
        );
      }

      // =================================================
      // STUDENT
      // =================================================

      const userData =
        data.student ||
        data.user ||
        data.profile ||
        null;

      if (!userData) {
        throw new Error(
          "Student details were not returned."
        );
      }

      setStudent(userData);

      // =================================================
      // ATTENDANCE
      // =================================================

      const attendanceData =
        normalizeArray(data.attendance);

      setAttendance(attendanceData);

      // =================================================
      // ATTENDANCE SUMMARY
      // =================================================

      let summaryData =
        data.attendanceSummary ??
        data.summary ??
        null;

      /*
       * Do NOT convert a summary object into an empty array.
       * AttendanceSummary may expect an object.
       */
      if (
        summaryData === null ||
        summaryData === undefined
      ) {
        summaryData = null;
      }

      setSummary(summaryData);

      // =================================================
      // SUBJECTS
      // =================================================

      const subjectsData =
        normalizeArray(data.subjects);

      setSubjects(subjectsData);

      // =================================================
      // TIMETABLE
      // =================================================

      const timetableData =
        normalizeArray(data.timetable);

      setTimetable(timetableData);

      // =================================================
      // SYNC STATUS
      // =================================================

      if (
        data.portal?.syncInProgress ||
        data.portal?.portalSyncInProgress ||
        userData.portalSyncInProgress ||
        userData.portal_sync_in_progress
      ) {
        setIsSyncing(true);
      }
    } catch (err) {
      console.error(
        "Failed to load student overview:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load student details."
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // =====================================================
  // POLL SYNC STATUS
  // =====================================================

  const pollSyncStatus = useCallback(async () => {
    if (!studentId) {
      return;
    }

    try {
      const response = await api.get(
        `/admin/students/${studentId}/overview`,
        {
          timeout: 15000,
        }
      );

      const responseData =
        response?.data || {};

      const data =
        responseData.student ||
        responseData.profile ||
        responseData;

      const syncInProgress =
        data.portalSyncInProgress ||
        data.portal_sync_in_progress;

      if (syncInProgress) {
        syncPollTimer.current =
          setTimeout(
            pollSyncStatus,
            SYNC_POLL_INTERVAL
          );

        return;
      }

      setIsSyncing(false);

      const lastError =
        data.portalSyncLastError ||
        data.portal_sync_last_error;

      if (lastError) {
        setSyncError(lastError);
      } else {
        setSyncSuccess(true);

        setTimeout(() => {
          setSyncSuccess(false);
        }, 6000);
      }

      await loadStudentData();
    } catch (err) {
      console.warn(
        "Sync polling network error. Retrying...",
        err
      );

      syncPollTimer.current =
        setTimeout(
          pollSyncStatus,
          SYNC_POLL_INTERVAL * 2
        );
    }
  }, [studentId, loadStudentData]);

  // =====================================================
  // RESUME BACKGROUND SYNC
  // =====================================================

  useEffect(() => {
    if (
      student &&
      (
        student.portalSyncInProgress === true ||
        student.portal_sync_in_progress === true
      )
    ) {
      setIsSyncing(true);

      pollSyncStatus();
    }
  }, [student, pollSyncStatus]);

  // =====================================================
  // MANUAL SYNC
  // =====================================================

  const handleSyncProfile = async () => {
    if (isSyncing || !studentId) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError("");
      setSyncSuccess(false);

      await api.post(
        `/admin/students/${studentId}/sync-profile`
      );

      pollSyncStatus();
    } catch (err) {
      setIsSyncing(false);

      setSyncError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to initiate synchronization."
      );
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadStudentData();

    return () => {
      if (syncPollTimer.current) {
        clearTimeout(
          syncPollTimer.current
        );
      }
    };
  }, [loadStudentData]);

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const portalConfigured =
    student?.portalCredentialsConfigured ||
    student?.portal_credentials_configured ||
    false;

  const isSynced =
    student?.portalSynced ||
    student?.portal_synced ||
    false;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <Loading
        fullPage
        text="Loading student profile..."
      />
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !student) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorMessage
          message={
            error ||
            "Student not found."
          }
          onRetry={() => {
            setLoading(true);
            loadStudentData();
          }}
        />

        <div className="mt-6">
          <Link
            to="/admin/users"
            className="text-sm font-bold text-indigo-600 hover:underline"
          >
            &larr; Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-6">
          <Link
            to="/admin/users"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-indigo-600 sm:text-sm"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>

            Back to Directory
          </Link>
        </div>

        {/* =================================================
            SYNC NOTIFICATIONS
        ================================================= */}

        {(isSyncing ||
          syncSuccess ||
          syncError) && (
          <div className="mb-6">

            {isSyncing && (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-indigo-600" />
                </span>

                <div>
                  <p className="text-sm font-bold text-indigo-900">
                    Synchronizing AMS & Parent Portal Data...
                  </p>

                  <p className="text-xs font-medium text-indigo-700 opacity-80">
                    Fetching latest profile,
                    subjects, and attendance.
                  </p>
                </div>
              </div>
            )}

            {syncSuccess &&
              !isSyncing && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    ✓
                  </span>

                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Synchronization Complete
                    </p>

                    <p className="text-xs font-medium text-emerald-700">
                      Student data has been updated.
                    </p>
                  </div>
                </div>
              )}

            {syncError &&
              !isSyncing && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    !
                  </span>

                  <div>
                    <p className="text-sm font-bold text-rose-900">
                      Synchronization Failed
                    </p>

                    <p className="text-xs font-medium text-rose-700">
                      {syncError}
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* =================================================
            STUDENT HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex items-center gap-5 sm:gap-6">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg sm:h-24 sm:w-24 sm:rounded-3xl sm:text-3xl">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                student.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {student.name ||
                    "Unknown Student"}
                </h1>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                    student.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      student.active
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />

                  {student.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">

                <span>
                  {student.vtuNumber ||
                    student.vtu_number ||
                    student.portalUsername ||
                    student.portal_username ||
                    "No VTU Number"}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span>
                  {student.email ||
                    "No email"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

            <Link
              to={`/admin/users/${studentId}/edit`}
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Edit Student
            </Link>

            <button
              type="button"
              onClick={handleSyncProfile}
              disabled={
                isSyncing ||
                !portalConfigured
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${
                  isSyncing
                    ? "animate-spin text-indigo-600"
                    : "text-indigo-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>

              {isSyncing
                ? "Syncing..."
                : "Sync Portal Data"}
            </button>
          </div>
        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div className="mb-6 flex overflow-x-auto border-b border-slate-200/60 scrollbar-hide">

          <TabButton
            active={
              activeTab === "overview"
            }
            onClick={() =>
              setActiveTab("overview")
            }
            label="Overview"
          />

          <TabButton
            active={
              activeTab === "attendance"
            }
            onClick={() =>
              setActiveTab("attendance")
            }
            label={`Attendance ${
              attendance.length > 0
                ? `(${attendance.length})`
                : ""
            }`}
          />

          <TabButton
            active={
              activeTab === "subjects"
            }
            onClick={() =>
              setActiveTab("subjects")
            }
            label={`Enrolled Subjects ${
              subjects.length > 0
                ? `(${subjects.length})`
                : ""
            }`}
          />

          <TabButton
            active={
              activeTab === "timetable"
            }
            onClick={() =>
              setActiveTab("timetable")
            }
            label={`Timetable ${
              timetable.length > 0
                ? `(${timetable.length})`
                : ""
            }`}
          />
        </div>

        {/* =================================================
            TAB CONTENT
        ================================================= */}

        <div className="space-y-6">

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeTab ===
            "overview" && (
            <>
              <div>
                <AttendanceSummary
                  summary={summary}
                  loading={false}
                  showDetails={false}
                  hideTitle={false}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">

                {/* ACADEMIC PROFILE */}

                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:rounded-3xl">

                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      Academic Profile
                    </h3>
                  </div>

                  <div className="grid gap-4 p-6 sm:grid-cols-2">

                    <InfoCard
                      label="VTU Number"
                      value={
                        student.vtuNumber ||
                        student.portalUsername
                      }
                    />

                    <InfoCard
                      label="Roll / Registration"
                      value={
                        student.rollNumber ||
                        student.registrationNumber
                      }
                    />

                    <InfoCard
                      label="Branch"
                      value={
                        student.branch
                      }
                    />

                    <InfoCard
                      label="Degree"
                      value={
                        student.degree
                      }
                    />

                    <InfoCard
                      label="Year"
                      value={
                        student.year
                      }
                    />

                    <InfoCard
                      label="Semester"
                      value={
                        student.semester
                      }
                    />

                    <InfoCard
                      label="Section"
                      value={
                        student.section
                      }
                    />

                    <InfoCard
                      label="Batch"
                      value={
                        student.batch
                      }
                    />
                  </div>
                </div>

                {/* SYSTEM */}

                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:rounded-3xl">

                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      System Integration
                    </h3>
                  </div>

                  <div className="grid gap-4 p-6 sm:grid-cols-2">

                    <InfoCard
                      label="Portal Configured"
                      value={
                        portalConfigured
                          ? "Yes"
                          : "No"
                      }
                      highlight={
                        portalConfigured
                          ? "emerald"
                          : "rose"
                      }
                    />

                    <InfoCard
                      label="Portal Synced"
                      value={
                        isSynced
                          ? "Yes"
                          : "No"
                      }
                      highlight={
                        isSynced
                          ? "emerald"
                          : "rose"
                      }
                    />

                    <InfoCard
                      label="AMS Username"
                      value={
                        student.portalUsername ||
                        student.vtuNumber ||
                        "—"
                      }
                    />

                    <InfoCard
                      label="Account Role"
                      value={
                        student.role
                      }
                    />

                    <InfoCard
                      label="Last Synced"
                      value={
                        formatDate(
                          student.lastSyncedAt ||
                            student.last_synced_at
                        ) || "Never"
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================
              ATTENDANCE
          ================================================= */}

          {activeTab ===
            "attendance" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:rounded-3xl">

              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Attendance Records
                  {" "}
                  ({attendance.length})
                </h3>
              </div>

              {attendance.length ===
              0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Attendance Found"
                    message="No attendance records are available for this student."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">

                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-500">
                          Date
                        </th>

                        <th className="px-6 py-4 font-bold text-slate-500">
                          Subject
                        </th>

                        <th className="px-6 py-4 font-bold text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {attendance.map(
                        (
                          record,
                          index
                        ) => (
                          <tr
                            key={
                              record._id ||
                              record.id ||
                              index
                            }
                            className="hover:bg-slate-50/50"
                          >

                            <td className="px-6 py-4 font-medium text-slate-900">
                              {formatDate(
                                record.date
                              )}
                            </td>

                            <td className="px-6 py-4 font-medium text-slate-600">
                              {record.subjectName ||
                                record.subjectCode ||
                                "—"}
                            </td>

                            <td className="px-6 py-4">
                              <AttendanceStatus
                                status={
                                  record.status
                                }
                              />
                            </td>
                          </tr>
                        )
                      )}

                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              ENROLLED SUBJECTS
          ================================================= */}

          {activeTab ===
            "subjects" && (
            <section>

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Enrolled Subjects
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Subjects associated with this student.
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                  {subjects.length} Subjects
                </div>
              </div>

              {subjects.length ===
              0 ? (
                <EmptyState
                  title="No Enrolled Subjects"
                  message="No enrolled subject information is currently available."
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {subjects.map(
                    (
                      subject,
                      index
                    ) => {
                      const code =
                        subject.subjectCode ||
                        subject.subject_code ||
                        subject.code ||
                        subject.courseCode ||
                        subject.course_code;

                      const name =
                        subject.subjectName ||
                        subject.subject_name ||
                        subject.name ||
                        subject.subject ||
                        subject.courseName ||
                        subject.course_name ||
                        "Unnamed Subject";

                      const faculty =
                        subject.faculty ||
                        subject.facultyName ||
                        subject.teacher ||
                        subject.staff;

                      return (
                        <div
                          key={
                            subject._id ||
                            subject.id ||
                            index
                          }
                          className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                        >

                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 19.5A2.5 2.5 0 016.5 17H20"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                              />
                            </svg>
                          </div>

                          <h3 className="line-clamp-2 text-base font-black text-slate-900">
                            {name}
                          </h3>

                          {code && (
                            <p className="mt-3 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-wider text-slate-600">
                              {code}
                            </p>
                          )}

                          {faculty && (
                            <p className="mt-3 text-xs font-medium text-slate-500">
                              Faculty:{" "}
                              <span className="font-bold text-slate-700">
                                {faculty}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </section>
          )}

          {/* =================================================
              TIMETABLE
          ================================================= */}

          {activeTab ===
            "timetable" && (
            <section>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Student Timetable
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Timetable fetched from the college AMS.
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
                  {timetable.length} Classes
                </div>
              </div>

              {timetable.length ===
              0 ? (
                <EmptyState
                  title="No Timetable Found"
                  message="No timetable has been synchronized for this student yet."
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm sm:rounded-3xl">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px] text-left text-sm">

                      <thead className="bg-slate-50">

                        <tr>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Day
                          </th>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Time
                          </th>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Subject
                          </th>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Code
                          </th>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Faculty
                          </th>

                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-slate-500">
                            Room
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {timetable.map(
                          (
                            slot,
                            index
                          ) => {

                            const day =
                              slot.day ||
                              slot.dayName ||
                              slot.weekday ||
                              "—";

                            const subjectName =
                              slot.subjectName ||
                              slot.subject_name ||
                              slot.subject ||
                              slot.courseName ||
                              slot.course_name ||
                              "Unknown Subject";

                            const subjectCode =
                              slot.subjectCode ||
                              slot.subject_code ||
                              slot.code ||
                              slot.courseCode ||
                              slot.course_code ||
                              "—";

                            const startTime =
                              slot.startTime ||
                              slot.start_time ||
                              "";

                            const endTime =
                              slot.endTime ||
                              slot.end_time ||
                              "";

                            const faculty =
                              slot.faculty ||
                              slot.facultyName ||
                              slot.teacher ||
                              slot.staff ||
                              "—";

                            const room =
                              slot.room ||
                              slot.roomNo ||
                              slot.roomNumber ||
                              slot.classroom ||
                              "—";

                            return (
                              <tr
                                key={
                                  slot._id ||
                                  slot.id ||
                                  index
                                }
                                className="transition hover:bg-indigo-50/30"
                              >

                                <td className="px-6 py-5">
                                  <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                    {day}
                                  </span>
                                </td>

                                <td className="whitespace-nowrap px-6 py-5 font-semibold text-slate-700">
                                  {startTime ||
                                  endTime ? (
                                    <>
                                      {startTime ||
                                        "—"}
                                      {" "}
                                      -
                                      {" "}
                                      {endTime ||
                                        "—"}
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </td>

                                <td className="px-6 py-5">
                                  <p className="font-bold text-slate-900">
                                    {
                                      subjectName
                                    }
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {
                                      subjectCode
                                    }
                                  </span>
                                </td>

                                <td className="px-6 py-5 font-medium text-slate-600">
                                  {faculty}
                                </td>

                                <td className="px-6 py-5 font-semibold text-slate-600">
                                  {room}
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB BUTTON
// =====================================================

function TabButton({
  active,
  onClick,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-bold transition-colors ${
        active
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  label,
  value,
  highlight,
}) {
  const styles = {
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    rose:
      "border-rose-100 bg-rose-50 text-rose-700",

    default:
      "border-slate-100 bg-slate-50 text-slate-900",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        styles[highlight] ||
        styles.default
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold">
        {value || "—"}
      </p>
    </div>
  );
}

// =====================================================
// ATTENDANCE STATUS
// =====================================================

function AttendanceStatus({
  status,
}) {
  const normalized =
    String(status || "")
      .toUpperCase();

  const isPresent =
    normalized === "PRESENT" ||
    normalized === "P";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        isPresent
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({
  title,
  message,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

        <svg
          className="h-7 w-7 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3.732 1.732 3z"
          />
        </svg>

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm font-medium text-slate-500">
        {message}
      </p>
    </div>
  );
}