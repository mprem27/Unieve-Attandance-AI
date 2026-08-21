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

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const displayValue = (value) => {
  const text = clean(value);
  if (text === "") {
    return "—";
  }
  return text;
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return (`${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`).toUpperCase();
};

// =====================================================
// NORMALIZE PROFILE
// =====================================================

const normalizeProfile = (data = {}, amsProfile = {}) => {
  const profile = amsProfile && typeof amsProfile === "object" ? amsProfile : {};

  return {
    ...data,

    // BASIC
    id: firstValue(data.id, data._id, data.userId, data.user_id),
    name: firstValue(data.name, data.fullName, data.full_name, data.studentName, data.student_name, profile.name, profile.fullName, profile.full_name, profile.studentName, profile.student_name),
    email: firstValue(data.email, data.emailAddress, data.email_address, profile.email, profile.emailAddress, profile.email_address),
    role: firstValue(data.role, data.userRole, data.user_role, "student"),

    // STUDENT IDENTIFICATION
    studentId: firstValue(data.studentId, data.student_id, profile.studentId, profile.student_id),
    vtuNumber: firstValue(data.vtuNumber, data.vtu_number, data.portalUsername, data.portal_username, profile.vtuNumber, profile.vtu_number, profile.portalUsername, profile.portal_username),
    rollNumber: firstValue(data.rollNumber, data.roll_number, data.registrationNumber, data.registration_number, profile.rollNumber, profile.roll_number, profile.registrationNumber, profile.registration_number),

    // PERSONAL
    gender: firstValue(data.gender, data.sex, profile.gender, profile.sex),
    fatherName: firstValue(data.fatherName, data.father_name, data.father, profile.fatherName, profile.father_name, profile.father),
    motherName: firstValue(data.motherName, data.mother_name, data.mother, profile.motherName, profile.mother_name, profile.mother),
    dateOfBirth: firstValue(data.dateOfBirth, data.date_of_birth, data.dob, profile.dateOfBirth, profile.date_of_birth, profile.dob),
    nationality: firstValue(data.nationality, profile.nationality),
    community: firstValue(data.community, data.caste, profile.community, profile.caste),
    religion: firstValue(data.religion, profile.religion),

    // ACADEMIC
    degree: firstValue(data.degree, data.program, data.course, profile.degree, profile.program, profile.course),
    branch: firstValue(data.branch, data.department, data.dept, profile.branch, profile.department, profile.dept),
    year: firstValue(data.year, data.studyYear, data.study_year, profile.year, profile.studyYear, profile.study_year),
    semester: firstValue(data.semester, data.sem, profile.semester, profile.sem),
    section: firstValue(data.section, data.classSection, data.class_section, profile.section, profile.classSection, profile.class_section),
    batch: firstValue(data.batch, data.batchName, data.batch_name, profile.batch, profile.batchName, profile.batch_name),
    regulation: firstValue(data.regulation, data.regulationName, data.regulation_name, profile.regulation, profile.regulationName, profile.regulation_name),

    // CONTACT
    phoneNumber: firstValue(data.phoneNumber, data.phone_number, data.phone, data.mobileNumber, data.mobile_number, data.mobile, profile.phoneNumber, profile.phone_number, profile.phone, profile.mobileNumber, profile.mobile_number, profile.mobile),
    parentName: firstValue(data.parentName, data.parent_name, data.guardianName, data.guardian_name, profile.parentName, profile.parent_name, profile.guardianName, profile.guardian_name),
    parentPhone: firstValue(data.parentPhone, data.parent_phone, data.guardianPhone, data.guardian_phone, profile.parentPhone, profile.parent_phone, profile.guardianPhone, profile.guardian_phone),

    // IDENTIFICATION
    aadhaarNumber: firstValue(data.aadhaarNumber, data.aadhaar_number, data.aadhaar, profile.aadhaarNumber, profile.aadhaar_number, profile.aadhaar),
    academicBankCreditsId: firstValue(data.academicBankCreditsId, data.academic_bank_credits_id, data.academicBankOfCreditsId, data.academic_bank_of_credits_id, data.abcId, data.abc_id, profile.academicBankCreditsId, profile.academic_bank_credits_id, profile.academicBankOfCreditsId, profile.academic_bank_of_credits_id, profile.abcId, profile.abc_id),

    // PHOTO
    photoUrl: firstValue(data.photoUrl, data.photo_url, data.profileImage, data.profile_image, data.avatar, profile.photoUrl, profile.photo_url, profile.profileImage, profile.profile_image, profile.avatar),

    // SETTINGS
    smsEnabled: data.smsEnabled ?? data.sms_enabled ?? true,
    notificationsEnabled: data.notificationsEnabled ?? data.notifications_enabled ?? true,

    // ACCOUNT
    active: data.active ?? data.isActive ?? data.is_active ?? true,
    forcePasswordChange: data.forcePasswordChange ?? data.force_password_change ?? false,

    // PORTAL
    portalUsername: firstValue(data.portalUsername, data.portal_username, data.vtuNumber, data.vtu_number, profile.portalUsername, profile.portal_username, profile.vtuNumber, profile.vtu_number),
    portalCredentialsConfigured: data.portalCredentialsConfigured ?? data.portal_credentials_configured ?? Boolean(data.portalUsername || data.portal_username),
    portalSynced: data.portalSynced ?? data.portal_synced ?? data.amsSynced ?? data.ams_synced ?? false,
    lastSyncedAt: firstValue(data.lastSyncedAt, data.last_synced_at, data.syncedAt, data.synced_at, profile.lastSyncedAt, profile.last_synced_at),
  };
};

