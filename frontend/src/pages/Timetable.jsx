import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getTimetable,
  syncTimetable,
} from "../services/timetableService";

import useAuth from "../hooks/useAuth";
import Loading from "../components/Loading";

// =====================================================
// DAYS
// =====================================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

// =====================================================
// FIXED AMS TIME SLOTS
// =====================================================

const TIME_SLOTS = [
  { key: "08:45", start: 525, end: 575, label: "8:45 AM - 9:35 AM", mobileLabel: "8:45" },
  { key: "09:45", start: 585, end: 635, label: "9:45 AM - 10:35 AM", mobileLabel: "9:45" },
  { key: "10:45", start: 645, end: 695, label: "10:45 AM - 11:35 AM", mobileLabel: "10:45" },
  { key: "11:45", start: 705, end: 755, label: "11:45 AM - 12:35 PM", mobileLabel: "11:45" },
  { key: "13:45", start: 825, end: 875, label: "1:45 PM - 2:35 PM", mobileLabel: "1:45" },
  { key: "14:45", start: 885, end: 935, label: "2:45 PM - 3:35 PM", mobileLabel: "2:45" },
  { key: "15:45", start: 945, end: 995, label: "3:45 PM - 4:35 PM", mobileLabel: "3:45" },
  { key: "16:45", start: 1005, end: 1055, label: "4:45 PM - 5:35 PM", mobileLabel: "4:45" },
];

// =====================================================
// HELPERS
// =====================================================

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return "";
};

const displayValue = (value) => {
  const text = clean(value);
  return text || "—";
};

const normalizeDay = (value) => {
  const text = clean(value).toLowerCase();
  for (const day of DAYS) {
    if (text === day.toLowerCase() || text.includes(day.toLowerCase())) return day;
  }
  return "";
};

// =====================================================
// SUBJECT & COURSE GETTERS
// =====================================================

const getSubjectName = (item) =>
  firstValue(
    item?.subjectName, item?.subject_name, item?.courseName, item?.course_name,
    item?.course_name_text, item?.subject, item?.courseTitle, item?.course_title,
    item?.name, item?.courseNameText, item?.course_name_text, item?.course?.subjectName,
    item?.course?.courseName, item?.course?.course_name, item?.course?.name, item?.course, item?.title
  );

const getSubjectCode = (item) =>
  firstValue(
    item?.subjectCode, item?.subject_code, item?.courseCode, item?.course_code,
    item?.coursecode, item?.code, item?.course?.subjectCode, item?.course?.courseCode,
    item?.course?.course_code, item?.course?.code
  );

const getFaculty = (item) =>
  firstValue(
    item?.faculty, item?.facultyName, item?.faculty_name, item?.facultyname,
    item?.teacher, item?.teacherName, item?.staff, item?.staffName,
    item?.course?.faculty, item?.course?.facultyName, item?.course?.faculty_name
  );

const getFacultyId = (item) =>
  firstValue(item?.facultyId, item?.faculty_id, item?.facultyID, item?.staffId, item?.staff_id);

const getRoom = (item) =>
  firstValue(
    item?.room, item?.roomNo, item?.room_no, item?.roomNumber,
    item?.room_number, item?.classroom, item?.course?.room,
    item?.course?.roomNo, item?.course?.roomNumber
  );

const getCategory = (item) =>
  firstValue(
    item?.category, item?.courseCategory, item?.course_category,
    item?.courseType, item?.course_type, item?.type,
    item?.course?.category, item?.course?.courseCategory
  );

const getCredit = (item) =>
  firstValue(
    item?.credit, item?.credits, item?.creditHours, item?.credit_hours,
    item?.course?.credit, item?.course?.credits
  );

const getSlot = (item) =>
  firstValue(
    item?.slot, item?.slotName, item?.slot_name, item?.timeSlot,
    item?.time_slot, item?.period, item?.periodName, item?.period_name,
    item?.course?.slot, item?.course?.slotName
  );

