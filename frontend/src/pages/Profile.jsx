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
// BASIC HELPERS
// =====================================================

const clean = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value).trim();
};

const displayValue = (value) => {
  const text = clean(value);
  if (text === "") {
    return "—";
  }
  return text;
};

const isObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && clean(value) !== "") {
      return value;
    }
  }
  return "";
};

const normalizeKey = (value) => {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
};

const getInitials = (name) => {
  const value = clean(name);
  if (!value) return "U";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return (`${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`).toUpperCase();
};

// =====================================================
// FIND VALUE RECURSIVELY
// =====================================================

const findNestedValue = (root, aliases, maxDepth = 8) => {
  if (root === null || root === undefined || maxDepth < 0) return "";
  if (!isObject(root) && !Array.isArray(root)) return "";

  const aliasSet = new Set(aliases.map(normalizeKey));
  const visited = new WeakSet();

  const search = (value, depth) => {
    if (value === null || value === undefined || depth < 0) return "";
    if (typeof value !== "object") return "";
    if (visited.has(value)) return "";
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = search(item, depth - 1);
        if (clean(result)) return result;
      }
      return "";
    }

    for (const [key, fieldValue] of Object.entries(value)) {
      if (
        aliasSet.has(normalizeKey(key)) &&
        fieldValue !== null &&
        fieldValue !== undefined &&
        typeof fieldValue !== "object" &&
        clean(fieldValue) !== ""
      ) {
        return fieldValue;
      }
    }

    for (const fieldValue of Object.values(value)) {
      if (fieldValue && typeof fieldValue === "object") {
        const result = search(fieldValue, depth - 1);
        if (clean(result)) return result;
      }
    }
    return "";
  };

  return search(root, maxDepth);
};

const extractProfileObject = (response) => {
  if (!isObject(response)) return {};
  const directProfileFields = [
    "id", "name", "fullName", "email", "role", "studentId", "vtuNumber", "rollNumber",
    "fatherName", "motherName", "gender", "dateOfBirth", "dob", "degree", "branch",
    "department", "year", "semester", "section", "batch", "regulation", "community",
    "religion", "nationality", "phoneNumber", "mobileNumber", "parentName", "parentPhone",
    "aadhaarNumber", "academicBankCreditsId", "photoUrl", "smsEnabled", "notificationsEnabled",
    "active", "forcePasswordChange", "portalUsername", "portalCredentialsConfigured",
    "portalSynced", "lastSyncedAt", "portalSyncInProgress", "portalSyncLastError",
  ];

  const normalizedResponseKeys = new Set(Object.keys(response).map(normalizeKey));
  const hasDirectProfileField = directProfileFields.some((field) => normalizedResponseKeys.has(normalizeKey(field)));

  if (hasDirectProfileField) return response;

  const possibleKeys = ["user", "profile", "student", "studentProfile", "studentData", "userData", "details", "data", "academic", "studentDetails"];
  for (const key of possibleKeys) {
    const actualKey = Object.keys(response).find((responseKey) => normalizeKey(responseKey) === normalizeKey(key));
    if (actualKey && isObject(response[actualKey])) {
      const extracted = extractProfileObject(response[actualKey]);
      if (Object.keys(extracted).length) return extracted;
    }
  }
  return response;
};

// =====================================================
// FIELD GETTERS
// =====================================================

