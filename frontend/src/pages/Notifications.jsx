import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api";

import NotificationCard from "../components/NotificationCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

export default function Notifications() {
  // =====================================================
  // STATE
  // =====================================================

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [markingRead, setMarkingRead] = useState(null);

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadNotifications = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/notifications");

        const data = Array.isArray(response.data)
          ? response.data
          : [];

        setNotifications(data);
      } catch (err) {
        console.error(
          "Failed to load notifications:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load notifications. Please try again."
        );
      } finally {
        if (manualRefresh) {
          setTimeout(() => {
            setIsRefreshing(false);
          }, 400);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // =====================================================
  // GET NOTIFICATION ID
  // =====================================================

  const getNotificationId = (notification) => {
    return (
      notification?.id ||
      notification?._id ||
      notification?.notificationId
    );
  };

  // =====================================================
  // MARK AS READ
  // =====================================================

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) {
      console.error(
        "Notification ID is missing."
      );

      setError(
        "Unable to mark this notification as read."
      );

      return;
    }

    if (markingRead === notificationId) {
      return;
    }

    try {
      setMarkingRead(notificationId);
      setError("");

      await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((current) =>
        current.map((notification) => {
          const currentId =
            getNotificationId(notification);

          if (currentId === notificationId) {
            return {
              ...notification,
              read: true,
              isRead: true,
            };
          }

          return notification;
        })
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setMarkingRead(null);
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    if (!isRefreshing) {
      loadNotifications(true);
    }
  };

  // =====================================================
  // COUNTS
  // =====================================================

  const unreadCount = notifications.filter(
    (notification) =>
      notification.read !== true &&
      notification.isRead !== true
  ).length;

  const readCount =
    notifications.length - unreadCount;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Loading fullPage />;
  }

  // =====================================================
  // FATAL ERROR
  // =====================================================

  if (
    error &&
    notifications.length === 0
  ) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <ErrorMessage
            message={error}
            onRetry={() =>
              loadNotifications(true)
            }
          />
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">

      <div className="mx-auto max-w-[1600px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>

              </span>

              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Updates
              </p>

            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Notification Center
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
              Stay up to date with attendance alerts and system messages.
            </p>

          </div>

          {/* Refresh */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:py-2.5"
          >

            <svg
              className={`h-4 w-4 transition-all ${
                isRefreshing
                  ? "animate-spin text-indigo-600"
                  : "text-slate-400 group-hover:text-indigo-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>

            {isRefreshing
              ? "Checking..."
              : "Refresh Inbox"}

          </button>

        </div>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total */}

          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15"
                  />
                </svg>

              </div>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Inbox
            </p>

            <p className="mt-1 text-3xl font-black text-slate-900">
              {notifications.length}
            </p>

          </div>

          {/* Unread */}

          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 shadow-[0_8px_30px_rgb(99,102,241,0.06)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl">

            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">

              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25"
                />
              </svg>

            </div>

            <p className="relative mt-4 text-xs font-bold uppercase tracking-wider text-indigo-600/80">
              Unread
            </p>

            <div className="relative flex items-center gap-2">

              <p className="text-3xl font-black text-indigo-700">
                {unreadCount}
              </p>

              {unreadCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                </span>
              )}

            </div>

          </div>

          {/* Read */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-[0_8px_30px_rgb(16,185,129,0.05)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">

              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12.5l4 4L19 6.5"
                />
              </svg>

            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-600/80">
              Read
            </p>

            <p className="mt-1 text-3xl font-black text-emerald-700">
              {readCount}
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error &&
          notifications.length > 0 && (
            <div className="mb-6">
              <ErrorMessage
                message={error}
                onRetry={() =>
                  loadNotifications(true)
                }
              />
            </div>
          )}

        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm sm:rounded-3xl sm:p-20">

            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-900/5">

              <svg
                className="h-10 w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>

            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              You're all caught up!
            </h2>

            <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
              Your inbox is clear. We'll notify you here if your attendance drops or if there are system alerts.
            </p>

          </div>
        ) : (

          /* ================================================= */
          /* NOTIFICATION LIST */
          /* ================================================= */

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">

            {notifications.map(
              (notification) => {
                const notificationId =
                  getNotificationId(
                    notification
                  );

                return (
                  <NotificationCard
                    key={
                      notificationId ||
                      Math.random()
                    }
                    notification={
                      notification
                    }
                    onMarkRead={
                      handleMarkRead
                    }
                    markingRead={
                      markingRead ===
                      notificationId
                    }
                  />
                );
              }
            )}

          </div>
        )}

      </div>
    </div>
  );
}