// =====================================================
// PROFILE / AMS DETAILS
// =====================================================

const normalizeKey = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const isUsableValue = (value) => value !== null && value !== undefined && typeof value !== "object" && String(value).trim() !== "";

const findFieldValue = (sources, aliases, maxDepth = 5) => {
  const aliasSet = new Set(aliases.map(normalizeKey));
  const visited = new Set();

  const search = (value, depth) => {
    if (value === null || value === undefined || depth > maxDepth) return "";
    if (typeof value !== "object") return "";
    if (visited.has(value)) return "";
    visited.add(value);

    for (const [key, fieldValue] of Object.entries(value)) {
      if (aliasSet.has(normalizeKey(key)) && isUsableValue(fieldValue)) {
        return String(fieldValue).trim();
      }
    }

    for (const nestedValue of Object.values(value)) {
      if (nestedValue && typeof nestedValue === "object") {
        const result = search(nestedValue, depth + 1);
        if (result) return result;
      }
    }
    return "";
  };

  for (const source of sources) {
    const result = search(source, 0);
    if (result) return result;
  }
  return "";
};

const getStudentName = (source) => findFieldValue([source], ["name", "studentName", "student_name", "fullName", "full_name", "candidateName"]);
const getVtuNumber = (source) => findFieldValue([source], ["vtuNumber", "vtu_number", "vtuNo", "vtu_no", "portalUsername", "username", "registrationNo", "regNo"]);
const getRollNumber = (source) => findFieldValue([source], ["rollNumber", "roll_number", "rollNo", "roll_no", "roll", "studentRollNumber"]);
const getDegree = (source) => findFieldValue([source], ["degree", "degreeName", "program", "programName", "programme"]);
const getBranch = (source) => findFieldValue([source], ["branch", "branchName", "department", "deptName"]);
const getBatch = (source) => findFieldValue([source], ["batch", "batchYear", "academicYear", "year", "admissionYear"]);
const getSemester = (source) => findFieldValue([source], ["semester", "sem", "semesterName", "semesterNo"]);
const getRegulation = (source) => findFieldValue([source], ["regulation", "regulationName", "reg", "regulationCode"]);
const getSection = (source) => findFieldValue([source], ["section", "sectionName", "classSection", "division"]);
const getBucket = (source) => findFieldValue([source], ["bucket", "bucketName", "bucketCode", "yourBucket", "academicBucket"]);

// =====================================================
// TIME HELPERS
// =====================================================

const getStartTime = (item) =>
  firstValue(item?.startTime, item?.start_time, item?.from, item?.start, item?.course?.startTime, item?.schedule?.startTime);

const getEndTime = (item) =>
  firstValue(item?.endTime, item?.end_time, item?.to, item?.end, item?.course?.endTime, item?.schedule?.endTime);

const getTimeValues = (item) => {
  const values = [getStartTime(item), getEndTime(item), item?.time, item?.timeSlot, item?.slot, item?.period];
  Object.entries(item || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || typeof value === "object") return;
    if (/(time|slot|period)/i.test(key)) values.push(value);
  });
  return values.map(clean).filter(Boolean);
};

const normalizeTime = (value) =>
  clean(value).toLowerCase().replace(/[.]/g, ":").replace(/\s+/g, " ").replace(/\b(a\.m\.|am)\b/gi, "am").replace(/\b(p\.m\.|pm)\b/gi, "pm").trim();

const clockToMinutes = (hour, minute, period = "") => {
  let h = Number(hour);
  const m = Number(minute || 0);
  const p = clean(period).toLowerCase();

  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  if (p === "am" && h === 12) h = 0;
  if (p === "pm" && h !== 12 && h < 12) h += 12;
  if (h > 23) return null;

  return h * 60 + m;
};

