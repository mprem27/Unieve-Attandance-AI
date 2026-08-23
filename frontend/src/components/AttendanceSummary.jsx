import React, { useEffect, useMemo, useState } from "react";

// =====================================================
// ATTENDANCE CALCULATION LOGIC
// =====================================================

const getAttendanceTotals = (summary) => {
  const safeSummary = Array.isArray(summary) ? summary : [];
  const totalPresent = safeSummary.reduce((total, subject) => total + (Number(subject?.present) || 0), 0);
  const totalAbsent = safeSummary.reduce((total, subject) => total + (Number(subject?.absent) || 0), 0);
  const totalClasses = totalPresent + totalAbsent;
  const percentage = totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(2)) : 0;

  return { totalPresent, totalAbsent, totalClasses, percentage };
};

const getTargetInformation = (present, absent, percentage) => {
  const target = 75;
  let classesNeeded = 0;
  let classesCanMiss = 0;

  if (percentage < target) {
    const denominator = target / 100;
    classesNeeded = Math.ceil((denominator * (present + absent) - present) / (1 - denominator));
    if (classesNeeded < 0) classesNeeded = 0;
  } else {
    let missed = 0;
    while ((present / (present + absent + missed + 1)) * 100 >= target) {
      missed += 1;
      if (missed > 1000) break; // safeguard
    }
    classesCanMiss = missed;
  }

  return { target, classesNeeded, classesCanMiss };
};

const getSubjectPercentage = (subject) => {
  const present = Number(subject?.present) || 0;
  const absent = Number(subject?.absent) || 0;
  const total = present + absent;
  return total <= 0 ? 0 : Number(((present / total) * 100).toFixed(2));
};

// =====================================================
// DYNAMIC THEME & WAVES (Strict Logo Colors)
// =====================================================

const getTheme = (percentage) => {
  if (percentage >= 75) {
    return {
      status: "Excellent Standing",
      message: "You are exceeding the university attendance requirements.",
      colorHex: "#10b981", // Emerald
      bgGradient: "from-[#185e3a] via-[#10b981] to-[#047857]", // Deep Green to Emerald
      textColor: "text-[#10b981]",
      waveType: "smooth",
    };
  }

  if (percentage >= 65) {
    return {
      status: "Warning Zone",
      message: "You are dangerously close to the minimum threshold.",
      colorHex: "#f59e0b", // Gold
      bgGradient: "from-[#1e3a8a] via-[#3b82f6] to-[#1e3a8a]", // Navy Blue
      textColor: "text-[#f59e0b]",
      waveType: "choppy",
    };
  }

  return {
    status: "Critical Shortage",
    message: "Immediate action required. You are currently ineligible for exams.",
    colorHex: "#b91c1c", // Vel Tech Red
    bgGradient: "from-[#991b1b] via-[#b91c1c] to-[#7f1d1d]", // Red Gradient
    textColor: "text-[#b91c1c]",
    waveType: "jagged",
  };
};

// =====================================================
// DYNAMIC WAVE COMPONENT
// =====================================================

