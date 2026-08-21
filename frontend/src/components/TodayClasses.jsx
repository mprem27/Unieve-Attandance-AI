import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";

// =====================================================
// FIXED AMS TIME SLOTS
// =====================================================

const TIME_SLOTS = [
  {
    start: "08:45",
    end: "09:35",
  },
  {
    start: "09:45",
    end: "10:35",
  },
  {
    start: "10:45",
    end: "11:35",
  },
  {
    start: "11:45",
    end: "12:35",
  },
  {
    start: "12:35",
    end: "13:25",
  },
  {
    start: "13:25",
    end: "14:15",
  },
  {
    start: "14:15",
    end: "15:05",
  },
  {
    start: "15:15",
    end: "16:05",
  },
];

// =====================================================
// DAY NORMALIZATION
// =====================================================

const normalizeDay = (value) => {
  if (!value) {
    return "";
  }

  const day = String(value)
    .trim()
    .toLowerCase();

  const dayMap = {
    sun: "sunday",
    sunday: "sunday",

    mon: "monday",
    monday: "monday",

    tue: "tuesday",
    tues: "tuesday",
    tuesday: "tuesday",

    wed: "wednesday",
    wednesday: "wednesday",

    thu: "thursday",
    thurs: "thursday",
    thursday: "thursday",

    fri: "friday",
    friday: "friday",

    sat: "saturday",
    saturday: "saturday",
  };

  return dayMap[day] || day;
};

// =====================================================
// GET TODAY
// =====================================================

const getTodayName = () => {
  return normalizeDay(
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      }
    )
  );
};

// =====================================================
// TIME HELPERS
// =====================================================

const timeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  const value = String(time)
    .trim()
    .toUpperCase();

  // HH:MM AM/PM
  const twelveHourMatch =
    value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );

  if (twelveHourMatch) {
    let hours = Number(
      twelveHourMatch[1]
    );

    const minutes = Number(
      twelveHourMatch[2]
    );

    const period =
      twelveHourMatch[3];

    if (
      period === "AM" &&
      hours === 12
    ) {
      hours = 0;
    }

    if (
      period === "PM" &&
      hours !== 12
    ) {
      hours += 12;
    }

    return hours * 60 + minutes;
  }

  // HH:MM
  const twentyFourHourMatch =
    value.match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (twentyFourHourMatch) {
    return (
      Number(twentyFourHourMatch[1]) *
        60 +
      Number(twentyFourHourMatch[2])
    );
  }

  return null;
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (time) => {
  if (!time) {
    return "";
  }

  const minutes =
    timeToMinutes(time);

  if (minutes === null) {
    return String(time);
  }

  const hours24 = Math.floor(
    minutes / 60
  );

  const mins = minutes % 60;

  const period =
    hours24 >= 12 ? "PM" : "AM";

  let hours12 =
    hours24 % 12;

  if (hours12 === 0) {
    hours12 = 12;
  }

  return `${String(hours12).padStart(
    2,
    "0"
  )}:${String(mins).padStart(
    2,
    "0"
  )} ${period}`;
};

// =====================================================
// GET RECORD FIELD
// =====================================================