const getStudentName = (source) => findNestedValue(source, ["name", "fullName", "full_name", "studentName", "student_name", "candidateName", "candidate_name", "studentFullName"]);
const getStudentId = (source) => findNestedValue(source, ["studentId", "student_id", "studentID", "idNumber", "id_number", "studentNumber", "student_number"]);
const getVtuNumber = (source) => findNestedValue(source, ["vtuNumber", "vtu_number", "vtuNo", "vtu_no", "vtu", "VTU", "portalUsername", "portal_username", "username", "registrationNo", "registrationNumber", "registration_number", "regNo", "regNumber"]);
const getRollNumber = (source) => findNestedValue(source, ["rollNumber", "roll_number", "rollNo", "roll_no", "roll", "studentRollNumber", "student_roll_number", "studentRollNo"]);
const getDegree = (source) => findNestedValue(source, ["degree", "degreeName", "degree_name", "program", "programName", "program_name", "programme", "programmeName", "course"]);
const getBranch = (source) => findNestedValue(source, ["branch", "branchName", "branch_name", "department", "departmentName", "department_name", "dept", "deptName", "dept_name"]);
const getYear = (source) => findNestedValue(source, ["year", "studyYear", "study_year", "academicYear", "academic_year", "yearOfStudy", "year_of_study", "currentYear"]);
const getSemester = (source) => findNestedValue(source, ["semester", "semesterName", "semester_name", "semesterNo", "semester_no", "semesterNumber", "semester_number", "sem", "semNo", "semNumber", "currentSemester"]);
const getSection = (source) => findNestedValue(source, ["section", "sectionName", "section_name", "classSection", "class_section", "division", "class"]);
const getBatch = (source) => findNestedValue(source, ["batch", "batchName", "batch_name", "batchYear", "batch_year", "academicBatch", "academic_batch"]);
const getRegulation = (source) => findNestedValue(source, ["regulation", "regulationName", "regulation_name", "regulationCode", "regulation_code", "reg"]);
const getBucket = (source) => findNestedValue(source, ["bucket", "bucketName", "bucket_name", "bucketCode", "bucket_code", "yourBucket", "your_bucket", "academicBucket", "academic_bucket", "studentBucket", "student_bucket"]);
const getGender = (source) => findNestedValue(source, ["gender", "sex"]);
const getDateOfBirth = (source) => findNestedValue(source, ["dateOfBirth", "date_of_birth", "dob", "birthDate", "birth_date", "dateOfBirthText"]);
const getNationality = (source) => findNestedValue(source, ["nationality", "citizenship"]);
const getCommunity = (source) => findNestedValue(source, ["community", "communityName", "community_name", "caste", "casteName", "caste_name"]);
const getReligion = (source) => findNestedValue(source, ["religion", "religionName", "religion_name"]);
const getPhoneNumber = (source) => findNestedValue(source, ["phoneNumber", "phone_number", "phone", "mobileNumber", "mobile_number", "mobile", "mobileNo", "mobile_no", "contactNumber", "contact_number"]);
const getFatherName = (source) => findNestedValue(source, ["fatherName", "father_name", "father", "fathername", "fatherFullName"]);
const getMotherName = (source) => findNestedValue(source, ["motherName", "mother_name", "mother", "mothername", "motherFullName"]);
const getParentName = (source) => findNestedValue(source, ["parentName", "parent_name", "guardianName", "guardian_name", "guardian"]);
const getParentPhone = (source) => findNestedValue(source, ["parentPhone", "parent_phone", "guardianPhone", "guardian_phone", "parentMobile", "parent_mobile", "guardianMobile", "guardian_mobile"]);
const getAcademicBankCreditsId = (source) => findNestedValue(source, ["academicBankCreditsId", "academic_bank_credits_id", "academicBankOfCreditsId", "academic_bank_of_credits_id", "academicBankId", "academic_bank_id", "abcId", "abc_id", "ABCId"]);
const getAadhaarNumber = (source) => findNestedValue(source, ["aadhaarNumber", "aadhaar_number", "aadhaar", "aadharNumber", "aadhar_number", "aadhar"]);
const getPhotoUrl = (source) => findNestedValue(source, ["photoUrl", "photo_url", "profileImage", "profile_image", "profilePhoto", "profile_photo", "avatar", "image", "imageUrl", "image_url"]);

