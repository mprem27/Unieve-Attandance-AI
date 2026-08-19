import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// =====================================================
// STATUS
// =====================================================

const getStatusConfig = (percentage) => {
  if (percentage >= 75) {
    return {
      label: "Good Standing",
      color: "#10b981",
      textColor: "text-emerald-700",
      gradient: "from-emerald-400 to-emerald-600",
      bgLight: "bg-emerald-50/80",
      border: "border-emerald-200/60",
    };
  }

  if (percentage >= 65) {
    return {
      label: "Warning Zone",
      color: "#f59e0b",
      textColor: "text-amber-700",
      gradient: "from-amber-400 to-orange-500",
      bgLight: "bg-amber-50/80",
      border: "border-amber-200/60",
    };
  }

  return {
    label: "Critical Shortage",
    color: "#ef4444",
    textColor: "text-rose-700",
    gradient: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50/80",
    border: "border-rose-200/60",
  };
};

// =====================================================
// TOOLTIP
// =====================================================

const CustomTooltip = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="z-50 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-md">
      <p className="font-semibold text-slate-200">
        {item.name}
      </p>

      <p className="mt-1 text-slate-400">
        <span className="font-black text-white">
          {item.value}
        </span>{" "}
        classes
      </p>
    </div>
  );
};

// =====================================================
// COMPONENT
// =====================================================

export default function AttendanceChart({
  summary = [],
}) {
  const safeSummary = Array.isArray(summary)
    ? summary
    : [];

  const totalPresent = safeSummary.reduce(
    (total, subject) =>
      total +
      (Number(subject?.present) || 0),
    0
  );

  const totalAbsent = safeSummary.reduce(
    (total, subject) =>
      total +
      (Number(subject?.absent) || 0),
    0
  );

  const totalClasses =
    totalPresent + totalAbsent;

  const overallPercentage =
    totalClasses > 0
      ? Number(
          (
            (totalPresent / totalClasses) *
            100
          ).toFixed(2)
        )
      : 0;

  const chartData = [
    {
      name: "Present",
      value: totalPresent,
    },
    {
      name: "Absent",
      value: totalAbsent,
    },
  ];

  const theme =
    getStatusConfig(overallPercentage);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:rounded-3xl sm:p-7 lg:p-8">
      <div
        className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${theme.gradient} opacity-90 sm:h-1.5`}
      />

      <div className="mb-6 flex flex-col items-start gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Overall Attendance
          </h2>

          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Cumulative performance across all
            subjects
          </p>
        </div>

        {totalClasses > 0 && (
          <div
            className={`flex items-center gap-2 rounded-full border ${theme.border} ${theme.bgLight} px-3.5 py-1.5 shadow-sm`}
          >
            <div
              className={`h-2 w-2 rounded-full bg-gradient-to-r ${theme.gradient} shadow-sm`}
            />

            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${theme.textColor} sm:text-xs`}
            >
              {theme.label}
            </span>
          </div>
        )}
      </div>

      <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
        <div className="relative flex h-56 items-center justify-center sm:h-72">
          {totalClasses > 0 ? (
            <>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="68%"
                    outerRadius="85%"
                    paddingAngle={5}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    cornerRadius={8}
                  >
                    <Cell
                      fill={theme.color}
                      style={{
                        filter: `drop-shadow(0px 4px 10px ${theme.color}40)`,
                      }}
                    />

                    <Cell fill="#f1f5f9" />
                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "transparent",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span
                  className={`bg-gradient-to-br ${theme.gradient} bg-clip-text text-4xl font-black tracking-tighter text-transparent sm:text-5xl`}
                >
                  {overallPercentage}%
                </span>

                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:mt-1 sm:text-xs">
                  Overall
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <div className="mb-3 h-12 w-12 rounded-full border-4 border-dashed border-slate-200 sm:h-16 sm:w-16" />

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:text-sm">
                No Data Yet
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Total Classes
            </p>

            <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
              {totalClasses}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Present
            </p>

            <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
              <p className="text-2xl font-black tracking-tight text-emerald-600 sm:text-3xl">
                {totalPresent}
              </p>

              {totalClasses > 0 && (
                <p className="text-xs font-bold text-emerald-600/60 sm:text-sm">
                  /{totalClasses}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Absent
            </p>

            <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
              <p className="text-2xl font-black tracking-tight text-rose-600 sm:text-3xl">
                {totalAbsent}
              </p>

              {totalClasses > 0 && (
                <p className="text-xs font-bold text-rose-600/60 sm:text-sm">
                  /{totalClasses}
                </p>
              )}
            </div>
          </div>

          <div
            className={`flex flex-col justify-center rounded-2xl border ${theme.border} ${theme.bgLight} p-3.5 transition-colors sm:p-5`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${theme.textColor} opacity-80 sm:text-xs`}
            >
              Status
            </p>

            <p
              className={`mt-1.5 text-sm font-black leading-tight ${theme.textColor} sm:text-lg`}
            >
              {theme.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}