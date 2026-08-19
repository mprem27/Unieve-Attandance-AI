import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import AdminStatsCard from "./AdminStatsCard";

// =====================================================
// ADMIN DASHBOARD
// =====================================================

export default function AdminDashboard() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD ADMIN DATA
  // =====================================================

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [syncResponse, usersResponse] =
        await Promise.all([
          api.get("/admin/sync/status"),
          api.get("/admin/users"),
        ]);

      setSyncStatus(syncResponse.data || {});

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );
    } catch (err) {
      console.error(
        "Admin dashboard loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load admin dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // =====================================================
  // RUN ATTENDANCE SYNC
  // =====================================================

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/admin/sync",
        {}
      );

      const result = response.data || {};

      setSuccess(
        `Synchronization completed successfully. ${
          result.recordsProcessed || 0
        } attendance records processed.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 5000);

      await loadAdminData();
    } catch (err) {
      console.error(
        "Attendance sync failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Attendance synchronization failed."
      );
    } finally {
      setSyncing(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  // =====================================================
  // STUDENT STATISTICS
  // =====================================================

  const studentUsers = users.filter(
    (user) => user?.role === "student"
  );

  const studentCount = studentUsers.length;

  const activeStudentCount =
    studentUsers.filter(
      (user) => user?.active === true
    ).length;

  const inactiveStudentCount =
    Math.max(
      studentCount - activeStudentCount,
      0
    );

  const portalConfiguredCount =
    studentUsers.filter(
      (user) =>
        user?.portalCredentialsConfigured === true
    ).length;

  // =====================================================
  // SYNC VALUES
  // =====================================================

  const studentsProcessed =
    syncStatus?.studentsProcessed ??
    syncStatus?.students_processed ??
    0;

  const recordsProcessed =
    syncStatus?.recordsProcessed ??
    syncStatus?.records_processed ??
    0;

  const changesDetected =
    syncStatus?.changesDetected ??
    syncStatus?.changes_detected ??
    0;

  const notificationsCreated =
    syncStatus?.notificationsCreated ??
    syncStatus?.notifications_created ??
    0;

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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
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
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Administration
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                Manage students, monitor portal
                synchronization, review attendance
                activity, and manage system services.
              </p>
            </div>

            {/* HEADER ACTIONS */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={loadAdminData}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  className={`h-4 w-4 text-slate-400 ${
                    loading ? "animate-spin" : ""
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

                Refresh
              </button>

              <Link
                to="/admin/users"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
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
                    d="M12 5v14M5 12h14"
                  />
                </svg>

                Manage Students
              </Link>
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
              onRetry={loadAdminData}
            />
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
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

              <p className="text-sm font-bold text-emerald-700">
                {success}
              </p>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* STUDENT STATISTICS */}
        {/* ================================================= */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Student Overview
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Current student account statistics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

            <AdminStatsCard
              title="Total Students"
              value={studentCount}
              subtitle="Registered student accounts"
              color="indigo"
              icon={<UsersIcon />}
            />

            <AdminStatsCard
              title="Active Students"
              value={activeStudentCount}
              subtitle="Currently active accounts"
              color="emerald"
              icon={<CheckIcon />}
            />

            <AdminStatsCard
              title="Portal Configured"
              value={portalConfiguredCount}
              subtitle="AMS credentials configured"
              color="violet"
              icon={<PortalIcon />}
            />

            <AdminStatsCard
              title="Inactive Students"
              value={inactiveStudentCount}
              subtitle="Currently inactive accounts"
              color="amber"
              icon={<WarningIcon />}
            />

          </div>
        </section>

        {/* ================================================= */}
        {/* SYNC OVERVIEW */}
        {/* ================================================= */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Synchronization Overview
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Latest attendance synchronization statistics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

            <AdminStatsCard
              title="Students Processed"
              value={studentsProcessed}
              subtitle="Students handled by sync"
              color="indigo"
              icon={<UsersIcon />}
            />

            <AdminStatsCard
              title="Records Processed"
              value={recordsProcessed}
              subtitle="Attendance records handled"
              color="violet"
              icon={<RecordsIcon />}
            />

            <AdminStatsCard
              title="Changes Detected"
              value={changesDetected}
              subtitle="Attendance changes found"
              color="amber"
              icon={<SyncIcon />}
            />

            <AdminStatsCard
              title="Alerts Created"
              value={notificationsCreated}
              subtitle="Notifications generated"
              color="emerald"
              icon={<BellIcon />}
            />

          </div>
        </section>

        {/* ================================================= */}
        {/* SYSTEM MODULES */}
        {/* ================================================= */}

        <section className="mb-8 sm:mb-10">

          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              System Modules
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage the main administration modules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <ModuleCard
              to="/admin/users"
              title="Student Management"
              description="Add students, edit profiles, configure portal credentials, and view complete student details."
              color="indigo"
              icon={<UsersIcon />}
            />

            <ModuleCard
              to="/admin/sync-status"
              title="Sync Status"
              description="Monitor attendance synchronization history, processing results, and synchronization errors."
              color="blue"
              icon={<SyncIcon />}
            />

            <ModuleCard
              to="/admin/sms-logs"
              title="SMS Logs"
              description="View attendance notification delivery history and SMS provider status."
              color="emerald"
              icon={<BellIcon />}
            />

            <ModuleCard
              to="/admin/users"
              title="Student Attendance"
              description="Select an individual student and review their complete attendance information."
              color="amber"
              icon={<AttendanceIcon />}
            />

          </div>
        </section>

        {/* ================================================= */}
        {/* SYNC CONTROL */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

          <div className="flex flex-col gap-6 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <SyncIcon />
                </span>

                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Attendance Pipeline
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Core Synchronization Service
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Fetch attendance information from the
                configured college portal and synchronize
                the latest records with the application.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SyncIcon spinning={syncing} />

              {syncing
                ? "Synchronizing..."
                : "Sync Portal Attendance"}
            </button>
          </div>

          {/* SERVICE STATUS */}

          <div className="bg-slate-50/50 p-6 sm:p-8">

            <div className="grid gap-5 md:grid-cols-3">

              <ServiceStatus
                title="Database"
                value="Connected"
                status="good"
              />

              <ServiceStatus
                title="Portal Adapter"
                value="Configured"
                status="good"
              />

              <ServiceStatus
                title="Sync Service"
                value={
                  syncing
                    ? "Synchronizing"
                    : "Ready"
                }
                status={
                  syncing
                    ? "working"
                    : "good"
                }
              />

            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">

              <div className="flex items-center gap-3">

                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      syncing
                        ? "bg-indigo-400"
                        : "bg-emerald-400"
                    }`}
                  />

                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      syncing
                        ? "bg-indigo-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </span>

                <p className="text-sm font-bold text-slate-800">
                  {syncing
                    ? "Attendance synchronization is currently running."
                    : "System connection established and ready."}
                </p>
              </div>

              <p className="mt-2 pl-6 text-xs font-semibold text-slate-400">
                {syncing
                  ? "Please wait until the synchronization process completes."
                  : "Use the synchronization button to fetch the latest attendance records."}
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

// =====================================================
// SERVICE STATUS
// =====================================================

function ServiceStatus({
  title,
  value,
  status,
}) {
  const working =
    status === "working";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
              working
                ? "bg-indigo-400"
                : "bg-emerald-400"
            }`}
          />

          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              working
                ? "bg-indigo-500"
                : "bg-emerald-500"
            }`}
          />
        </span>
      </div>

      <p className="mt-2 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

// =====================================================
// MODULE CARD
// =====================================================

function ModuleCard({
  to,
  title,
  description,
  color,
  icon,
}) {
  const styles = {
    indigo:
      "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    blue:
      "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    emerald:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    amber:
      "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  };

  const textColors = {
    indigo:
      "group-hover:text-indigo-600",
    blue:
      "group-hover:text-blue-600",
    emerald:
      "group-hover:text-emerald-600",
    amber:
      "group-hover:text-amber-600",
  };

  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:rounded-3xl sm:p-6"
    >
      <div>

        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${styles[color]}`}
        >
          {icon}
        </div>

        <h3
          className={`font-bold text-slate-900 transition-colors ${textColors[color]}`}
        >
          {title}
        </h3>

        <p className="mt-1.5 line-clamp-3 text-sm font-medium leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      <div
        className={`mt-5 flex items-center text-xs font-bold uppercase tracking-wider opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 ${textColors[color]}`}
      >
        Open Module
        <span className="ml-1">
          →
        </span>
      </div>
    </Link>
  );
}

// =====================================================
// ICONS
// =====================================================

function UsersIcon() {
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
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0z"
      />
    </svg>
  );
}

function CheckIcon() {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WarningIcon() {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function PortalIcon() {
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
        d="M12 3l8.25 4.5v5.25c0 4.2-2.85 7.95-8.25 9.75-5.4-1.8-8.25-5.55-8.25-9.75V7.5L12 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4"
      />
    </svg>
  );
}

function RecordsIcon() {
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
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function SyncIcon({ spinning = false }) {
  return (
    <svg
      className={`h-5 w-5 ${
        spinning ? "animate-spin" : ""
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
  );
}

function BellIcon() {
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
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 00-12 0v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function AttendanceIcon() {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 9h18M5.25 5.25h13.5A2.25 2.25 0 0121 7.5v11.25A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V7.5a2.25 2.25 0 012.25-2.25z"
      />
    </svg>
  );
}