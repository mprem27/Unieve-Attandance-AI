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
// STATUS
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
  const normalized = String(
    status || ""
  )
    .trim()
    .toUpperCase();

  if (
    normalized === "P" ||
    normalized === "PRESENT" ||
    normalized === "1" ||
    normalized === "TRUE"
  ) {
    return {
      label: "Present",
      badgeClass:
        "border-emerald-200/60 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50",
      dotClass:
        "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    };
  }

  if (
    normalized === "A" ||
    normalized === "ABSENT" ||
    normalized === "0" ||
    normalized === "FALSE"
  ) {
    return {
      label: "Absent",
      badgeClass:
        "border-rose-200/60 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/50",
      dotClass:
        "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
    };
  }

  if (
    normalized.includes("PRESENT")
  ) {
    return {
      label: "Present",
      badgeClass:
        "border-emerald-200/60 bg-emerald-50 text-emerald-700 shadow-sm",
      dotClass: "bg-emerald-500",
    };
  }

  if (
    normalized.includes("ABSENT")
  ) {
    return {
      label: "Absent",
      badgeClass:
        "border-rose-200/60 bg-rose-50 text-rose-700 shadow-sm",
      dotClass: "bg-rose-500",
    };
  }

  return {
    label:
      status !== undefined &&
      status !== null &&
      String(status).trim() !== ""
        ? String(status)
        : "Unknown",
    badgeClass:
      "border-slate-200/60 bg-slate-50 text-slate-600 shadow-sm",
    dotClass: "bg-slate-400",
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
  const normalized = String(
    source || ""
  )
    .trim()
    .toLowerCase();

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

  if (normalized === "mock") {
    return "Mock";
  }

  if (!source) {
    return "Portal";
  }

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
// COMPONENT
// =====================================================

export default function AttendanceTable({
  attendance = [],
}) {
  const records = Array.isArray(attendance)
    ? attendance
    : [];

  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-colors hover:bg-slate-50 sm:rounded-3xl sm:p-12">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-2xl">
          <svg
            className="h-6 w-6 text-slate-400 sm:h-8 sm:w-8"
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

        <h3 className="text-base font-bold text-slate-900 sm:text-lg">
          No Attendance Records
        </h3>

        <p className="mt-1.5 max-w-[280px] text-xs text-slate-500 sm:mt-2 sm:max-w-sm sm:text-sm">
          We haven't synced any attendance data
          for you yet. Records will appear here
          automatically once fetched.
        </p>
      </div>
    );
  }

  // ===================================================
  // TABLE
  // ===================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

      {/* HEADER */}

      <div className="border-b border-slate-100 bg-white p-5 sm:px-8 sm:py-6">
        <div className="flex items-start justify-between gap-4 sm:items-center">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Attendance Log
            </h2>

            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:mt-1 sm:text-sm">
              Attendance synchronized from the
              college parent portal
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 sm:px-3 sm:py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:text-xs">
              {records.length}
              <span className="hidden sm:inline">
                {" "}
                Records
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          DESKTOP TABLE
      ================================================= */}

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:px-8">
                Date
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:px-8">
                Subject
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:px-8">
                Code
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:px-8">
                Status
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:px-8">
                Source
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {records.map(
              (record, index) => {
                const rawStatus =
                  getRecordStatus(record);

                const status =
                  getStatusStyle(
                    rawStatus
                  );

                const source =
                  getRecordSource(
                    record
                  );

                const subjectName =
                  getSubjectName(
                    record
                  );

                const subjectCode =
                  getSubjectCode(
                    record
                  );

                const recordDate =
                  getRecordDate(
                    record
                  );

                return (
                  <tr
                    key={getRecordKey(
                      record,
                      index
                    )}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-700 lg:px-8 lg:py-5">
                      {recordDate
                        ? formatDate(
                            recordDate
                          )
                        : "—"}
                    </td>

                    {/* SUBJECT */}

                    <td className="px-6 py-4 lg:px-8 lg:py-5">
                      <p className="font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                        {subjectName}
                      </p>
                    </td>

                    {/* CODE */}

                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-400 lg:px-8 lg:py-5 lg:text-sm">
                      {subjectCode}
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4 lg:px-8 lg:py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide lg:text-xs ${status.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                        />

                        {status.label}
                      </span>
                    </td>

                    {/* SOURCE */}

                    <td className="px-6 py-4 text-xs font-medium text-slate-500 lg:px-8 lg:py-5 lg:text-sm">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                          />
                        </svg>

                        {getSourceLabel(
                          source
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* =================================================
          MOBILE
      ================================================= */}

      <div className="divide-y divide-slate-100 md:hidden">
        {records.map(
          (record, index) => {
            const rawStatus =
              getRecordStatus(
                record
              );

            const status =
              getStatusStyle(
                rawStatus
              );

            const source =
              getSourceLabel(
                getRecordSource(
                  record
                )
              );

            const subjectName =
              getSubjectName(
                record
              );

            const subjectCode =
              getSubjectCode(
                record
              );

            const recordDate =
              getRecordDate(
                record
              );

            return (
              <div
                key={getRecordKey(
                  record,
                  index
                )}
                className="bg-white p-4 transition-colors hover:bg-slate-50/50 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-snug text-slate-900 sm:text-base">
                      {subjectName}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:mt-1 sm:text-xs">
                      {subjectCode}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-[10px] ${status.badgeClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                    />

                    {status.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:mt-5 sm:p-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                      Date
                    </span>

                    <span className="mt-0.5 text-xs font-semibold text-slate-700 sm:text-sm">
                      {recordDate
                        ? formatDate(
                            recordDate
                          )
                        : "—"}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-200 sm:h-8" />

                  <div className="flex min-w-0 flex-col text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                      Source
                    </span>

                    <span className="mt-0.5 text-xs font-semibold text-slate-700 sm:text-sm">
                      {source}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* FOOTER */}

      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-8 sm:py-4">
        <p className="text-[11px] font-medium text-slate-500 sm:text-sm">
          Showing{" "}
          <span className="font-bold text-slate-900">
            {records.length}
          </span>{" "}
          attendance records
        </p>
      </div>
    </div>
  );
}