import React, { useState } from "react";

export default function NotificationCard({ notification, onMarkRead }) {
  const [loading, setLoading] = useState(false);

  const isRead = notification?.read === true;

  const handleMarkRead = async () => {
    if (isRead || !onMarkRead) return;

    try {
      setLoading(true);
      await onMarkRead(notification.id);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = () => {
    switch (notification?.type?.toUpperCase()) {
      case "ATTENDANCE":
        return {
          icon: (
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          ),
          bg: "bg-blue-50 text-blue-600",
          border: "border-blue-100",
          gradient: "from-blue-500 to-cyan-500",
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
        };

      case "WARNING":
        return {
          icon: (
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bg: "bg-amber-50 text-amber-600",
          border: "border-amber-100",
          gradient: "from-amber-400 to-orange-500",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        };

      case "ALERT":
        return {
          icon: (
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          ),
          bg: "bg-rose-50 text-rose-600",
          border: "border-rose-100",
          gradient: "from-rose-500 to-red-600",
          glow: "shadow-[0_0_12px_rgba(225,29,72,0.3)]",
        };

      default:
        return {
          icon: (
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          ),
          bg: "bg-indigo-50 text-indigo-600",
          border: "border-indigo-100",
          gradient: "from-indigo-500 to-violet-600",
          glow: "shadow-[0_0_12px_rgba(99,102,241,0.3)]",
        };
    }
  };

  const theme = getTypeConfig();

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
        isRead
          ? "border-slate-200/60 bg-white hover:border-slate-300/80"
          : "border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white shadow-[0_8px_30px_rgb(99,102,241,0.06)]"
      }`}
    >
      {/* Decorative Unread Glow Line */}
      {!isRead && (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 to-violet-600" />
      )}

      {/* Main wrapper: columns on mobile, row on tablet/desktop */}
      <div className="flex flex-1 flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        
        {/* Top Row for Mobile (Icon + Mobile Title) */}
        <div className="flex items-start gap-3 sm:gap-5">
          {/* Dynamic Icon */}
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border ${theme.border} ${theme.bg} ${!isRead ? theme.glow : "shadow-sm"}`}
          >
            {theme.icon}
          </div>

          {/* Mobile-Only Title & Badge */}
          <div className="flex min-w-0 flex-1 flex-col sm:hidden pt-0.5">
            <div className="flex items-center gap-2">
              <h3 className={`truncate text-sm font-bold tracking-tight ${isRead ? "text-slate-700" : "text-slate-900"}`}>
                {notification?.title || "Notification"}
              </h3>
              {!isRead && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                </span>
              )}
            </div>
            {notification?.type && (
              <span className={`mt-1.5 w-fit inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${theme.bg} ${theme.border}`}>
                {notification.type}
              </span>
            )}
          </div>
        </div>

        {/* Content Container (Title, Message, Button) */}
        <div className="flex min-w-0 flex-1 flex-col h-full">
          
          {/* Desktop-Only Title & Timestamp Row */}
          <div className="hidden sm:flex flex-col gap-1.5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className={`text-base font-bold tracking-tight ${isRead ? "text-slate-700" : "text-slate-900"}`}>
                  {notification?.title || "Notification"}
                </h3>
                {!isRead && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
                  </span>
                )}
              </div>
              {notification?.type && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.bg} ${theme.border}`}>
                  {notification.type}
                </span>
              )}
            </div>
            
            {/* Desktop Timestamp */}
            {notification?.createdAt && (
              <span className="shrink-0 pt-1 text-xs font-semibold text-slate-400">
                {new Date(notification.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
          </div>

          {/* Main Message Text */}
          <p className={`mt-1 sm:mt-3 text-xs sm:text-sm leading-relaxed break-words ${isRead ? "text-slate-500" : "text-slate-600 font-medium"}`}>
            {notification?.message || notification?.body || "No notification message available."}
          </p>

          {/* Mobile Timestamp (Shows below text on mobile) */}
          <div className="mt-3 block sm:hidden">
            {notification?.createdAt && (
              <span className="text-[11px] font-semibold text-slate-400">
                {new Date(notification.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
          </div>

          {/* Action Area - mt-auto keeps buttons aligned at the bottom across different card heights */}
          <div className="mt-auto flex w-full items-center pt-5 sm:pt-6">
            {!isRead && onMarkRead && (
              <button
                type="button"
                onClick={handleMarkRead}
                disabled={loading}
                className="relative inline-flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 py-3 sm:py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Mark as read
                  </>
                )}
              </button>
            )}

            {isRead && (
              <div className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-xl sm:rounded-full border border-emerald-100 bg-emerald-50 px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-bold text-emerald-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}