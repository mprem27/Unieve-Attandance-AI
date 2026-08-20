import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useAttendance from "../hooks/useAttendance";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

// =====================================================
// GLOBAL ACADEMIC BACKGROUND ANIMATION
// =====================================================
const BackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let elements = [];
    
    // Balanced density
    const maxElements = 35; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    class AcademicElement {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50; 
        this.size = Math.random() * 20 + 15; 
        
        // Auto-moving floating upwards
        this.speedY = -(Math.random() * 0.3 + 0.1); 
        this.speedX = (Math.random() - 0.5) * 0.2; 
        
        // Faint opacity so it stays in the background
        this.opacity = Math.random() * 0.04 + 0.02; 
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.005;
        
        // Type: 0 = ID Card, 1 = Number, 2 = Grad Cap
        this.type = Math.floor(Math.random() * 3);
        this.textValue = Math.random() > 0.5 ? Math.floor(Math.random() * 9000 + 1000).toString() : "0110";
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotSpeed;

        if (this.y < -60 || this.x < -60 || this.x > canvas.width + 60) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Emerald/Dark Green palette to match theme
        ctx.strokeStyle = `rgba(24, 94, 58, ${this.opacity})`; 
        ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`; 
        ctx.lineWidth = 1.5;

        switch(this.type) {
          case 0: // ID CARD DESIGN
            let w = this.size * 1.4;
            let h = this.size * 0.9;
            ctx.strokeRect(-w/2, -h/2, w, h);
            ctx.strokeRect(-w/2 + 6, -h/2 + 6, w*0.3, h*0.5);
            ctx.beginPath();
            ctx.moveTo(-w/2 + w*0.45, -h/2 + 10); ctx.lineTo(w/2 - 6, -h/2 + 10);
            ctx.moveTo(-w/2 + w*0.45, -h/2 + 18); ctx.lineTo(w/2 - 12, -h/2 + 18);
            ctx.stroke();
            break;

          case 1: // STUDENT NUMBERS
            ctx.font = `600 ${this.size * 0.7}px system-ui`;
            ctx.fillText(this.textValue, -this.size/2, 0);
            break;

          case 2: // GRADUATION CAP SYMBOL
            let s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, -s/3);
            ctx.lineTo(s/2, 0);
            ctx.lineTo(0, s/3);
            ctx.lineTo(-s/2, 0);
            ctx.closePath();
            ctx.moveTo(-s/4, s/8);
            ctx.quadraticCurveTo(0, s/3, s/4, s/8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s/2, 0);
            ctx.lineTo(s/2 + 4, s/4);
            ctx.stroke();
            break;
          default:
            break;
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < maxElements; i++) {
      elements.push(new AcademicElement());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < elements.length; i++) {
        elements[i].update();
        elements[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1, backgroundColor: "#f8f9fb" }}
    />
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

  const todayPresentCount = safeTodayAttendance.filter((record) => {
    const status = String(
      record?.status ||
      record?.attendanceStatus ||
      record?.attendance_status ||
      ""
    ).trim().toUpperCase();

    return status === "PRESENT" || status === "P";
  }).length;

  const todayAbsentCount = safeTodayAttendance.filter((record) => {
    const status = String(
      record?.status ||
      record?.attendanceStatus ||
      record?.attendance_status ||
      ""
    ).trim().toUpperCase();

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
        <div className="w-full max-w-lg rounded-[24px] bg-white/70 backdrop-blur-md border border-white/50 p-6 shadow-sm">
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
  
  const overallPercentage = totalClasses > 0 
    ? Number(((totalPresent / totalClasses) * 100).toFixed(0)) 
    : 0;

  // Semi-circle SVG math
  const semiCircleCircumference = 125.6; 
  const semiCircleOffset = semiCircleCircumference - (semiCircleCircumference * overallPercentage) / 100;

  // =====================================================
  // REUSABLE PREMIUM UI CLASSES (GLASSMORPHISM ADDED)
  // =====================================================
  // Replaced solid white with bg-white/70 and backdrop-blur-md
  const premiumCard = "bg-white/70 backdrop-blur-md rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden transition-all duration-300";
  const arrowBtn = "w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200/50 bg-white/50 flex items-center justify-center text-gray-500 backdrop-blur-sm";

  // Helper for consistent bar colors in charts
  const getBarColor = (index) => {
    if (index % 3 === 0) return "bg-[#185e3a]"; // Dark Green
    if (index % 3 === 1) return "bg-[#10b981]"; // Emerald
    return "bg-[#065f46]"; // Deepest Green
  };

  const chartDisplayData = safeSummary.slice(0, 6);

  // =====================================================
  // DASHBOARD RENDER
  // =====================================================

  return (
    // Note: root div is transparent so the background canvas shines through
    <div className="relative min-h-screen bg-transparent text-gray-900 font-sans pb-28 md:pb-12">
      
      <BackgroundCanvas />

      {/* FORCE MATERIAL ICONS TO RENDER PROPERLY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}} />

      {/* MOBILE HEADER - Glassmorphism */}
      <header className="md:hidden fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-20 bg-white/70 backdrop-blur-xl border-b border-white/50">
        <div className="font-extrabold text-xl text-[#185e3a] tracking-tight drop-shadow-sm">
          ScholarDash
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/80 border border-white/50 shadow-sm text-gray-600 active:scale-95 transition-all ${isRefreshing ? "animate-spin text-[#185e3a]" : ""}`}
        >
          <span className="material-symbols-outlined text-[20px]">sync</span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 mx-auto max-w-[1440px] flex flex-col h-full p-4 pt-24 md:pt-10 md:px-8 gap-6">
        
        {/* ================================================= */}
        {/* DESKTOP HEADER */}
        {/* ================================================= */}
        <div className="hidden md:flex justify-between items-center mb-2">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-gray-900 drop-shadow-sm">
              Dashboard
            </h1>
            <p className="text-sm font-medium text-gray-600 mt-1 drop-shadow-sm">Plan, prioritize, and accomplish your tasks with ease.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#185e3a]/90 backdrop-blur-md border border-white/20 rounded-full shadow-sm text-sm font-medium text-white hover:bg-[#11462a] transition-colors active:scale-95"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin" : ""}`}>
                sync
              </span>
              Refresh Data
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* STUDENT PROFILE HERO CARD (Top - Glassmorphism) */}
        {/* ================================================= */}
        <div className="bg-gradient-to-r from-[#185e3a]/85 to-[#0a311b]/85 backdrop-blur-md border border-white/10 rounded-[24px] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-h-[130px] mb-2">
          {/* Abstract decorative circles */}
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 border-[20px] border-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-30px] left-[20%] w-32 h-32 border-[15px] border-white/10 rounded-full pointer-events-none"></div>
          
          {/* Profile Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0 relative z-10 shadow-inner">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px]">person</span>
          </div>
          
          {/* Profile Text Data */}
          <div className="relative z-10 flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-emerald-100/90 mb-1 flex items-center gap-1.5">
              Student Profile
            </h3>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 truncate text-white drop-shadow-md" title={user?.name || "Student"}>
              {user?.name || "STUDENT"}
            </h2>
            <p className="text-[#6ee7b7] text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-sm">{user?.vtuNumber || "ID Not Synced"}</p>
          </div>
        </div>

        {/* ================================================= */}
        {/* ROW 1: 4 STATS CARDS */}
        {/* ================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Overall % (Dark Green - Glassmorphism) */}
          <div className="bg-[#185e3a]/85 backdrop-blur-md border border-white/20 rounded-[24px] p-5 sm:p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">Overall %</h3>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-inner">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-md">{overallPercentage}</h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/10 rounded-md text-[9px] sm:text-[10px] font-medium text-emerald-50 tracking-wider shadow-sm">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">trending_up</span>
                Target: 75%
              </div>
            </div>
          </div>

          {/* Card 2: Attended */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-800 drop-shadow-sm">Classes Attended</h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 drop-shadow-sm">{totalPresent}</h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-[#ecfdf5]/80 backdrop-blur-sm border border-[#10b981]/20 text-[#10b981] rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check_circle</span>
                Present
              </div>
            </div>
          </div>

          {/* Card 3: Missed */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-800 drop-shadow-sm">Classes Missed</h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 drop-shadow-sm">{totalAbsent}</h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-[#fef2f2]/80 backdrop-blur-sm border border-[#ef4444]/20 text-[#ef4444] rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">cancel</span>
                Absent
              </div>
            </div>
          </div>

          {/* Card 4: Total */}
          <div className={`${premiumCard} p-5 sm:p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-800 drop-shadow-sm">Total Classes</h3>
              <div className={arrowBtn}>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform -rotate-45">arrow_forward</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 drop-shadow-sm">{totalClasses}</h2>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 rounded-md text-[9px] sm:text-[10px] font-bold shadow-sm">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">calendar_today</span>
                Conducted
              </div>
            </div>
          </div>

        </div>

        {/* ================================================= */}
        {/* ROW 2 & 3 COMBINED: FLEX COLUMN REORDERING GRID */}
        {/* ================================================= */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
          
          {/* ================= RIGHT COLUMN (Renders FIRST on Mobile) ================= */}
          <div className="flex flex-col gap-6 lg:col-span-4 order-1 lg:order-2">
            
            {/* Requirement Tracker */}
            <div className={`${premiumCard} p-6 sm:p-8 flex flex-col justify-between order-1`}>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 drop-shadow-sm">Requirement Tracker</h3>
                <h4 className="text-2xl font-bold text-[#185e3a] drop-shadow-sm">75% Minimum</h4>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {overallPercentage >= 75 
                    ? "You are maintaining the safe threshold. Keep it up!" 
                    : "Warning: You are below the required criteria. Prioritize classes."}
                </p>
              </div>
              <Link to="/attendance" className="mt-6 w-full py-3 bg-[#185e3a]/90 backdrop-blur-md border border-white/20 text-white text-sm font-bold rounded-full text-center hover:bg-[#11462a] transition-colors flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Check Status
              </Link>
            </div>

            {/* Overall Attendance Donut */}
            <div className={`${premiumCard} flex flex-col p-6 sm:p-8 order-2`}>
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center sm:text-left drop-shadow-sm">Overall Attendance</h3>
              
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px] pb-4">
                <div className="relative w-48 h-28 sm:w-56 sm:h-32 flex items-end justify-center overflow-visible mt-2">
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible drop-shadow-sm">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#185e3a" strokeWidth="12" strokeLinecap="round" strokeDasharray={semiCircleCircumference} strokeDashoffset={semiCircleOffset} className="transition-all duration-1000 ease-out drop-shadow-md" />
                  </svg>
                  <div className="absolute bottom-[-5px] sm:bottom-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
                      {overallPercentage}<span className="text-lg sm:text-2xl font-bold text-gray-500 ml-1">%</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Avg</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-10 sm:mt-12 flex flex-col items-center w-full gap-3 border-t border-white/50 pt-5">
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 w-full">
                    <div className="flex items-center gap-2 bg-[#ecfdf5]/80 backdrop-blur-sm border border-[#d1fae5]/50 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest">Present: {totalPresent}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#fef2f2]/80 backdrop-blur-sm border border-[#ffe4e6]/50 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                      <span className="text-[10px] sm:text-xs font-bold text-rose-800 uppercase tracking-widest">Absent: {totalAbsent}</span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-600 bg-white/60 backdrop-blur-sm border border-white/50 px-4 py-1.5 rounded-full shadow-sm mt-1">
                    Total Conducted: {totalClasses}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ================= LEFT COLUMN (Renders SECOND on Mobile) ================= */}
          <div className="flex flex-col gap-6 lg:col-span-8 order-2 lg:order-1">
            
            {/* Today's Sync */}
            <div className={`${premiumCard} flex flex-col p-5 sm:p-8 order-1 lg:order-2`}>
              <div className="flex justify-between items-center mb-6 border-b border-white/50 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm">Today's Sync</h3>
                  <p className="text-xs text-gray-600 mt-1 font-medium">Live from college records</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/50 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Live Updates</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">Live</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[300px]">
                {safeTodayAttendance.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center py-10">
                    <span className="material-symbols-outlined text-gray-400 text-5xl mb-2 drop-shadow-sm">event_busy</span>
                    <p className="text-gray-600 font-medium text-sm">No classes logged today.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {safeTodayAttendance.map((record, index) => {
                      const isPresent = String(record?.status || "").toUpperCase() === "PRESENT" || String(record?.status || "").toUpperCase() === "P";
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl hover:bg-white/80 hover:shadow-md transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner border ${isPresent ? 'bg-[#ecfdf5]/80 border-emerald-200/50 text-[#10b981]' : 'bg-[#fef2f2]/80 border-rose-200/50 text-[#ef4444]'}`}>
                              <span className="material-symbols-outlined text-[20px]">
                                {isPresent ? 'check' : 'close'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 drop-shadow-sm" title={record?.subjectName || record?.subjectCode}>
                                {record?.subjectName || record?.subjectCode || "Unknown Subject"}
                              </h4>
                              <p className="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">
                                {record?.subjectCode || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border ${isPresent ? 'bg-[#ecfdf5]/80 border-emerald-200/50 text-[#10b981]' : 'bg-[#fef2f2]/80 border-rose-200/50 text-[#ef4444]'}`}>
                            {record?.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary Graph */}
            <div className={`${premiumCard} flex flex-col p-5 sm:p-8 order-2 lg:order-1`}>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm">Attendance Summary</h3>
                <p className="text-xs text-gray-600 mt-1 font-medium">Subject-wise performance overview</p>
              </div>
              
              <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 flex flex-col justify-center min-h-[300px] sm:min-h-[350px] border border-white/50 shadow-inner">
                {safeSummary.length === 0 ? (
                  <p className="text-sm font-medium text-gray-500 self-center">Awaiting Data</p>
                ) : (
                  <div className="flex flex-col w-full h-full mt-auto">
                    
                    {/* The Graph Area */}
                    <div className="flex w-full h-[180px] sm:h-[240px] gap-2 sm:gap-4">
                      <div className="flex flex-col justify-between items-end pr-2 sm:pr-4 border-r border-gray-300/50 text-[9px] sm:text-[10px] font-bold text-gray-500 pb-6 sm:pb-8 shrink-0">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>0%</span>
                      </div>

                      <div className="flex-1 flex items-end justify-around relative pb-6 sm:pb-8">
                        <div className="absolute inset-0 flex flex-col justify-between pb-6 sm:pb-8 pointer-events-none opacity-30">
                           <div className="w-full border-t border-dashed border-gray-400"></div>
                           <div className="w-full border-t border-dashed border-gray-400"></div>
                           <div className="w-full border-t border-dashed border-gray-400"></div>
                           <div className="w-full border-t border-gray-400"></div>
                        </div>

                        {chartDisplayData.map((subject, index) => {
                          const percentage = Number(subject?.percentage || 0);
                          const barColor = getBarColor(index);
                          
                          return (
                            <div key={index} className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-[24px] sm:min-w-[40px] max-w-[48px] sm:max-w-[64px] h-full z-10">
                              <div className="relative w-full h-full rounded-full flex items-end overflow-visible bg-white/60 border border-white/50 shadow-inner" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px)' }}>
                                <div className="group w-full flex items-end justify-center h-full relative cursor-pointer">
                                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/90 backdrop-blur-sm shadow-md text-white px-2 py-1 rounded-md z-20 whitespace-nowrap flex flex-col items-center pointer-events-none">
                                    <span className="text-[10px] sm:text-[11px] font-bold leading-none">{percentage}%</span>
                                  </div>
                                  <div className={`w-full rounded-full transition-all duration-1000 ease-out shadow-sm ${percentage > 0 ? barColor : 'bg-transparent'}`} style={{ height: `${percentage}%` }}>
                                    {index === 2 && percentage > 0 && (
                                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-white/50 shadow-sm text-[8px] sm:text-[10px] font-bold text-[#185e3a] px-1.5 sm:px-2 py-0.5 rounded-full z-20">
                                        {percentage}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[8px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-widest truncate w-full text-center absolute bottom-0 drop-shadow-sm">
                                {subject?.subjectCode ? subject.subjectCode.substring(0, 3) : "SUB"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 pt-4 border-t border-gray-300/50 flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2.5 w-full">
                      {chartDisplayData.map((subject, index) => (
                        <div key={index} className="flex items-center gap-1.5 min-w-[120px] max-w-[180px]">
                           <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${getBarColor(index)}`}></div>
                           <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 shrink-0 uppercase tracking-widest drop-shadow-sm">{subject?.subjectCode ? subject.subjectCode.substring(0, 3) : "SUB"}</span>
                           <span className="text-[9px] sm:text-[10px] font-medium text-gray-600 truncate" title={subject?.subjectName}>- {subject?.subjectName || "Subject"}</span>
                        </div>
                      ))}
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
              <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm">Course Metrics</h3>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Detailed performance breakdown</p>
            </div>
            <Link to="/attendance" className="px-4 py-2 border border-white/50 bg-white/60 backdrop-blur-md rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-white/80 text-gray-700 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span> Full Logs
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {safeSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-3 drop-shadow-sm">library_books</span>
                <p className="text-gray-600 font-medium">No active subjects found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {safeSummary.map((subject, index) => {
                  const percentage = Number(subject?.percentage || 0);
                  const total = Number(subject?.present || 0) + Number(subject?.absent || 0);
                  const isLow = percentage < 75;

                  return (
                    <div key={subject?.subjectId || subject?.subjectCode || index} className="flex flex-col gap-4 group border border-white/50 bg-white/50 backdrop-blur-md p-5 sm:p-6 rounded-2xl hover:bg-white/70 hover:shadow-lg transition-all shadow-sm">
                      
                      {/* Top Row: Icon, Name, and Status Badge */}
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 text-[#185e3a] flex items-center justify-center shadow-sm mt-0.5">
                             <span className="material-symbols-outlined text-[20px]">book</span>
                          </div>
                          <div className="min-w-0 pt-1">
                            <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-900 truncate pr-2 drop-shadow-sm">
                              {subject?.subjectName || subject?.subjectCode || "Unknown Subject"}
                            </h4>
                            <p className="text-[11px] sm:text-[12px] text-gray-600 uppercase mt-0.5 tracking-widest truncate">
                              {subject?.subjectCode || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 pt-1">
                           <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm border ${isLow ? 'bg-red-100/80 backdrop-blur-sm text-red-700 border-red-200/50' : 'bg-emerald-100/80 backdrop-blur-sm text-[#185e3a] border-emerald-200/50'}`}>
                             {isLow ? 'WARNING' : 'ON TRACK'}
                           </span>
                        </div>
                      </div>
                      
                      {/* Bottom Row: Progress Bar & Exact Fraction */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-[11px] sm:text-[12px] font-bold text-gray-600">
                            Attended: <span className="text-gray-900 ml-1 drop-shadow-sm">{subject?.present} / {total} Classes</span>
                          </span>
                          <span className={`text-[13px] sm:text-[14px] font-black drop-shadow-sm ${isLow ? 'text-red-600' : 'text-[#185e3a]'}`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 sm:h-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${isLow ? 'bg-red-500' : 'bg-[#185e3a]'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
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

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link to="/" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-[#185e3a] bg-emerald-50/80 border border-emerald-100/50 transition-all shadow-sm">
          <span className="material-symbols-outlined filled text-[24px]">dashboard</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Home</span>
        </Link>

        <Link to="/attendance" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-gray-500 hover:text-[#185e3a] hover:bg-white/50 transition-all">
          <span className="material-symbols-outlined text-[24px]">analytics</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Logs</span>
        </Link>

        <Link to="/profile" className="flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] text-gray-500 hover:text-[#185e3a] hover:bg-white/50 transition-all">
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Profile</span>
        </Link>
      </nav>

    </div>
  );
}