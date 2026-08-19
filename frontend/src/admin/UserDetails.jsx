import {
  useCallback,
  useEffect,
  useMemo,
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

const getValue = (
  object,
  keys,
  fallback = null
) => {
  for (const key of keys) {
    if (
      object?.[key] !== undefined &&
      object?.[key] !== null &&
      object?.[key] !== ""
    ) {
      return object[key];
    }
  }

  return fallback;
};

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
  // DATA LOADING
  // =====================================================

  const loadStudentData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      setError("Student ID is missing from the URL.");
      return;
    }

    try {
      setError("");

      // Load the complete student overview first.
      // This remains the primary working endpoint.
      const overviewResponse = await api.get(
        `/admin/students/${studentId}/overview`,
        { timeout: 15000 }
      );

      const data = overviewResponse?.data || {};

      if (data.success === false) {
        throw new Error(
          data.message || "Failed to load student overview."
        );
      }

      const userData =
        data.student ||
        data.user ||
        null;

      if (!userData) {
        throw new Error("Student details were not returned.");
      }

      setStudent(userData);

      const overviewAttendance =
        normalizeArray(data.attendance);

      const overviewSummary =
        normalizeArray(data.attendanceSummary);

      const overviewSubjects =
        normalizeArray(data.subjects);

      const overviewTimetable =
        normalizeArray(data.timetable);

      setAttendance(overviewAttendance);
      setSummary(overviewSummary);
      setSubjects(overviewSubjects);
      setTimetable(overviewTimetable);

      // The overview remains the primary source.
      // If an older backend response does not include subjects,
      // timetable, or summary, use the admin-specific routes
      // without changing the working attendance/sync logic.
      const fallbackRequests = [];

      if (overviewSubjects.length === 0) {
        fallbackRequests.push(
          api
            .get(`/admin/users/${studentId}/subjects`, {
              timeout: 15000,
            })
            .then((response) => ({
              type: "subjects",
              data: normalizeArray(response?.data),
            }))
            .catch(() => ({
              type: "subjects",
              data: [],
            }))
        );
      }

      if (overviewTimetable.length === 0) {
        fallbackRequests.push(
          api
            .get(`/admin/users/${studentId}/timetable`, {
              timeout: 15000,
            })
            .then((response) => ({
              type: "timetable",
              data: normalizeArray(response?.data),
            }))
            .catch(() => ({
              type: "timetable",
              data: [],
            }))
        );
      }

      if (overviewSummary.length === 0) {
        fallbackRequests.push(
          api
            .get(
              `/admin/users/${studentId}/attendance/summary`,
              { timeout: 15000 }
            )
            .then((response) => ({
              type: "summary",
              data: normalizeArray(response?.data),
            }))
            .catch(() => ({
              type: "summary",
              data: [],
            }))
        );
      }

      if (fallbackRequests.length > 0) {
        const fallbackResults =
          await Promise.all(fallbackRequests);

        fallbackResults.forEach((result) => {
          if (result.type === "subjects" && result.data.length > 0) {
            setSubjects(result.data);
          }

          if (result.type === "timetable" && result.data.length > 0) {
            setTimetable(result.data);
          }

          if (result.type === "summary" && result.data.length > 0) {
            setSummary(result.data);
          }
        });
      }

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
  // BACKGROUND SYNC POLLING
  // =====================================================

  const pollSyncStatus = useCallback(async () => {
    if (!studentId) return;

    try {
      const response = await api.get(`/admin/students/${studentId}/overview`, { timeout: 15000 });
      const data = response?.data?.student || response?.data?.profile || response?.data || {};

      if (data.portalSyncInProgress || data.portal_sync_in_progress) {
        // Still running, poll again
        syncPollTimer.current = setTimeout(pollSyncStatus, SYNC_POLL_INTERVAL);
      } else {
        // Sync completed
        setIsSyncing(false);

        if (data.portalSyncLastError || data.portal_sync_last_error) {
          setSyncError(data.portalSyncLastError || data.portal_sync_last_error);
        } else {
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 6000); // Hide success after 6s
        }

        // Refresh the dashboard with the newly scraped data!
        loadStudentData();
      }
    } catch (err) {
      console.warn("Sync polling network blip, retrying...", err);
      // Don't kill the polling on a single network drop
      syncPollTimer.current = setTimeout(pollSyncStatus, SYNC_POLL_INTERVAL * 2);
    }
  }, [studentId, loadStudentData]);

  // =====================================================
  // RESUME EXISTING BACKGROUND SYNC
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
  // MANUAL SYNC TRIGGER
  // =====================================================

  const handleSyncProfile = async () => {
    if (isSyncing || !studentId) return;

    try {
      setIsSyncing(true);
      setSyncError("");
      setSyncSuccess(false);

      // Tell backend to start the Background Task
      await api.post(`/admin/students/${studentId}/sync-profile`);

      // Start polling the overview endpoint for completion
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
  // LIFECYCLE
  // =====================================================

  useEffect(() => {
    loadStudentData();

    return () => {
      if (syncPollTimer.current) {
        clearTimeout(syncPollTimer.current);
      }
    };
  }, [loadStudentData]);

  // =====================================================
  // DERIVED DATA
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
  // LOADING / ERROR
  // =====================================================

  if (loading) {
    return <Loading fullPage text="Loading student profile..." />;
  }

  if (error || !student) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorMessage
          message={error || "Student not found."}
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

        {/* BREADCRUMB */}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Directory
          </Link>
        </div>

        {/* SYNC NOTIFICATIONS */}
        {(isSyncing || syncSuccess || syncError) && (
          <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
            {isSyncing && (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-indigo-600" />
                </span>
                <div>
                  <p className="text-sm font-bold text-indigo-900">Synchronizing AMS & Parent Portal Data...</p>
                  <p className="text-xs font-medium text-indigo-700 opacity-80">Fetching latest profile, subjects, and attendance. This may take a minute.</p>
                </div>
              </div>
            )}

            {syncSuccess && !isSyncing && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Synchronization Complete</p>
                  <p className="text-xs font-medium text-emerald-700 opacity-80">Student data has been successfully updated.</p>
                </div>
              </div>
            )}

            {syncError && !isSyncing && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold">!</span>
                <div>
                  <p className="text-sm font-bold text-rose-900">Synchronization Failed</p>
                  <p className="text-xs font-medium text-rose-700 opacity-80">{syncError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg sm:h-24 sm:w-24 sm:rounded-3xl sm:text-3xl">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                student.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {student.name || "Unknown Student"}
                </h1>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                    student.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${student.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {student.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 sm:text-base">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                  {student.vtuNumber ||
                    student.vtu_number ||
                    student.portalUsername ||
                    student.portal_username ||
                    "No VTU Number"}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {student.email || "No email"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={`/admin/users/${studentId}/edit`}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
            >
              Edit Student
            </Link>

            <button
              type="button"
              onClick={handleSyncProfile}
              disabled={isSyncing || !portalConfigured}
              className="group flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${isSyncing ? "animate-spin text-indigo-600" : "text-indigo-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {isSyncing ? "Syncing..." : "Sync Portal Data"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-6 flex overflow-x-auto border-b border-slate-200/60 scrollbar-hide">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Overview" />
          <TabButton active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} label="Attendance Records" />
          <TabButton active={activeTab === "subjects"} onClick={() => setActiveTab("subjects")} label="Enrolled Subjects" />
          <TabButton active={activeTab === "timetable"} onClick={() => setActiveTab("timetable")} label="Timetable" />
        </div>

        {/* TAB CONTENTS */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              {/* ATTENDANCE SUMMARY CARD */}
              <div className="mb-6">
                <AttendanceSummary
                  summary={summary}
                  loading={false}
                  showDetails={false}
                  hideTitle={false}
                />
              </div>

              {/* PROFILE & SYSTEM DETAILS */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Academic Profile</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoCard label="VTU Number" value={student.vtuNumber || student.portalUsername} />
                      <InfoCard label="Roll / Registration" value={student.rollNumber || student.registrationNumber} />
                      <InfoCard label="Branch" value={student.branch} />
                      <InfoCard label="Degree" value={student.degree} />
                      <InfoCard label="Year" value={student.year} />
                      <InfoCard label="Semester" value={student.semester} />
                      <InfoCard label="Section" value={student.section} />
                      <InfoCard label="Batch" value={student.batch} />
                      <InfoCard label="Gender" value={student.gender} />
                      <InfoCard label="Date of Birth" value={student.dateOfBirth} />
                      <InfoCard label="Father Name" value={student.fatherName} />
                      <InfoCard label="Mother Name" value={student.motherName} />
                      <InfoCard label="Phone" value={student.phoneNumber} />
                      <InfoCard label="Parent Name" value={student.parentName} />
                      <InfoCard label="Parent Phone" value={student.parentPhone} />
                      <InfoCard label="Academic Bank ID" value={student.academicBankCreditsId} />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">System Integration</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoCard label="Portal Configured" value={portalConfigured ? "Yes" : "No"} highlight={portalConfigured ? "emerald" : "rose"} />
                      <InfoCard label="Portal Synced" value={isSynced ? "Yes" : "No"} highlight={isSynced ? "emerald" : "rose"} />
                      <InfoCard
                        label="AMS Username"
                        value={student.portalUsername || student.vtuNumber || "—"}
                      />
                      <InfoCard
                        label="Parent Portal Login"
                        value={student.portalUsername || student.vtuNumber || "—"}
                      />
                      <InfoCard label="Parent Password" value="Not Required" />
                      <InfoCard label="Account Role" value={student.role} />
                      <InfoCard label="Last Synced" value={formatDate(student.lastSyncedAt || student.last_synced_at) || "Never"} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "attendance" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Raw Attendance Records ({attendance.length})
                </h3>
              </div>
              <div className="p-0">
                {attendance.length === 0 ? (
                  <EmptyState title="No Attendance Found" message="No attendance records have been synchronized for this student yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500">Date</th>
                          <th className="px-6 py-4 font-bold text-slate-500">Subject</th>
                          <th className="px-6 py-4 font-bold text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendance.map((record, index) => (
                          <tr key={record._id || record.id || index} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{formatDate(record.date)}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">{record.subjectName || record.subjectCode}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                record.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "subjects" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState title="No Subjects Found" message="No enrolled subjects were found during the last synchronization." />
                </div>
              ) : (
                subjects.map((sub, index) => (
                  <div key={sub._id || index} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 line-clamp-2">{sub.name || sub.subjectName || sub.subject || "Unnamed Subject"}</h4>
                    </div>
                    {sub.code && (
                      <p className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tracking-wider text-slate-600">
                        {sub.code || sub.subjectCode || sub.subject_code}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "timetable" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Weekly Timetable</h3>
              </div>
              <div className="p-6">
                {timetable.length === 0 ? (
                  <EmptyState title="No Timetable Found" message="No timetable data has been synchronized yet." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {timetable.map((slot, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{slot.day || slot.dayName || slot.weekday || "Day"}</p>
                        <p className="mt-1 font-bold text-slate-900">{slot.subjectName || slot.subject || slot.name || slot.code || "Unknown Subject"}</p>
                        <p className="mt-2 text-xs font-medium text-slate-500">{slot.startTime || slot.start_time || "—"} - {slot.endTime || slot.end_time || "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// =====================================================
// UI COMPONENTS
// =====================================================

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-colors ${
        active
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({ label, value, highlight }) {
  const highlightStyles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    default: "bg-slate-50 text-slate-900 border-slate-100",
  };
  const style = highlightStyles[highlight] || highlightStyles.default;

  return (
    <div className={`rounded-xl border p-4 ${style}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-semibold">{value || "—"}</p>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}