const DynamicWaves = ({ type }) => {
  if (type === "smooth") {
    return (
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[75%] flex items-end">
        <svg className="absolute bottom-0 w-full h-full animate-[wave-front_14s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,60 C150,150 350,0 600,60 C850,120 1050,0 1200,60 L1200,150 L0,150 Z" opacity=".15" />
        </svg>
        <svg className="absolute bottom-0 w-full h-[85%] animate-[wave-back_18s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,80 C200,20 400,140 600,80 C800,20 1000,140 1200,80 L1200,150 L0,150 Z" opacity=".25" />
        </svg>
        <svg className="absolute bottom-0 w-full h-[70%] animate-[wave-front_22s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,100 C250,180 450,40 700,100 C900,160 1100,40 1200,100 L1200,150 L0,150 Z" opacity=".35" />
        </svg>
      </div>
    );
  }
  if (type === "choppy") {
    return (
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[70%] flex items-end">
        <svg className="absolute bottom-0 w-[200%] h-full animate-[wave-front_10s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,40 Q100,100 200,40 T400,40 T600,40 T800,40 T1000,40 T1200,40 L1200,150 L0,150 Z" opacity=".2" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] h-[80%] animate-[wave-back_14s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,60 Q150,130 300,60 T600,60 T900,60 T1200,60 L1200,150 L0,150 Z" opacity=".3" />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[65%] flex items-end">
      <svg className="absolute bottom-0 w-[200%] h-full animate-[wave-front_8s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,100 L100,20 L200,110 L300,30 L400,100 L500,10 L600,90 L700,20 L800,110 L900,30 L1000,100 L1100,10 L1200,90 L1200,150 L0,150 Z" opacity=".2" />
      </svg>
      <svg className="absolute bottom-0 w-[200%] h-[75%] animate-[wave-back_12s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,120 L150,40 L300,120 L450,50 L600,120 L750,30 L900,120 L1050,40 L1200,120 L1200,150 L0,150 Z" opacity=".3" />
      </svg>
    </div>
  );
};

// =====================================================
// REALISTIC ANIMATED WALKING STUDENT
// =====================================================

const WalkingStudent = ({ isEligible }) => {
  const speed = isEligible ? "1.2s" : "2.4s"; // Swift confident walk vs slow trudge
  const color = isEligible ? "bg-white" : "bg-white/90";
  const shadow = isEligible ? "bg-white/60" : "bg-white/40";
  const backpackColor = isEligible ? "bg-white/80" : "bg-white/50";

  return (
    <div className="relative h-44 w-28 translate-x-4 sm:translate-x-0 drop-shadow-2xl">
      <div 
        className="absolute inset-0 origin-bottom"
        style={{ animation: `walk-bob ${speed} infinite ease-in-out` }}
      >
        {/* Back Arm (Left Arm) */}
        <div 
          className={`absolute top-[50px] left-[45px] h-[55px] w-[14px] rounded-full ${shadow} origin-[50%_15%]`}
          style={{ animation: `swing-b ${speed} infinite ease-in-out` }}
        />
        
        {/* Back Leg (Left Leg) */}
        <div 
          className={`absolute top-[100px] left-[48px] h-[65px] w-[18px] rounded-full ${shadow} origin-[50%_10%]`}
          style={{ animation: `swing-b ${speed} infinite ease-in-out` }}
        />
        
        {/* Backpack (Right side, since walking left) */}
        <div className={`absolute top-[45px] right-[4px] h-[60px] w-[28px] rounded-[14px] ${backpackColor}`} />

        {/* Torso */}
        <div className={`absolute top-[42px] left-[35px] h-[75px] w-[28px] rounded-full ${color} z-10`} />

        {/* Head */}
        <div 
          className={`absolute top-[0px] left-[24px] h-[38px] w-[38px] rounded-full ${color} z-10`}
          style={{ animation: `head-bob ${speed} infinite ease-in-out` }}
        />

        {/* Front Leg (Right Leg) */}
        <div 
          className={`absolute top-[100px] left-[35px] h-[65px] w-[18px] rounded-full ${color} z-10 origin-[50%_10%]`}
          style={{ animation: `swing-f ${speed} infinite ease-in-out` }}
        />

        {/* Front Arm (Right Arm) */}
        <div 
          className={`absolute top-[50px] left-[35px] h-[55px] w-[14px] rounded-full ${color} z-20 origin-[50%_15%]`}
          style={{ animation: `swing-f ${speed} infinite ease-in-out` }}
        />
      </div>
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AttendanceAnalytics({ summary = [] }) {
  const { totalPresent, totalAbsent, totalClasses, percentage } = getAttendanceTotals(summary);
  const [animatedPct, setAnimatedPct] = useState(0);

  const theme = getTheme(percentage);
  const overallTargetInfo = useMemo(() => getTargetInformation(totalPresent, totalAbsent, percentage), [totalPresent, totalAbsent, percentage]);
  const isEligible = percentage >= 75;

  const subjectAnalytics = useMemo(() => {
    const safeSummary = Array.isArray(summary) ? summary : [];
    return safeSummary
      .map((subject, index) => {
        const present = Number(subject?.present) || 0;
        const absent = Number(subject?.absent) || 0;
        const subjPct = getSubjectPercentage(subject);
        const targets = getTargetInformation(present, absent, subjPct);

        return {
          ...subject,
          name: subject?.subjectName || subject?.name || `Subject ${index + 1}`,
          code: subject?.subjectCode || subject?.code || "",
          present,
          absent,
          total: present + absent,
          percentage: subjPct,
          needed: targets.classesNeeded,
          canMiss: targets.classesCanMiss,
        };
      })
      .filter((s) => s.total > 0);
  }, [summary]);

  const deficitSubjects = subjectAnalytics.filter(s => s.percentage < 75);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPct(percentage), 150);
    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className="relative mx-auto mt-6 flex w-full max-w-[1400px] flex-col gap-8 pb-10">

      {/* INJECT KEYFRAMES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-front { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wave-back { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes walk-bob {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes head-bob {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg) translateY(2px) translateX(-2px); }
        }
        @keyframes swing-f {
          0% { transform: rotate(35deg); }
          50% { transform: rotate(-35deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes swing-b {
          0% { transform: rotate(-35deg); }
          50% { transform: rotate(35deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(80px) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-200px) scale(1.4); opacity: 0; }
        }
        @keyframes smoke-drift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50% { transform: translate(40px, -30px) scale(1.1); opacity: 0.35; }
        }
      `}} />

      {/* =================================================
          1. HERO SECTION (Walking Student ON Waves)
      ================================================= */}
      <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${theme.bgGradient} p-8 pb-10 shadow-2xl transition-colors duration-700 sm:p-12 sm:pb-16`}>
        
        {/* SMOKE EFFECTS */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-20 h-64 w-64 rounded-full bg-white/10 blur-[60px] animate-[smoke-drift_10s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 -right-10 h-72 w-72 rounded-full bg-white/20 blur-[70px] animate-[smoke-drift_12s_ease-in-out_infinite_reverse]" />
        </div>

        {/* Dynamic Background Waves */}
        <div className="pointer-events-none absolute inset-0 text-white z-0">
          <DynamicWaves type={theme.waveType} />
        </div>

        {/* WATER BUBBLES */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-[-10px] left-[15%] h-3 w-3 rounded-full bg-white/40 blur-[1px] animate-[float-up_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-20px] left-[35%] h-5 w-5 rounded-full bg-white/30 blur-[2px] animate-[float-up_6s_ease-in-out_infinite]" style={{animationDelay: '1.5s'}} />
          <div className="absolute bottom-[-5px] left-[55%] h-4 w-4 rounded-full bg-white/50 blur-[0.5px] animate-[float-up_5s_ease-in-out_infinite]" style={{animationDelay: '3s'}} />
          <div className="absolute bottom-[-15px] left-[75%] h-6 w-6 rounded-full bg-white/20 blur-[1px] animate-[float-up_7s_ease-in-out_infinite]" style={{animationDelay: '0.8s'}} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
          
          <div className="text-center lg:text-left flex-1 mt-4 lg:mt-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full`} style={{ backgroundColor: theme.colorHex, opacity: 0.7 }}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5`} style={{ backgroundColor: theme.colorHex }}></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white drop-shadow-sm">
                {theme.status}
              </span>
            </div>
            <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl drop-shadow-md">
              {animatedPct}% <span className="text-2xl sm:text-3xl font-bold opacity-80">Overall</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm sm:text-base font-medium text-white/90 lg:mx-0 leading-relaxed drop-shadow-sm">
              {theme.message}
            </p>
          </div>

          {/* Animated Student Walking */}
          <div className="relative flex flex-col items-center shrink-0 mb-4 lg:mb-0">
            <WalkingStudent isEligible={isEligible} />
          </div>

        </div>
      </div>

      {/* =================================================
          2. FLOATING DATA TICKETS
      ================================================= */}
      <div className="relative z-20 -mt-16 grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6 sm:px-8">
        
        {/* TOTAL CLASSES (Navy / Cyan) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0ea5e9]/15 text-[#0ea5e9]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Classes</p>
            <p className="text-3xl font-black text-[#1e3a8a]">{totalClasses}</p>
          </div>
        </div>

        {/* PRESENT (Deep Green / Emerald) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10b981]/15 text-[#10b981]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Attended</p>
            <p className="text-3xl font-black text-[#185e3a]">{totalPresent}</p>
          </div>
        </div>

        {/* ABSENT (Vel Tech Red) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b91c1c]/10 text-[#b91c1c]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Missed</p>
            <p className="text-3xl font-black text-[#b91c1c]">{totalAbsent}</p>
          </div>
        </div>
      </div>

      {/* =================================================
          3. ACADEMIC ACTION PLAN (Specific Subjects)
      ================================================= */}
      <div className={`mx-4 sm:mx-8 rounded-[32px] border p-6 sm:p-8 flex flex-col gap-6 shadow-sm
        ${deficitSubjects.length === 0 ? 'border-[#10b981]/30 bg-[#ecfdf5]' : 'border-[#b91c1c]/30 bg-[#fef2f2]'}`}>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
          <div className="flex items-center gap-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${deficitSubjects.length === 0 ? 'bg-[#10b981]' : 'bg-[#b91c1c]'}`}>
              {deficitSubjects.length === 0 ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${deficitSubjects.length === 0 ? 'text-[#185e3a]' : 'text-[#b91c1c]'}`}>
                {deficitSubjects.length === 0 ? "Action Plan: Maintain Standing" : "Action Plan: Recovery Needed"}
              </p>
              <h3 className={`mt-1.5 text-xl sm:text-2xl font-black ${deficitSubjects.length === 0 ? 'text-[#10b981]' : 'text-[#b91c1c]'}`}>
                {deficitSubjects.length === 0 
                  ? `You are on track. Safely miss ${overallTargetInfo.classesCanMiss} more overall class${overallTargetInfo.classesCanMiss === 1 ? '' : 'es'}.` 
                  : `You have ${deficitSubjects.length} subject${deficitSubjects.length > 1 ? 's' : ''} below 75%.`}
              </h3>
            </div>
          </div>
        </div>

        {/* Dynamic Subject Warning List */}
        {deficitSubjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full pt-2">
            {deficitSubjects.map((sub) => (
              <div key={sub.code} className="flex items-center justify-between rounded-2xl bg-white p-5 border border-[#b91c1c]/20 shadow-sm transition-transform hover:-translate-y-1">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-black text-[#1e3a8a]" title={sub.name}>{sub.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b91c1c]/80 mt-1">Currently {sub.percentage}%</p>
                </div>
                <div className="shrink-0 text-right bg-[#fef2f2] px-3 py-2 rounded-xl border border-[#b91c1c]/10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Attend Next</p>
                  <p className="text-xl font-black text-[#b91c1c]">+{sub.needed}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          4. DETAILED SUBJECT GRID
      ================================================= */}
      <div className="px-4 sm:px-8 mt-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-[#0ea5e9]"></div>
          <div>
            <h3 className="text-2xl font-black text-[#1e3a8a]">Subject Breakdown</h3>
            <p className="text-sm font-medium text-slate-500">Individual performance across all registered modules.</p>
          </div>
        </div>

        {subjectAnalytics.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-lg font-bold text-slate-400">No subject data available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectAnalytics.map((subject) => {
              const safe = subject.percentage >= 75;
              const warning = subject.percentage >= 65 && subject.percentage < 75;
              
              const barColor = safe ? "bg-[#10b981]" : warning ? "bg-[#f59e0b]" : "bg-[#b91c1c]";
              const textColor = safe ? "text-[#10b981]" : warning ? "text-[#f59e0b]" : "text-[#b91c1c]";

              return (
                <div key={subject.code || subject.name} className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/30 hover:border-[#0ea5e9]/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-black text-[#1e3a8a] leading-snug" title={subject.name}>{subject.name}</h4>
                      {subject.code && <p className="text-[10px] font-black text-[#0ea5e9] mt-1 uppercase tracking-wider">{subject.code}</p>}
                    </div>
                    <div className={`text-2xl font-black shrink-0 ${textColor}`}>
                      {subject.percentage}%
                    </div>
                  </div>

                  {/* Subject Progress Bar */}
                  <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden mb-5">
                    <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(subject.percentage, 100)}%` }} />
                    <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-slate-300 z-10" />
                  </div>

                  {/* Subject Metrics */}
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-3">
                    <div className="text-center w-full">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Present</p>
                      <p className="text-sm font-black text-[#185e3a] mt-0.5">{subject.present}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center w-full">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Absent</p>
                      <p className="text-sm font-black text-[#b91c1c] mt-0.5">{subject.absent}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center w-full">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
                      <p className="text-sm font-black text-[#1e3a8a] mt-0.5">{subject.total}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          5. FOOTER SUMMARY
      ================================================= */}
      <div className="mx-4 sm:mx-8 mt-6 rounded-[32px] bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] p-8 sm:p-10 text-white shadow-xl shadow-[#1e3a8a]/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 bg-white/10 px-3 py-1.5 rounded-full w-fit border border-white/20 shadow-sm">
              Final Evaluation
            </p>
            <h3 className="mt-4 text-2xl font-black leading-tight drop-shadow-sm">
              {percentage >= 75
                ? "You have fulfilled the attendance requirements for this period."
                : "You have not met the mandatory matriculation requirements."}
            </h3>
          </div>
          
          <div className="flex items-center gap-6 bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20 shadow-inner">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Overall Standing</p>
              <p className="text-3xl font-black text-white mt-1 drop-shadow-md">{percentage}%</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Absences</p>
              <p className="text-3xl font-black text-white mt-1 drop-shadow-md">{totalAbsent}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}