const getField = (
  record,
  fields,
  fallback = ""
) => {
  if (!record) {
    return fallback;
  }

  for (const field of fields) {
    const value =
      record[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

// =====================================================
// GET DAY FROM RECORD
// =====================================================

const getRecordDay = (record) => {
  return normalizeDay(
    getField(record, [
      "day",
      "weekday",
      "weekDay",
      "week_day",
      "dayName",
      "day_name",
    ])
  );
};

// =====================================================
// GET START TIME
// =====================================================

const getStartTime = (record) => {
  return getField(record, [
    "startTime",
    "start_time",
    "fromTime",
    "from_time",
    "start",
    "from",
  ]);
};

// =====================================================
// GET END TIME
// =====================================================

const getEndTime = (record) => {
  return getField(record, [
    "endTime",
    "end_time",
    "toTime",
    "to_time",
    "end",
    "to",
  ]);
};

// =====================================================
// GET SLOT
// =====================================================

const getSlot = (record) => {
  const start =
    getStartTime(record);

  const end =
    getEndTime(record);

  const startMinutes =
    timeToMinutes(start);

  const endMinutes =
    timeToMinutes(end);

  // ---------------------------------------------------
  // Exact / matching timetable slot
  // ---------------------------------------------------

  const exactSlot =
    TIME_SLOTS.find(
      (slot) => {
        const slotStart =
          timeToMinutes(
            slot.start
          );

        const slotEnd =
          timeToMinutes(
            slot.end
          );

        return (
          startMinutes ===
            slotStart &&
          endMinutes ===
            slotEnd
        );
      }
    );

  if (exactSlot) {
    return exactSlot;
  }

  // ---------------------------------------------------
  // If only start time is available
  // ---------------------------------------------------

  if (startMinutes !== null) {
    const startMatch =
      TIME_SLOTS.find(
        (slot) =>
          timeToMinutes(
            slot.start
          ) === startMinutes
      );

    if (startMatch) {
      return startMatch;
    }
  }

  // ---------------------------------------------------
  // If no time exists, don't guess
  // ---------------------------------------------------

  return null;
};

// =====================================================
// GET SUBJECT
// =====================================================

const getSubjectName = (record) => {
  return getField(record, [
    "subjectName",
    "subject_name",
    "subject",
    "courseName",
    "course_name",
    "name",
    "title",
  ], "Class");
};

// =====================================================
// GET SUBJECT CODE
// =====================================================

const getSubjectCode = (record) => {
  return getField(record, [
    "subjectCode",
    "subject_code",
    "courseCode",
    "course_code",
    "code",
  ]);
};

// =====================================================
// GET FACULTY
// =====================================================

const getFaculty = (record) => {
  return getField(record, [
    "facultyName",
    "faculty_name",
    "faculty",
    "teacherName",
    "teacher_name",
    "teacher",
    "staffName",
    "staff_name",
    "staff",
  ]);
};

// =====================================================
// GET ROOM
// =====================================================

const getRoom = (record) => {
  return getField(record, [
    "room",
    "roomNumber",
    "room_number",
    "roomNo",
    "room_no",
    "classRoom",
    "class_room",
  ]);
};

// =====================================================
// GET SUBJECT ID
// =====================================================

const getSubjectId = (record) => {
  return getField(record, [
    "subjectId",
    "subject_id",
    "subjectID",
    "id",
    "_id",
  ]);
};

// =====================================================
// STATUS
// =====================================================

const getClassStatus = (
  slot,
  currentMinutes
) => {
  if (!slot) {
    return "upcoming";
  }

  const start =
    timeToMinutes(
      slot.start
    );

  const end =
    timeToMinutes(
      slot.end
    );

  if (
    start === null ||
    end === null
  ) {
    return "upcoming";
  }

  if (currentMinutes < start) {
    return "upcoming";
  }

  if (currentMinutes >= end) {
    return "completed";
  }

  return "now";
};

// =====================================================
// STATUS CONFIG
// =====================================================

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className:
      "border-slate-200 bg-slate-50 text-slate-600",
    iconClass:
      "bg-slate-100 text-slate-500",
  },

  now: {
    label: "Now",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClass:
      "bg-emerald-100 text-emerald-600",
  },

  upcoming: {
    label: "Upcoming",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    iconClass:
      "bg-blue-100 text-blue-600",
  },
};

// =====================================================
// COMPONENT
// =====================================================

export default function TodayClasses({
  timetable = [],
}) {
  // ===================================================
  // CURRENT TIME
  // ===================================================

  const [now, setNow] =
    useState(new Date());

  // ===================================================
  // UPDATE CURRENT TIME
  // ===================================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        setNow(new Date());
      }, 30000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ===================================================
  // TODAY
  // ===================================================

  const todayName =
    normalizeDay(
      now.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        }
      )
    );

  const todayLabel =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  // ===================================================
  // SAFE TIMETABLE
  // ===================================================

  const safeTimetable =
    Array.isArray(timetable)
      ? timetable
      : [];

  // ===================================================
  // TODAY'S TIMETABLE
  // ===================================================

  const todaysClasses =
    useMemo(() => {
      const filtered =
        safeTimetable
          .filter((record) => {
            const recordDay =
              getRecordDay(
                record
              );

            return (
              recordDay ===
              todayName
            );
          })
          .map((record) => {
            const slot =
              getSlot(record);

            return {
              ...record,
              slot,
            };
          });

      // ------------------------------------------------
      // SORT USING FIXED AMS SLOT ORDER
      // ------------------------------------------------

      return filtered.sort(
        (a, b) => {
          const aStart =
            a.slot
              ? timeToMinutes(
                  a.slot.start
                )
              : timeToMinutes(
                  getStartTime(a)
                );

          const bStart =
            b.slot
              ? timeToMinutes(
                  b.slot.start
                )
              : timeToMinutes(
                  getStartTime(b)
                );

          if (
            aStart === null &&
            bStart === null
          ) {
            return 0;
          }

          if (aStart === null) {
            return 1;
          }

          if (bStart === null) {
            return -1;
          }

          return (
            aStart - bStart
          );
        }
      );
    }, [
      safeTimetable,
      todayName,
    ]);

  // ===================================================
  // CURRENT MINUTES
  // ===================================================

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  // ===================================================
  // CLASS COUNTS
  // ===================================================

  const counts = useMemo(() => {
    let completed = 0;
    let nowClass = 0;
    let upcoming = 0;

    todaysClasses.forEach(
      (item) => {
        const status =
          getClassStatus(
            item.slot,
            currentMinutes
          );

        if (
          status ===
          "completed"
        ) {
          completed++;
        }

        if (
          status === "now"
        ) {
          nowClass++;
        }

        if (
          status ===
          "upcoming"
        ) {
          upcoming++;
        }
      }
    );

    return {
      total:
        todaysClasses.length,
      completed,
      now:
        nowClass,
      upcoming,
    };
  }, [
    todaysClasses,
    currentMinutes,
  ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:rounded-3xl sm:p-7 lg:p-8">

      {/* ================================================= */}
      {/* TOP ACCENT */}
      {/* ================================================= */}

      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-cyan-500 sm:h-1.5" />

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm">

            <CalendarDays
              size={22}
              strokeWidth={2}
            />

          </div>

          <div>

            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Today's Classes
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {todayLabel}
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* TOTAL */}
        {/* ================================================= */}

        <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">

          <BookOpen
            size={14}
            className="text-slate-500"
          />

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:text-xs">
            {counts.total}{" "}
            {counts.total === 1
              ? "Class"
              : "Classes"}
          </span>

        </div>

      </div>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      {todaysClasses.length >
        0 && (
        <div className="mb-6 grid grid-cols-3 gap-2.5 sm:gap-4">

          {/* COMPLETED */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">

            <div className="flex items-center gap-2">

              <CheckCircle2
                size={16}
                className="text-slate-500"
              />

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                Completed
              </p>

            </div>

            <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
              {counts.completed}
            </p>

          </div>

          {/* NOW */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">

            <div className="flex items-center gap-2">

              <Clock3
                size={16}
                className="text-emerald-600"
              />

              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 sm:text-xs">
                Now
              </p>

            </div>

            <p className="mt-1 text-xl font-black text-emerald-600 sm:text-2xl">
              {counts.now}
            </p>

          </div>

          {/* UPCOMING */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 sm:p-4">

            <div className="flex items-center gap-2">

              <CalendarDays
                size={16}
                className="text-blue-600"
              />

              <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700 sm:text-xs">
                Upcoming
              </p>

            </div>

            <p className="mt-1 text-xl font-black text-blue-600 sm:text-2xl">
              {counts.upcoming}
            </p>

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* CLASSES */}
      {/* ================================================= */}

      {todaysClasses.length ===
      0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">

          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

            <CalendarDays
              size={30}
            />

          </div>

          <h3 className="text-sm font-bold text-slate-700 sm:text-base">
            No Classes Scheduled Today
          </h3>

          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">
            There are no timetable entries mapped to{" "}
            <span className="font-bold text-slate-500">
              {todayName}
            </span>
            .
          </p>

        </div>
      ) : (
        <div className="space-y-3">

          {todaysClasses.map(
            (
              record,
              index
            ) => {

              const status =
                getClassStatus(
                  record.slot,
                  currentMinutes
                );

              const config =
                STATUS_CONFIG[
                  status
                ];

              const subject =
                getSubjectName(
                  record
                );

              const code =
                getSubjectCode(
                  record
                );

              const faculty =
                getFaculty(
                  record
                );

              const room =
                getRoom(
                  record
                );

              const subjectId =
                getSubjectId(
                  record
                );

              const start =
                record.slot
                  ?.start ||
                getStartTime(
                  record
                );

              const end =
                record.slot
                  ?.end ||
                getEndTime(
                  record
                );

              return (
                <article
                  key={
                    subjectId ||
                    record?.id ||
                    record?._id ||
                    `${todayName}-${start}-${index}`
                  }
                  className={`
                    group relative overflow-hidden
                    rounded-2xl border
                    p-4
                    transition-all duration-200
                    sm:p-5
                    ${
                      status === "now"
                        ? "border-emerald-200 bg-emerald-50/40 shadow-md shadow-emerald-100/50"
                        : "border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-sm"
                    }
                  `}
                >

                  {/* CURRENT CLASS INDICATOR */}

                  {status ===
                    "now" && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    {/* ================================================= */}
                    {/* TIME */}
                    {/* ================================================= */}

                    <div className="flex shrink-0 items-center gap-3 sm:w-[155px] sm:flex-col sm:items-start sm:gap-1">

                      <div className="flex items-center gap-2">

                        <Clock3
                          size={16}
                          className={
                            status ===
                            "now"
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }
                        />

                        <span className="text-sm font-black text-slate-900">
                          {formatTime(
                            start
                          )}
                        </span>

                      </div>

                      <span className="hidden text-[10px] font-bold text-slate-400 sm:block">
                        to{" "}
                        {formatTime(
                          end
                        )}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 sm:hidden">
                        –
                      </span>

                      <span className="text-sm font-black text-slate-900 sm:hidden">
                        {formatTime(
                          end
                        )}
                      </span>

                    </div>

                    {/* ================================================= */}
                    {/* SUBJECT */}
                    {/* ================================================= */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start gap-3">

                        <div
                          className={`
                            flex h-10 w-10 shrink-0
                            items-center justify-center
                            rounded-xl
                            ${config.iconClass}
                          `}
                        >

                          <BookOpen
                            size={19}
                          />

                        </div>

                        <div className="min-w-0">

                          <h3
                            className="truncate text-sm font-black text-slate-900 sm:text-base"
                            title={subject}
                          >
                            {subject}
                          </h3>

                          {code && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {code}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">

                            {faculty && (
                              <div className="flex items-center gap-1.5">

                                <UserRound
                                  size={12}
                                  className="text-slate-400"
                                />

                                <span className="text-[10px] font-semibold text-slate-500">
                                  {faculty}
                                </span>

                              </div>
                            )}

                            {room && (
                              <div className="flex items-center gap-1.5">

                                <MapPin
                                  size={12}
                                  className="text-slate-400"
                                />

                                <span className="text-[10px] font-semibold text-slate-500">
                                  {room}
                                </span>

                              </div>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* ================================================= */}
                    {/* STATUS */}
                    {/* ================================================= */}

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">

                      <span
                        className={`
                          inline-flex items-center gap-1.5
                          rounded-full border
                          px-3 py-1.5
                          text-[9px] font-black uppercase
                          tracking-wider
                          ${config.className}
                        `}
                      >

                        {status ===
                          "now" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        )}

                        {config.label}

                      </span>

                      {status ===
                        "now" && (
                        <span className="text-[9px] font-bold text-emerald-600">
                          Class in progress
                        </span>
                      )}

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      {todaysClasses.length >
        0 && (
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">

          <div className="h-2 w-2 rounded-full bg-emerald-500" />

          <p className="text-[10px] font-medium text-slate-400">
            Timetable shown for{" "}
            <span className="font-bold text-slate-500">
              {todayName}
            </span>
            . Classes are ordered by the fixed timetable slots.
          </p>

        </div>
      )}

    </section>
  );
}