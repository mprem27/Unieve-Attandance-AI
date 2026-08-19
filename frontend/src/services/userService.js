import api from "./api";

// =====================================================
// PROFILE
// =====================================================

/**
 * Get the currently logged-in student's complete profile.
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

/**
 * Update application-level profile settings.
 */
export const updateProfile = async (profileData) => {
  if (
    !profileData ||
    typeof profileData !== "object"
  ) {
    throw new Error(
      "Profile data is required."
    );
  }

  const response = await api.put(
    "/profile",
    profileData
  );

  return response.data;
};


// =====================================================
// PORTAL / VELTECH AMS CREDENTIALS
// =====================================================

/**
 * Get AMS credential status.
 *
 * Correct mapping:
 *
 * VTU number       = VTU26381
 * Roll number      = 23UECS1039
 *
 * AMS username     = VTU26381
 * Parent Portal    = VTU26381
 * Parent password  = NOT REQUIRED
 */
export const getPortalCredentials = async () => {
  const response = await api.get(
    "/profile/portal-credentials"
  );

  return response.data;
};


/**
 * Save / update AMS credentials.
 *
 * IMPORTANT:
 * portalUsername must be the VTU number.
 *
 * Example:
 *
 * portalUsername = VTU26381
 *
 * Do NOT use:
 *
 * 23UECS1039
 */
export const updatePortalCredentials = async (
  credentials
) => {
  if (
    !credentials ||
    typeof credentials !== "object"
  ) {
    throw new Error(
      "Credentials data is required."
    );
  }

  const portalUsername = String(
    credentials.portalUsername ||
      credentials.portal_username ||
      credentials.vtuNumber ||
      credentials.vtu_number ||
      ""
  )
    .trim()
    .toUpperCase();

  if (!portalUsername) {
    throw new Error(
      "VTU number is required."
    );
  }

  const payload = {
    ...credentials,
    portalUsername,
  };

  /*
   * Only send a new AMS password when
   * one was actually entered.
   *
   * Empty password means:
   * keep the existing password.
   */
  const portalPassword = String(
    credentials.portalPassword ||
      credentials.portal_password ||
      ""
  );

  if (portalPassword) {
    payload.portalPassword =
      portalPassword;
  } else {
    delete payload.portalPassword;
    delete payload.portal_password;
  }

  /*
   * Parent Portal does NOT require a password.
   */
  delete payload.parentPortalPassword;
  delete payload.parent_portal_password;

  const response = await api.put(
    "/profile/portal-credentials",
    payload
  );

  return response.data;
};


// =====================================================
// ADMIN USERS
// =====================================================

/**
 * Get all users.
 */
export const getUsers = async () => {
  const response = await api.get(
    "/admin/users"
  );

  return response.data;
};


/**
 * Get one student's complete details.
 */
export const getUser = async (userId) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const response = await api.get(
    `/admin/users/${userId}`
  );

  return response.data;
};


// =====================================================
// CREATE STUDENT
// =====================================================

/**
 * Create a new student.
 *
 * IMPORTANT IDENTIFIERS:
 *
 * vtuNumber:
 *     VTU26381
 *
 * rollNumber:
 *     23UECS1039
 *
 * portalUsername:
 *     VTU26381
 *
 * Parent Portal password:
 *     NOT REQUIRED
 */
export const createUser = async (
  userData
) => {
  if (
    !userData ||
    typeof userData !== "object"
  ) {
    throw new Error(
      "User data is required."
    );
  }

  const payload = {
    ...userData,
  };

  /*
   * VTU number is the portal login.
   */
  if (payload.vtuNumber) {
    payload.vtuNumber = String(
      payload.vtuNumber
    )
      .trim()
      .toUpperCase();

    payload.portalUsername =
      payload.vtuNumber;
  }

  /*
   * Keep rollNumber completely separate.
   *
   * Example:
   *
   * vtuNumber  = VTU26381
   * rollNumber = 23UECS1039
   */

  const response = await api.post(
    "/admin/users",
    payload
  );

  return response.data;
};


// =====================================================
// UPDATE STUDENT
// =====================================================

/**
 * Update an existing student.
 *
 * VTU number and roll number remain separate.
 */
export const updateUser = async (
  userId,
  userData
) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (
    !userData ||
    typeof userData !== "object"
  ) {
    throw new Error(
      "User data is required."
    );
  }

  const payload = {
    ...userData,
  };

  /*
   * If VTU number is changed,
   * update the portal username to
   * the same VTU number.
   */
  if (payload.vtuNumber) {
    payload.vtuNumber = String(
      payload.vtuNumber
    )
      .trim()
      .toUpperCase();

    payload.portalUsername =
      payload.vtuNumber;
  }

  /*
   * rollNumber is NOT changed or
   * converted into portalUsername.
   */

  const response = await api.put(
    `/admin/users/${userId}`,
    payload
  );

  return response.data;
};


// =====================================================
// DELETE / DEACTIVATE STUDENT
// =====================================================

/**
 * Deactivate a student.
 */
export const deleteUser = async (
  userId
) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
};


// =====================================================
// ADMIN USER ACTIVATION
// =====================================================

/**
 * Activate a previously deactivated student.
 *
 * Backend:
 * POST /admin/users/:userId/activate
 */
export const activateUser = async (
  userId
) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const response = await api.post(
    `/admin/users/${userId}/activate`
  );

  return response.data;
};