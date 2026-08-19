import {
  useCallback,
  useEffect,
  useMemo,
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

// =====================================================
// FIRST AVAILABLE VALUE
// =====================================================

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

// =====================================================
// INITIALS
// =====================================================

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || "U";
  }

  return (
    `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`
  ).toUpperCase();
};

// =====================================================
// OBJECT VALUE
// =====================================================

const getNestedValue = (object, paths = []) => {
  for (const path of paths) {
    const parts = path.split(".");
    let current = object;

    for (const part of parts) {
      if (
        current === null ||
        current === undefined
      ) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (
      current !== undefined &&
      current !== null &&
      current !== ""
    ) {
      return current;
    }
  }

  return "";
};

// =====================================================
// NORMALIZE PROFILE
// =====================================================

const normalizeProfile = (data = {}) => {
  /*
   * AMS information may arrive:
   *
   * 1. Directly:
   *    {
   *      name: "...",
   *      gender: "...",
   *      fatherName: "..."
   *    }
   *
   * 2. Inside:
   *    amsProfile: {...}
   *
   * 3. Inside:
   *    studentProfile: {...}
   *
   * 4. Inside:
   *    portalProfile: {...}
   */

  const amsProfile =
    data.amsProfile ||
    data.ams_profile ||
    data.studentProfile ||
    data.student_profile ||
    data.portalProfile ||
    data.portal_profile ||
    {};

  return {
    ...data,

    // ===================================================
    // BASIC
    // ===================================================

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
      amsProfile.name,
      amsProfile.fullName,
      amsProfile.full_name,
      amsProfile.studentName,
      amsProfile.student_name
    ),

    email: firstValue(
      data.email,
      data.emailAddress,
      data.email_address,
      amsProfile.email,
      amsProfile.emailAddress,
      amsProfile.email_address
    ),

    role: firstValue(
      data.role,
      data.userRole,
      data.user_role,
      "student"
    ),

    // ===================================================
    // STUDENT IDENTIFICATION
    // ===================================================

    // VTU number is the portal identifier.
    // Example: VTU26381
    // NEVER fall back to roll/registration number here.
    vtuNumber: firstValue(
      data.vtuNumber,
      data.vtu_number,

      data.portalUsername,
      data.portal_username,

      amsProfile.vtuNumber,
      amsProfile.vtu_number,

      amsProfile.portalUsername,
      amsProfile.portal_username
    ),

    // College roll / registration number is separate.
    // Example: 23UECS1039
    rollNumber: firstValue(
      data.rollNumber,
      data.roll_number,

      data.registrationNumber,
      data.registration_number,

      amsProfile.rollNumber,
      amsProfile.roll_number,

      amsProfile.registrationNumber,
      amsProfile.registration_number
    ),

    studentId: firstValue(
      data.studentId,
      data.student_id,

      amsProfile.studentId,
      amsProfile.student_id,

      data.id,
      data._id
    ),

    // ===================================================
    // PERSONAL INFORMATION
    // ===================================================

    gender: firstValue(
      data.gender,
      data.sex,

      amsProfile.gender,
      amsProfile.sex
    ),

    fatherName: firstValue(
      data.fatherName,
      data.father_name,

      data.father,

      amsProfile.fatherName,
      amsProfile.father_name,
      amsProfile.father
    ),

    motherName: firstValue(
      data.motherName,
      data.mother_name,

      data.mother,

      amsProfile.motherName,
      amsProfile.mother_name,
      amsProfile.mother
    ),

    dateOfBirth: firstValue(
      data.dateOfBirth,
      data.date_of_birth,
      data.dob,

      amsProfile.dateOfBirth,
      amsProfile.date_of_birth,
      amsProfile.dob
    ),

    degree: firstValue(
      data.degree,
      data.program,
      data.course,

      amsProfile.degree,
      amsProfile.program,
      amsProfile.course
    ),

    community: firstValue(
      data.community,
      data.caste,

      amsProfile.community,
      amsProfile.caste
    ),

    religion: firstValue(
      data.religion,

      amsProfile.religion
    ),

    nationality: firstValue(
      data.nationality,

      amsProfile.nationality
    ),

    // ===================================================
    // GOVERNMENT / ACADEMIC IDS
    // ===================================================

    aadhaarNumber: firstValue(
      data.aadhaarNumber,
      data.aadhaar_number,
      data.aadhaar,

      data.aadhaarNo,
      data.aadhaar_no,

      amsProfile.aadhaarNumber,
      amsProfile.aadhaar_number,
      amsProfile.aadhaar,

      amsProfile.aadhaarNo,
      amsProfile.aadhaar_no
    ),

    academicBankCreditsId: firstValue(
      data.academicBankCreditsId,
      data.academic_bank_credits_id,

      data.academicBankOfCreditsId,
      data.academic_bank_of_credits_id,

      data.abcId,
      data.abc_id,

      amsProfile.academicBankCreditsId,
      amsProfile.academic_bank_credits_id,

      amsProfile.academicBankOfCreditsId,
      amsProfile.academic_bank_of_credits_id,

      amsProfile.abcId,
      amsProfile.abc_id
    ),

    // ===================================================
    // CONTACT
    // ===================================================

    phoneNumber: firstValue(
      data.phoneNumber,
      data.phone_number,
      data.phone,

      data.mobileNumber,
      data.mobile_number,
      data.mobile,

      amsProfile.phoneNumber,
      amsProfile.phone_number,
      amsProfile.phone,

      amsProfile.mobileNumber,
      amsProfile.mobile_number,
      amsProfile.mobile
    ),

    parentName: firstValue(
      data.parentName,
      data.parent_name,

      data.guardianName,
      data.guardian_name,

      amsProfile.parentName,
      amsProfile.parent_name,

      amsProfile.guardianName,
      amsProfile.guardian_name
    ),

    parentPhone: firstValue(
      data.parentPhone,
      data.parent_phone,

      data.guardianPhone,
      data.guardian_phone,

      amsProfile.parentPhone,
      amsProfile.parent_phone,

      amsProfile.guardianPhone,
      amsProfile.guardian_phone
    ),

    // ===================================================
    // ACADEMIC
    // ===================================================

    branch: firstValue(
      data.branch,
      data.department,
      data.dept,

      amsProfile.branch,
      amsProfile.department,
      amsProfile.dept
    ),

    year: firstValue(
      data.year,
      data.studyYear,
      data.study_year,

      amsProfile.year,
      amsProfile.studyYear,
      amsProfile.study_year
    ),

    semester: firstValue(
      data.semester,
      data.sem,

      amsProfile.semester,
      amsProfile.sem
    ),

    section: firstValue(
      data.section,
      data.classSection,
      data.class_section,

      amsProfile.section,
      amsProfile.classSection,
      amsProfile.class_section
    ),

    batch: firstValue(
      data.batch,
      data.batchName,
      data.batch_name,

      amsProfile.batch,
      amsProfile.batchName,
      amsProfile.batch_name
    ),

    // ===================================================
    // PHOTO
    // ===================================================

    photoUrl: firstValue(
      data.photoUrl,
      data.photo_url,
      data.profileImage,
      data.profile_image,
      data.avatar,

      amsProfile.photoUrl,
      amsProfile.photo_url,
      amsProfile.profileImage,
      amsProfile.profile_image,
      amsProfile.avatar
    ),

    // ===================================================
    // NOTIFICATIONS
    // ===================================================

    smsEnabled:
      data.smsEnabled ??
      data.sms_enabled ??
      true,

    notificationsEnabled:
      data.notificationsEnabled ??
      data.notifications_enabled ??
      true,

    // ===================================================
    // ACCOUNT
    // ===================================================

    active:
      data.active ??
      data.isActive ??
      data.is_active ??
      true,

    forcePasswordChange:
      data.forcePasswordChange ??
      data.force_password_change ??
      false,

    // ===================================================
    // PORTAL
    // ===================================================

    // AMS username and Parent Portal login are both VTU number.
    // Parent Portal does not require a password.
    portalUsername: firstValue(
      data.portalUsername,
      data.portal_username,

      data.vtuNumber,
      data.vtu_number,

      amsProfile.portalUsername,
      amsProfile.portal_username,

      amsProfile.vtuNumber,
      amsProfile.vtu_number
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

      amsProfile.lastSyncedAt,
      amsProfile.last_synced_at
    ),
  };
};

