import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import useAttendance from "../hooks/useAttendance";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate } from "../utils/dateUtils";

// =====================================================
// ATTENDANCE THRESHOLD
// =====================================================

const MIN_ATTENDANCE_PERCENTAGE = 75;

// =====================================================
// THEME
// =====================================================

const getTheme = (percentage) => {
  if (percentage >= 75) {
    return {
      label: "Good Standing",
      textClass: "text-emerald-700",
      bgLight: "bg-emerald-50/80",
      border: "border-emerald-200/80",
      gradientText: "from-emerald-600 to-teal-700",
      barGradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/10",
    };
  }

  if (percentage >= 65) {
    return {
      label: "Warning Zone",
      textClass: "text-amber-700",
      bgLight: "bg-amber-50/80",
      border: "border-amber-200/80",
      gradientText: "from-amber-600 to-orange-700",
      barGradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/10",
    };
  }

  return {
    label: "Critical Shortage",
    textClass: "text-rose-700",
    bgLight: "bg-rose-50/80",
    border: "border-rose-200/80",
    gradientText: "from-rose-600 to-red-800",
    barGradient: "from-rose-600 to-red-700",
    shadow: "shadow-rose-500/10",
  };
};

// =====================================================
// RECORD STATUS
// =====================================================

const getStatusStyle = (status) => {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "PRESENT") {
    return {
      label: "Present",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm",
      dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    };
  }

  if (normalized === "ABSENT") {
    return {
      label: "Absent",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-800 shadow-sm",
      dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    };
  }

  return {
    label: status || "Unknown",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700 shadow-sm",
    dotClass: "bg-slate-400",
  };
};

// =====================================================
// NUMBER HELPER
// =====================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

// =====================================================
// RECORD STATUS HELPERS
// =====================================================

const isPresent = (status) =>
  String(status || "").trim().toUpperCase() === "PRESENT";

const isAbsent = (status) =>
  String(status || "").trim().toUpperCase() === "ABSENT";

// =====================================================
// COMPONENT
// =====================================================

