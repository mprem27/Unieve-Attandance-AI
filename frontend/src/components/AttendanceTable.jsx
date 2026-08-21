import React from "react";
import { formatDate } from "../utils/dateUtils";

// =====================================================
// VALUE HELPERS
// =====================================================

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }
  return "";
};

// =====================================================
// DATE
// =====================================================

const getRecordDate = (record) => {
  return firstValue(
    record?.date,
    record?.attendanceDate,
    record?.attendance_date,
    record?.classDate,
    record?.class_date,
    record?.day,
    record?.createdAt
  );
};

// =====================================================
// SUBJECT NAME
// =====================================================

const getSubjectName = (record) => {
  return firstValue(
    record?.subjectName,
    record?.subject_name,
    record?.subject,
    record?.subjectTitle,
    record?.subject_title,
    record?.courseName,
    record?.course_name,
    record?.course,
    record?.subjectDetails?.name,
    record?.subject_details?.name,
    record?.subjectInfo?.name,
    record?.subject_info?.name,
    record?.subject?.name,
    "Unknown Subject"
  );
};

// =====================================================
// SUBJECT CODE
// =====================================================

const getSubjectCode = (record) => {
  return firstValue(
    record?.subjectCode,
    record?.subject_code,
    record?.code,
    record?.courseCode,
    record?.course_code,
    record?.course?.code,
    record?.subjectDetails?.code,
    record?.subject_details?.code,
    record?.subjectInfo?.code,
    record?.subject_info?.code,
    record?.subject?.code,
    "—"
  );
};

// =====================================================
// PREMIUM STATUS STYLES (Strict Brand Colors)
// =====================================================

const getRecordStatus = (record) => {
  return firstValue(
    record?.status,
    record?.attendanceStatus,
    record?.attendance_status,
    record?.attendance,
    record?.presentStatus,
    record?.present_status,
    record?.value,
    ""
  );
};

