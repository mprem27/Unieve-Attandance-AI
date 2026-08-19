import React from "react";

const getSyncStatus = ({ synced, configured, lastSyncedAt }) => {
  if (!configured) {
    return {
      label: "Not Configured",
      description: "College portal credentials are not configured.",
      badge:
        "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-400",
    };
  }

  if (synced) {
    return {
      label: "Synced",
      description: lastSyncedAt
        ? `Last synced ${lastSyncedAt}`
        : "College portal data is up to date.",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  return {
    label: "Pending Sync",
    description: "Portal data has not been synchronized yet.",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  };
};

export default function SyncStatusBadge({
  synced = false,
  configured = false,
  lastSyncedAt = null,
  compact = false,
}) {
  const status = getSyncStatus({
    synced,
    configured,
    lastSyncedAt,
  });

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.badge}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
        />

        {status.label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.badge}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${status.dot}`}
        />

        {status.label}
      </div>

      <span className="hidden text-xs font-medium text-slate-400 sm:inline">
        {status.description}
      </span>
    </div>
  );
}