const extractClockTimes = (value) => {
  const text = normalizeTime(value);
  if (!text) return [];

  const pattern = /(\d{1,2})(?:[:](\d{2})(?::\d{2})?)(?:\s*(am|pm))?/gi;
  const times = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    times.push({ hour: Number(match[1]), minute: Number(match[2]), period: clean(match[3]).toLowerCase(), index: match.index });
  }

  if (!times.length) return [];

  for (let i = 0; i < times.length; i += 1) {
    if (times[i].period) continue;
    const next = times[i + 1];
    const previous = times[i - 1];
    if (next?.period) times[i].period = next.period;
    else if (previous?.period) times[i].period = previous.period;
  }

  return times.map((time) => clockToMinutes(time.hour, time.minute, time.period)).filter((val) => val !== null);
};

const getPeriodNumber = (item) => {
  const values = [item?.period, item?.periodName, item?.slot, item?.slotName];
  for (const value of values) {
    const text = clean(value).toLowerCase();
    if (!text) continue;
    const match = text.match(/(?:period|p)\s*([1-8])\b/i);
    if (match) return Number(match[1]);
    if (/^[1-8]$/.test(text)) return Number(text);
  }
  return null;
};

const extractStartMinutes = (item) => {
  const directStart = getStartTime(item);
  const directEnd = getEndTime(item);

  if (directStart) {
    const startText = normalizeTime(directStart);
    const startTimes = extractClockTimes(directStart);

    if (startTimes.length) {
      if (!/\b(am|pm)\b/i.test(startText) && directEnd) {
        const endText = normalizeTime(directEnd);
        const endPeriod = endText.match(/\b(am|pm)\b/i)?.[1];
        if (endPeriod) {
          const firstMatch = startText.match(/^(\d{1,2}):(\d{2})/);
          if (firstMatch) {
            const inferred = clockToMinutes(firstMatch[1], firstMatch[2], endPeriod);
            if (inferred !== null) return inferred;
          }
        }
      }
      return startTimes[0];
    }
  }

  for (const value of getTimeValues(item)) {
    const times = extractClockTimes(value);
    if (times.length) return times[0];
  }

  return null;
};

const PERIOD_TO_SLOT = {
  1: TIME_SLOTS[0], 2: TIME_SLOTS[1], 3: TIME_SLOTS[2], 4: TIME_SLOTS[3],
  5: TIME_SLOTS[4], 6: TIME_SLOTS[5], 7: TIME_SLOTS[6], 8: TIME_SLOTS[7],
};

const getExactSlot = (item) => {
  const start = extractStartMinutes(item);

  if (start !== null) {
    const exact = TIME_SLOTS.find((slot) => slot.start === start);
    if (exact) return exact;

    const nearest = TIME_SLOTS.reduce((best, slot) => {
      const distance = Math.abs(slot.start - start);
      if (!best || distance < best.distance) return { slot, distance };
      return best;
    }, null);

    if (nearest && nearest.distance <= 5) return nearest.slot;
  }

  const period = getPeriodNumber(item);
  if (period && PERIOD_TO_SLOT[period]) return PERIOD_TO_SLOT[period];

  return null;
};

const normalizeRecord = (item, index) => {
  if (!item || typeof item !== "object") return null;
  const day = normalizeDay(firstValue(item?.day, item?.weekday, item?.weekDay, item?.dayName));
  if (!day) return null;

  const slot = getExactSlot(item);
  return {
    ...item,
    _index: index,
    _day: day,
    _slotKey: slot?.key || null,
    _slotStart: slot?.start ?? null,
    _unmapped: !slot,
  };
};

// =====================================================
// MEDIUM TRANSPARENT COMPONENTS
// =====================================================

