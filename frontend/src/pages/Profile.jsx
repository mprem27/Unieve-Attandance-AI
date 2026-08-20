import {
  useCallback,
  useEffect,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import PortalCredentialsCard from "../components/PortalCredentialsCard";

import {
  getProfile,
  updateProfile,
} from "../services/profileService";

import {
  syncStudentAcademicDetails,
} from "../services/timetableService";

import {
  formatDate,
  formatDateTime,
} from "../utils/dateUtils";

// =====================================================
// HELPERS
// =====================================================

const displayValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return "";
};

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return (
      parts[0][0]?.toUpperCase() ||
      "U"
    );
  }

  return (
    `${parts[0][0] || ""}${
      parts[parts.length - 1][0] || ""
    }`
  ).toUpperCase();
};

// =====================================================
// NORMALIZE PROFILE
// =====================================================

const normalizeProfile = (
  data = {},
  amsProfile = {}
) => {
  const profile =
    amsProfile &&
    typeof amsProfile === "object"
      ? amsProfile
      : {};

  return {
    ...data,

    // ---------------------------------------------------
    // BASIC
    // ---------------------------------------------------

    id: firstValue(
      data.id,
      data._id,
      data.userId,
      data.user_id
    ),

    name: firstValue(
      data.name,
      data.fullName,
      data.full_name,
      data.studentName,
      data.student_name,

      profile.name,
      profile.fullName,
      profile.full_name,
      profile.studentName,
      profile.student_name
    ),

    email: firstValue(
      data.email,
      data.emailAddress,
      data.email_address,

      profile.email,
      profile.emailAddress,
      profile.email_address
    ),

    role: firstValue(
      data.role,
      data.userRole,
      data.user_role,
      "student"
    ),

    // ---------------------------------------------------
    // STUDENT IDENTIFICATION
    // ---------------------------------------------------

    studentId: firstValue(
      data.studentId,
      data.student_id,
      profile.studentId,
      profile.student_id
    ),

    vtuNumber: firstValue(
      data.vtuNumber,
      data.vtu_number,
      data.portalUsername,
      data.portal_username,

      profile.vtuNumber,
      profile.vtu_number,
      profile.portalUsername,
      profile.portal_username
    ),

    rollNumber: firstValue(
      data.rollNumber,
      data.roll_number,

      data.registrationNumber,
      data.registration_number,

      profile.rollNumber,
      profile.roll_number,

      profile.registrationNumber,
      profile.registration_number
    ),

    // ---------------------------------------------------
    // PERSONAL
    // ---------------------------------------------------

    gender: firstValue(
      data.gender,
      data.sex,
      profile.gender,
      profile.sex
    ),

    fatherName: firstValue(
      data.fatherName,
      data.father_name,
      data.father,

      profile.fatherName,
      profile.father_name,
      profile.father
    ),

    motherName: firstValue(
      data.motherName,
      data.mother_name,
      data.mother,

      profile.motherName,
      profile.mother_name,
      profile.mother
    ),

    dateOfBirth: firstValue(
      data.dateOfBirth,
      data.date_of_birth,
      data.dob,

      profile.dateOfBirth,
      profile.date_of_birth,
      profile.dob
    ),

    nationality: firstValue(
      data.nationality,
      profile.nationality
    ),

    community: firstValue(
      data.community,
      data.caste,
      profile.community,
      profile.caste
    ),

    religion: firstValue(
      data.religion,
      profile.religion
    ),

    // ---------------------------------------------------
    // ACADEMIC
    // ---------------------------------------------------

    degree: firstValue(
      data.degree,
      data.program,
      data.course,

      profile.degree,
      profile.program,
      profile.course
    ),

    branch: firstValue(
      data.branch,
      data.department,
      data.dept,

      profile.branch,
      profile.department,
      profile.dept
    ),

    year: firstValue(
      data.year,
      data.studyYear,
      data.study_year,

      profile.year,
      profile.studyYear,
      profile.study_year
    ),

    semester: firstValue(
      data.semester,
      data.sem,

      profile.semester,
      profile.sem
    ),

    section: firstValue(
      data.section,
      data.classSection,
      data.class_section,

      profile.section,
      profile.classSection,
      profile.class_section
    ),

    batch: firstValue(
      data.batch,
      data.batchName,
      data.batch_name,

      profile.batch,
      profile.batchName,
      profile.batch_name
    ),

    regulation: firstValue(
      data.regulation,
      data.regulationName,
      data.regulation_name,

      profile.regulation,
      profile.regulationName,
      profile.regulation_name
    ),

    // ---------------------------------------------------
    // CONTACT
    // ---------------------------------------------------

    phoneNumber: firstValue(
      data.phoneNumber,
      data.phone_number,
      data.phone,

      data.mobileNumber,
      data.mobile_number,
      data.mobile,

      profile.phoneNumber,
      profile.phone_number,
      profile.phone,

      profile.mobileNumber,
      profile.mobile_number,
      profile.mobile
    ),

    parentName: firstValue(
      data.parentName,
      data.parent_name,

      data.guardianName,
      data.guardian_name,

      profile.parentName,
      profile.parent_name,

      profile.guardianName,
      profile.guardian_name
    ),

    parentPhone: firstValue(
      data.parentPhone,
      data.parent_phone,

      data.guardianPhone,
      data.guardian_phone,

      profile.parentPhone,
      profile.parent_phone,

      profile.guardianPhone,
      profile.guardian_phone
    ),

    // ---------------------------------------------------
    // IDENTIFICATION
    // ---------------------------------------------------

    aadhaarNumber: firstValue(
      data.aadhaarNumber,
      data.aadhaar_number,
      data.aadhaar,

      profile.aadhaarNumber,
      profile.aadhaar_number,
      profile.aadhaar
    ),

    academicBankCreditsId: firstValue(
      data.academicBankCreditsId,
      data.academic_bank_credits_id,

      data.academicBankOfCreditsId,
      data.academic_bank_of_credits_id,

      data.abcId,
      data.abc_id,

      profile.academicBankCreditsId,
      profile.academic_bank_credits_id,

      profile.academicBankOfCreditsId,
      profile.academic_bank_of_credits_id,

      profile.abcId,
      profile.abc_id
    ),

    // ---------------------------------------------------
    // PHOTO
    // ---------------------------------------------------

    photoUrl: firstValue(
      data.photoUrl,
      data.photo_url,
      data.profileImage,
      data.profile_image,
      data.avatar,

      profile.photoUrl,
      profile.photo_url,
      profile.profileImage,
      profile.profile_image,
      profile.avatar
    ),

    // ---------------------------------------------------
    // SETTINGS
    // ---------------------------------------------------

    smsEnabled:
      data.smsEnabled ??
      data.sms_enabled ??
      true,

    notificationsEnabled:
      data.notificationsEnabled ??
      data.notifications_enabled ??
      true,

    // ---------------------------------------------------
    // ACCOUNT
    // ---------------------------------------------------

    active:
      data.active ??
      data.isActive ??
      data.is_active ??
      true,

    forcePasswordChange:
      data.forcePasswordChange ??
      data.force_password_change ??
      false,

    // ---------------------------------------------------
    // PORTAL
    // ---------------------------------------------------

    portalUsername: firstValue(
      data.portalUsername,
      data.portal_username,

      data.vtuNumber,
      data.vtu_number,

      profile.portalUsername,
      profile.portal_username,

      profile.vtuNumber,
      profile.vtu_number
    ),

    portalCredentialsConfigured:
      data.portalCredentialsConfigured ??
      data.portal_credentials_configured ??
      Boolean(
        data.portalUsername ||
        data.portal_username
      ),

    portalSynced:
      data.portalSynced ??
      data.portal_synced ??
      data.amsSynced ??
      data.ams_synced ??
      false,

    lastSyncedAt: firstValue(
      data.lastSyncedAt,
      data.last_synced_at,
      data.syncedAt,
      data.synced_at,

      profile.lastSyncedAt,
      profile.last_synced_at
    ),
  };
};

// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-bold text-slate-800 ${
          mono
            ? "font-mono tracking-wide"
            : ""
        }`}
      >
        {displayValue(value)}
      </p>
    </div>
  );
}

// =====================================================
// SECTION
// =====================================================

function Section({
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {children}
      </div>
    </section>
  );
}

// =====================================================
// COURSE CARD
// =====================================================

function CourseCard({
  course,
  index,
}) {
  const courseName = firstValue(
    course.courseName,
    course.subjectName,
    course.name,
    course.course
  );

  const courseCode = firstValue(
    course.courseCode,
    course.subjectCode,
    course.code
  );

  const credits = firstValue(
    course.credit,
    course.credits,
    course.creditHours
  );

  const faculty = firstValue(
    course.facultyName,
    course.faculty,
    course.teacher,
    course.staff
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/30">
      <div className="flex gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-600">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h3 className="break-words text-sm font-bold text-slate-900">
                {displayValue(
                  courseName
                )}
              </h3>

              <p className="mt-1 font-mono text-xs font-bold text-indigo-600">
                {displayValue(
                  courseCode
                )}
              </p>
            </div>

            {course.category && (
              <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {displayValue(
                  course.category
                )}
              </span>
            )}

          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">

            <InfoItem
              label="Credits"
              value={credits}
            />

            <InfoItem
              label="Faculty"
              value={faculty}
            />

            <InfoItem
              label="Faculty ID"
              value={
                course.facultyId
              }
              mono
            />

          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PROFILE
// =====================================================

export default function Profile() {
  const {
    user,
    setUser,
  } = useAuth();

  const [profile, setProfile] =
    useState(
      normalizeProfile(
        user || {}
      )
    );

  const [bucket, setBucket] =
    useState("");

  const [courses, setCourses] =
    useState([]);

  const [form, setForm] =
    useState({
      smsEnabled:
        user?.smsEnabled ?? true,

      notificationsEnabled:
        user?.notificationsEnabled ??
        true,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadProfile =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const profileResponse =
          await getProfile();

        const rawProfile =
          profileResponse?.data &&
          typeof profileResponse.data ===
            "object" &&
          !Array.isArray(
            profileResponse.data
          )
            ? profileResponse.data
            : profileResponse || {};

        let academicDetails = null;

        try {
          academicDetails =
            await syncStudentAcademicDetails();
        } catch (amsError) {
          console.warn(
            "AMS academic sync failed:",
            amsError
          );
        }

        // -------------------------------------------------
        // AMS RESPONSE NORMALIZATION
        // -------------------------------------------------
        // Keep the existing API/service untouched.
        // Some backend responses may wrap the actual
        // academic data inside "data".
        // This only makes Profile consume both shapes.
        // -------------------------------------------------

        const academicRoot =
          academicDetails?.data &&
          typeof academicDetails.data ===
            "object" &&
          !Array.isArray(
            academicDetails.data
          )
            ? {
                ...academicDetails,
                ...academicDetails.data,
              }
            : academicDetails || {};

        const academicProfile =
          academicRoot?.profile &&
          typeof academicRoot.profile ===
            "object"
            ? academicRoot.profile
            : {};

        const academicCourses =
          Array.isArray(
            academicRoot?.courses
          )
            ? academicRoot.courses
            : Array.isArray(
                academicRoot?.registeredCourses
              )
              ? academicRoot.registeredCourses
              : Array.isArray(
                  academicRoot?.registeredSubjects
                )
                ? academicRoot.registeredSubjects
                : [];

        const academicBucket =
          firstValue(
            academicRoot?.bucket,
            academicRoot?.yourBucket,
            academicRoot?.your_bucket,
            academicProfile?.bucket,
            academicProfile?.yourBucket,
            academicProfile?.your_bucket
          );

        const profileData =
          normalizeProfile(
            {
              ...rawProfile,
              ...academicRoot,
            },
            academicProfile
          );

        setProfile(
          profileData
        );

        setBucket(
          academicBucket
        );

        setCourses(
          academicCourses
        );

        setForm({
          smsEnabled:
            profileData.smsEnabled,

          notificationsEnabled:
            profileData.notificationsEnabled,
        });

        if (
          typeof setUser ===
          "function"
        ) {
          setUser(
            profileData
          );
        }

        localStorage.setItem(
          "user",
          JSON.stringify(
            profileData
          )
        );
      } catch (err) {
        setError(
          err?.response?.data
            ?.detail ||
            err?.response?.data
              ?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    }, [setUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      checked,
    } = event.target;

    setError("");
    setSuccess("");

    setForm((current) => ({
      ...current,
      [name]: checked,
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await updateProfile({
          smsEnabled:
            Boolean(
              form.smsEnabled
            ),

          notificationsEnabled:
            Boolean(
              form.notificationsEnabled
            ),
        });

      const responseData =
        response?.data &&
        typeof response.data ===
          "object"
          ? response.data
          : response || {};

      const updatedProfile =
        normalizeProfile({
          ...profile,
          ...responseData,

          smsEnabled:
            responseData.smsEnabled ??
            form.smsEnabled,

          notificationsEnabled:
            responseData.notificationsEnabled ??
            form.notificationsEnabled,
        });

      setProfile(
        updatedProfile
      );

      if (
        typeof setUser ===
        "function"
      ) {
        setUser(
          updatedProfile
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(
          updatedProfile
        )
      );

      setSuccess(
        "Notification preferences saved successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      setError(
        err?.response?.data
          ?.detail ||
          err?.response?.data
            ?.message ||
          "Unable to update your preferences."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  const displayUser =
    profile || user || {};

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/60 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}

        <div className="mb-8">

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Student Account
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Manage and view your student,
            academic, contact and AMS information
            in one place.
          </p>

        </div>

        {/* ================================================= */}
        {/* ALERTS */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={loadProfile}
            />
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        {/* ================================================= */}
        {/* PROFILE HERO */}
        {/* ================================================= */}

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

          <div className="p-6 sm:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-center">

              {/* PHOTO */}

              <div className="shrink-0">

                {displayUser.photoUrl ? (
                  <img
                    src={
                      displayUser.photoUrl
                    }
                    alt={
                      displayUser.name ||
                      "Student"
                    }
                    className="h-24 w-24 rounded-2xl object-cover shadow-md ring-4 ring-indigo-50"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-black text-white shadow-lg shadow-indigo-500/20">
                    {getInitials(
                      displayUser.name
                    )}
                  </div>
                )}

              </div>

              {/* NAME */}

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="break-words text-2xl font-black tracking-tight text-slate-900">
                    {displayValue(
                      displayUser.name
                    )}
                  </h2>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Student
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      displayUser.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {displayUser.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

                <p className="mt-2 break-all text-sm font-medium text-slate-500">
                  {displayValue(
                    displayUser.email
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">

                  <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    VTU:{" "}
                    <span className="font-mono text-slate-900">
                      {displayValue(
                        displayUser.vtuNumber
                      )}
                    </span>
                  </span>

                  <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    Roll No:{" "}
                    <span className="font-mono text-slate-900">
                      {displayValue(
                        displayUser.rollNumber
                      )}
                    </span>
                  </span>

                  <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    Semester:{" "}
                    <span className="text-slate-900">
                      {displayValue(
                        displayUser.semester
                      )}
                    </span>
                  </span>

                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* MAIN CONTENT */}
        {/* ================================================= */}

        <div className="space-y-6">

          {/* ================================================= */}
          {/* ACADEMIC OVERVIEW */}
          {/* ================================================= */}

          <Section
            title="Academic Details"
            description="Your current academic and course registration information."
          >

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <InfoItem
                label="Degree"
                value={
                  displayUser.degree
                }
              />

              <InfoItem
                label="Branch"
                value={
                  displayUser.branch
                }
              />

              <InfoItem
                label="Year"
                value={
                  displayUser.year
                }
              />

              <InfoItem
                label="Semester"
                value={
                  displayUser.semester
                }
              />

              <InfoItem
                label="Section"
                value={
                  displayUser.section
                }
              />

              <InfoItem
                label="Batch"
                value={
                  displayUser.batch
                }
              />

              <InfoItem
                label="Regulation"
                value={
                  displayUser.regulation
                }
              />

              <InfoItem
                label="Roll Number"
                value={
                  displayUser.rollNumber
                }
                mono
              />

            </div>
          </Section>

          {/* ================================================= */}
          {/* YOUR BUCKET */}
          {/* ================================================= */}

          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Academic Category
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Your Bucket
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Your bucket/category as provided by AMS.
                </p>

              </div>

              <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-indigo-100">

                <p className="text-center text-2xl font-black text-indigo-700">
                  {displayValue(
                    bucket
                  )}
                </p>

              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* COURSE REGISTERED DETAILS */}
          {/* ================================================= */}

          <Section
            title="Course Registered Details"
            description={`Courses currently registered in AMS • ${courses.length} ${
              courses.length === 1
                ? "course"
                : "courses"
            }`}
          >

            {courses.length > 0 ? (

              <div className="space-y-3">

                {courses.map(
                  (
                    course,
                    index
                  ) => (
                    <CourseCard
                      key={
                        course.courseCode ||
                        course.subjectCode ||
                        `${index}-${course.courseName}`
                      }
                      course={
                        course
                      }
                      index={
                        index
                      }
                    />
                  )
                )}

              </div>

            ) : (

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">

                <p className="text-sm font-bold text-slate-700">
                  No registered courses found.
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Please synchronize your AMS information.
                </p>

              </div>

            )}

          </Section>

          {/* ================================================= */}
          {/* PERSONAL INFORMATION */}
          {/* ================================================= */}

          <Section
            title="Personal Information"
            description="Personal information available in your student profile."
          >

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              <InfoItem
                label="Full Name"
                value={
                  displayUser.name
                }
              />

              <InfoItem
                label="Gender"
                value={
                  displayUser.gender
                }
              />

              <InfoItem
                label="Date of Birth"
                value={
                  displayUser.dateOfBirth
                    ? formatDate(
                        displayUser.dateOfBirth
                      )
                    : ""
                }
              />

              <InfoItem
                label="Nationality"
                value={
                  displayUser.nationality
                }
              />

              <InfoItem
                label="Community"
                value={
                  displayUser.community
                }
              />

              <InfoItem
                label="Religion"
                value={
                  displayUser.religion
                }
              />

            </div>
          </Section>

          {/* ================================================= */}
          {/* CONTACT + PARENT */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">

            <Section
              title="Contact Details"
              description="Your registered contact information."
            >

              <div className="grid gap-3">

                <InfoItem
                  label="Email"
                  value={
                    displayUser.email
                  }
                />

                <InfoItem
                  label="Mobile Number"
                  value={
                    displayUser.phoneNumber
                  }
                  mono
                />

                <InfoItem
                  label="VTU Number"
                  value={
                    displayUser.vtuNumber
                  }
                  mono
                />

              </div>

            </Section>

            <Section
              title="Parent Information"
              description="Parent and guardian contact details."
            >

              <div className="grid gap-3">

                <InfoItem
                  label="Father Name"
                  value={
                    displayUser.fatherName
                  }
                />

                <InfoItem
                  label="Mother Name"
                  value={
                    displayUser.motherName
                  }
                />

                <InfoItem
                  label="Parent / Guardian"
                  value={
                    displayUser.parentName
                  }
                />

                <InfoItem
                  label="Parent Phone"
                  value={
                    displayUser.parentPhone
                  }
                  mono
                />

              </div>

            </Section>

          </div>

          {/* ================================================= */}
          {/* IDENTIFICATION */}
          {/* ================================================= */}

          <Section
            title="Identification Details"
            description="Academic and identification information."
          >

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              <InfoItem
                label="Student ID"
                value={
                  displayUser.studentId
                }
                mono
              />

              <InfoItem
                label="VTU Number"
                value={
                  displayUser.vtuNumber
                }
                mono
              />

              <InfoItem
                label="Roll Number"
                value={
                  displayUser.rollNumber
                }
                mono
              />

              <InfoItem
                label="Academic Bank Credits ID"
                value={
                  displayUser.academicBankCreditsId
                }
                mono
              />

              <InfoItem
                label="Aadhaar Number"
                value={
                  displayUser.aadhaarNumber
                }
                mono
              />

            </div>
          </Section>

          {/* ================================================= */}
          {/* ACCOUNT + AMS */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">

            <Section
              title="Account Status"
              description="Your UniEve AI account information."
            >

              <div className="grid gap-3">

                <InfoItem
                  label="Account Status"
                  value={
                    displayUser.active
                      ? "Active"
                      : "Inactive"
                  }
                />

                <InfoItem
                  label="Role"
                  value={
                    displayUser.role
                  }
                />

                <InfoItem
                  label="Password Change"
                  value={
                    displayUser.forcePasswordChange
                      ? "Required"
                      : "Not Required"
                  }
                />

                <InfoItem
                  label="Portal Credentials"
                  value={
                    displayUser.portalCredentialsConfigured
                      ? "Configured"
                      : "Not Configured"
                  }
                />

              </div>

            </Section>

            <Section
              title="Veltech AMS"
              description="College portal synchronization information."
            >

              <div className="grid gap-3">

                <InfoItem
                  label="AMS Username"
                  value={
                    displayUser.portalUsername ||
                    displayUser.vtuNumber
                  }
                  mono
                />

                <InfoItem
                  label="Sync Status"
                  value={
                    displayUser.portalSynced
                      ? "Synchronized"
                      : "Available"
                  }
                />

                <InfoItem
                  label="Last Synced"
                  value={
                    displayUser.lastSyncedAt
                      ? formatDateTime(
                          displayUser.lastSyncedAt
                        )
                      : "Current session"
                  }
                />

              </div>

            </Section>

          </div>

          {/* ================================================= */}
          {/* NOTIFICATION SETTINGS */}
          {/* ================================================= */}

          <Section
            title="Notification Preferences"
            description="Choose how UniEve AI should notify you."
          >

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >

              {/* SMS */}

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/30">

                <div>

                  <p className="text-sm font-bold text-slate-900">
                    SMS Alerts
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Receive important attendance alerts through SMS.
                  </p>

                </div>

                <div className="relative h-6 w-11 shrink-0">

                  <input
                    type="checkbox"
                    name="smsEnabled"
                    checked={Boolean(
                      form.smsEnabled
                    )}
                    onChange={
                      handleChange
                    }
                    className="peer sr-only"
                  />

                  <div className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />

                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />

                </div>

              </label>

              {/* APP NOTIFICATIONS */}

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition hover:border-violet-100 hover:bg-violet-50/30">

                <div>

                  <p className="text-sm font-bold text-slate-900">
                    Application Notifications
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Receive attendance warnings and system updates.
                  </p>

                </div>

                <div className="relative h-6 w-11 shrink-0">

                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    checked={Boolean(
                      form.notificationsEnabled
                    )}
                    onChange={
                      handleChange
                    }
                    className="peer sr-only"
                  />

                  <div className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-violet-600" />

                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />

                </div>

              </label>

              <div className="flex justify-end pt-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving
                    ? "Saving..."
                    : "Save Preferences"}
                </button>

              </div>

            </form>

          </Section>

          {/* ================================================= */}
          {/* AMS CREDENTIALS */}
          {/* ================================================= */}

          <PortalCredentialsCard />

        </div>
      </div>
    </div>
  );
}