const normalizeProfile = (profileData = {}, amsData = {}) => {
  const profile = isObject(profileData) ? profileData : {};
  const ams = isObject(amsData) ? amsData : {};

  const name = firstValue(profile.name, profile.fullName, getStudentName(ams));
  const studentId = firstValue(profile.studentId, profile.student_id, getStudentId(ams));
  const vtuNumber = firstValue(profile.vtuNumber, profile.vtu_number, getVtuNumber(ams));
  const rollNumber = firstValue(profile.rollNumber, profile.roll_number, getRollNumber(ams));
  const gender = firstValue(profile.gender, getGender(ams));
  const dateOfBirth = firstValue(profile.dateOfBirth, profile.date_of_birth, getDateOfBirth(ams));
  const nationality = firstValue(profile.nationality, getNationality(ams));
  const community = firstValue(profile.community, getCommunity(ams));
  const religion = firstValue(profile.religion, getReligion(ams));
  const fatherName = firstValue(profile.fatherName, profile.father_name, getFatherName(ams));
  const motherName = firstValue(profile.motherName, profile.mother_name, getMotherName(ams));
  const parentName = firstValue(profile.parentName, profile.parent_name, getParentName(ams));
  const parentPhone = firstValue(profile.parentPhone, profile.parent_phone, getParentPhone(ams));
  const phoneNumber = firstValue(profile.phoneNumber, profile.phone_number, profile.mobileNumber, profile.mobile_number, getPhoneNumber(ams));
  const degree = firstValue(profile.degree, getDegree(ams));
  const branch = firstValue(profile.branch, getBranch(ams));
  const year = firstValue(profile.year, getYear(ams));
  const semester = firstValue(profile.semester, getSemester(ams));
  const section = firstValue(profile.section, getSection(ams));
  const batch = firstValue(profile.batch, getBatch(ams));
  const regulation = firstValue(profile.regulation, getRegulation(ams));
  const academicBankCreditsId = firstValue(profile.academicBankCreditsId, profile.academic_bank_credits_id, getAcademicBankCreditsId(ams));
  const aadhaarNumber = firstValue(profile.aadhaarNumber, profile.aadhaar_number, getAadhaarNumber(ams));
  const photoUrl = firstValue(profile.photoUrl, profile.photo_url, getPhotoUrl(ams));

  return {
    ...profile,
    id: firstValue(profile.id, profile._id),
    name,
    email: firstValue(profile.email),
    role: firstValue(profile.role, "student"),
    studentId,
    vtuNumber,
    rollNumber,
    gender,
    dateOfBirth,
    nationality,
    community,
    religion,
    fatherName,
    motherName,
    parentName,
    parentPhone,
    phoneNumber,
    degree,
    branch,
    year,
    semester,
    section,
    batch,
    regulation,
    aadhaarNumber,
    academicBankCreditsId,
    photoUrl,
    smsEnabled: typeof profile.smsEnabled === "boolean" ? profile.smsEnabled : true,
    notificationsEnabled: typeof profile.notificationsEnabled === "boolean" ? profile.notificationsEnabled : true,
    active: typeof profile.active === "boolean" ? profile.active : true,
    forcePasswordChange: typeof profile.forcePasswordChange === "boolean" ? profile.forcePasswordChange : false,
    portalUsername: firstValue(profile.portalUsername, profile.portal_username, vtuNumber),
    portalCredentialsConfigured: typeof profile.portalCredentialsConfigured === "boolean" ? profile.portalCredentialsConfigured : false,
    portalSynced: typeof profile.portalSynced === "boolean" ? profile.portalSynced : false,
    lastSyncedAt: firstValue(profile.lastSyncedAt, profile.last_synced_at) || null,
    portalSyncInProgress: typeof profile.portalSyncInProgress === "boolean" ? profile.portalSyncInProgress : false,
    portalSyncLastError: firstValue(profile.portalSyncLastError, profile.portal_sync_last_error) || null,
  };
};