function Section({ title, description, children, className = "" }) {
  return (
    <section className={`relative overflow-hidden rounded-[32px] border border-white/40 bg-white/30 backdrop-blur-xl shadow-sm transition-all ${className}`}>
      <div className="border-b border-white/30 px-5 py-5 sm:px-8 bg-white/20">
        <h2 className="text-xl font-bold text-[#1e3a8a] tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm font-medium text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/30 px-4 py-3.5 shadow-sm transition-all hover:bg-white/50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800">{displayValue(value)}</p>
    </div>
  );
}

// Compact class card for Matrix Grid (Mobile squished)
function MatrixClassCard({ item }) {
  const subject = getSubjectName(item);
  const code = getSubjectCode(item);
  const room = getRoom(item);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md sm:rounded-2xl border border-white/40 bg-white/40 p-0.5 sm:p-2.5 shadow-sm transition-all hover:scale-105 hover:bg-white/60 hover:shadow-md">
      
      {/* Mobile view: Extremely condensed */}
      <span className="block sm:hidden text-[7px] font-black uppercase tracking-tighter text-[#1e3a8a] text-center leading-tight line-clamp-2">
        {code || subject.substring(0, 6)}
      </span>
      {room && (
        <span className="block sm:hidden mt-0.5 text-[5px] font-bold text-[#0ea5e9] truncate w-full text-center">
          {room}
        </span>
      )}

      {/* Desktop view: Normal size */}
      <div className="hidden sm:flex flex-col items-center text-center w-full">
        <p className="line-clamp-2 text-xs font-black leading-snug text-[#1e3a8a]" title={clean(subject)}>
          {displayValue(subject)}
        </p>
        {code && <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-wider text-[#0ea5e9]">{code}</p>}
        {room && <span className="mt-1.5 inline-block rounded bg-white/40 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-600 border border-white/30 shadow-sm">Room: {room}</span>}
      </div>
    </div>
  );
}

// Normal Card for list views
function ClassCard({ item }) {
  const subject = getSubjectName(item);
  const code = getSubjectCode(item);
  const faculty = getFaculty(item);
  const room = getRoom(item);

  return (
    <div className="w-full rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-white/70 hover:bg-white/60">
      <p className="line-clamp-3 text-sm font-black leading-snug text-[#1e3a8a]" title={clean(subject)}>
        {displayValue(subject)}
      </p>
      {code && (
        <p className="mt-1 truncate text-[10px] font-black uppercase tracking-wider text-[#0ea5e9]">
          {code}
        </p>
      )}
      {faculty && (
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-slate-600" title={clean(faculty)}>
          {faculty}
        </p>
      )}
      {room && (
        <span className="mt-2.5 inline-block rounded-md border border-white/50 bg-white/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
          Room: {room}
        </span>
      )}
    </div>
  );
}

// =====================================================
// MAIN TIMETABLE COMPONENT
// =====================================================

export default function Timetable() {
  const { user, loading: authLoading } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [academicData, setAcademicData] = useState({});
  const [courseData, setCourseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const applyResponseData = useCallback((response) => {
    let records = [];
    if (Array.isArray(response)) records = response;
    else if (Array.isArray(response?.data)) records = response.data;
    else if (Array.isArray(response?.timetable)) records = response.timetable;
    else if (Array.isArray(response?.records)) records = response.records;

    setTimetable(records);

    const profile = response?.profile && typeof response.profile === "object" ? response.profile : {};
    const student = response?.student && typeof response.student === "object" ? response.student : {};
    const academic = response?.academic && typeof response.academic === "object" ? response.academic : {};
    const studentDetails = response?.studentDetails && typeof response.studentDetails === "object" ? response.studentDetails : {};
    const details = response?.details && typeof response.details === "object" ? response.details : {};

    setAcademicData({
      ...(user || {}),
      ...(response || {}),
      ...details,
      ...academic,
      ...studentDetails,
      ...student,
      ...profile,
    });

    const courses =
      response?.courses || response?.registeredCourses || response?.registered_courses ||
      response?.courseRegisteredDetails || response?.course_registered_details;

    if (Array.isArray(courses)) setCourseData(courses);
    else setCourseData([]);

    return records;
  }, [user]);

  const loadTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getTimetable();
      applyResponseData(response);
    } catch (err) {
      console.error("Timetable loading failed:", err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to load timetable.");
    } finally {
      setLoading(false);
    }
  }, [applyResponseData]);

  useEffect(() => {
    if (!authLoading) loadTimetable();
  }, [authLoading, loadTimetable]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setSyncMessage("");
      const response = await syncTimetable();
      applyResponseData(response);
      setSyncMessage(response?.message || "Timetable synchronized successfully.");
    } catch (err) {
      console.error("Timetable sync failed:", err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to synchronize timetable.");
    } finally {
      setSyncing(false);
    }
  };

  const normalizedRecords = useMemo(() => {
    return timetable
      .map(normalizeRecord)
      .filter(Boolean)
      .sort((a, b) => {
        if (a._day !== b._day) return DAYS.indexOf(a._day) - DAYS.indexOf(b._day);
        return a._slotStart - b._slotStart;
      });
  }, [timetable]);

  const unmappedRecords = useMemo(
    () => normalizedRecords.filter((item) => item._unmapped).sort((a, b) => a._index - b._index),
    [normalizedRecords]
  );

  const getClasses = useCallback((day, slot) => {
    return normalizedRecords
      .filter((item) => item._day === day && item._slotKey === slot.key)
      .sort((a, b) => a._index - b._index);
  }, [normalizedRecords]);

  const courses = useMemo(() => {
    const source = [...courseData, ...timetable];
    const map = new Map();

    source.forEach((item) => {
      if (!item) return;
      const key = getSubjectCode(item) || getSubjectName(item);
      if (!key) return;

      const existing = map.get(key);
      if (!existing) map.set(key, item);
      else map.set(key, { ...existing, ...item });
    });

    return Array.from(map.values());
  }, [courseData, timetable]);

  // Extract Student Data
  const detailSources = [academicData, academicData?.profile, academicData?.student, academicData?.studentDetails, academicData?.details, academicData?.academic, user].filter(Boolean);
  const detailSource = detailSources.length > 0 ? detailSources : [academicData];

  const studentName = getStudentName(detailSource);
  const vtuNumber = getVtuNumber(detailSource);
  const rollNumber = getRollNumber(detailSource);
  const degree = getDegree(detailSource);
  const branch = getBranch(detailSource);
  const batch = getBatch(detailSource);
  const semester = getSemester(detailSource);
  const regulation = getRegulation(detailSource);
  const section = getSection(detailSource);
  const bucket = getBucket(academicData) || getBucket(user) || getBucket(timetable[0]);

  if (authLoading || loading) {
    return <Loading fullPage />;
  }

  return (
    // Make root background completely transparent so underlying animations show through
    <div className="relative min-h-[calc(100vh-72px)] bg-transparent p-4 sm:p-6 lg:p-8 xl:p-10 overflow-hidden">
      
      {/* INJECT ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-slide-up {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      <div className="relative z-10 mx-auto max-w-[1550px] animate-fade-slide-up space-y-8">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/40 backdrop-blur-md shadow-sm border border-white/40 text-[#0ea5e9]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0ea5e9]">
                Academic Schedule
              </p>
            </div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-[#1e3a8a] sm:text-4xl lg:text-5xl">
              Timetable
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Weekly schedule based on AMS assigned periods.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-[#0ea5e9] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {syncing ? "Synchronizing..." : "Sync Timetable"}
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50/80 backdrop-blur-md px-5 py-4 text-sm font-bold text-rose-700 shadow-sm">
            {error}
          </div>
        )}
        {syncMessage && !error && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 backdrop-blur-md px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
            {syncMessage}
          </div>
        )}

        {/* =================================================
            STUDENT PROFILE (Medium Glassmorphism)
        ================================================= */}
        <Section title="Student Profile" description="Academic information associated with your account.">
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6 lg:p-8">
            <DetailItem label="Name" value={studentName} />
            <DetailItem label="VTU Number" value={vtuNumber} />
            <DetailItem label="Roll Number" value={rollNumber} />
            <DetailItem label="Degree" value={degree} />
            <DetailItem label="Branch" value={branch} />
            <DetailItem label="Batch" value={batch} />
            <DetailItem label="Semester" value={semester} />
            <DetailItem label="Section" value={section} />
            <DetailItem label="Regulation" value={regulation} />
          </div>
        </Section>

        {/* =================================================
            BUCKET SECTION (Medium Glassmorphism)
        ================================================= */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/30 backdrop-blur-xl p-8 shadow-sm">
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0ea5e9] bg-white/40 px-3 py-1.5 rounded-full w-fit border border-white/30">
                Academic Category
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-[#1e3a8a]">
                Your Bucket
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 font-medium">
                Primary academic grouping for course coordination.
              </p>
            </div>
            <div className="min-w-[200px] rounded-2xl bg-white/50 backdrop-blur-xl px-6 py-5 text-center border border-white/40 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Assigned Bucket
              </p>
              <p className="mt-1 text-2xl font-black text-[#1e3a8a] drop-shadow-sm">
                {displayValue(bucket)}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            COURSE REGISTERED DETAILS (Responsive Mobile Stack, No Scroll)
        ================================================= */}
        <Section
          title="Course Registered Details"
          description={`${courses.length} registered ${courses.length === 1 ? "course" : "courses"}`}
        >
          {courses.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-slate-500">
              No registered course details available.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-white/30 border-b border-white/40">
                    <tr>
                      {["#", "Category", "Course Code", "Course Name", "Credit", "Faculty Name", "Slot", "Room"].map((heading) => (
                        <th key={heading} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {courses.map((course, index) => (
                      <tr key={course?._id || course?.id || getSubjectCode(course) || index} className="transition-colors hover:bg-white/50">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{index + 1}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{displayValue(getCategory(course))}</td>
                        <td className="px-6 py-4 font-mono text-xs font-black text-[#0ea5e9]">{displayValue(getSubjectCode(course))}</td>
                        <td className="px-6 py-4 text-xs font-black text-[#1e3a8a]">{displayValue(getSubjectName(course))}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{displayValue(getCredit(course))}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">{displayValue(getFaculty(course))}</td>
                        <td className="px-6 py-4 text-xs font-black text-[#0ea5e9]">{displayValue(getSlot(course))}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{displayValue(getRoom(course))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE STACKED CARDS (No horizontal scroll) */}
              <div className="grid gap-3 p-4 lg:hidden sm:grid-cols-2 bg-white/10">
                {courses.map((course, index) => (
                  <div key={course?._id || course?.id || index} className="flex flex-col rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between border-b border-white/50 pb-3">
                      <div className="pr-3">
                        <p className="font-black text-[#1e3a8a] leading-snug">{displayValue(getSubjectName(course))}</p>
                        <p className="mt-1 font-mono text-[10px] font-black uppercase text-[#0ea5e9]">{displayValue(getSubjectCode(course))}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white/60 border border-white/70 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#0ea5e9] shadow-sm">
                        {displayValue(getCategory(course))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                      <div className="bg-white/30 p-2 rounded-xl">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Faculty</span>
                        <span className="mt-0.5 block font-bold text-slate-700 line-clamp-1">{displayValue(getFaculty(course))}</span>
                      </div>
                      <div className="bg-white/30 p-2 rounded-xl">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Room</span>
                        <span className="mt-0.5 block font-bold text-slate-700 truncate">{displayValue(getRoom(course))}</span>
                      </div>
                      <div className="bg-white/30 p-2 rounded-xl">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Slot</span>
                        <span className="mt-0.5 block font-black text-[#0ea5e9] truncate">{displayValue(getSlot(course))}</span>
                      </div>
                      <div className="bg-white/30 p-2 rounded-xl">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Credits</span>
                        <span className="mt-0.5 block font-bold text-slate-700">{displayValue(getCredit(course))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* =================================================
            TIMETABLE MATRIX (Responsive Squish on Mobile)
        ================================================= */}
        <Section
          title="Time Table Matrix"
          description="Classes arranged exactly by period. Automatically adjusts to fit your screen."
        >
          {normalizedRecords.length === 0 ? (
            <div className="p-16 text-center">
              <h3 className="text-lg font-bold text-slate-800">No Timetable Available</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">Synchronize your timetable to load your schedule.</p>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="mt-6 rounded-xl bg-[#0ea5e9] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0284c7] disabled:opacity-70"
              >
                {syncing ? "Synchronizing..." : "Sync Timetable"}
              </button>
            </div>
          ) : (
            <div className="w-full">
              
              {/* HEADER ROW */}
              <div 
                className="grid border-y border-white/40 bg-white/30 backdrop-blur-sm"
                style={{ gridTemplateColumns: "minmax(35px, 1.2fr) repeat(8, minmax(0, 1fr))" }}
              >
                <div className="flex min-h-[40px] sm:min-h-[70px] items-center justify-center border-r border-white/40 px-1 sm:px-3 bg-white/10">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Day</span>
                </div>
                
                {TIME_SLOTS.map((slot) => (
                  <div key={slot.key} className="flex flex-col items-center justify-center border-r border-white/40 px-0.5 sm:px-2 text-center last:border-r-0">
                    <span className="hidden sm:block text-[10px] font-black text-slate-700">{slot.label}</span>
                    <span className="sm:hidden text-[7px] font-black text-slate-700">{slot.mobileLabel}</span>
                  </div>
                ))}
              </div>

              {/* DAYS ROWS */}
              {DAYS.map((day) => (
                <div 
                  key={day} 
                  className="grid border-b border-white/40 bg-white/20 hover:bg-white/40 transition-colors"
                  style={{ gridTemplateColumns: "minmax(35px, 1.2fr) repeat(8, minmax(0, 1fr))" }}
                >
                  <div className="flex min-h-[50px] sm:min-h-[140px] items-center justify-center border-r border-white/40 bg-white/20 px-1 sm:px-3">
                    <span className="hidden sm:block text-sm font-black text-[#1e3a8a] uppercase tracking-widest">{day}</span>
                    <span className="sm:hidden text-[8px] font-black text-[#1e3a8a] uppercase">{day.substring(0, 3)}</span>
                  </div>

                  {TIME_SLOTS.map((slot) => {
                    const classes = getClasses(day, slot);

                    return (
                      <div key={`${day}-${slot.key}`} className="min-h-[50px] sm:min-h-[140px] border-r border-white/40 p-0.5 sm:p-2 last:border-r-0 flex flex-col justify-center">
                        {classes.length > 0 ? (
                          <div className="flex flex-col gap-1 sm:gap-2 h-full justify-center">
                            {classes.map((item, index) => (
                              <MatrixClassCard key={item?._id || item?.id || `${day}-${slot.key}-${index}`} item={item} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-[6px] sm:text-[10px] font-bold text-slate-400">—</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* UNMAPPED AMS CLASSES */}
          {unmappedRecords.length > 0 && (
            <div className="border-t border-amber-200/50 bg-amber-50/40 backdrop-blur-md p-5 sm:p-8">
              <div className="mb-4">
                <p className="text-sm font-black text-amber-900">
                  Additional Unmapped Classes
                </p>
                <p className="mt-1 text-xs font-medium text-amber-700">
                  These classes have unusual time formats and could not be mapped to fixed periods.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {unmappedRecords.map((item, index) => (
                  <ClassCard key={item?._id || item?.id || `unmapped-${index}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}