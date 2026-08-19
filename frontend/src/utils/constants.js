// =====================================================
// API
// =====================================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

// =====================================================
// PORTAL
// =====================================================

export const PORTAL_CONFIG = {
  NAME: "Veltech AMS",
  URL: "https://ams.veltech.edu.in/Login.htm",
};

// =====================================================
// ATTENDANCE
// =====================================================

export const MIN_ATTENDANCE_PERCENTAGE = 75;

export const ATTENDANCE_STATUS = {
  GOOD: "GOOD",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

export const ATTENDANCE_SOURCES = {
  COLLEGE_PORTAL: "college_portal",
  MOCK: "mock",
};

// =====================================================
// USER ROLES
// =====================================================

export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
};

// =====================================================
// ROUTES
// =====================================================

export const ROUTES = {
  LOGIN: "/login",

  DASHBOARD: "/dashboard",
  ATTENDANCE: "/attendance",
  SUBJECT_DETAILS: "/attendance/subject",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  CHANGE_PASSWORD: "/change-password",

  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_SYNC_STATUS: "/admin/sync-status",
  ADMIN_SMS_LOGS: "/admin/sms-logs",
};

// =====================================================
// STORAGE
// =====================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  USER: "user",
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const NOTIFICATION_TYPES = {
  ATTENDANCE: "ATTENDANCE",
  WARNING: "WARNING",
  ALERT: "ALERT",
  GENERAL: "GENERAL",
};

// =====================================================
// SMS
// =====================================================

export const SMS_STATUS = {
  TEST_LOGGED: "TEST_LOGGED",
  SKIPPED_NO_PHONE: "SKIPPED_NO_PHONE",
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  DISABLED: "DISABLED",
};