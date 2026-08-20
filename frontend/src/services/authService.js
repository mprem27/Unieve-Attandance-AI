import api from "./api";

// =====================================================
// AUTHENTICATION
// =====================================================

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (
  email,
  password
) => {
  const response = await api.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return response.data;
};

// =====================================================
// CURRENT USER
// =====================================================

export const getCurrentUser = async () => {
  const response = await api.get(
    "/profile"
  );

  return response.data;
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword = async (
  currentPassword,
  newPassword
) => {
  const response = await api.post(
    "/auth/change-password",
    {
      currentPassword,
      newPassword,
    }
  );

  return response.data;
};

// =====================================================
// LOGOUT
// =====================================================
// Local logout is kept here so the existing working
// authentication flow is not dependent on a backend
// logout endpoint.
//
// The AuthContext also clears the session after calling
// this function.
//
// =====================================================

export const logoutUser = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "user"
  );
};