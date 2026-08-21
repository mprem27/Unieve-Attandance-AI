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
// EXISTING CHANGE PASSWORD
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
// PASSWORD RESET - REQUEST OTP
// =====================================================

export const requestPasswordOtp = async (
  email
) => {
  const response = await api.post(
    "/auth/password/request-otp",
    {
      email,
    }
  );

  return response.data;
};

// =====================================================
// PASSWORD RESET - VERIFY OTP
// =====================================================

export const verifyPasswordOtp = async (
  email,
  otp
) => {
  const response = await api.post(
    "/auth/password/verify-otp",
    {
      email,
      otp,
    }
  );

  return response.data;
};

// =====================================================
// PASSWORD RESET - CHANGE PASSWORD
// =====================================================

export const changePasswordWithOtp = async (
  email,
  verificationToken,
  newPassword
) => {
  const response = await api.post(
    "/auth/password/change-with-otp",
    {
      email,
      verificationToken,
      newPassword,
    }
  );

  return response.data;
};

// =====================================================
// LOGOUT
// =====================================================

export const logoutUser = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "user"
  );
};