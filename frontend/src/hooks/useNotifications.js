import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getNotifications,
  markNotificationRead,
} from "../services/notificationService";

// =====================================================
// NOTIFICATION HOOK
// =====================================================

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getNotifications();

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Notification loading failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Unable to load notifications.";

      setError(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await markNotificationRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error(
        "Mark notification as read failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Unable to mark notification as read.";

      setError(message);

      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const refresh = async () => {
    await loadNotifications();
  };

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        notification?.read !== true
    );

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    loading,
    actionLoading,
    error,
    refresh,
    markAsRead,
  };
}