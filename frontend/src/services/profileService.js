import api from "./api";

// =====================================================
// PROFILE
// =====================================================

export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  if (!profileData || typeof profileData !== "object") {
    throw new Error("Profile data is required.");
  }

  const response = await api.put("/profile", profileData);
  return response.data;
};

// =====================================================
// PORTAL / VELTECH AMS CREDENTIALS
// =====================================================

export const getPortalCredentials = async () => {
  const response = await api.get(
    "/profile/portal-credentials"
  );

  return response.data;
};

export const updatePortalCredentials = async (
  credentials
) => {
  if (!credentials || typeof credentials !== "object") {
    throw new Error("Credentials are required.");
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
  ).trim();

  if (!portalUsername) {
    throw new Error("VTU number is required.");
  }

  if (!/^VTU\d+$/i.test(portalUsername)) {
    throw new Error(
      "AMS username must be your VTU number. Example: VTU26381."
    );
  }

  if (!portalPassword) {
    throw new Error("AMS password is required.");
  }

  const payload = {
    portalUsername,
    portalPassword,
  };

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

export const getUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const getUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await api.get(
    `/admin/users/${userId}`
  );

  return response.data;
};

// =====================================================
// CREATE STUDENT
// =====================================================

export const createUser = async (userData) => {
  if (!userData || typeof userData !== "object") {
    throw new Error("User data is required.");
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
  }

  const hasPortalUsername = Boolean(
    String(
      payload.portalUsername || ""
    ).trim()
  );

  const hasPortalPassword = Boolean(
    String(
      payload.portalPassword || ""
    ).trim()
  );

  if (hasPortalUsername || hasPortalPassword) {
    if (!payload.vtuNumber) {
      throw new Error(
        "VTU number is required when AMS credentials are provided."
      );
    }

    if (!hasPortalPassword) {
      throw new Error(
        "AMS password is required when AMS credentials are provided."
      );
    }

    payload.portalUsername =
      payload.vtuNumber;

    payload.portalPassword = String(
      payload.portalPassword
    ).trim();
  } else {
    delete payload.portalUsername;
    delete payload.portalPassword;
  }

  const response = await api.post(
    "/admin/users",
    payload
  );

  return response.data;
};

// =====================================================
// UPDATE STUDENT
// =====================================================

export const updateUser = async (
  userId,
  userData
) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!userData || typeof userData !== "object") {
    throw new Error("User data is required.");
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
  }

  if (
    payload.portalUsername ||
    payload.portalPassword
  ) {
    if (!payload.vtuNumber) {
      throw new Error(
        "VTU number is required when AMS credentials are provided."
      );
    }

    payload.portalUsername =
      payload.vtuNumber;

    if (payload.portalPassword) {
      payload.portalPassword = String(
        payload.portalPassword
      ).trim();
    } else {
      delete payload.portalPassword;
    }
  }

  const response = await api.put(
    `/admin/users/${userId}`,
    payload
  );

  return response.data;
};

// =====================================================
// DELETE / DEACTIVATE STUDENT
// =====================================================

export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
};

// =====================================================
// ADMIN USER ACTIVATION
// =====================================================

export const activateUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await api.post(
    `/admin/users/${userId}/activate`
  );

  return response.data;
};