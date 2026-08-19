import React from "react";

// =====================================================
// ADMIN STATS CARD
// =====================================================

export default function AdminStatsCard({
  title,
  value = 0,
  subtitle,
  icon,
  color = "indigo",
  trend,
  trendLabel,
  loading = false,
  onClick,
}) {
  const themes = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-600",
      glow: "group-hover:bg-indigo-500/5",
      border: "group-hover:border-indigo-200",
    },

    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-blue-600",
      glow: "group-hover:bg-blue-500/5",
      border: "group-hover:border-blue-200",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
      glow: "group-hover:bg-emerald-500/5",
      border: "group-hover:border-emerald-200",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
      glow: "group-hover:bg-amber-500/5",
      border: "group-hover:border-amber-200",
    },

    rose: {
      icon: "bg-rose-50 text-rose-600",
      value: "text-rose-600",
      glow: "group-hover:bg-rose-500/5",
      border: "group-hover:border-rose-200",
    },

    violet: {
      icon: "bg-violet-50 text-violet-600",
      value: "text-violet-600",
      glow: "group-hover:bg-violet-500/5",
      border: "group-hover:border-violet-200",
    },
  };

  const theme =
    themes[color] || themes.indigo;

  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-IN")
      : value;

  const hasPositiveTrend =
    typeof trend === "number"
      ? trend >= 0
      : String(trend || "").startsWith("+");

  const hasTrend =
    trend !== undefined &&
    trend !== null &&
    trend !== "";

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 sm:rounded-3xl sm:p-6 ${
        onClick
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
          : "hover:-translate-y-0.5 hover:shadow-md"
      } ${theme.border}`}
    >
      {/* Background Glow */}

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-colors duration-300 ${theme.glow}`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          {/* Icon */}

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${theme.icon}`}
          >
            {icon || (
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </div>

          {/* Trend */}

          {hasTrend && (
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                hasPositiveTrend
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              <svg
                className={`h-3 w-3 ${
                  hasPositiveTrend
                    ? ""
                    : "rotate-180"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l5 5L20 7"
                />
              </svg>

              {Math.abs(Number(trend))}%
            </div>
          )}
        </div>

        {/* Content */}

        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p
              className={`mt-1 text-3xl font-black tracking-tight sm:text-4xl ${theme.value}`}
            >
              {formattedValue}
            </p>
          )}

          {subtitle && (
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}

          {trendLabel && hasTrend && (
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              {trendLabel}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Accent */}

      <div
        className={`absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full ${
          color === "emerald"
            ? "bg-emerald-500"
            : color === "blue"
              ? "bg-blue-500"
              : color === "amber"
                ? "bg-amber-500"
                : color === "rose"
                  ? "bg-rose-500"
                  : color === "violet"
                    ? "bg-violet-500"
                    : "bg-indigo-500"
        }`}
      />
    </div>
  );
}