const extractCourses = (root, maxDepth = 8) => {
  if (root === null || root === undefined || maxDepth < 0) return [];
  if (!isObject(root) && !Array.isArray(root)) return [];

  const courseKeys = new Set(["courses", "registeredCourses", "registered_courses", "registeredSubjects", "registered_subjects", "subjects", "courseList", "course_list", "subjectList", "subject_list", "courseRegisteredDetails", "course_registered_details"]);
  const visited = new WeakSet();

  const search = (value, depth) => {
    if (value === null || value === undefined || depth < 0 || typeof value !== "object") return [];
    if (visited.has(value)) return [];
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = search(item, depth - 1);
        if (result.length) return result;
      }
      return [];
    }

    for (const [key, fieldValue] of Object.entries(value)) {
      if (courseKeys.has(normalizeKey(key)) && Array.isArray(fieldValue)) {
        return fieldValue;
      }
    }

    for (const fieldValue of Object.values(value)) {
      if (fieldValue && typeof fieldValue === "object") {
        const result = search(fieldValue, depth - 1);
        if (result.length) return result;
      }
    }
    return [];
  };

  return search(root, maxDepth);
};

const extractBucket = (academicDetails) => {
  return firstValue(getBucket(academicDetails));
};

// Course extract helpers
const getCourseName = (course) => firstValue(course?.courseName, course?.course_name, course?.subjectName, course?.subject_name, course?.name, course?.courseTitle, course?.course_title, course?.subject, course?.title);
const getCourseCode = (course) => firstValue(course?.courseCode, course?.course_code, course?.subjectCode, course?.subject_code, course?.code, course?.coursecode);
const getCourseCredits = (course) => firstValue(course?.credit, course?.credits, course?.creditHours, course?.credit_hours);
const getCourseFaculty = (course) => firstValue(course?.facultyName, course?.faculty_name, course?.faculty, course?.teacherName, course?.teacher_name, course?.teacher, course?.staffName, course?.staff_name, course?.staff);
const getCourseFacultyId = (course) => firstValue(course?.facultyId, course?.faculty_id, course?.staffId, course?.staff_id);
const getCourseCategory = (course) => firstValue(course?.category, course?.courseCategory, course?.course_category, course?.courseType, course?.course_type, course?.type);
const getCourseSlot = (course) => firstValue(course?.slot, course?.slotName, course?.slot_name, course?.timeSlot, course?.time_slot, course?.period, course?.periodName, course?.period_name);
const getCourseRoom = (course) => firstValue(course?.room, course?.roomNo, course?.room_no, course?.roomNumber, course?.room_number, course?.classroom);


