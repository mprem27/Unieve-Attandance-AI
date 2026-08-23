import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useAttendance from "../hooks/useAttendance";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

// =====================================================
// LIGHTWEIGHT ACADEMIC BACKGROUND (Fixes Mobile Lag)
// =====================================================
// Replaces the heavy Canvas element with hardware-accelerated CSS
const LightweightBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#f8f9fb] pointer-events-none overflow-hidden">
      {/* Subtle dotted pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{
          backgroundImage: `radial-gradient(#185e3a 1.5px, transparent 1.5px)`,
          backgroundSize: `32px 32px`
        }}
      />
      {/* Soft static ambient glows (GPU accelerated) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] rounded-full bg-emerald-500/10 blur-[100px] transform translate-z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-blue-500/5 blur-[100px] transform translate-z-0" />
    </div>
  );
};

// =====================================================
// TODAY'S TIMETABLE
// =====================================================
const TodaysTimetable = ({ classes }) => {
  const safeClasses = Array.isArray(classes) ? classes : [];

  const getSubject = (item) =>
    item?.subjectName ||
    item?.subject_name ||
    item?.courseName ||
    item?.course_name ||
    item?.subject ||
    item?.name ||
    item?.subjectCode ||
    item?.courseCode ||
    "Subject";

  const getCode = (item) =>
    item?.subjectCode ||
    item?.subject_code ||
    item?.courseCode ||
    item?.course_code ||
    item?.code ||
    "";

  const getTime = (item) => {
    const start =
      item?.startTime ||
      item?.start ||
      item?.from ||
      item?.time ||
      "";
    const end =
      item?.endTime ||
      item?.end ||
      item?.to ||
      "";
    if (start && end) return `${start} - ${end}`;
    return start || end || "Time not available";
  };

  const getStatus = (item) => {
    const value = String(
      item?.status ||
      item?.classStatus ||
      item?.attendanceStatus ||
      ""
    ).toLowerCase();

    if (
      value.includes("ongoing") ||
      value.includes("live") ||
      value.includes("current")
    ) return "Live";

    if (
      value.includes("complete") ||
      value.includes("finish") ||
      value.includes("done")
    ) return "Completed";

    return "Scheduled";
  };

  return (
    <div className="mt-6 border-t border-white/50 pt-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Today's Classes
          </h3>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Today's timetable and class schedule
          </p>
        </div>

        <div className="shrink-0 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest">
            {safeClasses.length} Classes
          </span>
        </div>
      </div>

      {safeClasses.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/50 py-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-gray-400">
            event_busy
          </span>
          <p className="mt-2 text-sm font-bold text-gray-700">
            No classes scheduled today
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Today's timetable will appear here when available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {safeClasses.map((item, index) => {
            const status = getStatus(item);
            const subject = getSubject(item);
            const code = getCode(item);

            return (
              <div
                key={
                  item?.id ||
                  item?._id ||
                  `${code}-${index}`
                }
                className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4
                      className="text-sm font-black text-gray-900 break-words"
                      title={subject}
                    >
                      {subject}
                    </h4>

                    {code && (
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {code}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase shadow-sm ${
                      status === "Live"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : status === "Completed"
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                      Time
                    </p>
                    <p className="mt-1 text-xs font-bold text-gray-700">
                      {getTime(item)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                      Room
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-gray-700">
                      {item?.room ||
                        item?.roomNumber ||
                        item?.classroom ||
                        "—"}
                    </p>
                  </div>
                </div>

                {(item?.faculty ||
                  item?.facultyName ||
                  item?.teacher) && (
                  <div className="mt-2 rounded-xl bg-white border border-slate-100 px-3 py-2 shadow-sm">
                    <p className="truncate text-xs font-semibold text-gray-600">
                      {item?.faculty ||
                        item?.facultyName ||
                        item?.teacher}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =====================================================
// MAIN DASHBOARD COMPONENT
// =====================================================
export default function Dashboard() {
  const { user } = useAuth();

  const {
    summary = [],
    todayAttendance = [],
    todaysClasses = [],
    loading,
    error,
    refresh,
  } = useAttendance();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // =====================================================
  // SAFE DATA
  // =====================================================

  const safeSummary = Array.isArray(summary) ? summary : [];
  const safeTodayAttendance = Array.isArray(todayAttendance) ? todayAttendance : [];
  const safeTodaysClasses = Array.isArray(todaysClasses) ? todaysClasses : [];

  const todayPresentCount = safeTodayAttendance.filter((record) => {
    const status = String(record?.status || record?.attendanceStatus || record?.attendance_status || "").trim().toUpperCase();
    return status === "PRESENT" || status === "P";
  }).length;

  const todayAbsentCount = safeTodayAttendance.filter((record) => {
    const status = String(record?.status || record?.attendanceStatus || record?.attendance_status || "").trim().toUpperCase();
    return status === "ABSENT" || status === "A";
  }).length;

  const todayRecordedCount = todayPresentCount + todayAbsentCount;

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      await refresh();
    } catch (err) {
      console.error("Dashboard refresh failed:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };

  // =====================================================
  // LOADING & ERROR
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
        <div className="w-full max-w-lg rounded-[24px] bg-white/80 backdrop-blur-md border border-white/50 p-6 shadow-md">
          <ErrorMessage message={error} onRetry={handleRefresh} />
        </div>
      </div>
    );
  }

  // =====================================================
  // ATTENDANCE CALCULATIONS
  // =====================================================

  const totalPresent = safeSummary.reduce((total, subject) => total + Number(subject?.present || 0), 0);
  const totalAbsent = safeSummary.reduce((total, subject) => total + Number(subject?.absent || 0), 0);
  const totalClasses = totalPresent + totalAbsent;
  const overallPercentage = totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(0)) : 0;

  // Semi-circle SVG math
  const semiCircleCircumference = 125.6;
  const semiCircleOffset = semiCircleCircumference - (semiCircleCircumference * overallPercentage) / 100;

  // =====================================================
  // REUSABLE PREMIUM UI CLASSES
  // =====================================================

  const premiumCard = "bg-white/70 backdrop-blur-md rounded-[24px] shadow-sm border border-white/80 overflow-hidden transition-all duration-300";
  const arrowBtn = "w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200/50 bg-white/60 flex items-center justify-center text-gray-500 shadow-sm";

  const getBarColor = (index) => {
    if (index % 3 === 0) return "bg-[#185e3a]";
    if (index % 3 === 1) return "bg-[#10b981]";
    return "bg-[#065f46]";
  };

  const chartDisplayData = safeSummary.slice(0, 6);

  // =====================================================
  // DASHBOARD RENDER
  // =====================================================

  return (
    <div className="relative min-h-screen bg-transparent text-gray-900 font-sans pb-28 md:pb-12">
      
      <LightweightBackground />

      {/* FORCE MATERIAL ICONS TO RENDER PROPERLY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
        html { scroll-behavior: auto; }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-weight: normal; font-style: normal; font-size: 24px; line-height: 1;
          display: inline-block; -webkit-font-smoothing: antialiased;
        }
      `}} />

      {/* ================================================= */}
      {/* MOBILE HEADER */}
      {/* ================================================= */}
      <header className="md:hidden fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="font-extrabold text-xl text-[#185e3a] tracking-tight drop-shadow-sm">
          ScholarDash
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm text-gray-600 active:scale-95 transition-all ${isRefreshing ? "animate-spin text-[#185e3a]" : ""}`}
        >
          <span className="material-symbols-outlined text-[20px]">sync</span>
        </button>
      </header>

      {/* ================================================= */}
      {/* MAIN CONTAINER */}
      {/* ================================================= */}
      <main className="relative z-10 mx-auto max-w-[1440px] flex flex-col h-full p-4 pt-24 md:pt-10 md:px-8 gap-6">

        {/* ================================================= */}
        {/* DESKTOP HEADER */}
        {/* ================================================= */}
        <div className="hidden md:flex justify-between items-center mb-2">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-gray-900 drop-shadow-sm">
              Dashboard
            </h1>
            <p className="text-sm font-medium text-gray-600 mt-1 drop-shadow-sm">
              Plan, prioritize, and accomplish your tasks with ease.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#185e3a] border border-[#11462a] rounded-full shadow-md text-sm font-bold text-white hover:bg-[#11462a] transition-all active:scale-95"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin" : ""}`}>sync</span>
              Refresh Data
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* STUDENT PROFILE HERO CARD */}
        {/* ================================================= */}
        <div className="bg-gradient-to-r from-[#185e3a] to-[#0a311b] border border-[#0a311b] rounded-[24px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-h-[130px] mb-2 transform translate-z-0">
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 border-[20px] border-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-30px] left-[20%] w-32 h-32 border-[15px] border-white/10 rounded-full pointer-events-none"></div>
          
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 relative z-10 shadow-inner">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px]">person</span>
          </div>

          <div className="relative z-10 flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-emerald-200 mb-1 flex items-center gap-1.5 tracking-wider uppercase">
              Student Profile
            </h3>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-white drop-shadow-md break-words whitespace-normal" title={user?.name || "Student"}>
              {user?.name || "STUDENT"}
            </h2>
            <p className="text-[#6ee7b7] text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-sm">
              {user?.vtuNumber || "ID Not Synced"}
            </p>
          </div>
        </div>

        {/* ================================================= */}
        {/* ROW 1: 4 STATS CARDS */}
        {/* ================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* Card 1 */}
          <div className="bg-[#185e3a] border border-[#11462a] rounded-[24px] p-5 sm:p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-100 drop-shadow-sm">
                Overall %
              </h3>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 drop-shadow-md">
                {overallPercentage}
              </h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-md text-[9px] sm:text-[10px] font-bold text-white tracking-widest shadow-sm">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">trending_up</span>
                Target: 75%
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 drop-shadow-sm">
                Classes Attended
              </h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 drop-shadow-sm">
                {totalPresent}
              </h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check_circle</span>
                Present
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 drop-shadow-sm">
                Classes Missed
              </h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 drop-shadow-sm">
                {totalAbsent}
              </h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">cancel</span>
                Absent
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 drop-shadow-sm">
                Total Classes
              </h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 drop-shadow-sm">
                {totalClasses}
              </h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">calendar_today</span>
                Conducted
              </div>
            </div>
          </div>

        </div>

        {/* ================================================= */}
        {/* TODAY'S ATTENDANCE */}
        {/* ================================================= */}

        <div className={`${premiumCard} p-5 sm:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 drop-shadow-sm">
                Today's Sync — Live Attendance
              </h3>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                Live attendance recorded for today's timetable
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                Today
              </span>
            </div>
          </div>

          {/* TODAY'S TIMETABLE */}
          <TodaysTimetable classes={safeTodaysClasses} />

          {/* TODAY SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6 mt-6 border-t border-slate-200 pt-6">
            
            {/* PRESENT */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700">Present</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-emerald-700">{todayPresentCount}</p>
            </div>

            {/* ABSENT */}
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-700">Absent</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-rose-700">{todayAbsentCount}</p>
            </div>

            {/* RECORDED */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600">Recorded</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-800">{todayRecordedCount}</p>
            </div>
          </div>

          {/* TODAY SUBJECT LIST */}
          {safeTodayAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-2 drop-shadow-sm">event_busy</span>
              <p className="text-sm font-bold text-slate-700">No attendance recorded today</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Today's attendance will appear here after synchronization.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeTodayAttendance.map((record, index) => {
                const status = String(record?.status || record?.attendanceStatus || record?.attendance_status || "").trim().toUpperCase();
                const isPresent = status === "PRESENT" || status === "P";
                const subjectName = record?.subjectName || record?.subject_name || record?.subjectCode || "Unknown Subject";
                const subjectCode = record?.subjectCode || record?.subject_code || "";

                return (
                  <div key={record?.id || record?._id || `${subjectCode}-${index}`} className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${isPresent ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {isPresent ? "check" : "close"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate" title={subjectName}>
                          {subjectName}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">
                          {subjectCode || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm border ${isPresent ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* ROW 2 & 3 COMBINED: FLEX COLUMN REORDERING GRID */}
        {/* ================================================= */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex flex-col gap-6 lg:col-span-4 order-1 lg:order-2">

            {/* Requirement Tracker */}
            <div className={`${premiumCard} p-6 sm:p-8 flex flex-col justify-between order-1`}>
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4 drop-shadow-sm">
                  Requirement Tracker
                </h3>
                <h4 className="text-2xl font-black text-[#185e3a] drop-shadow-sm">
                  75% Minimum
                </h4>
                <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
                  {overallPercentage >= 75
                    ? "You are maintaining the safe threshold. Keep it up!"
                    : "Warning: You are below the required criteria. Prioritize classes."}
                </p>
              </div>
              <Link to="/attendance" className="mt-6 w-full py-3 bg-[#185e3a] border border-[#11462a] text-white text-sm font-bold rounded-full text-center hover:bg-[#11462a] transition-all flex items-center justify-center gap-2 shadow-md active:scale-95">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Check Status
              </Link>
            </div>

            {/* Overall Attendance Donut */}
            <div className={`${premiumCard} flex flex-col p-6 sm:p-8 order-2`}>
              <h3 className="text-lg font-black text-slate-900 mb-6 text-center sm:text-left drop-shadow-sm">
                Overall Attendance
              </h3>
              
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px] pb-4">
                <div className="relative w-48 h-28 sm:w-56 sm:h-32 flex items-end justify-center overflow-visible mt-2">
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible drop-shadow-md">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#185e3a" strokeWidth="12" strokeLinecap="round" strokeDasharray={semiCircleCircumference} strokeDashoffset={semiCircleOffset} className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute bottom-[-5px] sm:bottom-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                      {overallPercentage}<span className="text-lg sm:text-2xl font-bold text-slate-500 ml-1">%</span>
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Avg</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-10 sm:mt-12 flex flex-col items-center w-full gap-3 border-t border-slate-200 pt-5">
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 w-full">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                      <span className="text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-widest">Present: {totalPresent}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                      <span className="text-[10px] sm:text-xs font-black text-rose-800 uppercase tracking-widest">Absent: {totalAbsent}</span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-black text-slate-600 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm mt-1">
                    Total Conducted: {totalClasses}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= LEFT COLUMN ================= */}
          <div className="flex flex-col gap-6 lg:col-span-8 order-2 lg:order-1">

            {/* Live Sync Details - REMOVED (Duplicate from above) */}
            
            {/* Attendance Summary Graph */}
            <div className={`${premiumCard} flex flex-col p-5 sm:p-8 order-2 lg:order-1`}>
              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-900 drop-shadow-sm">Attendance Summary</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Subject-wise performance overview</p>
              </div>

              <div className="flex-1 bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-center min-h-[300px] sm:min-h-[350px] border border-slate-200 shadow-sm">
                {safeSummary.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400 self-center">Awaiting Data</p>
                ) : (
                  <div className="flex flex-col w-full h-full mt-auto">
                    <div className="flex w-full h-[200px] sm:h-[240px] gap-3 sm:gap-6 justify-around items-end pt-8 pb-6 sm:pb-8">
                      {chartDisplayData.map((subject, index) => {
                        const percentage = Number(subject?.percentage || 0);
                        const barColor = getBarColor(index);
                        const displayLabel = subject?.subjectCode ? subject.subjectCode.slice(-3) : "SUB";

                        return (
                          <div key={index} className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-[30px] sm:min-w-[40px] max-w-[60px] sm:max-w-[70px] h-full z-10">
                            <div className="relative w-full h-full rounded-full flex items-end overflow-visible bg-slate-50 border border-slate-200 shadow-inner">
                              <div className="w-full flex items-end justify-center h-full relative">
                                {percentage > 0 && (
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-md text-[9px] sm:text-[11px] font-black text-[#185e3a] px-2 py-0.5 rounded-full z-20">
                                    {percentage}%
                                  </div>
                                )}
                                <div className={`w-full rounded-full transition-all duration-1000 ease-out shadow-sm ${percentage > 0 ? barColor : "bg-transparent"}`} style={{ height: `${percentage}%` }}></div>
                              </div>
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black text-slate-700 uppercase tracking-widest truncate w-full text-center absolute bottom-0 drop-shadow-sm">
                              {displayLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2 sm:mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2.5 w-full">
                      {chartDisplayData.map((subject, index) => {
                        const displayLabel = subject?.subjectCode ? subject.subjectCode.slice(-3) : "SUB";
                        return (
                          <div key={index} className="flex items-center gap-1.5 min-w-[120px] max-w-[180px]">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${getBarColor(index)}`}></div>
                            <span className="text-[10px] sm:text-[11px] font-black text-slate-800 shrink-0 uppercase tracking-widest drop-shadow-sm">
                              {displayLabel}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate" title={subject?.subjectName}>
                              - {subject?.subjectName || "Subject"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* BOTTOM SECTION: COURSE METRICS */}
        {/* ================================================= */}

        <div className={`mb-10 ${premiumCard} flex flex-col p-5 sm:p-8`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 drop-shadow-sm">Course Metrics</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Detailed performance breakdown</p>
            </div>
            <Link to="/attendance" className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm active:scale-95">
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              Full Logs
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {safeSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 drop-shadow-sm">library_books</span>
                <p className="text-slate-600 font-bold text-sm">No active subjects found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {safeSummary.map((subject, index) => {
                  const percentage = Number(subject?.percentage || 0);
                  const total = Number(subject?.present || 0) + Number(subject?.absent || 0);
                  const isLow = percentage < 75;

                  return (
                    <div key={subject?.subjectId || subject?.subjectCode || index} className="flex flex-col gap-4 group border border-slate-200 bg-white p-5 sm:p-6 rounded-2xl hover:border-[#185e3a]/30 hover:shadow-md transition-all shadow-sm">
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-slate-50 border border-slate-200 text-[#185e3a] flex items-center justify-center shadow-sm mt-0.5">
                            <span className="material-symbols-outlined text-[20px]">book</span>
                          </div>
                          <div className="min-w-0 pt-1">
                            <h4 className="text-[14px] sm:text-[15px] font-black text-slate-900 truncate pr-2" title={subject?.subjectName || subject?.subjectCode}>
                              {subject?.subjectName || subject?.subjectCode || "Unknown Subject"}
                            </h4>
                            <p className="text-[11px] sm:text-[12px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest truncate">
                              {subject?.subjectCode || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 pt-1">
                          <span className={`inline-block px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm border ${isLow ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-[#185e3a] border-emerald-200"}`}>
                            {isLow ? "WARNING" : "ON TRACK"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-[11px] sm:text-[12px] font-bold text-slate-600">
                            Attended: <span className="text-slate-900 ml-1">{subject?.present} / {total} Classes</span>
                          </span>
                          <span className={`text-[13px] sm:text-[14px] font-black ${isLow ? "text-rose-600" : "text-[#185e3a]"}`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 sm:h-3 bg-slate-100 border border-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 shadow-sm ${isLow ? "bg-rose-500" : "bg-[#185e3a]"}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ================================================= */}
      {/* MOBILE BOTTOM NAVIGATION */}
      {/* ================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link to="/" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-[#185e3a] bg-emerald-50 border border-emerald-200 shadow-sm transition-all">
          <span className="material-symbols-outlined filled text-[24px]">dashboard</span>
          <span className="text-[10px] font-black mt-1 tracking-wider uppercase">Home</span>
        </Link>
        <Link to="/attendance" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-slate-400 hover:text-[#185e3a] transition-all">
          <span className="material-symbols-outlined text-[24px]">analytics</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Logs</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-slate-400 hover:text-[#185e3a] transition-all">
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Profile</span>
        </Link>
      </nav>

    </div>
  );
}