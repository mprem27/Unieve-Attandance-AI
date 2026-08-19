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

  return Number.isFinite(number)
    ? number
    : fallback;
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
  )
    .trim()
    .toLowerCase();

  if (
    rawStatus === "p" ||
    rawStatus === "present" ||
    rawStatus === "1" ||
    rawStatus === "true"
  ) {
    return "present";
  }

  if (
    rawStatus === "a" ||
    rawStatus === "absent" ||
    rawStatus === "0" ||
    rawStatus === "false"
  ) {
    return "absent";
  }

  if (
    rawStatus.includes("present")
  ) {
    return "present";
  }

  if (
    rawStatus.includes("absent")
  ) {
    return "absent";
  }

  return "unknown";
};

// =====================================================
// GET SUBJECT NAME
// =====================================================

const getSubjectName = (record) => {
  return (
    record?.subjectName ||
    record?.subject_name ||
    record?.subject?.name ||
    record?.courseName ||
    record?.course_name ||
    record?.name ||
    "Unknown Subject"
  );
};

// =====================================================
// GET SUBJECT CODE
// =====================================================

const getSubjectCode = (record) => {
  return (
    record?.subjectCode ||
    record?.subject_code ||
    record?.subject?.code ||
    record?.courseCode ||
    record?.course_code ||
    record?.code ||
    ""
  );
};

// =====================================================
// GET SUBJECT ID
// =====================================================

const getSubjectId = (record) => {
  return (
    record?.subjectId ||
    record?.subject_id ||
    record?.subject?.id ||
    record?.courseId ||
    record?.course_id ||
    ""
  );
};

// =====================================================
// GET PERCENTAGE
// =====================================================

const getPercentage = (subject) => {
  if (
    subject?.percentage !== undefined &&
    subject?.percentage !== null &&
    subject?.percentage !== ""
  ) {
    const percentage =
      Number(subject.percentage);

    if (Number.isFinite(percentage)) {
      return Math.max(
        0,
        Math.min(100, percentage)
      );
    }
  }

  const present = toNumber(
    subject?.present
  );

  const total = toNumber(
    subject?.total
  );

  if (total <= 0) {
    return 0;
  }

  return Number(
    ((present / total) * 100).toFixed(2)
  );
};

// =====================================================
// STATUS CLASSES
// =====================================================

