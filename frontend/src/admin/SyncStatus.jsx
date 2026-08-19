import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

// =====================================================
// HELPERS
// =====================================================

const getValue = (object, keys, fallback = 0) => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
};

const getStatusLabel = (status) => {
  if (!status) {
    return "Unknown";
  }

  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "SUCCESS":
    case "COMPLETED":
    case "SUCCESSFUL":
    case "READY":
      return "Healthy";

    case "RUNNING":
    case "IN_PROGRESS":
    case "PROCESSING":
      return "Running";

    case "FAILED":
    case "ERROR":
      return "Failed";

    case "IDLE":
      return "Idle";

    default:
      return String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
};

const getStatusClasses = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (
    ["SUCCESS", "COMPLETED", "SUCCESSFUL", "READY", "IDLE"].includes(
      normalized
    )
  ) {
    return {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (
    ["RUNNING", "IN_PROGRESS", "PROCESSING"].includes(
      normalized
    )
  ) {
    return {
      badge:
        "border-blue-200 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    };
  }

  if (["FAILED", "ERROR"].includes(normalized)) {
    return {
      badge:
        "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    };
  }

  return {
    badge:
      "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  };
};

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        {title}
      </p>

      <p
        className={`mt-1 text-3xl font-black tracking-tight sm:text-4xl ${valueClass}`}
      >
        {value}
      </p>

      {description && (
        <p className="mt-1 text-[10px] font-medium text-slate-400 sm:text-xs">
          {description}
        </p>
      )}
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function SyncStatusBadge({ status }) {
  const classes = getStatusClasses(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${classes.badge}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${classes.dot}`}
      />

      {getStatusLabel(status)}
    </span>
  );
}

// =====================================================
// SUCCESS MESSAGE
// =====================================================

function SuccessMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 shadow-sm">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg
          className="h-5 w-5"
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
      </div>

      <div>
        <p className="text-sm font-bold text-emerald-800">
          Synchronization completed
        </p>

        <p className="mt-0.5 text-xs font-medium leading-relaxed text-emerald-700">
          {message}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function SyncStatus() {
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD STATUS
  // =====================================================

  const loadStatus = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          "/admin/sync/status"
        );

        setStatus(response.data || {});
      } catch (err) {
        console.error(
          "Failed to load synchronization status:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load synchronization status."
        );
      } finally {
        setLoading(false);

        if (manualRefresh) {
          setTimeout(() => {
            setRefreshing(false);
          }, 400);
        }
      }
    },
    []
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // =====================================================
  // MANUAL SYNC
  // =====================================================

  const handleSync = async () => {
    if (syncing) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/admin/sync",
        {}
      );

      const result = response.data || {};

      const recordsProcessed = getValue(
        result,
        [
          "recordsProcessed",
          "records_processed",
          "processedRecords",
          "processed_records",
        ],
        0
      );

      const studentsProcessed = getValue(
        result,
        [
          "studentsProcessed",
          "students_processed",
          "processedStudents",
          "processed_students",
        ],
        0
      );

      const changesDetected = getValue(
        result,
        [
          "changesDetected",
          "changes_detected",
          "changes",
        ],
        0
      );

      setSuccess(
        `Sync completed successfully. ${studentsProcessed} students and ${recordsProcessed} attendance records were processed. ${changesDetected} changes were detected.`
      );

      await loadStatus();

      setTimeout(() => {
        setSuccess("");
      }, 7000);
    } catch (err) {
      console.error(
        "Attendance synchronization failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Attendance synchronization failed. Please check the college portal connection."
      );
    } finally {
      setSyncing(false);
    }
  };

  // =====================================================
  // NORMALIZED STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    return {
      students: getValue(
        status,
        [
          "studentsProcessed",
          "students_processed",
          "studentCount",
          "student_count",
        ],
        0
      ),

      records: getValue(
        status,
        [
          "recordsProcessed",
          "records_processed",
          "attendanceRecords",
          "attendance_records",
        ],
        0
      ),

      changes: getValue(
        status,
        [
          "changesDetected",
          "changes_detected",
          "changes",
        ],
        0
      ),

      notifications: getValue(
        status,
        [
          "notificationsCreated",
          "notifications_created",
          "notificationCount",
          "notification_count",
        ],
        0
      ),
    };
  }, [status]);

  const lastSync = getValue(
    status,
    [
      "lastSyncAt",
      "last_sync_at",
      "lastSyncedAt",
      "last_synced_at",
      "updatedAt",
      "updated_at",
    ],
    null
  );

  const currentStatus = getValue(
    status,
    [
      "status",
      "syncStatus",
      "sync_status",
      "state",
    ],
    "READY"
  );

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

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
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
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  System Operations
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Synchronization Status
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                Monitor attendance synchronization between the
                college portal and UniEve AI.
              </p>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() => loadStatus(true)}
                disabled={refreshing || syncing}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                  : "Refresh Status"}
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(99,102,241,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <svg
                  className={`h-4 w-4 ${
                    syncing
                      ? "animate-spin"
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

                {syncing
                  ? "Syncing..."
                  : "Run Manual Sync"}
              </button>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        <div className="mb-8 space-y-4">

          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => loadStatus(true)}
            />
          )}

          <SuccessMessage message={success} />

        </div>

        {/* ================================================= */}
        {/* CURRENT STATUS */}
        {/* ================================================= */}

        <div className="mb-8 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Current Pipeline Status
              </p>

              <div className="mt-2 flex items-center gap-3">

                <SyncStatusBadge status={currentStatus} />

                <span className="text-sm font-medium text-slate-500">
                  {syncing
                    ? "Synchronization is currently running..."
                    : "Synchronization pipeline is available."}
                </span>

              </div>

            </div>

            {lastSync && (
              <div className="text-left sm:text-right">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Last Sync
                </p>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  {formatSyncDate(lastSync)}
                </p>

              </div>
            )}

          </div>
        </div>

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

          <StatCard
            title="Students Scanned"
            value={statistics.students}
            description="Student accounts checked"
            icon={
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
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                />
              </svg>
            }
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Records Processed"
            value={statistics.records}
            description="Attendance records"
            icon={
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
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75"
                />
              </svg>
            }
            iconClass="bg-violet-50 text-violet-600"
            valueClass="text-violet-600"
          />

          <StatCard
            title="Changes Detected"
            value={statistics.changes}
            description="Updated attendance data"
            icon={
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
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            }
            iconClass="bg-amber-50 text-amber-600"
            valueClass="text-amber-600"
          />

          <StatCard
            title="Notifications"
            value={statistics.notifications}
            description="Alerts generated"
            icon={
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
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 00-12 0v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            }
            iconClass="bg-emerald-50 text-emerald-600"
            valueClass="text-emerald-600"
          />

        </div>

        {/* ================================================= */}
        {/* CONFIGURATION */}
        {/* ================================================= */}

        <div className="mb-8 grid gap-6 lg:grid-cols-2">

          {/* SYSTEM CONFIGURATION */}

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:rounded-3xl">

            <div className="flex items-center gap-4 border-b border-slate-100 p-6 sm:p-8">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  System Configuration
                </h2>

                <p className="text-sm font-medium text-slate-500">
                  Current synchronization configuration
                </p>
              </div>

            </div>

            <div className="space-y-3 bg-slate-50/30 p-6 sm:p-8">

              <ConfigRow
                label="Adapter Mode"
                value={
                  getValue(
                    status,
                    [
                      "adapterMode",
                      "adapter_mode",
                      "mode",
                    ],
                    "PORTAL INTEGRATION"
                  )
                }
              />

              <ConfigRow
                label="Trigger"
                value={
                  getValue(
                    status,
                    [
                      "trigger",
                      "triggerMode",
                      "trigger_mode",
                    ],
                    "MANUAL"
                  )
                }
              />

              <ConfigRow
                label="Data Source"
                value={
                  getValue(
                    status,
                    [
                      "dataSource",
                      "data_source",
                      "source",
                    ],
                    "College Portal"
                  )
                }
              />

              <ConfigRow
                label="Sync Enabled"
                value={
                  getValue(
                    status,
                    [
                      "enabled",
                      "syncEnabled",
                      "sync_enabled",
                    ],
                    true
                  )
                    ? "Enabled"
                    : "Disabled"
                }
              />

            </div>
          </div>

          {/* LATEST RESULT */}

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:rounded-3xl">

            <div className="flex items-center gap-4 border-b border-slate-100 p-6 sm:p-8">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Latest Sync Result
                </h2>

                <p className="text-sm font-medium text-slate-500">
                  Most recent synchronization information
                </p>
              </div>

            </div>

            <div className="bg-slate-50/30 p-6 sm:p-8">

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {getStatusLabel(currentStatus)}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {lastSync
                        ? `Last synchronization: ${formatSyncDate(
                            lastSync
                          )}`
                        : "No synchronization timestamp available."}
                    </p>
                  </div>

                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <MiniResult
                    label="Records"
                    value={statistics.records}
                  />

                  <MiniResult
                    label="Changes"
                    value={statistics.changes}
                  />

                  <MiniResult
                    label="Students"
                    value={statistics.students}
                  />

                  <MiniResult
                    label="Notifications"
                    value={statistics.notifications}
                  />

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* PIPELINE */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">

          <div className="mb-8">

            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Data Synchronization Pipeline
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Attendance data flow from the college portal into
              the UniEve AI system.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">

            <PipelineStep
              number="1"
              title="Student Identification"
              description="Identify registered students that need attendance synchronization."
              color="indigo"
            />

            <PipelineStep
              number="2"
              title="Portal Connection"
              description="Connect to the configured college attendance portal."
              color="violet"
            />

            <PipelineStep
              number="3"
              title="Data Processing"
              description="Read and normalize attendance information received from the portal."
              color="amber"
            />

            <PipelineStep
              number="4"
              title="Database Update"
              description="Store attendance changes and generate related notifications."
              color="emerald"
            />

          </div>
        </div>

      </div>
    </div>
  );
}

// =====================================================
// CONFIG ROW
// =====================================================

function ConfigRow({ label, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        {label}
      </span>

      <span className="max-w-full truncate text-sm font-bold text-slate-700">
        {String(value)}
      </span>

    </div>
  );
}

// =====================================================
// MINI RESULT
// =====================================================

function MiniResult({ label, value }) {
  return (
    <div className="rounded-xl border border-emerald-100/70 bg-white p-3.5 shadow-sm">

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-800">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// PIPELINE STEP
// =====================================================

function PipelineStep({
  number,
  title,
  description,
  color,
}) {
  const colors = {
    indigo: {
      circle:
        "bg-slate-200 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white",
      title:
        "group-hover:text-indigo-600",
    },

    violet: {
      circle:
        "bg-slate-200 text-slate-600 group-hover:bg-violet-600 group-hover:text-white",
      title:
        "group-hover:text-violet-600",
    },

    amber: {
      circle:
        "bg-slate-200 text-slate-600 group-hover:bg-amber-500 group-hover:text-white",
      title:
        "group-hover:text-amber-600",
    },

    emerald: {
      circle:
        "bg-slate-200 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white",
      title:
        "group-hover:text-emerald-600",
    },
  };

  const style = colors[color];

  return (
    <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md">

      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors ${style.circle}`}
      >
        {number}
      </div>

      <p
        className={`text-sm font-bold text-slate-900 transition-colors ${style.title}`}
      >
        {title}
      </p>

      <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
        {description}
      </p>

    </div>
  );
}

// =====================================================
// DATE FORMATTER
// =====================================================

function formatSyncDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}