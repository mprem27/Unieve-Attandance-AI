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
 *
 * Supported:
 * - smsEnabled
 * - notificationsEnabled
 */
export const updateProfile = async (profileData) => {
  if (
    !profileData ||
    typeof profileData !== "object"
  ) {
    throw new Error("Profile data is required.");
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
 * Get portal credential status.
 *
 * IMPORTANT:
 *
 * AMS username:
 *     VTU26381
 *
 * Parent Portal login:
 *     VTU26381
 *
 * Parent Portal password:
 *     NOT REQUIRED
 *
 * The backend must NEVER return the password.
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
 * AMS:
 *   username = VTU number
 *   password = AMS password
 *
 * Parent Portal:
 *   username = VTU number
 *   password = NOT REQUIRED
 */
export const updatePortalCredentials = async (
  credentials
) => {
  if (
    !credentials ||
    typeof credentials !== "object"
  ) {
    throw new Error(
      "Credentials are required."
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

  const portalPassword = String(
    credentials.portalPassword ||
      credentials.portal_password ||
      ""
  );

  if (!portalUsername) {
    throw new Error(
      "VTU number is required."
    );
  }

  /*
   * IMPORTANT
   *
   * Portal username MUST be VTU number.
   *
   * Example:
   *
   * VTU number:
   *     VTU26381
   *
   * Roll / Registration:
   *     23UECS1039
   *
   * Never use 23UECS1039 as portal username.
   */
  const payload = {
    ...credentials,
    portalUsername,
  };

  /*
   * Only send a password when the user
   * actually entered a new AMS password.
   *
   * Empty password means:
   * keep existing password.
   */
  if (portalPassword) {
    payload.portalPassword =
      portalPassword;
  } else {
    delete payload.portalPassword;
    delete payload.portal_password;
  }

  /*
   * Parent Portal does not use a password.
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
 *
 * Used by:
 *
 * /admin/users/:userId
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


/**
 * Create a new student.
 *
 * IMPORTANT:
 *
 * vtuNumber:
 *     VTU26381
 *
 * rollNumber:
 *     23UECS1039
 *
 * portalUsername:
 *     VTU26381
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

  if (payload.vtuNumber) {
    payload.vtuNumber = String(
      payload.vtuNumber
    )
      .trim()
      .toUpperCase();

    /*
     * Parent Portal / AMS username
     * is always the VTU number.
     */
    payload.portalUsername =
      payload.vtuNumber;
  }

  const response = await api.post(
    "/admin/users",
    payload
  );

  return response.data;
};


/**
 * Update an existing student.
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
   * Keep VTU number and roll number separate.
   *
   * VTU number:
   *     VTU26381
   *
   * Roll number:
   *     23UECS1039
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

  const response = await api.put(
    `/admin/users/${userId}`,
    payload
  );

  return response.data;
};


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