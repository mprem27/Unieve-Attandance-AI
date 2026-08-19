import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { formatDateTime } from "../utils/formatDate";

// =====================================================
// STATUS STYLE
// =====================================================

const getStatusStyle = (status) => {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  switch (normalized) {
    case "SENT":
      return {
        label: "Sent",
        badgeClass:
          "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        dotClass: "bg-emerald-500",
      };

    case "DELIVERED":
      return {
        label: "Delivered",
        badgeClass:
          "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        dotClass: "bg-emerald-500",
      };

    case "FAILED":
      return {
        label: "Failed",
        badgeClass:
          "border-rose-200/60 bg-rose-50 text-rose-700",
        dotClass: "bg-rose-500",
      };

    case "TEST_LOGGED":
      return {
        label: "Test Logged",
        badgeClass:
          "border-indigo-200/60 bg-indigo-50 text-indigo-700",
        dotClass: "bg-indigo-500",
      };

    case "SKIPPED_NO_PHONE":
      return {
        label: "No Phone",
        badgeClass:
          "border-amber-200/60 bg-amber-50 text-amber-700",
        dotClass: "bg-amber-500",
      };

    case "PROVIDER_NOT_CONFIGURED":
      return {
        label: "Provider Not Configured",
        badgeClass:
          "border-orange-200/60 bg-orange-50 text-orange-700",
        dotClass: "bg-orange-500",
      };

    case "DISABLED":
      return {
        label: "Disabled",
        badgeClass:
          "border-slate-200/60 bg-slate-50 text-slate-600",
        dotClass: "bg-slate-400",
      };

    default:
      return {
        label: normalized.replaceAll("_", " "),
        badgeClass:
          "border-slate-200/60 bg-slate-50 text-slate-600",
        dotClass: "bg-slate-400",
      };
  }
};

// =====================================================
// NORMALIZE API RESPONSE
// =====================================================

