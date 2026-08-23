import api from "./api";

// =====================================================
// IN-APP NOTIFICATIONS
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
    throw new Error(
      "Notification ID is required."
    );
  }

  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

// =====================================================
// WEB PUSH NOTIFICATIONS
// =====================================================

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (
  base64String
) => {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) =>
        char.charCodeAt(0)
    )
  );
};

// =====================================================
// CHECK SUPPORT
// =====================================================

export const isPushNotificationSupported =
  () => {
    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  };

// =====================================================
// GET PERMISSION
// =====================================================

export const getPushNotificationPermission =
  () => {
    if (
      !("Notification" in window)
    ) {
      return "unsupported";
    }

    return Notification.permission;
  };

// =====================================================
// SUBSCRIBE
// =====================================================

export const subscribeToPushNotifications =
  async () => {
    if (
      !isPushNotificationSupported()
    ) {
      throw new Error(
        "Push notifications are not supported on this device or browser."
      );
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error(
        "VAPID public key is not configured."
      );
    }

    let permission =
      Notification.permission;

    if (
      permission === "default"
    ) {
      permission =
        await Notification.requestPermission();
    }

    if (
      permission !== "granted"
    ) {
      throw new Error(
        permission === "denied"
          ? "Notification permission was denied."
          : "Notification permission was not granted."
      );
    }

    const registration =
      await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe(
          {
            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
              ),
          }
        );
    }

    const subscriptionJSON =
      subscription.toJSON();

    if (
      !subscriptionJSON.endpoint ||
      !subscriptionJSON.keys?.p256dh ||
      !subscriptionJSON.keys?.auth
    ) {
      throw new Error(
        "Invalid push subscription."
      );
    }

    const response =
      await api.post(
        "/notifications/subscribe",
        {
          endpoint:
            subscriptionJSON.endpoint,

          keys: {
            p256dh:
              subscriptionJSON.keys.p256dh,

            auth:
              subscriptionJSON.keys.auth,
          },
        }
      );

    return {
      subscription,
      data: response.data,
    };
  };

// =====================================================
// UNSUBSCRIBE
// =====================================================

export const unsubscribeFromPushNotifications =
  async () => {
    if (
      !isPushNotificationSupported()
    ) {
      return false;
    }

    const registration =
      await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    await api.delete(
      "/notifications/unsubscribe",
      {
        data: {
          endpoint:
            subscription.endpoint,
        },
      }
    );

    await subscription.unsubscribe();

    return true;
  };

// =====================================================
// GET PUSH STATUS
// =====================================================

export const getPushNotificationStatus =
  async () => {
    const response =
      await api.get(
        "/notifications/status"
      );

    return response.data;
  };