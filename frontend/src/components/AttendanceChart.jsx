import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock3,
} from "lucide-react";

// =====================================================
// MONTHS & WEEK DAYS
// =====================================================

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// =====================================================
// DATE UTILS
// =====================================================

const makeDateKey = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const normalizeDate = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return makeDateKey(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const date = String(value).trim();
  if (!date) return "";

  let match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  match = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  match = date.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  match = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  return "";
};

const getAttendanceDate = (record) => {
  if (!record || typeof record !== "object") return "";

  const possibleValues = [
    record.date, record.attendanceDate, record.attendance_date,
    record.attendedDate, record.attended_date, record.classDate,
    record.class_date, record.recordDate, record.record_date,
    record.sessionDate, record.session_date, record.dayDate,
    record.day_date, record.createdAt, record.created_at,
    record.updatedAt, record.updated_at,
  ];

  for (const value of possibleValues) {
    const normalized = normalizeDate(value);
    if (normalized) return normalized;
  }

  if (record.attendance && typeof record.attendance === "object" && !Array.isArray(record.attendance)) {
    return getAttendanceDate(record.attendance) || "";
  }
  if (record.record && typeof record.record === "object" && !Array.isArray(record.record)) {
    return getAttendanceDate(record.record) || "";
  }
  if (record.class && typeof record.class === "object" && !Array.isArray(record.class)) {
    return getAttendanceDate(record.class) || "";
  }
  return "";
};

const getStatus = (record) => {
  if (!record) return "unknown";

  if (typeof record.isPresent === "boolean") return record.isPresent ? "present" : "absent";
  if (typeof record.is_present === "boolean") return record.is_present ? "present" : "absent";
  if (typeof record.present === "boolean") return record.present ? "present" : "absent";
  if (typeof record.isAbsent === "boolean") return record.isAbsent ? "absent" : "present";
  if (typeof record.is_absent === "boolean") return record.is_absent ? "absent" : "present";

  const possibleValues = [
    record.status, record.attendanceStatus, record.attendance_status,
    record.attendance, record.present, record.value, record.result,
  ];

  for (const value of possibleValues) {
    if (typeof value === "boolean") return value ? "present" : "absent";
    if (value !== null && value !== undefined && typeof value !== "object") {
      const status = String(value).trim().toLowerCase();
      if (["p", "present", "yes", "y", "true", "1", "✓", "✔", "attended"].includes(status)) return "present";
      if (["a", "absent", "no", "n", "false", "0", "x", "✗", "❌", "not attended"].includes(status)) return "absent";
      if (status.includes("present")) return "present";
      if (status.includes("absent")) return "absent";
    }
  }

  if (record.attendance && typeof record.attendance === "object" && !Array.isArray(record.attendance)) {
    return getStatus(record.attendance);
  }
  return "unknown";
};

const getSubjectName = (record) => {
  if (!record) return "Unknown Subject";
  if (typeof record.subject === "string") return record.subject;
  if (typeof record.course === "string") return record.course;

  return (
    record.subjectName || record.subject_name || record.subjectTitle || record.subject_title ||
    record.subject?.name || record.subject?.subjectName || record.subject?.title ||
    record.courseName || record.course_name || record.courseTitle || record.course_title ||
    record.course?.name || record.course?.courseName || record.course?.title || record.name ||
    "Unknown Subject"
  );
};

const getSubjectCode = (record) => {
  if (!record) return "";
  return (
    record.subjectCode || record.subject_code || record.subject?.code || record.subject?.subjectCode ||
    record.courseCode || record.course_code || record.course?.code || record.code || ""
  );
};

const getClassTime = (record) => {
  if (!record) return "";
  return (
    record.time || record.classTime || record.class_time || record.startTime || record.start_time ||
    record.endTime || record.end_time || record.period || record.hour || record.session ||
    record.slot || record.timeSlot || record.time_slot || ""
  );
};

const flattenAttendanceData = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.flatMap((item) => {
      if (item && typeof item === "object" && getAttendanceDate(item)) return [item];
      return flattenAttendanceData(item);
    });
  }
  if (typeof data !== "object") return [];

  const wrapperKeys = ["attendance", "records", "items", "results", "data", "entries", "classes"];
  for (const key of wrapperKeys) {
    if (Array.isArray(data[key])) return flattenAttendanceData(data[key]);
  }

  if (getAttendanceDate(data)) return [data];

  const dateKeyEntries = Object.entries(data).filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key));
  if (dateKeyEntries.length > 0) {
    const output = [];
    dateKeyEntries.forEach(([date, value]) => {
      const records = flattenAttendanceData(value);
      records.forEach((record) => {
        output.push({ ...record, date: getAttendanceDate(record) || date });
      });
    });
    return output;
  }

  const output = [];
  Object.values(data).forEach((value) => {
    if (Array.isArray(value) || (value && typeof value === "object")) {
      output.push(...flattenAttendanceData(value));
    }
  });
  return output;
};