// =====================================================
// INFO ITEM
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
// SECTION
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
// MAIN PROFILE
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const profileResponse = await getProfile();
      const rawProfile = extractProfileObject(profileResponse);
      const databaseProfile = normalizeProfile(rawProfile);

      let academicDetails = null;

      try {
        academicDetails = await syncStudentAcademicDetails();
      } catch (amsError) {
        console.warn("AMS academic details could not be loaded:", amsError);
        academicDetails = null;
      }

      const academicRoot = isObject(academicDetails?.data) ? academicDetails.data : (isObject(academicDetails) ? academicDetails : {});
      const finalProfile = normalizeProfile(databaseProfile, academicRoot);
      const academicCourses = extractCourses(academicRoot);
      const academicBucket = extractBucket(academicRoot);

      setProfile(finalProfile);
      setBucket(clean(academicBucket));
      setCourses(Array.isArray(academicCourses) ? academicCourses : []);
      
      setForm({
        smsEnabled: typeof finalProfile.smsEnabled === "boolean" ? finalProfile.smsEnabled : true,
        notificationsEnabled: typeof finalProfile.notificationsEnabled === "boolean" ? finalProfile.notificationsEnabled : true,
      });

      if (typeof setUser === "function") {
        setUser(finalProfile);
      }
      localStorage.setItem("user", JSON.stringify(finalProfile));
    } catch (err) {
      console.error("Profile loading failed:", err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Unable to load your profile.");
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

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");
      
      const academicDetails = await syncStudentAcademicDetails();
      
      const academicRoot = isObject(academicDetails?.data) ? academicDetails.data : (isObject(academicDetails) ? academicDetails : {});
      const academicCourses = extractCourses(academicRoot);
      const academicBucket = extractBucket(academicRoot);
      
      const updatedProfile = normalizeProfile(profile, academicRoot);

      setProfile(updatedProfile);
      setBucket(clean(academicBucket));
      setCourses(Array.isArray(academicCourses) ? academicCourses : []);

      if (typeof setUser === "function") {
        setUser(updatedProfile);
      }
      localStorage.setItem("user", JSON.stringify(updatedProfile));

      setSuccess("Portal data synchronized successfully.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Portal sync failed:", err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Unable to synchronize portal data.");
    } finally {
      setSyncing(false);
    }
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

      const updatedRaw = extractProfileObject(response);

      const updatedProfile = normalizeProfile({
        ...profile,
        ...updatedRaw,
        smsEnabled: typeof updatedRaw.smsEnabled === "boolean" ? updatedRaw.smsEnabled : Boolean(form.smsEnabled),
        notificationsEnabled: typeof updatedRaw.notificationsEnabled === "boolean" ? updatedRaw.notificationsEnabled : Boolean(form.notificationsEnabled),
      });

      setProfile(updatedProfile);
      if (typeof setUser === "function") {
        setUser(updatedProfile);
      }
      localStorage.setItem("user", JSON.stringify(updatedProfile));

      setSuccess("Notification preferences saved successfully.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Unable to update your preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  const displayUser = profile || user || {};

  return (
    <div className="min-h-[calc(100vh-72px)] bg-transparent p-4 sm:p-6 lg:p-8 xl:p-10 overflow-hidden">

      {/* INJECT ANIMATIONS & CUSTOM KEYFRAMES */}
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
          animation: wave-animation 12s linear infinite;
        }
        .animate-wave-slow {
          animation: wave-animation 20s linear infinite;
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
        @keyframes wave-front {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-back {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .custom-timetable-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-timetable-scroll::-webkit-scrollbar-track { background: #f8fafc; border-radius: 8px; }
        .custom-timetable-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-timetable-scroll:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />

      <div className="mx-auto max-w-[1400px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 lg:mb-10 opacity-0 animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
          <div>
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
          
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-[#0ea5e9] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {syncing ? "Synchronizing..." : "Sync Portal"}
          </button>
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
        {/* PROFILE HERO (TALL WAVES, SMOKE & BUBBLES) */}
        {/* ================================================= */}
        <div className="mb-8 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0ea5e9] shadow-xl shadow-[#1e3a8a]/20 opacity-0 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          
          {/* SMOKE EFFECTS */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-20 h-64 w-64 rounded-full bg-white/20 blur-[60px] animate-[smoke-drift_10s_ease-in-out_infinite]" />
            <div className="absolute top-1/4 -right-10 h-72 w-72 rounded-full bg-[#0ea5e9]/30 blur-[70px] animate-[smoke-drift_12s_ease-in-out_infinite_reverse]" />
          </div>

          {/* TALL ANIMATED WAVES (Reaches above middle) */}
          <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[75%] sm:h-[80%] text-white pointer-events-none z-0 flex items-end">
            <svg className="absolute bottom-0 w-full h-full animate-[wave-front_14s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,60 C150,150 350,0 600,60 C850,120 1050,0 1200,60 L1200,150 L0,150 Z" opacity=".1" />
            </svg>
            <svg className="absolute bottom-0 w-full h-[85%] animate-[wave-back_18s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,80 C200,20 400,140 600,80 C800,20 1000,140 1200,80 L1200,150 L0,150 Z" opacity=".15" />
            </svg>
            <svg className="absolute bottom-0 w-full h-[70%] animate-[wave-front_22s_linear_infinite]" viewBox="0 0 1200 150" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,100 C250,180 450,40 700,100 C900,160 1100,40 1200,100 L1200,150 L0,150 Z" opacity=".2" />
            </svg>
          </div>

          {/* WATER BUBBLES */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute bottom-[-10px] left-[12%] h-4 w-4 rounded-full bg-white/40 blur-[1px] animate-[float-up_4s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-20px] left-[28%] h-6 w-6 rounded-full bg-white/30 blur-[2px] animate-[float-up_6s_ease-in-out_infinite]" style={{animationDelay: '1.5s'}} />
            <div className="absolute bottom-[-5px] left-[45%] h-3 w-3 rounded-full bg-white/50 blur-[0.5px] animate-[float-up_5s_ease-in-out_infinite]" style={{animationDelay: '3s'}} />
            <div className="absolute bottom-[-15px] left-[65%] h-7 w-7 rounded-full bg-white/20 blur-[1px] animate-[float-up_7s_ease-in-out_infinite]" style={{animationDelay: '0.8s'}} />
            <div className="absolute bottom-[-25px] left-[85%] h-5 w-5 rounded-full bg-white/40 blur-[1.5px] animate-[float-up_5.5s_ease-in-out_infinite]" style={{animationDelay: '2.5s'}} />
          </div>

          <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none z-0" />
          
          {/* HERO CONTENT */}
          <div className="relative z-10 p-6 sm:p-10 flex flex-col gap-6 md:flex-row md:items-center">
            
            {/* PHOTO */}
            <div className="shrink-0 relative mx-auto md:mx-0">
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
            <div className="min-w-0 flex-1 text-white text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
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

              <p className="mt-2 break-all text-sm font-semibold text-white/90">
                {displayValue(displayUser.email)}
              </p>

              {/* Quick Detail Pills */}
              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3">
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

          {/* COURSE REGISTERED DETAILS (Responsive FIXED Table, No Horizontal Scroll on Mobile) */}
          <Section title="Course Registered Details" description={`Currently registered inside AMS • ${courses.length} ${courses.length === 1 ? "course" : "courses"}`} delay={400}>
            {courses.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-base font-bold text-slate-700">No registered courses found.</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Please synchronize your AMS information to load courses.</p>
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[5%] sm:w-auto text-center">#</th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[12%] sm:w-auto text-center"><span className="sm:hidden">Cat</span><span className="hidden sm:inline">Category</span></th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[16%] sm:w-auto">Code</th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[27%] sm:w-auto">Course Name</th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[6%] sm:w-auto text-center"><span className="sm:hidden">Cr</span><span className="hidden sm:inline">Credits</span></th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[14%] sm:w-auto">Faculty</th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[8%] sm:w-auto">Slot</th>
                      <th className="px-1 py-3 sm:px-6 sm:py-4 text-[6px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 w-[12%] sm:w-auto">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course, index) => {
                      const courseName = getCourseName(course);
                      const courseCode = getCourseCode(course);
                      const credits = getCourseCredits(course);
                      const faculty = getCourseFaculty(course);
                      const category = getCourseCategory(course);
                      const room = getCourseRoom(course);
                      const slot = getCourseSlot(course);

                      return (
                        <tr key={course?._id || course?.id || courseCode || index} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-xs font-bold text-slate-500 text-center">{index + 1}</td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[7px] sm:text-xs font-bold text-slate-700 text-center break-words leading-tight">{displayValue(category)}</td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 font-mono text-[7px] sm:text-xs font-black text-[#0ea5e9] break-words">{displayValue(courseCode)}</td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-xs font-black text-[#1e3a8a] break-words leading-tight">
                            <div className="line-clamp-3 sm:line-clamp-none" title={clean(courseName)}>{displayValue(courseName)}</div>
                          </td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-xs font-bold text-slate-600 text-center">{displayValue(credits)}</td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[7px] sm:text-xs font-semibold text-slate-700 break-words leading-tight">
                            <div className="line-clamp-2 sm:line-clamp-none" title={clean(faculty)}>{displayValue(faculty)}</div>
                          </td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[7px] sm:text-xs font-black text-[#0ea5e9] break-words">{displayValue(slot)}</td>
                          <td className="px-1 py-3 sm:px-6 sm:py-4 text-[7px] sm:text-xs font-bold text-slate-600 break-words">{displayValue(room)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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