// =====================================================
// INFORMATION ROW
// =====================================================

function InfoRow({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        {label}
      </span>

      <span
        className={`break-words text-sm font-bold text-slate-700 sm:text-right ${
          mono
            ? "font-mono tracking-wide"
            : ""
        }`}
      >
        {displayValue(value)}
      </span>
    </div>
  );
}

// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  title,
  description,
  icon,
}) {
  return (
    <div className="border-b border-slate-100 p-6 sm:px-8 sm:py-6">
      <div className="flex items-start gap-3">

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {description}
            </p>
          )}
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
      normalizeProfile(user || {})
    );

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
  // LOAD PROFILE
  // =====================================================

  const loadProfile =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getProfile();

        /*
         * profileService currently returns
         * response.data.
         *
         * This also supports a response like:
         *
         * {
         *   data: {...}
         * }
         */

        const rawProfile =
          response?.data &&
          typeof response.data ===
            "object" &&
          !Array.isArray(
            response.data
          )
            ? response.data
            : response || {};

        const profileData =
          normalizeProfile(
            rawProfile
          );

        console.log(
          "Complete profile received:",
          rawProfile
        );

        console.log(
          "Normalized profile:",
          profileData
        );

        setProfile(
          profileData
        );

        setForm({
          smsEnabled:
            profileData.smsEnabled,

          notificationsEnabled:
            profileData.notificationsEnabled,
        });

        // -------------------------------------------------
        // UPDATE AUTH CONTEXT
        // -------------------------------------------------

        if (
          typeof setUser ===
          "function"
        ) {
          setUser(profileData);
        }

        // -------------------------------------------------
        // UPDATE LOCAL STORAGE
        // -------------------------------------------------

        localStorage.setItem(
          "user",
          JSON.stringify(
            profileData
          )
        );
      } catch (err) {
        console.error(
          "Profile loading failed:",
          err
        );

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

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // =====================================================
  // HANDLE SETTINGS
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

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        smsEnabled:
          Boolean(
            form.smsEnabled
          ),

        notificationsEnabled:
          Boolean(
            form.notificationsEnabled
          ),
      };

      const response =
        await updateProfile(
          payload
        );

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

      setForm({
        smsEnabled:
          updatedProfile.smsEnabled,

        notificationsEnabled:
          updatedProfile.notificationsEnabled,
      });

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
        "Your notification preferences were updated successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error(
        "Profile update failed:",
        err
      );

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

  // =====================================================
  // DISPLAY USER
  // =====================================================

  const displayUser =
    profile || user || {};

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">

      <div className="mx-auto max-w-[1500px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8">

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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>

            </span>

            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Account
            </span>

          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            My Profile
          </h1>

          <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500 sm:text-base">
            View your complete student information,
            academic details, personal information,
            account status and notification preferences.
          </p>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={loadProfile}
            />
          </div>
        )}

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {success && (

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50 p-4">

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

        {/* ================================================= */}
        {/* MAIN GRID */}
        {/* ================================================= */}

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">

          {/* ================================================= */}
          {/* LEFT */}
          {/* ================================================= */}

          <div className="space-y-6">

            {/* PROFILE CARD */}

            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">

              <div className="flex flex-col items-center text-center">

                {displayUser.photoUrl ? (

                  <img
                    src={
                      displayUser.photoUrl
                    }
                    alt={
                      displayUser.name ||
                      "Student"
                    }
                    className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white"
                  />

                ) : (

                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl font-black text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white">
                    {getInitials(
                      displayUser.name
                    )}
                  </div>

                )}

                <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {displayValue(
                    displayUser.name
                  )}
                </h2>

                <p className="mt-1 break-all text-sm font-medium text-slate-500">
                  {displayValue(
                    displayUser.email
                  )}
                </p>

                <span className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">
                  {displayValue(
                    displayUser.role
                  )}
                </span>

              </div>

              <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Account
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      displayUser.active
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {displayUser.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

                <InfoRow
                  label="Roll Number"
                  value={
                    displayUser.rollNumber ||
                    displayUser.vtuNumber
                  }
                  mono
                />

                <InfoRow
                  label="Mobile"
                  value={
                    displayUser.phoneNumber
                  }
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* ACADEMIC SUMMARY */}
            {/* ================================================= */}

            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">

              <h3 className="text-base font-bold text-slate-900">
                Academic Summary
              </h3>

              <div className="mt-5 space-y-3">

                <InfoRow
                  label="Degree"
                  value={
                    displayUser.degree
                  }
                />

                <InfoRow
                  label="Branch"
                  value={
                    displayUser.branch
                  }
                />

                <InfoRow
                  label="Year"
                  value={
                    displayUser.year
                  }
                />

                <InfoRow
                  label="Semester"
                  value={
                    displayUser.semester
                  }
                />

                <InfoRow
                  label="Section"
                  value={
                    displayUser.section
                  }
                />

                <InfoRow
                  label="Batch"
                  value={
                    displayUser.batch
                  }
                />

              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT */}
          {/* ================================================= */}

          <div className="space-y-6 lg:col-span-2">

            {/* ================================================= */}
            {/* PERSONAL INFORMATION */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Personal Information"
                description="Student information maintained by the administration and AMS."
                icon={
                  <svg
                    className="h-5 w-5"
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
                }
              />

              <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">

                <InfoRow
                  label="Student Name"
                  value={
                    displayUser.name
                  }
                />

                <InfoRow
                  label="Roll Number"
                  value={
                    displayUser.rollNumber ||
                    displayUser.vtuNumber
                  }
                  mono
                />

                <InfoRow
                  label="Gender"
                  value={
                    displayUser.gender
                  }
                />

                <InfoRow
                  label="Father Name"
                  value={
                    displayUser.fatherName
                  }
                />

                <InfoRow
                  label="Mother Name"
                  value={
                    displayUser.motherName
                  }
                />

                <InfoRow
                  label="Date of Birth"
                  value={
                    displayUser.dateOfBirth
                      ? formatDate(
                          displayUser.dateOfBirth
                        )
                      : "—"
                  }
                />

                <InfoRow
                  label="Degree"
                  value={
                    displayUser.degree
                  }
                />

                <InfoRow
                  label="Nationality"
                  value={
                    displayUser.nationality
                  }
                />

                <InfoRow
                  label="Community"
                  value={
                    displayUser.community
                  }
                />

                <InfoRow
                  label="Religion"
                  value={
                    displayUser.religion
                  }
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* CONTACT */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Contact & Identification"
                description="Registered contact and academic identification details."
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a.75.75 0 01-.941.218 12.035 12.035 0 01-5.735-5.735.75.75 0 01.218-.941l1.293-.97c.372-.279.542-.76.417-1.173L9.422 5.662A1.125 1.125 0 008.33 4.81H6.75A2.25 2.25 0 004.5 7.06v-.31z"
                    />
                  </svg>
                }
              />

              <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">

                <InfoRow
                  label="Mobile Number"
                  value={
                    displayUser.phoneNumber
                  }
                  mono
                />

                <InfoRow
                  label="Email"
                  value={
                    displayUser.email
                  }
                />

                <InfoRow
                  label="VTU Number"
                  value={
                    displayUser.vtuNumber
                  }
                  mono
                />

                <InfoRow
                  label="Academic Bank Credits ID"
                  value={
                    displayUser.academicBankCreditsId
                  }
                  mono
                />

                <InfoRow
                  label="Aadhaar Number"
                  value={
                    displayUser.aadhaarNumber
                  }
                  mono
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* PARENT INFORMATION */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Parent Information"
                description="Parent and guardian information."
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766"
                    />
                  </svg>
                }
              />

              <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">

                <InfoRow
                  label="Father Name"
                  value={
                    displayUser.fatherName
                  }
                />

                <InfoRow
                  label="Mother Name"
                  value={
                    displayUser.motherName
                  }
                />

                <InfoRow
                  label="Parent / Guardian"
                  value={
                    displayUser.parentName
                  }
                />

                <InfoRow
                  label="Parent Phone"
                  value={
                    displayUser.parentPhone
                  }
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* ACADEMIC */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Academic Details"
                description="Current academic information."
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.23-4.41 60.438 60.438 0 00-.491-6.347m-15.48 0a50.248 50.248 0 0115.48 0m-15.48 0a50.25 50.25 0 00-2.93 1.083A48.25 48.25 0 0112 20.904a48.25 48.25 0 018.23-9.674 50.25 50.25 0 00-2.93-1.083m-15.48 0A50.25 50.25 0 0112 3.75a50.25 50.25 0 019.74 1.397m-19.48 0A50.25 50.25 0 0112 3.75"
                    />
                  </svg>
                }
              />

              <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">

                <InfoRow
                  label="Degree"
                  value={
                    displayUser.degree
                  }
                />

                <InfoRow
                  label="Branch"
                  value={
                    displayUser.branch
                  }
                />

                <InfoRow
                  label="Year"
                  value={
                    displayUser.year
                  }
                />

                <InfoRow
                  label="Semester"
                  value={
                    displayUser.semester
                  }
                />

                <InfoRow
                  label="Section"
                  value={
                    displayUser.section
                  }
                />

                <InfoRow
                  label="Batch"
                  value={
                    displayUser.batch
                  }
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* ACCOUNT STATUS */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Account Status"
                description="Your UniEve AI account status."
              />

              <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">

                <InfoRow
                  label="Account"
                  value={
                    displayUser.active
                      ? "Active"
                      : "Inactive"
                  }
                />

                <InfoRow
                  label="Role"
                  value={
                    displayUser.role
                  }
                />

                <InfoRow
                  label="Password Change"
                  value={
                    displayUser.forcePasswordChange
                      ? "Required"
                      : "Not Required"
                  }
                />

                <InfoRow
                  label="Portal Credentials"
                  value={
                    displayUser.portalCredentialsConfigured
                      ? "Configured"
                      : "Not Configured"
                  }
                />

              </div>
            </div>

            {/* ================================================= */}
            {/* AMS SYNC */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Veltech AMS Sync"
                description="College portal synchronization status."
              />

              <div className="p-6 sm:p-8">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm font-bold text-slate-900">
                      AMS Profile Status
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Student details are fetched from AMS
                      when synchronization is successful.
                    </p>

                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      displayUser.portalSynced
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {displayUser.portalSynced
                      ? "Synced"
                      : "Not Synced"}
                  </span>

                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Synced
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {displayUser.lastSyncedAt
                        ? formatDateTime(
                            displayUser.lastSyncedAt
                          )
                        : "Never"}
                    </p>

                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      AMS Username
                    </p>

                    <p className="mt-2 break-all text-sm font-mono font-bold text-slate-700">
                      {displayValue(
                        displayUser.portalUsername
                      )}
                    </p>

                  </div>

                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* NOTIFICATIONS */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              <SectionHeader
                title="Notification Preferences"
                description="Choose how UniEve AI should notify you."
              />

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5 p-6 sm:p-8"
              >

                {/* SMS */}

                <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">

                  <div>

                    <p className="text-sm font-bold text-slate-900">
                      SMS Alerts
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Receive attendance alerts through SMS.
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

                {/* APP */}

                <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">

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

                {/* SAVE */}

                <div className="flex justify-end">

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
            </div>

            {/* ================================================= */}
            {/* VELTECH AMS - BOTTOM */}
            {/* ================================================= */}

            <div className="pt-2">

              <PortalCredentialsCard />

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}