export default function SubjectDetails() {
  const { subjectId } = useParams();
  const { getSubjectAttendance } = useAttendance();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // LOAD SUBJECT
  // ===================================================

  const loadSubject = useCallback(async () => {
    if (!subjectId) {
      setError("Subject ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getSubjectAttendance(subjectId);
      setData(result || null);
    } catch (err) {
      console.error("Subject attendance loading failed:", err);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load subject attendance.";

      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [subjectId, getSubjectAttendance]);

  useEffect(() => {
    loadSubject();
  }, [loadSubject]);

  if (loading) {
    return <Loading fullPage />;
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <ErrorMessage message={error} onRetry={loadSubject} />
        </div>
      </div>
    );
  }

  const subject =
    data?.subject && typeof data.subject === "object"
      ? data.subject
      : data || {};

  const rawRecords =
    data?.records ??
    data?.attendance ??
    subject?.records ??
    subject?.attendance ??
    [];

  const records = Array.isArray(rawRecords) ? rawRecords : [];

  const calculatedPresent = records.filter((record) => isPresent(record?.status)).length;
  const calculatedAbsent = records.filter((record) => isAbsent(record?.status)).length;

  const present = toNumber(
    data?.present ?? data?.totalPresent ?? subject?.present ?? subject?.totalPresent ?? calculatedPresent
  );

  const absent = toNumber(
    data?.absent ?? data?.totalAbsent ?? subject?.absent ?? subject?.totalAbsent ?? calculatedAbsent
  );

  const calculatedTotal = present + absent;
  const total = toNumber(
    data?.total ?? data?.totalClasses ?? subject?.total ?? subject?.totalClasses ?? calculatedTotal
  );

  let percentage;
  if (data?.percentage !== undefined && data?.percentage !== null) {
    percentage = toNumber(data.percentage);
  } else if (subject?.percentage !== undefined && subject?.percentage !== null) {
    percentage = toNumber(subject.percentage);
  } else if (total > 0) {
    percentage = (present / total) * 100;
  } else {
    percentage = 0;
  }

  percentage = Math.min(Math.max(percentage, 0), 100);
  const percentageText = percentage.toFixed(2);
  const theme = getTheme(percentage);
  const eligible = percentage >= MIN_ATTENDANCE_PERCENTAGE;

  const subjectName =
    subject?.subjectName || subject?.name || data?.subjectName || data?.name || "Subject Overview";

  const subjectCode =
    subject?.subjectCode || subject?.code || data?.subjectCode || data?.code || "NO-CODE";

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

      <div className="mx-auto max-w-[1400px] animate-fade-slide-up">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}
        <div className="mb-8">
          <Link
            to="/attendance"
            className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#1e3a8a] sm:text-sm"
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
            Back to Attendance
          </Link>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0ea5e9]/10 text-[#0ea5e9] shadow-sm sm:h-16 sm:w-16 sm:rounded-3xl">
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-snug tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {subjectName}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md bg-slate-200/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 sm:text-xs">
                  {subjectCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* STAT CARDS */}
        {/* ================================================= */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          
          {/* Percentage */}
          <div className={`group relative col-span-2 overflow-hidden rounded-3xl border ${theme.border} ${theme.bgLight} p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md lg:col-span-1 ${theme.shadow}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/85 sm:text-xs">
              Current Attendance
            </p>
            <p className={`mt-2 bg-gradient-to-br ${theme.gradientText} bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl`}>
              {percentageText}%
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${theme.barGradient}`} />
              <p className={`text-xs font-bold sm:text-sm ${theme.textClass}`}>
                {theme.label}
              </p>
            </div>
          </div>

          {/* Present */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-xs">Total Present</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#10b981] sm:text-4xl">{present}</p>
            <p className="mt-2 text-[10px] font-semibold text-slate-500 sm:text-xs">Classes attended</p>
          </div>

          {/* Absent */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-xs">Total Absent</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#b91c1c] sm:text-4xl">{absent}</p>
            <p className="mt-2 text-[10px] font-semibold text-slate-500 sm:text-xs">Classes missed</p>
          </div>

          {/* Total */}
          <div className="col-span-2 rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-6 lg:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-xs">Total Classes</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#1e3a8a] sm:text-4xl">{total}</p>
            <p className="mt-2 text-[10px] font-semibold text-slate-500 sm:text-xs">Conducted to date</p>
          </div>
        </div>

        {/* ================================================= */}
        {/* REQUIREMENT TRACKER */}
        {/* ================================================= */}
        <div className="mb-8 rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 sm:text-base">
                Requirement Tracker
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                {MIN_ATTENDANCE_PERCENTAGE}% minimum required threshold
              </p>
            </div>
            <span className={`w-fit rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider sm:text-xs ${
              eligible ? "bg-[#ecfdf5] text-[#185e3a] border border-[#10b981]/20" : "bg-[#fef2f2] text-[#b91c1c] border border-[#b91c1c]/20"
            }`}>
              {eligible ? "Status: Eligible" : "Status: Deficit"}
            </span>
          </div>

          <div className="relative mt-8">
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner sm:h-4">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            {/* 75% Marker */}
            <div className="absolute bottom-[-8px] left-[75%] top-[-8px] w-[2.5px] bg-slate-400 sm:bottom-[-10px] sm:top-[-10px]">
              <div className="absolute left-1/2 top-[-26px] -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm sm:top-[-28px] sm:text-xs">
                75%
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* ================================================= */}
        {/* DAILY RECORDS */}
        {/* ================================================= */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
          <div className="border-b border-slate-100 bg-white p-6 sm:px-8 sm:py-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#1e3a8a] via-[#0ea5e9] to-[#1e3a8a]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-[#1e3a8a]">
                  Daily Records Log
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  Attendance logs received from the college portal for this module.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-[#1e3a8a]/5 border border-[#1e3a8a]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] sm:text-xs">
                {records.length} Records
              </div>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center sm:p-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-900/5">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-900">No Daily Records</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                No individual attendance entries were found for this subject yet.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                      <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record, index) => {
                      const status = getStatusStyle(record?.status);
                      const key = record?.id || record?._id || `${record?.date || "record"}-${index}`;

                      return (
                        <tr key={key} className="group transition-colors hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-8 py-5 text-sm font-bold text-slate-700">
                            {formatDate(record?.date)}
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-black text-[#1e3a8a] transition-colors group-hover:text-[#0ea5e9]">
                              {record?.subjectName || subjectName}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {record?.subjectCode || subjectCode}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${status.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {(!record?.source || record.source === "college_portal") ? "Portal" : record.source}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-100 md:hidden bg-slate-50/50 p-4 flex flex-col gap-3">
                {records.map((record, index) => {
                  const status = getStatusStyle(record?.status);
                  const key = record?.id || record?._id || `${record?.date || "record"}-${index}`;

                  return (
                    <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[15px] font-black text-[#1e3a8a]">{record?.subjectName || subjectName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{record?.subjectCode || subjectCode}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${status.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</span>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDate(record?.date)}</p>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Source</span>
                          <p className="text-xs font-bold text-[#0ea5e9] mt-0.5">{(!record?.source || record.source === "college_portal") ? "Portal" : record.source}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-white px-6 py-4 sm:px-8 flex justify-between items-center">
                <p className="text-xs font-medium text-slate-500">
                  Showing <span className="font-black text-[#1e3a8a]">{records.length}</span> records for this module
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}