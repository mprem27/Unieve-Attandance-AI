import api from "./api";

// =====================================================
// NOTIFICATIONS
// =====================================================

export const getNotifications = async () => {
  const response = await api.get("/notifications");

  return Array.isArray(response.data)
    ? response.data
    : [];
};

export const markNotificationRead = async (
  notificationId
) => {
  if (!notificationId) {
    throw new Error("Notification ID is required.");
  }

  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};