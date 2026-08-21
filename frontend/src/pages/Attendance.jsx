import React, { useMemo, useState } from "react";

import useAttendance from "../hooks/useAttendance";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import AttendanceTable from "../components/AttendanceTable";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceChart from "../components/AttendanceChart";

// =====================================================
// NUMBER HELPER
// =====================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

// =====================================================
// NORMALIZE ATTENDANCE STATUS
// =====================================================

const normalizeStatus = (record) => {
  const rawStatus = String(
    record?.status ??
    record?.attendanceStatus ??
    record?.attendance ??
    record?.value ??
    ""
  ).trim().toLowerCase();

  if (rawStatus === "p" || rawStatus === "present" || rawStatus === "1" || rawStatus === "true") return "present";
  if (rawStatus === "a" || rawStatus === "absent" || rawStatus === "0" || rawStatus === "false") return "absent";
  if (rawStatus.includes("present")) return "present";
  if (rawStatus.includes("absent")) return "absent";

  return "unknown";
};

// =====================================================
// GET SUBJECT DETAILS
// =====================================================

const getSubjectName = (record) => {
  return (
    record?.subjectName || record?.subject_name || record?.subject?.name ||
    record?.courseName || record?.course_name || record?.name || "Unknown Subject"
  );
};

const getSubjectCode = (record) => {
  return (
    record?.subjectCode || record?.subject_code || record?.subject?.code ||
    record?.courseCode || record?.course_code || record?.code || ""
  );
};

const getSubjectId = (record) => {
  return (
    record?.subjectId || record?.subject_id || record?.subject?.id ||
    record?.courseId || record?.course_id || ""
  );
};

const getPercentage = (subject) => {
  if (subject?.percentage !== undefined && subject?.percentage !== null && subject?.percentage !== "") {
    const percentage = Number(subject.percentage);
    if (Number.isFinite(percentage)) {
      return Math.max(0, Math.min(100, percentage));
    }
  }

  const present = toNumber(subject?.present);
  const total = toNumber(subject?.total);

  if (total <= 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
};

// =====================================================
// BALANCED STATUS CLASSES (Medium Saturation)
// =====================================================

const getStatusClasses = (percentage) => {
  if (percentage >= 75) {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-500",
    };
  }

  if (percentage >= 65) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      dot: "bg-amber-500",
    };
  }

  return {
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  };
};

// =====================================================
// BUILD SUMMARY FROM ATTENDANCE
// =====================================================

const buildSummaryFromAttendance = (attendance) => {
  if (!Array.isArray(attendance)) return [];
  const map = new Map();

  attendance.forEach((record) => {
    if (!record || typeof record !== "object") return;

    const subjectName = getSubjectName(record);
    const subjectCode = getSubjectCode(record);
    const subjectId = getSubjectId(record);
    const key = subjectId || subjectCode || subjectName;

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        subjectId: subjectId || null,
        subjectName: subjectName || "Unknown Subject",
        subjectCode: subjectCode || "",
        present: 0,
        absent: 0,
        total: 0,
        percentage: 0,
      });
    }

    const subject = map.get(key);
    const status = normalizeStatus(record);

    if (status === "present") {
      subject.present += 1;
      subject.total += 1;
    } else if (status === "absent") {
      subject.absent += 1;
      subject.total += 1;
    }
  });

  return Array.from(map.values()).map((subject) => ({
    ...subject,
    percentage: subject.total > 0 ? Number(((subject.present / subject.total) * 100).toFixed(2)) : 0,
  }));
};

// =====================================================
// NORMALIZE BACKEND SUMMARY
// =====================================================

const normalizeSummary = (summary) => {
  if (!Array.isArray(summary)) return [];

  return summary
    .filter((subject) => subject && typeof subject === "object")
    .map((subject) => {
      const present = toNumber(subject.present);
      const absent = toNumber(subject.absent);
      const backendTotal = toNumber(subject.total);
      const calculatedTotal = present + absent;
      const total = backendTotal > 0 ? backendTotal : calculatedTotal;

      const percentage =
        subject.percentage !== undefined && subject.percentage !== null && subject.percentage !== ""
          ? toNumber(subject.percentage)
          : total > 0
          ? Number(((present / total) * 100).toFixed(2))
          : 0;

      return {
        ...subject,
        subjectId: subject.subjectId || subject.subject_id || subject.subject?.id || null,
        subjectName: subject.subjectName || subject.subject_name || subject.subject?.name || subject.courseName || subject.name || "Unknown Subject",
        subjectCode: subject.subjectCode || subject.subject_code || subject.subject?.code || subject.courseCode || subject.code || "",
        present,
        absent,
        total,
        percentage,
      };
    });
};

// =====================================================
// MAIN ATTENDANCE PAGE
// =====================================================