const getTodayKey = () => {
  const now = new Date();
  return makeDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

// =====================================================
// MAIN CALENDAR COMPONENT
// =====================================================

export default function AttendanceChart({ attendance = [] }) {
  const records = useMemo(() => flattenAttendanceData(attendance), [attendance]);
  const todayKey = useMemo(() => getTodayKey(), []);

  const initialDate = new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const normalizedRecords = useMemo(() => {
    return records
      .map((record, index) => ({
        record,
        index,
        date: getAttendanceDate(record),
        status: getStatus(record),
      }))
      .filter((item) => item.date);
  }, [records]);

  const recordsByDate = useMemo(() => {
    const grouped = {};
    normalizedRecords.forEach((item) => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    return grouped;
  }, [normalizedRecords]);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);

    // Always render exactly 6 calendar rows.
    // This keeps the calendar height constant when switching months.
    while (days.length < 42) days.push(null);

    return days;
  }, [firstDay, daysInMonth]);

  const monthRecords = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    return normalizedRecords.filter((item) => item.date.startsWith(prefix));
  }, [normalizedRecords, currentYear, currentMonth]);

  const monthStats = useMemo(() => {
    const present = monthRecords.filter((item) => item.status === "present").length;
    const absent = monthRecords.filter((item) => item.status === "absent").length;
    const total = present + absent;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
    return { present, absent, total: monthRecords.length, percentage };
  }, [monthRecords]);

  const selectedRecords = recordsByDate[selectedDate] || [];

  const selectedStats = useMemo(() => {
    const present = selectedRecords.filter((item) => item.status === "present").length;
    const absent = selectedRecords.filter((item) => item.status === "absent").length;
    const unknown = selectedRecords.filter((item) => item.status === "unknown").length;
    const total = selectedRecords.length;
    const knownTotal = present + absent;
    const percentage = knownTotal > 0 ? ((present / knownTotal) * 100).toFixed(1) : "0.0";
    return { present, absent, unknown, total, percentage };
  }, [selectedRecords]);

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  const selectToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(makeDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const selectDate = (day) => {
    if (!day) return;
    setSelectedDate(makeDateKey(currentYear, currentMonth, day));
  };

  const selectedDateText = selectedDate
    ? (() => {
        const [year, month, day] = selectedDate.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
      })()
    : "Select a date";

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-6 lg:space-y-8 mt-4">
      
      {/* INJECT ANIMATIONS & SCROLLBAR */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .custom-calendar-scroll::-webkit-scrollbar { width: 4px; }
        .custom-calendar-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-calendar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-calendar-scroll:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />

      {/* ======================= MAIN LAYOUT GRID ======================= */}
      <div className="grid items-start gap-6 lg:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* ======================= 1. LEFT PANEL: CALENDAR WIDGET (STRICT FIXED HEIGHT) ======================= */}
        <div
          className="rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-lg shadow-[#1e3a8a]/5 sm:p-8 relative overflow-hidden flex h-[460px] min-h-[460px] max-h-[460px] flex-none flex-col justify-between lg:h-[620px] lg:min-h-[620px] lg:max-h-[620px]"
        >
          
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#1e3a8a] via-[#0ea5e9] to-[#1e3a8a]" />

          <div>
            {/* CALENDAR HEADER */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0ea5e9]/10 text-[#0ea5e9] shadow-inner shadow-[#0ea5e9]/20">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1e3a8a] sm:text-2xl tracking-tight">
                    Attendance Calendar
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Select a date to view classes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={selectToday}
                className="w-fit rounded-xl border border-[#1e3a8a]/20 bg-white px-4 py-2 text-xs font-bold text-[#1e3a8a] shadow-sm transition-all hover:bg-[#1e3a8a] hover:text-white active:scale-95"
              >
                Go to Today
              </button>
            </div>
            
            {/* MONTH SELECTOR */}
            <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={previousMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#1e3a8a]"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="text-base sm:text-lg font-black text-[#1e3a8a]">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#1e3a8a]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* WEEK DAYS */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="py-1 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* CALENDAR GRID */}
            <div
              className="grid h-[216px] min-h-[216px] max-h-[216px] grid-cols-7 grid-rows-6 gap-1 sm:h-[342px] sm:min-h-[342px] sm:max-h-[342px] sm:gap-1.5"
            >
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-full w-full min-h-0"
                    />
                  );
                }

                const dateKey = makeDateKey(currentYear, currentMonth, day);
                const items = recordsByDate[dateKey] || [];
                const present = items.filter((item) => item.status === "present").length;
                const absent = items.filter((item) => item.status === "absent").length;
                const unknown = items.filter((item) => item.status === "unknown").length;
                const hasRecords = items.length > 0;
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={`
                      relative flex h-full min-h-0 w-full items-center justify-center rounded-full transition-all duration-200
                      ${isSelected 
                          ? "border-[1.5px] border-[#1e3a8a] bg-slate-50 shadow-sm z-10" 
                          : hasRecords 
                          ? "bg-transparent hover:bg-slate-50 z-0" 
                          : "bg-transparent opacity-50 hover:bg-slate-50 hover:opacity-100 z-0"}
                    `}
                  >
                    <span className={`text-[12px] sm:text-[14px] font-bold ${
                        isToday ? "text-[#f59e0b]" : isSelected ? "text-[#1e3a8a]" : hasRecords ? "text-slate-900" : "text-slate-500"
                      }`}>
                      {day}
                    </span>

                    {isToday && <span className="absolute right-[12%] top-[12%] h-1.5 w-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.6)]" />}

                    {hasRecords && (
                      <div className="absolute bottom-[10%] flex gap-[2px] items-center justify-center">
                        {present > 0 && <span className="h-1 w-1 rounded-full bg-[#10b981]" />}
                        {absent > 0 && <span className="h-1 w-1 rounded-full bg-[#b91c1c]" />}
                        {unknown > 0 && <span className="h-1 w-1 rounded-full bg-[#0ea5e9]" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LEGEND */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#b91c1c]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Other</span>
            </div>
          </div>
        </div>

        {/* ======================= 2. RIGHT PANEL: SELECTED DAY DETAILS (STRICT FIXED HEIGHT) ======================= */}
        <div
          className="flex h-[580px] min-h-[580px] max-h-[580px] flex-none flex-col rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-lg shadow-[#1e3a8a]/5 sm:p-8 lg:sticky lg:top-24 lg:h-[620px] lg:min-h-[620px] lg:max-h-[620px] justify-between overflow-hidden"
          style={{ height: "580px", minHeight: "580px", maxHeight: "580px" }}
        >
          
          <div className="shrink-0">
            {/* HEADER */}
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9]">
                  <Clock3 size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1e3a8a]">Selected Day</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedDateText}</p>
                </div>
              </div>
              <button
                onClick={selectToday}
                className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Today
              </button>
            </div>

            {/* SELECTED STATS */}
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-[16px] bg-[#ecfdf5] p-3 text-center border border-[#10b981]/20 shadow-sm">
                <p className="text-2xl font-black text-[#10b981]">{selectedStats.present}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#10b981] mt-1">Present</p>
              </div>
              <div className="rounded-[16px] bg-[#fef2f2] p-3 text-center border border-[#b91c1c]/20 shadow-sm">
                <p className="text-2xl font-black text-[#b91c1c]">{selectedStats.absent}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#b91c1c]/80 mt-1">Absent</p>
              </div>
              <div className="rounded-[16px] bg-slate-50 p-3 text-center border border-slate-200 shadow-sm">
                <p className="text-2xl font-black text-[#1e3a8a]">{selectedStats.total}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#0ea5e9] mt-1">Classes</p>
              </div>
            </div>

            {/* DAILY PROGRESS BAR */}
            {selectedStats.total > 0 && (
              <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily Attendance</span>
                  <span className="text-xs font-black text-[#185e3a]">{selectedStats.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#10b981] transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(Number(selectedStats.percentage), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RECORDS LIST CONTAINER (LOCKED HEIGHT AREA) */}
          <div className="flex h-[240px] min-h-0 shrink-0 flex-col pt-1 sm:h-[260px]">
            <div className="mb-3 flex items-center justify-between shrink-0">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Schedule</h4>
            </div>

            {selectedRecords.length === 0 ? (
              <div key={selectedDate} className="animate-fade-in flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center">
                <CalendarDays size={28} className="mb-2 text-slate-300" />
                <h4 className="text-xs font-bold text-[#1e3a8a]">No classes found</h4>
                <p className="mt-0.5 text-[11px] text-slate-500">No records for this date.</p>
              </div>
            ) : (
              <div key={selectedDate} className="custom-calendar-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 pb-1">
                {selectedRecords.map((item, index) => {
                  const record = item.record;
                  const isPresent = item.status === "present";
                  const isAbsent = item.status === "absent";

                  return (
                    <div
                      key={record?._id || record?.id || `${selectedDate}-${index}`}
                      className="animate-fade-in flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:shadow-md opacity-0"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isPresent ? "bg-[#ecfdf5] text-[#10b981]" : isAbsent ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-slate-50 text-[#0ea5e9]"
                        }`}>
                        {isPresent ? <CheckCircle2 size={18} strokeWidth={2.5} /> : isAbsent ? <XCircle size={18} strokeWidth={2.5} /> : <BookOpen size={16} strokeWidth={2.5} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs sm:text-sm font-black text-[#1e3a8a]">{getSubjectName(record)}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {getSubjectCode(record) && (
                            <span className="text-[9px] font-bold text-slate-400">{getSubjectCode(record)}</span>
                          )}
                          {getClassTime(record) && (
                            <span className="text-[9px] font-semibold text-slate-400">• {getClassTime(record)}</span>
                          )}
                        </div>
                      </div>

                      <span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                          isPresent ? "bg-[#ecfdf5] text-[#185e3a]" : isAbsent ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-slate-50 text-[#1e3a8a]"
                        }`}>
                        {isPresent ? "Present" : isAbsent ? "Absent" : "Unknown"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}