const normalizeLogs = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.logs)) {
    return data.logs;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

// =====================================================
// COMPONENT
// =====================================================

export default function SMSLogs() {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD SMS LOGS
  // =====================================================

  const loadLogs = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * IMPORTANT:
       * This endpoint must exist in the backend.
       *
       * Expected:
       * GET /admin/sms-logs
       */
      const response = await api.get("/admin/sms-logs");

      setLogs(normalizeLogs(response.data));
    } catch (err) {
      console.error("SMS logs error:", err);

      setLogs([]);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load SMS delivery logs."
      );
    } finally {
      setLoading(false);

      if (manual) {
        setTimeout(() => {
          setRefreshing(false);
        }, 400);
      }
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const normalizedLogs = logs.map((log) =>
      String(log.status || "").toUpperCase()
    );

    return {
      total: logs.length,

      sent: normalizedLogs.filter(
        (status) =>
          status === "SENT" ||
          status === "DELIVERED"
      ).length,

      failed: normalizedLogs.filter(
        (status) => status === "FAILED"
      ).length,

      test: normalizedLogs.filter(
        (status) => status === "TEST_LOGGED"
      ).length,

      skipped: normalizedLogs.filter(
        (status) =>
          status === "SKIPPED_NO_PHONE" ||
          status === "PROVIDER_NOT_CONFIGURED" ||
          status === "DISABLED"
      ).length,
    };
  }, [logs]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">
      <div className="mx-auto max-w-[1600px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8">

          <Link
            to="/admin"
            className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-indigo-600 sm:text-sm"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>

            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227l3.423.379c.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501l3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018"
                    />
                  </svg>
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Notifications
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                SMS Delivery Logs
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                Monitor attendance SMS notification activity,
                delivery status, and communication history.
              </p>
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => loadLogs(true)}
              disabled={refreshing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <svg
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin text-indigo-600"
                    : "text-slate-400"
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

              {refreshing
                ? "Refreshing..."
                : "Refresh Logs"}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={() => loadLogs(true)}
            />
          </div>
        )}

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">

          <StatCard
            title="Total Logs"
            value={statistics.total}
            color="slate"
            icon="logs"
          />

          <StatCard
            title="Sent"
            value={statistics.sent}
            color="emerald"
            icon="success"
          />

          <StatCard
            title="Failed"
            value={statistics.failed}
            color="rose"
            icon="failed"
          />

          <StatCard
            title="Test Logs"
            value={statistics.test}
            color="indigo"
            icon="test"
          />

          <StatCard
            title="Skipped"
            value={statistics.skipped}
            color="amber"
            icon="warning"
          />
        </div>

        {/* ================================================= */}
        {/* LOG TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

          {/* TABLE HEADER */}

          <div className="border-b border-slate-100 p-5 sm:px-8 sm:py-6">

            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Communication History
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  Attendance notification delivery records.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {logs.length} Records
              </span>

            </div>
          </div>

          {/* EMPTY */}

          {logs.length === 0 ? (
            <EmptyLogs />
          ) : (
            <>
              {/* ================================================= */}
              {/* DESKTOP */}
              {/* ================================================= */}

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full text-left">

                  <thead className="bg-slate-50/80">
                    <tr>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Phone
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Message
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {logs.map((log, index) => (
                      <DesktopRow
                        key={
                          log.id ||
                          log._id ||
                          index
                        }
                        log={log}
                      />
                    ))}

                  </tbody>

                </table>
              </div>

              {/* ================================================= */}
              {/* MOBILE */}
              {/* ================================================= */}

              <div className="divide-y divide-slate-100 lg:hidden">

                {logs.map((log, index) => (
                  <MobileCard
                    key={
                      log.id ||
                      log._id ||
                      index
                    }
                    log={log}
                  />
                ))}

              </div>

              {/* FOOTER */}

              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-8">

                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {logs.length}
                  </span>{" "}
                  SMS communication records
                </p>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  color,
  icon,
}) {
  const styles = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const valueStyles = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${styles[color]}`}
      >
        <StatIcon type={icon} />
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        {title}
      </p>

      <p
        className={`mt-1 text-3xl font-black sm:text-4xl ${valueStyles[color]}`}
      >
        {value}
      </p>
    </div>
  );
}

// =====================================================
// DESKTOP ROW
// =====================================================

function DesktopRow({ log }) {
  const status = getStatusStyle(log.status);

  const studentName =
    log.studentName ||
    log.userName ||
    log.student?.name ||
    log.studentId ||
    "Unknown Student";

  const phone =
    log.phoneNumber ||
    log.phone ||
    log.student?.phone ||
    "—";

  const message =
    log.message ||
    log.body ||
    log.content ||
    "—";

  const date =
    log.createdAt ||
    log.updatedAt ||
    log.timestamp ||
    log.date;

  return (
    <tr className="group transition-colors hover:bg-slate-50/80">

      <td className="px-8 py-5">

        <p className="font-bold text-slate-900 group-hover:text-indigo-600">
          {studentName}
        </p>

        {(log.studentId || log.vtuNumber) && (
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            {log.vtuNumber || log.studentId}
          </p>
        )}

      </td>

      <td className="whitespace-nowrap px-8 py-5 text-sm font-semibold text-slate-600">
        {phone}
      </td>

      <td className="max-w-[380px] px-8 py-5">

        <p
          className="truncate text-sm font-medium text-slate-500"
          title={message}
        >
          {message}
        </p>

      </td>

      <td className="px-8 py-5">

        <StatusBadge status={status} />

      </td>

      <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-slate-500">
        {formatDateTime(date)}
      </td>

    </tr>
  );
}

// =====================================================
// MOBILE CARD
// =====================================================

function MobileCard({ log }) {
  const status = getStatusStyle(log.status);

  const studentName =
    log.studentName ||
    log.userName ||
    log.student?.name ||
    log.studentId ||
    "Unknown Student";

  const phone =
    log.phoneNumber ||
    log.phone ||
    log.student?.phone ||
    "—";

  const message =
    log.message ||
    log.body ||
    log.content ||
    "No message payload";

  const date =
    log.createdAt ||
    log.updatedAt ||
    log.timestamp ||
    log.date;

  return (
    <div className="p-5 transition-colors hover:bg-slate-50/50">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0 flex-1">

          <p className="truncate text-base font-bold text-slate-900">
            {studentName}
          </p>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {log.vtuNumber ||
              log.studentId ||
              "Student"}
          </p>

        </div>

        <StatusBadge status={status} />

      </div>

      {/* MESSAGE */}

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">

        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Message
        </p>

        <p className="text-sm font-medium leading-relaxed text-slate-600">
          {message}
        </p>

      </div>

      {/* DETAILS */}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-xl border border-slate-100 bg-white p-3">

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Contact
          </p>

          <p className="mt-1 truncate text-sm font-bold text-slate-700">
            {phone}
          </p>

        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3">

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Timestamp
          </p>

          <p className="mt-1 text-xs font-bold text-slate-700">
            {formatDateTime(date)}
          </p>

        </div>

      </div>
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${status.badgeClass}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
      />

      {status.label}
    </span>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyLogs() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center sm:p-20">

      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-900/5">

        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227l3.423.379c.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501l3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018"
          />
        </svg>

      </div>

      <h3 className="text-base font-bold text-slate-900 sm:text-lg">
        No SMS Logs Found
      </h3>

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        SMS communication records will appear here
        when attendance notifications are processed.
      </p>

    </div>
  );
}

// =====================================================
// STAT ICON
// =====================================================

function StatIcon({ type }) {
  if (type === "success") {
    return (
      <svg
        className="h-5 w-5 sm:h-6 sm:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    );
  }

  if (type === "failed") {
    return (
      <svg
        className="h-5 w-5 sm:h-6 sm:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }

  if (type === "warning") {
    return (
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
          d="M12 9v3.75m0 3h.008v.008H12v-.008zM10.29 3.86L2.82 17.25A1.5 1.5 0 004.12 19.5h15.76a1.5 1.5 0 001.3-2.25L13.71 3.86a1.98 1.98 0 00-3.42 0z"
        />
      </svg>
    );
  }

  if (type === "test") {
    return (
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
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c1.49-.137 3-.137 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5m-14 0l1.57.393A9.065 9.065 0 0012 15a9.065 9.065 0 005.43-.107L19 14.5m-14 0v1.47a2.25 2.25 0 001.372 2.068 33.22 33.22 0 0011.256 0A2.25 2.25 0 0019 15.97V14.5"
        />
      </svg>
    );
  }

  return (
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
        d="M9 12h6m-6 4h6m2.25-13.5H6.75A2.25 2.25 0 004.5 4.75v14.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V7.5L15 2.5z"
      />
    </svg>
  );
}