import React, { useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useAttendance from "../hooks/useAttendance";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceChart from "../components/AttendanceChart";
import SubjectCard from "../components/SubjectCard";
import PortalCredentialsCard from "../components/PortalCredentialsCard";

export default function Dashboard() {
  const { user } = useAuth();

  const {
    summary = [],
    todayAttendance = [],
    loading,
    error,
    refresh,
  } = useAttendance();

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // =====================================================
  // SAFE DATA
  // =====================================================

  const safeSummary = Array.isArray(summary)
    ? summary
    : [];

  const safeTodayAttendance =
    Array.isArray(todayAttendance)
      ? todayAttendance
      : [];

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);

      await refresh();
    } catch (err) {
      console.error(
        "Dashboard refresh failed:",
        err
      );
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
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

  // =====================================================
  // ATTENDANCE CALCULATIONS
  // =====================================================

  const totalPresent = safeSummary.reduce(
    (total, subject) =>
      total + Number(subject?.present || 0),
    0
  );

  const totalAbsent = safeSummary.reduce(
    (total, subject) =>
      total + Number(subject?.absent || 0),
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

  // =====================================================
  // ATTENDANCE STATUS
  // =====================================================

  let percentageConfig = {
    text: "Critical Shortage",
    color: "text-rose-600",
    dot: "bg-rose-500",
    bg: "bg-rose-50",
  };

  if (overallPercentage >= 85) {
    percentageConfig = {
      text: "Excellent Record",
      color: "text-indigo-600",
      dot: "bg-indigo-500",
      bg: "bg-indigo-50",
    };
  } else if (overallPercentage >= 75) {
    percentageConfig = {
      text: "Good Standing",
      color: "text-emerald-600",
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
    };
  } else if (overallPercentage >= 65) {
    percentageConfig = {
      text: "Warning Zone",
      color: "text-amber-600",
      dot: "bg-amber-500",
      bg: "bg-amber-50",
    };
  }

  // =====================================================
  // TODAY ATTENDANCE
  // =====================================================

  const todayPresent =
    safeTodayAttendance.filter(
      (record) =>
        String(record?.status || "").toUpperCase() ===
        "PRESENT"
    ).length;

  const todayAbsent =
    safeTodayAttendance.filter(
      (record) =>
        String(record?.status || "").toUpperCase() ===
        "ABSENT"
    ).length;

  const todayTotal =
    todayPresent + todayAbsent;

  // =====================================================
  // LOW ATTENDANCE SUBJECTS
  // =====================================================

  const lowAttendanceSubjects =
    safeSummary.filter(
      (subject) =>
        Number(subject?.percentage || 0) < 75
    );

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">

      <div className="mx-auto max-w-[1600px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

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
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>

              </span>

              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Student Portal
              </p>

            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">

              Welcome,{" "}

              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                {user?.name?.split(" ")[0] ||
                  "Student"}
              </span>

              {" "}👋

            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
              Here is your comprehensive attendance overview.
            </p>

          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:py-2.5"
          >

            <svg
              className={`h-4 w-4 ${
                isRefreshing
                  ? "animate-spin text-indigo-600"
                  : "text-slate-400 group-hover:text-indigo-600"
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
              ? "Syncing Data..."
              : "Refresh Dashboard"}

          </button>

        </div>

        {/* ================================================= */}
        {/* QUICK METRICS */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">

          {/* OVERALL */}

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-12 sm:w-12 sm:rounded-2xl">

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
                  d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                />
              </svg>

            </div>

            <div className="mt-4">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Total Average
              </p>

              <p className="mt-1 text-3xl font-black text-slate-900 sm:text-4xl">
                {overallPercentage.toFixed(2)}%
              </p>

              <div className="mt-2 flex items-center gap-1.5">

                <span
                  className={`h-1.5 w-1.5 rounded-full ${percentageConfig.dot}`}
                />

                <p
                  className={`text-[10px] font-bold uppercase tracking-wide sm:text-xs ${percentageConfig.color}`}
                >
                  {percentageConfig.text}
                </p>

              </div>

            </div>

          </div>

          {/* PRESENT */}

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12 sm:rounded-2xl">

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

            </div>

            <div className="mt-4">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Classes Attended
              </p>

              <p className="mt-1 text-3xl font-black text-emerald-600 sm:text-4xl">
                {totalPresent}
              </p>

              <p className="mt-2 text-[10px] font-bold text-slate-400 sm:text-xs">
                Of {totalClasses} total
              </p>

            </div>

          </div>

          {/* ABSENT */}

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 sm:h-12 sm:w-12 sm:rounded-2xl">

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
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

            </div>

            <div className="mt-4">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Classes Missed
              </p>

              <p className="mt-1 text-3xl font-black text-rose-600 sm:text-4xl">
                {totalAbsent}
              </p>

              <p className="mt-2 text-[10px] font-bold text-slate-400 sm:text-xs">
                Keep this low
              </p>

            </div>

          </div>

          {/* SUBJECTS */}

          <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5 lg:p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 sm:h-12 sm:w-12 sm:rounded-2xl">

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
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>

            </div>

            <div className="mt-4">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Active Subjects
              </p>

              <p className="mt-1 text-3xl font-black text-sky-600 sm:text-4xl">
                {safeSummary.length}
              </p>

              <p className="mt-2 text-[10px] font-bold text-slate-400 sm:text-xs">
                Being tracked
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TODAY'S ATTENDANCE */}
        {/* ================================================= */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

          <div className="flex flex-col lg:flex-row lg:items-center">

            <div className="flex-1 border-b border-slate-100 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">

              <div className="flex items-center gap-3">

                <span className="relative flex h-3 w-3">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />

                  <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-600" />

                </span>

                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Today's Live Status
                </h2>

              </div>

              <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                Quick glance at the attendance recorded for your classes today based on the latest sync.
              </p>

              <Link
                to="/attendance"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 sm:mt-5"
              >
                View Full Logs

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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>

              </Link>

            </div>

            <div className="flex-1 bg-slate-50/50 p-5 sm:p-6 lg:p-8">

              {safeTodayAttendance.length === 0 ? (

                <div className="flex h-full items-center justify-center py-4">

                  <p className="text-sm font-bold text-slate-500">
                    No classes synced for today yet.
                  </p>

                </div>

              ) : (

                <div className="grid grid-cols-2 gap-4 sm:gap-6">

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 sm:text-xs">
                      Marked Present
                    </p>

                    <p className="mt-1 text-3xl font-black text-emerald-600 sm:text-4xl">
                      {todayPresent}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 sm:p-5">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 sm:text-xs">
                      Marked Absent
                    </p>

                    <p className="mt-1 text-3xl font-black text-rose-600 sm:text-4xl">
                      {todayAbsent}
                    </p>

                  </div>

                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">

                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Today's Classes
                    </span>

                    <span className="text-sm font-black text-slate-900">
                      {todayTotal}
                    </span>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* LOW ATTENDANCE ALERT */}
        {/* ================================================= */}

        {lowAttendanceSubjects.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-white shadow-sm sm:rounded-3xl">

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">

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
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"
                    />
                  </svg>

                </div>

                <div>

                  <h3 className="text-sm font-bold text-amber-900 sm:text-base">
                    Attendance Attention Required
                  </h3>

                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700 sm:text-sm">
                    {lowAttendanceSubjects.length}{" "}
                    {lowAttendanceSubjects.length === 1
                      ? "subject is"
                      : "subjects are"}{" "}
                    below the 75% attendance requirement.
                  </p>

                </div>

              </div>

              <Link
                to="/attendance"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
              >
                Check Attendance

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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>

              </Link>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* ANALYTICS */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-6 sm:gap-8 xl:grid xl:grid-cols-3">

          {/* SUMMARY */}

          <div className="h-full xl:col-span-2">

            {safeSummary.length === 0 ? (

              <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-900/5">
                  <span className="text-2xl">
                    📋
                  </span>
                </div>

                <p className="text-lg font-bold text-slate-900">
                  Awaiting Data Sync
                </p>

                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                  Your detailed analytics will generate here after the portal syncs your subjects.
                </p>

              </div>

            ) : (

              <AttendanceSummary
                summary={safeSummary}
              />

            )}

          </div>

          {/* CHART */}

          <div className="h-full xl:col-span-1">

            {safeSummary.length === 0 ? (

              <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-900/5">
                  <span className="text-2xl">
                    📊
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900">
                  Chart Unavailable
                </p>

              </div>

            ) : (

              <AttendanceChart
                summary={safeSummary}
              />

            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* SUBJECTS */}
        {/* ================================================= */}

        <div className="mb-8">

          <div className="mb-5 flex items-end justify-between sm:mb-6">

            <div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Your Subjects
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Detailed metrics for every tracked course.
              </p>

            </div>

            <Link
              to="/attendance"
              className="hidden items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 sm:inline-flex"
            >
              View All

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
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>

            </Link>

          </div>

          {safeSummary.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm sm:rounded-3xl">

              <span className="text-4xl">
                📚
              </span>

              <p className="mt-4 text-lg font-bold text-slate-900">
                No active subjects
              </p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Subjects will appear once attendance is logged.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">

              {safeSummary.map(
                (subject, index) => (

                  <SubjectCard
                    key={
                      subject?.subjectId ||
                      subject?.subjectCode ||
                      index
                    }
                    subject={subject}
                  />

                )
              )}

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <div className="mb-8">

          <div className="mb-5">

            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Quickly access the most useful sections of your portal.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* ATTENDANCE */}

            <Link
              to="/attendance"
              className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:rounded-3xl sm:p-6"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

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
                      d="M8.25 6.75h7.5M8.25 12h7.5M8.25 17.25h4.5M5.25 3.75h13.5A2.25 2.25 0 0121 6v12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25z"
                    />
                  </svg>

                </div>

                <div className="min-w-0">

                  <p className="font-bold text-slate-900 group-hover:text-indigo-600">
                    Attendance Logs
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    View complete attendance history
                  </p>

                </div>

              </div>

            </Link>

            {/* PROFILE */}

            <Link
              to="/profile"
              className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg sm:rounded-3xl sm:p-6"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>

                </div>

                <div>

                  <p className="font-bold text-slate-900 group-hover:text-violet-600">
                    My Profile
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    View student account information
                  </p>

                </div>

              </div>

            </Link>

            {/* NOTIFICATIONS */}

            <Link
              to="/notifications"
              className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg sm:rounded-3xl sm:p-6"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">

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
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 00-12 0v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0M12 21a3 3 0 01-3-3h6a3 3 0 01-3 3z"
                    />
                  </svg>

                </div>

                <div>

                  <p className="font-bold text-slate-900 group-hover:text-rose-600">
                    Notifications
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    View attendance alerts and updates
                  </p>

                </div>

              </div>

            </Link>

          </div>

        </div>

        {/* ================================================= */}
        {/* IDENTITY OVERVIEW */}
        {/* ================================================= */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

          <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:px-8 sm:py-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Student Information
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Basic information associated with your account.
                </p>

              </div>

              <Link
                to="/profile"
                className="hidden text-sm font-bold text-indigo-600 hover:text-indigo-700 sm:block"
              >
                View Profile
              </Link>

            </div>

          </div>

          <div className="grid grid-cols-2 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">

            <div className="p-5 sm:p-6 lg:p-8">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Full Name
              </p>

              <p className="mt-2 text-sm font-bold text-slate-900">
                {user?.name || "—"}
              </p>

            </div>

            <div className="p-5 sm:p-6 lg:p-8">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                VTU Number
              </p>

              <p className="mt-2 text-sm font-bold uppercase text-slate-900">
                {user?.vtuNumber || "—"}
              </p>

            </div>

            <div className="p-5 sm:p-6 lg:p-8">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Branch
              </p>

              <p className="mt-2 text-sm font-bold uppercase text-slate-900">
                {user?.branch || "—"}
              </p>

            </div>

            <div className="p-5 sm:p-6 lg:p-8">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                Section
              </p>

              <p className="mt-2 text-sm font-bold uppercase text-slate-900">
                {user?.section || "—"}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* VELTECH AMS PORTAL - MOVED TO VERY BOTTOM */}
        {/* ================================================= */}

        <div className="mb-8">

          <div className="mb-5">

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
                    d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M8 9h.01M12 9h.01M16 9h.01"
                  />
                </svg>

              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                College Portal
              </span>

            </div>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Veltech AMS Portal
            </h2>

            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
              Connect your Veltech AMS account to automatically
              synchronize your attendance and keep your UniEve
              AI dashboard up to date.
            </p>

          </div>

          <PortalCredentialsCard />

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="border-t border-slate-200/60 pt-6 text-center">

          <p className="text-xs font-medium text-slate-400">
            UniEve AI • Smart Student Attendance Management
          </p>

        </div>

      </div>
    </div>
  );
}