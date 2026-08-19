import React from "react";

// =====================================================
// ATTENDANCE CALCULATION
// =====================================================

const getAttendanceTotals = (summary) => {
  const safeSummary = Array.isArray(summary)
    ? summary
    : [];

  const totalPresent = safeSummary.reduce(
    (total, subject) =>
      total + (Number(subject?.present) || 0),
    0
  );

  const totalAbsent = safeSummary.reduce(
    (total, subject) =>
      total + (Number(subject?.absent) || 0),
    0
  );

  const totalClasses =
    totalPresent + totalAbsent;

  const percentage =
    totalClasses > 0
      ? Number(
          (
            (totalPresent / totalClasses) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    totalPresent,
    totalAbsent,
    totalClasses,
    percentage,
  };
};

// =====================================================
// THEME
// =====================================================

const getTheme = (percentage) => {
  if (percentage >= 75) {
    return {
      label: "Good Standing",
      textClass: "text-emerald-600",
      bgLight: "bg-emerald-50/80",
      border: "border-emerald-200/60",
      gradientText:
        "from-emerald-500 to-teal-600",
      barGradient:
        "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
    };
  }

  if (percentage >= 65) {
    return {
      label: "Warning Zone",
      textClass: "text-amber-600",
      bgLight: "bg-amber-50/80",
      border: "border-amber-200/60",
      gradientText:
        "from-amber-500 to-orange-500",
      barGradient:
        "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
    };
  }

  return {
    label: "Critical Shortage",
    textClass: "text-rose-600",
    bgLight: "bg-rose-50/80",
    border: "border-rose-200/60",
    gradientText:
      "from-rose-500 to-red-600",
    barGradient:
      "from-rose-500 to-red-600",
    shadow: "shadow-rose-500/20",
  };
};

// =====================================================
// COMPONENT
// =====================================================

export default function AttendanceSummary({
  summary = [],
}) {
  const {
    totalPresent,
    totalAbsent,
    totalClasses,
    percentage: overallPercentage,
  } = getAttendanceTotals(summary);

  const theme = getTheme(overallPercentage);

  const progressWidth = Math.min(
    Math.max(overallPercentage, 0),
    100
  );

  const isEligible =
    overallPercentage >= 75;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_35px_rgb(0,0,0,0.07)] sm:rounded-3xl sm:p-6 lg:p-8">

      <div
        className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${theme.barGradient} sm:h-1.5`}
      />

      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Attendance Summary
        </h2>

        <p className="mt-1 text-xs font-medium text-slate-500 sm:mt-1.5 sm:text-sm">
          Your cumulative performance overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">

        <div
          className={`group relative col-span-2 overflow-hidden rounded-2xl border ${theme.border} ${theme.bgLight} p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.shadow} lg:col-span-1 sm:p-5`}
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80 sm:text-xs">
              Overall Average
            </p>

            <p
              className={`mt-1.5 bg-gradient-to-br ${theme.gradientText} bg-clip-text text-4xl font-black tracking-tight text-transparent sm:mt-2 lg:text-5xl`}
            >
              {overallPercentage}%
            </p>

            <div className="mt-2 flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${theme.barGradient}`}
              />

              <p
                className={`truncate text-xs font-semibold ${theme.textClass} sm:text-sm`}
              >
                {theme.label}
              </p>
            </div>
          </div>

          <div
            className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${theme.barGradient} opacity-10 blur-2xl`}
          />
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
            Total Present
          </p>

          <p className="mt-1.5 text-3xl font-black tracking-tight text-emerald-600 sm:mt-2 sm:text-4xl">
            {totalPresent}
          </p>

          <p className="mt-1.5 text-[10px] font-medium text-slate-500 sm:mt-2 sm:text-sm">
            Classes attended
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
            Total Absent
          </p>

          <p className="mt-1.5 text-3xl font-black tracking-tight text-rose-600 sm:mt-2 sm:text-4xl">
            {totalAbsent}
          </p>

          <p className="mt-1.5 text-[10px] font-medium text-slate-500 sm:mt-2 sm:text-sm">
            Classes missed
          </p>
        </div>

        <div className="group col-span-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:col-span-1 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
            Total Classes
          </p>

          <p className="mt-1.5 text-3xl font-black tracking-tight text-blue-600 sm:mt-2 sm:text-4xl">
            {totalClasses}
          </p>

          <p className="mt-1.5 text-[10px] font-medium text-slate-500 sm:mt-2 sm:text-sm">
            Classes conducted
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:mt-8 sm:p-6">

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 sm:text-sm">
              Requirement Tracker
            </h3>

            <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-sm">
              75% minimum attendance threshold
            </p>
          </div>

          <div
            className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
              isEligible
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {isEligible
              ? "Eligible"
              : "Deficit"}
          </div>
        </div>

        <div className="relative mt-7 sm:mt-6">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 sm:h-3">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} transition-all duration-1000 ease-out`}
              style={{
                width: `${progressWidth}%`,
              }}
            />
          </div>

          <div className="absolute bottom-[-6px] left-[75%] top-[-6px] w-[2px] bg-slate-400 sm:bottom-[-8px] sm:top-[-8px]">
            <div className="absolute left-1/2 top-[-22px] -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-white sm:top-[-24px] sm:text-[10px]">
              75%
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex justify-between text-[10px] font-bold text-slate-400 sm:mt-3 sm:text-xs">
          <span>0%</span>

          <span>100%</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
          <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
              Current
            </p>

            <p
              className={`mt-1 text-sm font-black ${theme.textClass} sm:text-base`}
            >
              {overallPercentage}%
            </p>
          </div>

          <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
              Required
            </p>

            <p className="mt-1 text-sm font-black text-slate-700 sm:text-base">
              75%
            </p>
          </div>

          <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
              Difference
            </p>

            <p
              className={`mt-1 text-sm font-black ${
                isEligible
                  ? "text-emerald-600"
                  : "text-rose-600"
              } sm:text-base`}
            >
              {isEligible
                ? `+${(
                    overallPercentage - 75
                  ).toFixed(2)}%`
                : `-${(
                    75 - overallPercentage
                  ).toFixed(2)}%`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}