const getStatusStyle = (status) => {
  const normalized = String(status || "").trim().toUpperCase();

  if (
    normalized === "P" ||
    normalized === "PRESENT" ||
    normalized === "1" ||
    normalized === "TRUE" ||
    normalized.includes("PRESENT")
  ) {
    return {
      label: "Present",
      badgeClass: "border-[#10b981]/30 bg-[#ecfdf5] text-[#185e3a]", // Emerald border, Deep Green text
      dotClass: "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    };
  }

  if (
    normalized === "A" ||
    normalized === "ABSENT" ||
    normalized === "0" ||
    normalized === "FALSE" ||
    normalized.includes("ABSENT")
  ) {
    return {
      label: "Absent",
      badgeClass: "border-[#b91c1c]/20 bg-[#fef2f2] text-[#b91c1c]", // Vel Tech Red
      dotClass: "bg-[#b91c1c] shadow-[0_0_8px_rgba(185,28,28,0.4)]",
    };
  }

  return {
    label:
      status !== undefined && status !== null && String(status).trim() !== ""
        ? String(status)
        : "Unknown",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    dotClass: "bg-[#0ea5e9]", // Cyan default
  };
};

// =====================================================
// SOURCE
// =====================================================

const getRecordSource = (record) => {
  return firstValue(
    record?.source,
    record?.dataSource,
    record?.data_source,
    record?.origin,
    record?.provider,
    "college_portal"
  );
};

const getSourceLabel = (source) => {
  const normalized = String(source || "").trim().toLowerCase();

  if (
    normalized === "college_portal" ||
    normalized === "collegeportal" ||
    normalized === "parent_portal" ||
    normalized === "parentportal" ||
    normalized === "portal" ||
    normalized === "veltech" ||
    normalized === "veltech_portal" ||
    normalized === "ams"
  ) {
    return "Portal";
  }

  if (normalized === "mock") return "Mock";
  if (!source) return "Portal";

  return String(source);
};

// =====================================================
// RECORD KEY
// =====================================================

const getRecordKey = (record, index) => {
  return (
    record?.id ||
    record?._id ||
    record?.attendanceId ||
    record?.attendance_id ||
    [
      getRecordDate(record),
      getSubjectCode(record),
      getSubjectName(record),
      getRecordStatus(record),
      index,
    ].join("-")
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AttendanceTable({ attendance = [] }) {
  const records = Array.isArray(attendance) ? attendance : [];

  // ===================================================
  // EMPTY STATE
  // ===================================================
  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-[#1e3a8a]/20 bg-slate-50/50 p-10 text-center transition-colors hover:bg-slate-50 sm:p-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] shadow-inner shadow-[#0ea5e9]/20 sm:h-20 sm:w-20">
          <svg
            className="h-8 w-8 sm:h-10 sm:w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-[#1e3a8a] sm:text-2xl">
          No Attendance Records
        </h3>
        <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
          We haven't synced any attendance data for you yet. Records will appear here automatically once fetched from the portal.
        </p>
      </div>
    );
  }

  // ===================================================
  // TABLE & LIST VIEW
  // ===================================================
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
      
      {/* ANIMATION STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.4s ease-out forwards;
        }
      `}} />

      {/* TOP ACCENT LINE (Navy to Cyan) */}
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#1e3a8a] via-[#0ea5e9] to-[#1e3a8a]" />

      {/* HEADER */}
      <div className="border-b border-slate-100 bg-white p-6 sm:px-8 sm:py-7 pt-8">
        <div className="flex items-start justify-between gap-4 sm:items-center">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-[#1e3a8a]">
              Attendance Log
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              Comprehensive timeline of your class participation.
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-center rounded-full bg-[#1e3a8a]/5 px-3 py-1.5 border border-[#1e3a8a]/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] sm:text-xs">
              {records.length} <span className="hidden sm:inline">Records</span>
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          DESKTOP TABLE
      ================================================= */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Subject</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Code</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {records.map((record, index) => {
              const status = getStatusStyle(getRecordStatus(record));
              const source = getSourceLabel(getRecordSource(record));
              const subjectName = getSubjectName(record);
              const subjectCode = getSubjectCode(record);
              const recordDate = getRecordDate(record);

              return (
                <tr
                  key={getRecordKey(record, index)}
                  className="group transition-colors hover:bg-slate-50/60 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${Math.min(index * 30, 800)}ms` }}
                >
                  {/* DATE */}
                  <td className="whitespace-nowrap px-8 py-5 text-sm font-bold text-slate-600">
                    {recordDate ? formatDate(recordDate) : "—"}
                  </td>

                  {/* SUBJECT */}
                  <td className="px-8 py-5">
                    <p className="font-black text-[#1e3a8a] transition-colors group-hover:text-[#0ea5e9]">
                      {subjectName}
                    </p>
                  </td>

                  {/* CODE */}
                  <td className="whitespace-nowrap px-8 py-5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    {subjectCode}
                  </td>

                  {/* STATUS */}
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${status.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </td>

                  {/* SOURCE */}
                  <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                      {source}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =================================================
          MOBILE LIST CARDS
      ================================================= */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50/50">
        {records.map((record, index) => {
          const status = getStatusStyle(getRecordStatus(record));
          const source = getSourceLabel(getRecordSource(record));
          const subjectName = getSubjectName(record);
          const subjectCode = getSubjectCode(record);
          const recordDate = getRecordDate(record);

          return (
            <div
              key={getRecordKey(record, index)}
              className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm opacity-0 animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 40, 800)}ms` }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-black leading-snug text-[#1e3a8a]">
                    {subjectName}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {subjectCode || "N/A"}
                  </p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${status.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Date
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-slate-700">
                    {recordDate ? formatDate(recordDate) : "—"}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex min-w-0 flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Source
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-[#0ea5e9]">
                    {source}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-100 bg-white px-6 py-4 sm:px-8 sm:py-5 flex justify-center sm:justify-start">
        <p className="text-xs font-medium text-slate-500">
          Showing <span className="font-black text-[#1e3a8a]">{records.length}</span> attendance records.
        </p>
      </div>
    </div>
  );
}