// =====================================================
// INFO ITEM (Premium Pill Style)
// =====================================================

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className={`mt-1.5 break-words text-[13px] sm:text-sm font-bold text-slate-800 ${mono ? "font-mono tracking-wider text-[#1e3a8a]" : ""}`}>
        {displayValue(value)}
      </p>
    </div>
  );
}

// =====================================================
// SECTION (Glass/Premium Wrapper)
// =====================================================

function Section({ title, description, children, delay = 0 }) {
  return (
    <section 
      className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50/50 shadow-lg shadow-[#1e3a8a]/5 opacity-0 animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-slate-100 bg-white px-6 py-6 sm:px-8">
        <h2 className="text-xl font-black tracking-tight text-[#1e3a8a]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </section>
  );
}

// =====================================================
// COURSE CARD (Premium Redesign)
// =====================================================

function CourseCard({ course, index }) {
  const courseName = firstValue(course.courseName, course.subjectName, course.name, course.course);
  const courseCode = firstValue(course.courseCode, course.subjectCode, course.code);
  const credits = firstValue(course.credit, course.credits, course.creditHours);
  const faculty = firstValue(course.facultyName, course.faculty, course.teacher, course.staff);
  const facultyId = firstValue(course.facultyId, course.staffId);
  const category = firstValue(course.category, course.courseCategory);

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0ea5e9]/40 hover:shadow-md">
      
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0ea5e9]/10 text-lg font-black text-[#0ea5e9]">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="break-words text-base font-black text-[#1e3a8a] leading-snug" title={clean(courseName)}>
              {displayValue(courseName)}
            </h3>
            <p className="mt-1 font-mono text-[11px] font-black tracking-wider text-slate-400">
              {displayValue(courseCode)}
            </p>
          </div>
          {category && (
            <span className="w-fit shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
              {displayValue(category)}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Credits</p>
            <p className="mt-0.5 text-xs font-bold text-slate-700">{displayValue(credits)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Faculty</p>
            <p className="mt-0.5 text-xs font-bold text-slate-700 line-clamp-1" title={clean(faculty)}>{displayValue(faculty)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Faculty ID</p>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-[#0ea5e9] truncate">{displayValue(facultyId)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PROFILE COMPONENT
// =====================================================

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(normalizeProfile(user || {}));
  const [bucket, setBucket] = useState("");
  const [courses, setCourses] = useState([]);
  
  const [form, setForm] = useState({
    smsEnabled: user?.smsEnabled ?? true,
    notificationsEnabled: user?.notificationsEnabled ?? true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const profileResponse = await getProfile();
      const rawProfile = profileResponse?.data && typeof profileResponse.data === "object" && !Array.isArray(profileResponse.data) ? profileResponse.data : profileResponse || {};

      let academicDetails = null;
      try {
        academicDetails = await syncStudentAcademicDetails();
      } catch (amsError) {
        // Silently catch 502/sync errors so the console doesn't get flooded.
        // We will just fall back to whatever is cached or empty.
      }

      const academicRoot = academicDetails?.data && typeof academicDetails.data === "object" && !Array.isArray(academicDetails.data)
        ? { ...academicDetails, ...academicDetails.data }
        : academicDetails || {};

      const academicProfile = academicRoot?.profile && typeof academicRoot.profile === "object" ? academicRoot.profile : {};

      const academicCourses = Array.isArray(academicRoot?.courses) ? academicRoot.courses 
        : Array.isArray(academicRoot?.registeredCourses) ? academicRoot.registeredCourses 
        : Array.isArray(academicRoot?.registeredSubjects) ? academicRoot.registeredSubjects 
        : [];

      const academicBucket = firstValue(academicRoot?.bucket, academicRoot?.yourBucket, academicRoot?.your_bucket, academicProfile?.bucket, academicProfile?.yourBucket, academicProfile?.your_bucket);

      const profileData = normalizeProfile({ ...rawProfile, ...academicRoot }, academicProfile);

      setProfile(profileData);
      setBucket(academicBucket);
      setCourses(academicCourses);
      setForm({
        smsEnabled: profileData.smsEnabled,
        notificationsEnabled: profileData.notificationsEnabled,
      });

      if (typeof setUser === "function") {
        setUser(profileData);
      }
      localStorage.setItem("user", JSON.stringify(profileData));
    } catch (err) {
      // Use silent error handling
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setError("");
    setSuccess("");
    setForm((current) => ({ ...current, [name]: checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateProfile({
        smsEnabled: Boolean(form.smsEnabled),
        notificationsEnabled: Boolean(form.notificationsEnabled),
      });

      const responseData = response?.data && typeof response.data === "object" ? response.data : response || {};

      const updatedProfile = normalizeProfile({
        ...profile,
        ...responseData,
        smsEnabled: responseData.smsEnabled ?? form.smsEnabled,
        notificationsEnabled: responseData.notificationsEnabled ?? form.notificationsEnabled,
      });

      setProfile(updatedProfile);
      if (typeof setUser === "function") {
        setUser(updatedProfile);
      }
      localStorage.setItem("user", JSON.stringify(updatedProfile));

      setSuccess("Notification preferences saved successfully.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to update your preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  const displayUser = profile || user || {};

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/80 p-4 sm:p-6 lg:p-8 xl:p-10">

      {/* INJECT ANIMATIONS & WAVE KEYFRAMES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wave-animation {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave-animation 15s linear infinite;
        }
        .animate-wave-slow {
          animation: wave-animation 20s linear infinite;
        }
      `}} />

      <div className="mx-auto max-w-[1400px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}
        <div className="mb-6 lg:mb-10 opacity-0 animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0ea5e9]">
            Student Account
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[#1e3a8a] sm:text-4xl lg:text-5xl">
            My Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
            Manage your identity, academic details, and portal configurations.
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 rounded-2xl border border-[#b91c1c]/20 bg-[#fef2f2] px-5 py-4 text-sm font-bold text-[#b91c1c] shadow-sm animate-fade-slide-up">
            <ErrorMessage message={error} onRetry={loadProfile} />
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-2xl border border-[#10b981]/20 bg-[#ecfdf5] px-5 py-4 text-sm font-bold text-[#185e3a] shadow-sm animate-fade-slide-up">
            {success}
          </div>
        )}

        {/* ================================================= */}
        {/* PROFILE HERO (Premium Gradient Banner with Waves) */}
        {/* ================================================= */}
        <div className="mb-8 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e3a8a] to-[#0ea5e9] shadow-xl shadow-[#1e3a8a]/20 opacity-0 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          
          {/* Animated Background Waves */}
          <div className="absolute bottom-0 left-0 right-0 w-[200%] h-32 text-white opacity-20 pointer-events-none z-0">
            <svg className="absolute bottom-0 animate-wave-slow" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" />
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5V0Z" opacity=".5" />
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" />
            </svg>
            <svg className="absolute bottom-0 animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" />
            </svg>
          </div>

          <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none z-0" />
          
          <div className="relative z-10 p-6 sm:p-10 flex flex-col gap-6 md:flex-row md:items-center">
            
            {/* PHOTO */}
            <div className="shrink-0 relative">
              <div className="absolute inset-0 rounded-[28px] bg-white/20 blur-md" />
              {displayUser.photoUrl ? (
                <img
                  src={displayUser.photoUrl}
                  alt={displayUser.name || "Student"}
                  className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-[28px] object-cover shadow-lg border-2 border-white/40 bg-white"
                />
              ) : (
                <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-[28px] border-2 border-white/40 bg-white/20 backdrop-blur-xl text-4xl font-black text-white shadow-lg">
                  {getInitials(displayUser.name)}
                </div>
              )}
            </div>

            {/* NAME & PRIMARY INFO */}
            <div className="min-w-0 flex-1 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
                  {displayValue(displayUser.name)}
                </h2>
                <span className="rounded-lg bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                  Student
                </span>
                <span className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    displayUser.active ? "bg-[#10b981]/20 border-[#10b981]/50 text-white" : "bg-[#b91c1c]/20 border-[#b91c1c]/50 text-white"
                  }`}>
                  {displayUser.active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-2 break-all text-sm font-semibold text-white/80">
                {displayValue(displayUser.email)}
              </p>

              {/* Quick Detail Pills */}
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">VTU</span>
                  <span className="font-mono text-sm font-bold text-white">{displayValue(displayUser.vtuNumber)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Roll</span>
                  <span className="font-mono text-sm font-bold text-white">{displayValue(displayUser.rollNumber)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Sem</span>
                  <span className="text-sm font-bold text-white">{displayValue(displayUser.semester)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* MAIN GRID LAYOUT */}
        {/* ================================================= */}
        <div className="space-y-6 lg:space-y-8">

          {/* ACADEMIC OVERVIEW */}
          <Section title="Academic Details" description="Your current academic registration structure." delay={200}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Degree" value={displayUser.degree} />
              <InfoItem label="Branch" value={displayUser.branch} />
              <InfoItem label="Year" value={displayUser.year} />
              <InfoItem label="Semester" value={displayUser.semester} />
              <InfoItem label="Section" value={displayUser.section} />
              <InfoItem label="Batch" value={displayUser.batch} />
              <InfoItem label="Regulation" value={displayUser.regulation} />
              <InfoItem label="Roll Number" value={displayUser.rollNumber} mono />
            </div>
          </Section>

          {/* YOUR BUCKET */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-100 to-white p-6 sm:p-8 shadow-sm border border-slate-200/80 opacity-0 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0ea5e9]">
                  Academic Category
                </p>
                <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#1e3a8a]">
                  Your Bucket
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Your designated grouping for class coordination.
                </p>
              </div>
              <div className="min-w-[220px] rounded-2xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/5 px-6 py-5 text-center shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Assigned Bucket
                </p>
                <p className="mt-1 text-2xl font-black text-[#1e3a8a]">
                  {displayValue(bucket)}
                </p>
              </div>
            </div>
          </section>

          {/* COURSE REGISTERED DETAILS */}
          <Section title="Course Registered Details" description={`Currently registered inside AMS • ${courses.length} ${courses.length === 1 ? "course" : "courses"}`} delay={400}>
            {courses.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-base font-bold text-slate-700">No registered courses found.</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Please synchronize your AMS information to load courses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map((course, index) => (
                  <CourseCard key={course.courseCode || course.subjectCode || `${index}-${course.courseName}`} course={course} index={index} />
                ))}
              </div>
            )}
          </Section>

          {/* PERSONAL INFORMATION */}
          <Section title="Personal Information" description="Demographics available in your student profile." delay={500}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Full Name" value={displayUser.name} />
              <InfoItem label="Gender" value={displayUser.gender} />
              <InfoItem label="Date of Birth" value={displayUser.dateOfBirth ? formatDate(displayUser.dateOfBirth) : ""} />
              <InfoItem label="Nationality" value={displayUser.nationality} />
              <InfoItem label="Community" value={displayUser.community} />
              <InfoItem label="Religion" value={displayUser.religion} />
            </div>
          </Section>

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            
            {/* CONTACT DETAILS */}
            <Section title="Contact Details" description="Your registered communication info." delay={600}>
              <div className="grid gap-4">
                <InfoItem label="Email" value={displayUser.email} />
                <InfoItem label="Mobile Number" value={displayUser.phoneNumber} mono />
                <InfoItem label="VTU Number" value={displayUser.vtuNumber} mono />
              </div>
            </Section>

            {/* PARENT INFORMATION */}
            <Section title="Parent Information" description="Guardian contact details." delay={700}>
              <div className="grid gap-4">
                <InfoItem label="Father Name" value={displayUser.fatherName} />
                <InfoItem label="Mother Name" value={displayUser.motherName} />
                <InfoItem label="Parent / Guardian" value={displayUser.parentName} />
                <InfoItem label="Parent Phone" value={displayUser.parentPhone} mono />
              </div>
            </Section>
          </div>

          {/* IDENTIFICATION */}
          <Section title="Identification Details" description="Academic and official identification." delay={800}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Student ID" value={displayUser.studentId} mono />
              <InfoItem label="VTU Number" value={displayUser.vtuNumber} mono />
              <InfoItem label="Roll Number" value={displayUser.rollNumber} mono />
              <InfoItem label="Academic Bank Credits ID" value={displayUser.academicBankCreditsId} mono />
              <InfoItem label="National ID Ref" value="[Redacted]" mono />
            </div>
          </Section>

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            
            {/* ACCOUNT STATUS */}
            <Section title="Account Status" description="Your UniEve AI integration info." delay={900}>
              <div className="grid gap-4">
                <InfoItem label="Account Status" value={displayUser.active ? "Active" : "Inactive"} />
                <InfoItem label="Role" value={displayUser.role} />
                <InfoItem label="Password Change" value={displayUser.forcePasswordChange ? "Required" : "Not Required"} />
                <InfoItem label="Portal Credentials" value={displayUser.portalCredentialsConfigured ? "Configured" : "Not Configured"} />
              </div>
            </Section>

            {/* VELTECH AMS */}
            <Section title="Veltech AMS" description="College portal synchronization state." delay={1000}>
              <div className="grid gap-4">
                <InfoItem label="AMS Username" value={displayUser.portalUsername || displayUser.vtuNumber} mono />
                <InfoItem label="Sync Status" value={displayUser.portalSynced ? "Synchronized" : "Pending"} />
                <InfoItem label="Last Synced" value={displayUser.lastSyncedAt ? formatDateTime(displayUser.lastSyncedAt) : "Current session"} />
              </div>
            </Section>
          </div>

          {/* NOTIFICATION PREFERENCES */}
          <Section title="Notification Preferences" description="Choose how UniEve AI alerts you." delay={1100}>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* SMS */}
              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/5 hover:shadow-md">
                <div>
                  <p className="text-base font-black text-[#1e3a8a]">SMS Alerts</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Receive important attendance updates directly via SMS.</p>
                </div>
                <div className="relative h-7 w-12 shrink-0">
                  <input
                    type="checkbox"
                    name="smsEnabled"
                    checked={Boolean(form.smsEnabled)}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="absolute inset-0 rounded-full bg-slate-200 transition-colors duration-300 peer-checked:bg-[#0ea5e9]" />
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                </div>
              </label>

              {/* APP NOTIFICATIONS */}
              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#10b981]/30 hover:bg-[#10b981]/5 hover:shadow-md">
                <div>
                  <p className="text-base font-black text-[#1e3a8a]">Application Notifications</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Get push warnings and internal system updates.</p>
                </div>
                <div className="relative h-7 w-12 shrink-0">
                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    checked={Boolean(form.notificationsEnabled)}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="absolute inset-0 rounded-full bg-slate-200 transition-colors duration-300 peer-checked:bg-[#10b981]" />
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
                </div>
              </label>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto rounded-xl bg-[#1e3a8a] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-[#1e3a8a]/20 transition-all hover:bg-[#0ea5e9] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {saving ? "Saving Preferences..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </Section>

          {/* AMS CREDENTIALS */}
          <div className="opacity-0 animate-fade-slide-up" style={{ animationDelay: '1200ms' }}>
            <PortalCredentialsCard />
          </div>

        </div>
      </div>
    </div>
  );
}