const getStatusClasses = (percentage) => {
  if (percentage >= 75) {
    return {
      badge:
        "border-emerald-200/60 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (percentage >= 65) {
    return {
      badge:
        "border-amber-200/60 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    badge:
      "border-rose-200/60 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  };
};

// =====================================================
// BUILD SUMMARY FROM ATTENDANCE
// =====================================================

const buildSummaryFromAttendance = (
  attendance
) => {
  if (!Array.isArray(attendance)) {
    return [];
  }

  const map = new Map();

  attendance.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const subjectName =
      getSubjectName(record);

    const subjectCode =
      getSubjectCode(record);

    const subjectId =
      getSubjectId(record);

    const key =
      subjectId ||
      subjectCode ||
      subjectName;

    if (!key) {
      return;
    }

    if (!map.has(key)) {
      map.set(key, {
        subjectId:
          subjectId || null,

        subjectName:
          subjectName || "Unknown Subject",

        subjectCode:
          subjectCode || "",

        present: 0,
        absent: 0,
        total: 0,
        percentage: 0,
      });
    }

    const subject =
      map.get(key);

    const status =
      normalizeStatus(record);

    if (status === "present") {
      subject.present += 1;
      subject.total += 1;
    } else if (
      status === "absent"
    ) {
      subject.absent += 1;
      subject.total += 1;
    }
  });

  return Array.from(
    map.values()
  ).map((subject) => ({
    ...subject,

    percentage:
      subject.total > 0
        ? Number(
            (
              (subject.present /
                subject.total) *
              100
            ).toFixed(2)
          )
        : 0,
  }));
};

// =====================================================
// NORMALIZE BACKEND SUMMARY
// =====================================================

const normalizeSummary = (summary) => {
  if (!Array.isArray(summary)) {
    return [];
  }

  return summary
    .filter(
      (subject) =>
        subject &&
        typeof subject === "object"
    )
    .map((subject) => {
      const present =
        toNumber(subject.present);

      const absent =
        toNumber(subject.absent);

      const backendTotal =
        toNumber(subject.total);

      const calculatedTotal =
        present + absent;

      const total =
        backendTotal > 0
          ? backendTotal
          : calculatedTotal;

      const percentage =
        subject.percentage !==
          undefined &&
        subject.percentage !==
          null &&
        subject.percentage !== ""
          ? toNumber(
              subject.percentage
            )
          : total > 0
          ? Number(
              (
                (present / total) *
                100
              ).toFixed(2)
            )
          : 0;

      return {
        ...subject,

        subjectId:
          subject.subjectId ||
          subject.subject_id ||
          subject.subject?.id ||
          null,

        subjectName:
          subject.subjectName ||
          subject.subject_name ||
          subject.subject?.name ||
          subject.courseName ||
          subject.name ||
          "Unknown Subject",

        subjectCode:
          subject.subjectCode ||
          subject.subject_code ||
          subject.subject?.code ||
          subject.courseCode ||
          subject.code ||
          "",

        present,
        absent,
        total,

        percentage,
      };
    });
};

// =====================================================
// ATTENDANCE PAGE
// =====================================================

export default function Attendance() {
  const {
    attendance = [],
    summary = [],
    loading,
    error,
    refresh,
  } = useAttendance();

  const [view, setView] =
    useState("summary");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const displaySummary = useMemo(() => {
    const backendSummary =
      normalizeSummary(summary);

    if (
      backendSummary.length > 0
    ) {
      return backendSummary;
    }

    return buildSummaryFromAttendance(
      attendance
    );
  }, [summary, attendance]);

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await refresh();
    } catch (refreshError) {
      console.error(
        "Attendance refresh failed:",
        refreshError
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (
    error &&
    attendance.length === 0 &&
    displaySummary.length === 0
  ) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <ErrorMessage
            message={error}
            onRetry={handleRefresh}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                />
              </svg>
            </span>

            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Analytics
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Attendance Details
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
            View your attendance records and
            subject-wise performance.
          </p>
        </div>

        <div className="flex w-full flex-col-reverse items-center gap-4 sm:w-auto sm:flex-row sm:gap-5">
          <div className="flex w-full rounded-xl bg-slate-200/60 p-1 shadow-inner sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setView("summary")
              }
              className={`flex-1 rounded-lg px-5 py-2 text-sm font-bold transition-all duration-300 sm:flex-none ${
                view === "summary"
                  ? "bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Summary
            </button>

            <button
              type="button"
              onClick={() =>
                setView("records")
              }
              className={`flex-1 rounded-lg px-5 py-2 text-sm font-bold transition-all duration-300 sm:flex-none ${
                view === "records"
                  ? "bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Records
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            <svg
              className={`h-4 w-4 text-slate-400 transition-all group-hover:text-indigo-600 ${
                isRefreshing
                  ? "animate-spin text-indigo-600"
                  : ""
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

            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {error &&
        (attendance.length > 0 ||
          displaySummary.length > 0) && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {error}
          </div>
        )}

      {view === "summary" && (
        <div className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8">
          <div className="flex flex-col gap-6 sm:gap-8 2xl:grid 2xl:grid-cols-3">
            <div className="w-full 2xl:col-span-2">
              {displaySummary.length ===
              0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center sm:rounded-3xl sm:p-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                    <svg
                      className="h-8 w-8 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>

                  <p className="text-lg font-bold text-slate-900">
                    No Subject Data Available
                  </p>

                  <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                    Attendance records have not
                    produced subject-wise data yet.
                    Try refreshing after the Parent
                    Portal synchronization completes.
                  </p>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isRefreshing
                      ? "Refreshing..."
                      : "Refresh Attendance"}
                  </button>
                </div>
              ) : (
                <AttendanceSummary
                  summary={displaySummary}
                />
              )}
            </div>

            <div className="h-full w-full 2xl:col-span-1">
              <AttendanceChart
                summary={displaySummary}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">
            <div className="border-b border-slate-100 p-5 sm:px-8 sm:py-6">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Subject Breakdown
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Detailed counts of total, present,
                and absent classes.
              </p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Subject
                    </th>

                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Code
                    </th>

                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Present
                    </th>

                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Absent
                    </th>

                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Percentage
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {displaySummary.map(
                    (
                      subject,
                      index
                    ) => {
                      const percentage =
                        getPercentage(
                          subject
                        );

                      const status =
                        getStatusClasses(
                          percentage
                        );

                      return (
                        <tr
                          key={
                            subject.subjectId ||
                            subject.subjectCode ||
                            subject.subjectName ||
                            index
                          }
                          className="group transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                              {subject.subjectName ||
                                "Unknown Subject"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {subject.subjectCode ||
                              "—"}
                          </td>

                          <td className="px-8 py-5 text-sm font-black text-emerald-600">
                            {toNumber(
                              subject.present
                            )}
                          </td>

                          <td className="px-8 py-5 text-sm font-black text-rose-600">
                            {toNumber(
                              subject.absent
                            )}
                          </td>

                          <td className="px-8 py-5 text-sm font-bold text-slate-600">
                            {toNumber(
                              subject.total,
                              toNumber(
                                subject.present
                              ) +
                                toNumber(
                                  subject.absent
                                )
                            )}
                          </td>

                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${status.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                              />

                              {percentage.toFixed(
                                2
                              )}
                              %
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {displaySummary.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-8 py-10 text-center text-sm font-medium text-slate-500"
                      >
                        No subject data
                        available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {displaySummary.map(
                (
                  subject,
                  index
                ) => {
                  const percentage =
                    getPercentage(
                      subject
                    );

                  const status =
                    getStatusClasses(
                      percentage
                    );

                  return (
                    <div
                      key={
                        subject.subjectId ||
                        subject.subjectCode ||
                        subject.subjectName ||
                        index
                      }
                      className="bg-white p-5 transition-colors hover:bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold leading-snug text-slate-900">
                            {subject.subjectName ||
                              "Unknown Subject"}
                          </p>

                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {subject.subjectCode ||
                              "NO CODE"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />

                          {percentage.toFixed(
                            2
                          )}
                          %
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total
                          </span>

                          <span className="mt-0.5 text-sm font-black text-slate-700">
                            {toNumber(
                              subject.total,
                              toNumber(
                                subject.present
                              ) +
                                toNumber(
                                  subject.absent
                                )
                            )}
                          </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Present
                          </span>

                          <span className="mt-0.5 text-sm font-black text-emerald-600">
                            {toNumber(
                              subject.present
                            )}
                          </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Absent
                          </span>

                          <span className="mt-0.5 text-sm font-black text-rose-600">
                            {toNumber(
                              subject.absent
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {displaySummary.length ===
                0 && (
                <div className="px-5 py-8 text-center text-sm font-medium text-slate-500">
                  No subject data
                  available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === "records" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {attendance.length > 0 ? (
            <AttendanceTable
              attendance={attendance}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-bold text-slate-900">
                No Attendance Records
              </p>

              <p className="mt-2 text-sm font-medium text-slate-500">
                No attendance records are currently
                available for this student.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}