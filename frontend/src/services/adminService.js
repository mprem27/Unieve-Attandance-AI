import api from "./api";

// =====================================================
// ADMIN USERS
// =====================================================

export const getUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const getUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const createUser = async (userData) => {
  if (!userData) {
    throw new Error("User data is required.");
  }
  
  // Note: Backend now creates the user instantly and returns 201 Created.
  // It no longer hangs. The UI should catch this and trigger syncStudentProfile.
  const response = await api.post("/admin/users", userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  if (!userData) {
    throw new Error("User data is required.");
  }
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};


// =====================================================
// ADMIN STUDENT ATTENDANCE
// =====================================================

export const getUserAttendance = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  const response = await api.get(`/admin/users/${userId}/attendance`);
  return Array.isArray(response.data) ? response.data : [];
};


// =====================================================
// STUDENT COMPLETE SYNC (BACKGROUND)
// =====================================================

/**
 * Synchronize one student (AMS + Parent Portal).
 *
 * Backend: POST /admin/students/{studentId}/sync-profile
 *
 * IMPORTANT: This now returns almost instantly because the backend
 * processes the sync in the background. The UI should listen for 
 * syncInProgress status.
 */
export const syncStudentProfile = async (studentId) => {
  if (!studentId) {
    throw new Error("Student ID is required for synchronization.");
  }
  const response = await api.post(`/admin/students/${studentId}/sync-profile`);
  return response.data;
};

/**
 * Alias for syncStudentProfile. 
 * Kept for backward compatibility with existing components.
 */
export const syncSingleStudent = async (studentId) => {
  return syncStudentProfile(studentId);
};


// =====================================================
// ADMIN SYNC ALL / STATUS
// =====================================================

export const getSyncStatus = async () => {
  const response = await api.get("/admin/sync/status");
  return response.data;
};

export const runSync = async () => {
  const response = await api.post("/admin/sync", {});
  return response.data;
};


// =====================================================
// PORTAL TEST
// =====================================================

/**
 * Test Parent Portal attendance independently.
 *
 * Backend: GET /admin/students/{studentId}/portal-test
 */
export const testStudentPortal = async (studentId) => {
  if (!studentId) {
    throw new Error("Student ID is required.");
  }
  const response = await api.get(`/admin/students/${studentId}/portal-test`);
  return response.data;
};


// =====================================================
// STUDENT OVERVIEW
// =====================================================

/**
 * Get complete admin-side student overview.
 *
 * Includes:
 * - student profile
 * - attendance & summary
 * - subjects
 * - timetable
 * - notifications
 * - portal status (including syncInProgress)
 */
export const getStudentOverview = async (studentId) => {
  if (!studentId) {
    throw new Error("Student ID is required.");
  }
  const response = await api.get(`/admin/students/${studentId}/overview`);
  return response.data;
};


// =====================================================
// ADMIN SMS LOGS
// =====================================================

export const getSmsLogs = async () => {
  const response = await api.get("/admin/sms-logs");
  return Array.isArray(response.data) ? response.data : [];
};


// =====================================================
// ERROR HELPER
// =====================================================

export const getApiErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};