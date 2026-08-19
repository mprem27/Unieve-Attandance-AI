import api from "./api";

// =====================================================
// AUTHENTICATION
// =====================================================

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/profile");

  return response.data;
};

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

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};