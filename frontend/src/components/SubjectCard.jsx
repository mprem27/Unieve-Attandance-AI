import React from "react";
import { Link } from "react-router-dom";

const getTheme = (percentage) => {
  if (percentage >= 75) {
    return {
      label: "Optimal Standing",
      badge:
        "border-emerald-200/60 bg-emerald-50 text-emerald-700",
      dot:
        "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
      textGradient: "from-emerald-500 to-teal-600",
      barGradient: "from-emerald-400 to-teal-500",
      topGlow: "from-emerald-400 to-teal-400",
    };
  }

  if (percentage >= 65) {
    return {
      label: "Warning Zone",
      badge:
        "border-amber-200/60 bg-amber-50 text-amber-700",
      dot:
        "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      textGradient: "from-amber-500 to-orange-500",
      barGradient: "from-amber-400 to-orange-500",
      topGlow: "from-amber-400 to-orange-400",
    };
  }

  return {
    label: "Critical Shortage",
    badge:
      "border-rose-200/60 bg-rose-50 text-rose-700",
    dot:
      "bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.6)]",
    textGradient: "from-rose-500 to-red-600",
    barGradient: "from-rose-500 to-red-600",
    topGlow: "from-rose-400 to-red-500",
  };
};

// =====================================================
// SUBJECT CARD
// =====================================================

export default function SubjectCard({ subject }) {
  const percentage = Number(subject?.percentage) || 0;
  const present = Number(subject?.present) || 0;
  const absent = Number(subject?.absent) || 0;

  const safePercentage = Math.min(
    Math.max(percentage, 0),
    100
  );

  const theme = getTheme(percentage);

  const subjectId =
    subject?.subjectId ||
    subject?.subject_id ||
    subject?.id;

  if (!subjectId) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <div>
            <p className="font-bold text-slate-900">
              Invalid Subject
            </p>
            <p className="text-xs text-slate-500">
              Subject details are unavailable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/attendance/subject/${subjectId}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/50 sm:rounded-3xl sm:p-6 lg:p-7"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.topGlow} opacity-80 transition-opacity group-hover:opacity-100 sm:h-1.5`}
      />

      <div className="flex items-start justify-between gap-3 sm:items-center">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 sm:px-2.5 sm:text-[10px]">
          {subject?.subjectCode || "NO-CODE"}
        </span>

        <span
          className={`inline-flex max-w-[150px] items-center gap-1 truncate rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wider sm:gap-1.5 sm:px-2.5 sm:text-[10px] ${theme.badge}`}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`}
          />

          <span className="truncate">
            {theme.label}
          </span>
        </span>
      </div>

      <div className="mb-6 mt-4 sm:mb-8 sm:mt-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-lg font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 sm:min-h-[3.5rem] sm:text-xl">
          {subject?.subjectName || "Unnamed Subject"}
        </h3>
      </div>

      <div>
        <div className="mb-2.5 flex items-end justify-between sm:mb-3">
          <p
            className={`bg-gradient-to-br ${theme.textGradient} bg-clip-text text-4xl font-black tracking-tighter text-transparent sm:text-5xl`}
          >
            {percentage.toFixed(2)}%
          </p>

          <span className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
            Attendance
          </span>
        </div>

        <div className="relative mt-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} transition-all duration-1000 ease-out`}
              style={{
                width: `${safePercentage}%`,
              }}
            />
          </div>

          <div className="absolute -top-1 bottom-0 left-[75%] w-[2px] bg-slate-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-slate-400">
              75%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 sm:mt-8 sm:pt-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
              Present
            </span>

            <span className="mt-0.5 text-base font-bold text-emerald-600 sm:text-lg">
              {present}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 sm:h-8" />

          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
              Absent
            </span>

            <span className="mt-0.5 text-base font-bold text-rose-600 sm:text-lg">
              {absent}
            </span>
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 sm:h-10 sm:w-10">
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}