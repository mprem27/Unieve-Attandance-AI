import { useState } from "react";
import { PORTAL_CONFIG } from "../utils/constants";
import usePortal from "../hooks/usePortal";

export default function PortalCredentialsCard() {
  const {
    portalUsername,
    configured,
    loading,
    saving,
    error,
    saveCredentials,
  } = usePortal();

  const [username, setUsername] = useState(
    portalUsername || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setValidationError("");

    const cleanUsername = username.trim().toUpperCase();

    if (!cleanUsername) {
      setValidationError(
        "Please enter your AMS VTU number."
      );
      return;
    }

    if (!cleanUsername.startsWith("VTU")) {
      setValidationError(
        "AMS username must be your VTU number, for example VTU26381."
      );
      return;
    }

    if (!/^VTU\d+$/i.test(cleanUsername)) {
      setValidationError(
        "Invalid VTU number. Example: VTU26381."
      );
      return;
    }

    if (!password) {
      setValidationError(
        "Please enter your AMS password."
      );
      return;
    }

    try {
      const result = await saveCredentials(
        cleanUsername,
        password
      );

      if (result?.syncError) {
        setSuccess(
          "AMS credentials saved successfully, but AMS data synchronization could not be completed. Please try again."
        );
        setValidationError(result.syncError);
      } else if (result?.synced) {
        setSuccess(
          configured
            ? "AMS credentials updated and student data synchronized successfully."
            : "AMS credentials saved and student data synchronized successfully."
        );
      } else if (result?.syncInProgress) {
        setSuccess(
          configured
            ? "AMS credentials updated successfully. Synchronization is in progress."
            : "AMS credentials saved successfully. Synchronization is in progress."
        );
      } else {
        setSuccess(
          configured
            ? "AMS portal credentials updated successfully."
            : "AMS portal credentials saved successfully."
        );
      }

      setUsername(cleanUsername);
      setPassword("");
      setShowPassword(false);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let backendMessage = "";

      if (typeof detail === "string") {
        backendMessage = detail;
      } else if (Array.isArray(detail)) {
        backendMessage = detail
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.msg || item?.message || ""
          )
          .filter(Boolean)
          .join(", ");
      }

      backendMessage =
        backendMessage ||
        err?.response?.data?.message ||
        err?.message;

      setValidationError(
        backendMessage ||
          "Unable to verify AMS credentials. Please check your VTU number and AMS password."
      );
    }
  };

  const handleOpenPortal = () => {
    if (!PORTAL_CONFIG?.URL) {
      setValidationError(
        "AMS portal URL is not configured."
      );
      return;
    }

    window.open(
      PORTAL_CONFIG.URL,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        <div className="animate-pulse space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-100" />
          <div className="h-12 w-full rounded-xl bg-slate-100" />
          <div className="h-12 w-full rounded-xl bg-slate-100" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_35px_rgb(0,0,0,0.07)] sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 21h18M4.5 21V9.75L12 4l7.5 5.75V21M8 21v-6h8v6M7.5 9.75h.01M12 9.75h.01M16.5 9.75h.01"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {PORTAL_CONFIG?.NAME ||
                  "Veltech AMS Portal"}
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                Connect your college AMS portal to
                synchronize your attendance information.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              configured
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                configured
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
            {configured
              ? "Configured"
              : "Not Configured"}
          </div>
        </div>

        {configured && portalUsername && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Connected AMS Account
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                  {portalUsername}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Your AMS password is hidden for security.
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12l4 4L19 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="portalUsername"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              AMS VTU Number
            </label>

            <input
              id="portalUsername"
              name="portalUsername"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(
                  event.target.value.toUpperCase()
                );
                setValidationError("");
                setSuccess("");
              }}
              placeholder={
                portalUsername ||
                "Example: VTU26381"
              }
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />

            <p className="mt-2 text-xs font-medium text-slate-400">
              Use your VTU number. Example: VTU26381
            </p>
          </div>

          <div>
            <label
              htmlFor="portalPassword"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              AMS Password
            </label>

            <div className="relative">
              <input
                id="portalPassword"
                name="portalPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError("");
                  setSuccess("");
                }}
                placeholder={
                  configured
                    ? "Enter new AMS password"
                    : "Enter your AMS password"
                }
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.5 0 .993-.035 1.477-.103M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 01-4.293 5.368M6.228 6.228L3 3m3.228 3.228l3.042 3.042m0 0a3 3 0 104.243 4.243m-4.243-4.243L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {(error || validationError) && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008M10.29 3.86L2.82 17a2 2 0 001.73 3h14.9a2 2 0 001.73 3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>

              <p className="text-sm font-medium text-rose-700">
                {validationError || error}
              </p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>

              <p className="text-sm font-medium text-emerald-700">
                {success}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying AMS...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12l4 4L19 6"
                    />
                  </svg>

                  {configured
                    ? "Update Credentials"
                    : "Save Credentials"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenPortal}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H18a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4.5M15 3h6m0 0v6m0-6L10.5 13.5"
                />
              </svg>

              Open Veltech AMS
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.5 12l1.7 1.7 3.3-3.4"
              />
            </svg>

            <div>
              <p className="text-xs font-bold text-indigo-700">
                Secure AMS Connection
              </p>

              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                Your AMS username is your VTU number.
                The password is verified against the
                live AMS portal before being saved and
                is never displayed after saving.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
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
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-800">
              Attendance Sync
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Fetch attendance from the college portal.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
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
                  d="M12 3v18m9-9H3"
                />
              </svg>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-800">
              Automatic Updates
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Keep attendance information up to date.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2zm10-9V7a4 4 0 10-8 0v3h8z"
                />
              </svg>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-800">
              Protected Credentials
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Password is never shown in the interface.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}