export default function Attendance() {
  const {
    attendance = [],
    summary = [],
    loading,
    error,
    refresh,
  } = useAttendance();

  const [view, setView] = useState("summary");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter states for the Records view
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'present', 'absent'
  const [selectedSubject, setSelectedSubject] = useState("all");

  const displaySummary = useMemo(() => {
    const backendSummary = normalizeSummary(summary);
    if (backendSummary.length > 0) return backendSummary;
    return buildSummaryFromAttendance(attendance);
  }, [summary, attendance]);

  // Filtered attendance records based on filters
  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const status = normalizeStatus(record);
      const subName = getSubjectName(record);

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSubj = selectedSubject === "all" || subName === selectedSubject;

      return matchesStatus && matchesSubj;
    });
  }, [attendance, statusFilter, selectedSubject]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (refreshError) {
      console.error("Attendance refresh failed:", refreshError);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (error && attendance.length === 0 && displaySummary.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <ErrorMessage message={error} onRetry={handleRefresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f8fafc] p-4 sm:p-6 lg:p-8 xl:p-10">
      
      {/* INJECT ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeInSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fade-slide-up">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </span>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Analytics & Logs
            </p>
          </div>
          <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Attendance Details
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-600 sm:text-base">
            Track your class participation, summaries, and dated histories.
          </p>
        </div>

        <div className="flex w-full flex-col-reverse items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          
          {/* SEGMENTED VIEW SWITCHER */}
          <div className="flex w-full rounded-2xl bg-slate-200/70 p-1.5 shadow-inner sm:w-auto">
            <button
              type="button"
              onClick={() => setView("summary")}
              className={`flex-1 rounded-xl px-5 py-2 text-xs font-bold transition-all sm:flex-none ${
                view === "summary"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Summary View
            </button>
            <button
              type="button"
              onClick={() => setView("records")}
              className={`flex-1 rounded-xl px-5 py-2 text-xs font-bold transition-all sm:flex-none ${
                view === "records"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Records View
            </button>
          </div>

          {/* REFRESH BUTTON */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-70 sm:w-auto"
          >
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {isRefreshing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (attendance.length > 0 || displaySummary.length > 0) && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-sm animate-fade-slide-up">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY VIEW
      ================================================= */}
      {view === "summary" && (
        <div className="space-y-6 sm:space-y-8 animate-fade-slide-up">
          
          <div className="flex flex-col gap-6 sm:gap-8 2xl:grid 2xl:grid-cols-3">
            <div className="w-full 2xl:col-span-2">
              {displaySummary.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                  <p className="text-lg font-bold text-slate-900">No Subject Data Available</p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Attendance records have not produced subject-wise summaries yet. Try forcing a sync.
                  </p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isRefreshing ? "Syncing..." : "Sync Now"}
                  </button>
                </div>
              ) : (
                <AttendanceSummary summary={displaySummary} />
              )}
            </div>

            <div className="h-full w-full 2xl:col-span-1">
              <AttendanceChart attendance={attendance} />
            </div>
          </div>

          {/* SUBJECT LEDGER TABLE */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 mt-8">
            <div className="border-b border-slate-100 p-6 sm:px-8 sm:py-6">
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Subject Ledger
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Detailed counts of present and absent classes per module.
              </p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Subject</th>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Code</th>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Present</th>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Absent</th>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Total</th>
                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displaySummary.map((subject, index) => {
                    const percentage = getPercentage(subject);
                    const status = getStatusClasses(percentage);

                    return (
                      <tr key={subject.subjectId || subject.subjectCode || index} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-8 py-4 font-bold text-slate-900">{subject.subjectName || "Unknown Subject"}</td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">{subject.subjectCode || "—"}</td>
                        <td className="px-8 py-4 text-sm font-black text-emerald-700">{toNumber(subject.present)}</td>
                        <td className="px-8 py-4 text-sm font-black text-rose-700">{toNumber(subject.absent)}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-700">{toNumber(subject.total, toNumber(subject.present) + toNumber(subject.absent))}</td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {percentage.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Summary List */}
            <div className="flex flex-col gap-3 p-4 bg-slate-50/50 lg:hidden">
              {displaySummary.map((subject, index) => {
                const percentage = getPercentage(subject);
                const status = getStatusClasses(percentage);

                return (
                  <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{subject.subjectName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{subject.subjectCode || "N/A"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase ${status.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          RECORDS VIEW (WITH ADVANCED FILTERS)
      ================================================= */}
      {view === "records" && (
        <div className="space-y-6 animate-fade-slide-up">
          
          {/* FILTER TOOLBAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                {['all', 'present', 'absent'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Subject Filter Dropdown */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="all">All Subjects</option>
                {displaySummary.map((sub) => (
                  <option key={sub.subjectName} value={sub.subjectName}>
                    {sub.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs font-bold text-slate-500 text-center sm:text-right">
              Showing <span className="text-slate-900">{filteredAttendance.length}</span> entries
            </p>
          </div>

          {/* TABLE DISPLAY */}
          {filteredAttendance.length > 0 ? (
            <AttendanceTable attendance={filteredAttendance} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-black text-slate-900">No Matching Records</p>
              <p className="mt-1 text-xs text-slate-500">Try changing your filters or refresh data.</p>
              <button
                onClick={() => { setStatusFilter('all'); setSelectedSubject('all'); }}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}