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
      bgGradient: "from-[#185e3a] to-[#0a311b]", // Deep Green
      textColor: "text-[#10b981]",
      waveType: "smooth",
    };
  }

  if (percentage >= 65) {
    return {
      status: "Warning Zone",
      message: "You are dangerously close to the minimum threshold.",
      colorHex: "#f59e0b", // Gold
      bgGradient: "from-[#1e3a8a] to-[#0f172a]", // Navy Blue
      textColor: "text-[#f59e0b]",
      waveType: "choppy",
    };
  }

  return {
    status: "Critical Shortage",
    message: "Immediate action required. You are currently ineligible for exams.",
    colorHex: "#b91c1c", // Vel Tech Red
    bgGradient: "from-[#b91c1c] to-[#7f1d1d]", // Red Gradient
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
      <svg className="absolute bottom-0 w-[200%] h-32 animate-[wave-animation_15s_linear_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.3" />
        <path d="M0,80 C200,20 400,140 600,80 C800,20 1000,140 1200,80 L1200,120 L0,120 Z" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (type === "choppy") {
    return (
      <svg className="absolute bottom-0 w-[200%] h-32 animate-[wave-animation_10s_linear_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,40 Q100,100 200,40 T400,40 T600,40 T800,40 T1000,40 T1200,40 L1200,120 L0,120 Z" fill="currentColor" opacity="0.3" />
        <path d="M0,60 Q150,120 300,60 T600,60 T900,60 T1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg className="absolute bottom-0 w-[200%] h-32 animate-[wave-animation_8s_linear_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,100 L100,20 L200,110 L300,30 L400,100 L500,10 L600,90 L700,20 L800,110 L900,30 L1000,100 L1100,10 L1200,90 L1200,120 L0,120 Z" fill="currentColor" opacity="0.3" />
      <path d="M0,120 L150,40 L300,120 L450,50 L600,120 L750,30 L900,120 L1050,40 L1200,120 L1200,120 L0,120 Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
};

// =====================================================
// ANIMATED WALKING STUDENT
// =====================================================
const WalkingStudent = ({ isEligible }) => {
  const speed = isEligible ? "0.8s" : "1.8s";
  
  return (
    <div className="relative w-40 h-40 flex flex-col items-center justify-end overflow-visible pb-2">
      <div className="relative flex flex-col items-center animate-[walk-bob_ease-in-out_infinite_alternate]" style={{ animationDuration: isEligible ? '0.4s' : '0.9s' }}>
        
        {/* Backpack (Only shows if eligible/good attendance) */}
        {isEligible && (
          <div className="absolute -left-4 top-5 h-12 w-8 rounded-l-2xl bg-white/80 shadow-md" />
        )}

        {/* Head */}
        <div className="h-11 w-11 rounded-full bg-white shadow-md relative z-10" />
        
        {/* Torso */}
        <div className="h-[70px] w-[50px] rounded-[20px] bg-white shadow-lg mt-1.5 relative z-10" />

        {/* Legs Container */}
        <div className="absolute -bottom-8 flex w-full justify-center gap-1.5">
          {/* Back Leg */}
          <div className="h-10 w-[18px] rounded-full bg-white/60 animate-[swing-leg-b_linear_infinite]" style={{ animationDuration: speed, transformOrigin: 'top center' }} />
          {/* Front Leg */}
          <div className="h-10 w-[18px] rounded-full bg-white/90 animate-[swing-leg-f_linear_infinite]" style={{ animationDuration: speed, transformOrigin: 'top center' }} />
        </div>
        
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
    <div className="relative mx-auto mt-6 flex w-full max-w-6xl flex-col gap-8 pb-10">

      {/* INJECT KEYFRAMES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-animation {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes walk-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes swing-leg-f {
          0%, 100% { transform: rotate(-35deg); }
          50% { transform: rotate(35deg); }
        }
        @keyframes swing-leg-b {
          0%, 100% { transform: rotate(35deg); }
          50% { transform: rotate(-35deg); }
        }
      `}} />

      {/* =================================================
          1. HERO SECTION (Walking Student ON Waves)
      ================================================= */}
      <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${theme.bgGradient} p-8 pb-20 shadow-2xl transition-colors duration-700 sm:p-12 sm:pb-24`}>
        
        {/* Dynamic Background Waves */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 w-[200%] text-white z-0">
          <DynamicWaves type={theme.waveType} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
          
          <div className="text-center lg:text-left flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className={`h-2.5 w-2.5 animate-ping rounded-full absolute`} style={{ backgroundColor: theme.colorHex }} />
              <span className={`h-2.5 w-2.5 rounded-full relative`} style={{ backgroundColor: theme.colorHex }} />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                {theme.status}
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl drop-shadow-md">
              {animatedPct}% <span className="text-2xl sm:text-3xl font-bold opacity-80">Overall</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base font-medium text-white/80 lg:mx-0">
              {theme.message}
            </p>
          </div>

          {/* Animated Student Walking on the Waves */}
          <div className="relative flex flex-col items-center shrink-0 drop-shadow-2xl">
            <WalkingStudent isEligible={isEligible} />
          </div>

        </div>
      </div>

      {/* =================================================
          2. FLOATING DATA TICKETS
      ================================================= */}
      <div className="relative z-20 -mt-16 grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6 sm:px-8">
        
        {/* TOTAL CLASSES (Navy / Cyan) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0ea5e9]/15 text-[#0ea5e9]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Classes</p>
            <p className="text-3xl font-black text-[#1e3a8a]">{totalClasses}</p>
          </div>
        </div>

        {/* PRESENT (Deep Green / Emerald) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10b981]/15 text-[#10b981]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Attended</p>
            <p className="text-3xl font-black text-[#185e3a]">{totalPresent}</p>
          </div>
        </div>

        {/* ABSENT (Vel Tech Red) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-[#1e3a8a]/5 flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b91c1c]/10 text-[#b91c1c]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Missed</p>
            <p className="text-3xl font-black text-[#b91c1c]">{totalAbsent}</p>
          </div>
        </div>
      </div>

      {/* =================================================
          3. ACADEMIC ACTION PLAN (Specific Subjects)
      ================================================= */}
      <div className={`mx-4 sm:mx-8 rounded-[24px] border-2 border-dashed p-6 sm:p-8 flex flex-col gap-6
        ${deficitSubjects.length === 0 ? 'border-[#10b981]/30 bg-[#10b981]/5' : 'border-[#b91c1c]/30 bg-[#b91c1c]/5'}`}>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
          <div className="flex items-center gap-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${deficitSubjects.length === 0 ? 'bg-[#10b981]' : 'bg-[#b91c1c]'}`}>
              {deficitSubjects.length === 0 ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${deficitSubjects.length === 0 ? 'text-[#185e3a]' : 'text-[#b91c1c]'}`}>
                {deficitSubjects.length === 0 ? "Action Plan: Maintain Standing" : "Action Plan: Recovery Needed"}
              </p>
              <h3 className={`mt-1 text-xl sm:text-2xl font-black ${deficitSubjects.length === 0 ? 'text-[#10b981]' : 'text-[#b91c1c]'}`}>
                {deficitSubjects.length === 0 
                  ? `You are on track. Safely miss ${overallTargets.canMiss} more overall class${overallTargets.canMiss === 1 ? '' : 'es'}.` 
                  : `You have ${deficitSubjects.length} subject${deficitSubjects.length > 1 ? 's' : ''} below 75%.`}
              </h3>
            </div>
          </div>
        </div>

        {/* Dynamic Subject Warning List */}
        {deficitSubjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {deficitSubjects.map((sub) => (
              <div key={sub.code} className="flex items-center justify-between rounded-xl bg-white/80 p-4 border border-[#b91c1c]/20 shadow-sm">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-bold text-[#1e3a8a]" title={sub.name}>{sub.name}</p>
                  <p className="text-xs font-semibold text-[#b91c1c]/80 mt-0.5">Currently {sub.percentage}%</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attend Next</p>
                  <p className="text-lg font-black text-[#b91c1c]">+{sub.needed}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* =================================================
          4. DETAILED SUBJECT GRID
      ================================================= */}
      <div className="px-4 sm:px-8">
        <div className="mb-6 border-l-4 border-[#1e3a8a] pl-4">
          <h3 className="text-2xl font-black text-[#1e3a8a]">Subject Breakdown</h3>
          <p className="text-sm font-medium text-slate-500">Individual performance across all registered modules.</p>
        </div>

        {subjectAnalytics.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
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
                <div key={subject.index} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-black text-[#1e3a8a]" title={subject.name}>{subject.name}</h4>
                      {subject.code && <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{subject.code}</p>}
                    </div>
                    <div className={`text-xl font-black shrink-0 ${textColor}`}>
                      {subject.percentage}%
                    </div>
                  </div>

                  {/* Subject Progress Bar */}
                  <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(subject.percentage, 100)}%` }} />
                    <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-slate-300 z-10" />
                  </div>

                  {/* Subject Metrics */}
                  <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Present</p>
                      <p className="text-sm font-black text-[#185e3a]">{subject.present}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Absent</p>
                      <p className="text-sm font-black text-[#b91c1c]">{subject.absent}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                      <p className="text-sm font-black text-[#1e3a8a]">{subject.total}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          5. FOOTER SUMMARY (Navy Blue)
      ================================================= */}
      <div className="mx-4 sm:mx-8 mt-4 rounded-[32px] bg-[#1e3a8a] p-8 sm:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#0ea5e9]">
              Final Evaluation
            </p>
            <h3 className="mt-2 text-2xl font-black">
              {percentage >= 75
                ? "You have fulfilled the attendance requirements for this period."
                : "You have not met the mandatory matriculation requirements."}
            </h3>
          </div>
          
          <div className="flex items-center gap-6 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Overall Standing</p>
              <p className="text-3xl font-black text-[#0ea5e9] mt-1">{percentage}%</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Absences</p>
              <p className="text-3xl font-black text-[#b91c1c] mt-1">{totalAbsent}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}