import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changePassword,
  getCurrentUser,
} from "../services/authService";

// =====================================================
// PASSWORD INPUT (Premium Glass Style)
// =====================================================

const PasswordInput = ({
  id,
  name,
  label,
  value,
  show,
  setShow,
  placeholder,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
      >
        {label}
      </label>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            name === "currentPassword"
              ? "current-password"
              : "new-password"
          }
          className={`w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md py-4 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 placeholder:font-medium ${
            disabled
              ? "cursor-not-allowed bg-slate-100/50 text-slate-400 opacity-60"
              : "hover:bg-white/80 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 shadow-sm"
          }`}
        />

        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// =====================================================
// REQUIREMENT ITEM
// =====================================================

const Requirement = ({ valid, children }) => {
  return (
    <li className={`flex items-center gap-3 transition-colors duration-300 ${valid ? "text-emerald-700" : "text-slate-500"}`}>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          valid ? "bg-emerald-100 text-emerald-600 shadow-sm" : "bg-white/50 text-slate-300 border border-slate-200"
        }`}
      >
        {valid ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
        )}
      </span>
      <span className="font-bold">{children}</span>
    </li>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingPasswordStatus, setCheckingPasswordStatus] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // 30-DAY PASSWORD LOCK
  // =====================================================
  const [passwordLocked, setPasswordLocked] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);
  const [availableDate, setAvailableDate] = useState("");

  // =====================================================
  // CHECK PASSWORD STATUS
  // =====================================================
  useEffect(() => {
    let mounted = true;

    const loadPasswordStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;

        const allowed = user?.passwordChangeAllowed;
        const days = user?.passwordChangeRemainingDays;
        const date = user?.passwordChangeAvailableDate;

        if (allowed === false) {
          setPasswordLocked(true);
          setRemainingDays(typeof days === "number" ? days : null);
          setAvailableDate(typeof date === "string" ? date : "");
        } else {
          setPasswordLocked(false);
          setRemainingDays(null);
          setAvailableDate("");
        }
      } catch (err) {
        console.error("Unable to load password change status:", err);
      } finally {
        if (mounted) {
          setCheckingPasswordStatus(false);
        }
      }
    };

    loadPasswordStatus();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // PASSWORD RULES & STRENGTH
  // =====================================================
  const rules = useMemo(
    () => ({
      length: form.newPassword.length >= 8,
      match: form.newPassword.length > 0 && form.newPassword === form.confirmPassword,
      different: form.newPassword.length > 0 && form.newPassword !== form.currentPassword,
      current: form.currentPassword.length > 0,
    }),
    [form]
  );

  const strength = useMemo(() => {
    let score = 0;
    if (form.newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(form.newPassword)) score += 1;
    if (/[a-z]/.test(form.newPassword)) score += 1;
    if (/[0-9]/.test(form.newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.newPassword)) score += 1;

    if (!form.newPassword) {
      return { score: 0, label: "Enter a password", className: "bg-slate-200/50", textClass: "text-slate-400" };
    }
    if (score <= 2) {
      return { score, label: "Weak", className: "bg-rose-500", textClass: "text-rose-600" };
    }
    if (score <= 3) {
      return { score, label: "Fair", className: "bg-amber-500", textClass: "text-amber-600" };
    }
    if (score === 4) {
      return { score, label: "Good", className: "bg-[#0ea5e9]", textClass: "text-[#0ea5e9]" };
    }
    return { score, label: "Strong", className: "bg-emerald-500", textClass: "text-emerald-600" };
  }, [form.newPassword]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const extractRemainingDays = (message) => {
    if (typeof message !== "string") return null;
    const match = message.match(/wait\s+(\d+)\s+day/i);
    return match ? Number(match[1]) : null;
  };

  const extractAvailableDate = (message) => {
    if (typeof message !== "string") return "";
    const match = message.match(/again on (.+?)\.?$/i);
    return match ? match[1] : "";
  };

  // =====================================================
  // SUBMIT
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (passwordLocked) return;
    if (form.currentPassword === "") return setError("Please enter your current password.");
    if (form.newPassword === "") return setError("Please enter your new password.");
    if (form.newPassword.length < 8) return setError("New password must contain at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("New password and confirm password do not match.");
    if (form.currentPassword === form.newPassword) return setError("Your new password must be different from your current password.");

    try {
      setLoading(true);
      await changePassword(form.currentPassword, form.newPassword);

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      setPasswordLocked(true);
      setRemainingDays(30);

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      setAvailableDate(nextDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }));
      setSuccess("Your password has been changed successfully. You can change it again after 30 days.");
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (err?.response?.status === 429) {
        setPasswordLocked(true);
        setRemainingDays(extractRemainingDays(detail));
        setAvailableDate(extractAvailableDate(detail));
        setError("");
        return;
      }

      setError(typeof detail === "string" ? detail : "Unable to change password. Please verify your current password and try again.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = rules.current && rules.length && rules.match && rules.different && !loading && !passwordLocked;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-slate-50 p-4 sm:p-6 lg:p-8 overflow-hidden">

      {/* =================================================
          INJECT ANIMATIONS & BACKGROUND DECORATIONS
      ================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-300px) scale(1.2); opacity: 0; }
        }
      `}} />

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#0ea5e9]/10 blur-[120px] pointer-events-none" />

      {/* Animated Bubbles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-10px] left-[15%] h-6 w-6 rounded-full bg-indigo-400/20 blur-[2px] animate-[float-up_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20px] left-[45%] h-8 w-8 rounded-full bg-[#0ea5e9]/20 blur-[3px] animate-[float-up_8s_ease-in-out_infinite]" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-[-15px] left-[75%] h-5 w-5 rounded-full bg-indigo-500/15 blur-[1px] animate-[float-up_5s_ease-in-out_infinite]" style={{animationDelay: '1s'}} />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-8 animate-fade-slide-up">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}
        <div className="mb-6 lg:mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </span>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Security
            </p>
          </div>
          <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Change Password
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Update your password to keep your UniEve AI account secure.
          </p>
        </div>

        {/* ================================================= */}
        {/* FORM CARD */}
        {/* ================================================= */}
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-xl shadow-indigo-900/5 p-6 sm:p-10">

            <div className="mb-8 flex items-center gap-4 border-b border-white/50 pb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-[#0ea5e9] text-white shadow-lg shadow-indigo-500/30 border border-white/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="10" width="16" height="10" rx="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
                  <circle cx="12" cy="15" r="1.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">
                  Account Password
                </h2>
                <p className="mt-0.5 text-xs font-bold text-slate-500">
                  Ensure it is strong and unique.
                </p>
              </div>
            </div>

            {/* STATUS CHECKER */}
            {checkingPasswordStatus && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-200/50 bg-indigo-50/50 p-4 backdrop-blur-md">
                <svg className="h-5 w-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-bold text-indigo-700">
                  Checking password change availability...
                </p>
              </div>
            )}

            {/* 30-DAY LOCK CARD */}
            {passwordLocked && (
              <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-md shadow-sm">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm border border-amber-100">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-amber-900 tracking-tight">
                        Password Change Locked
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-800/80">
                        You have already changed your password recently.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                          Time remaining
                        </p>
                        <p className="mt-1 text-3xl font-black text-amber-900">
                          {remainingDays !== null ? `${remainingDays} day${remainingDays === 1 ? "" : "s"}` : "30 days"}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/50 border border-amber-200">
                        <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                        </svg>
                      </div>
                    </div>

                    {availableDate && (
                      <div className="mt-5 border-t border-amber-200/50 pt-4">
                        <p className="text-xs font-bold text-amber-800">
                          You can change your password again on{" "}
                          <span className="font-black text-amber-900">{availableDate}</span>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ALERTS */}
            {(error || success) && (
              <div className="mb-8 space-y-4">
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/80 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm border border-rose-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="pt-1.5 text-sm font-bold leading-relaxed text-rose-800">
                      {error}
                    </p>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm border border-emerald-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="pt-1.5 text-sm font-bold text-emerald-800">
                      {success}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                PASSWORD FORM
            ================================================= */}
            <form onSubmit={handleSubmit} className={`space-y-6 ${passwordLocked ? "opacity-50 pointer-events-none grayscale-[20%]" : ""}`}>
              
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                label="Current Password"
                value={form.currentPassword}
                show={showCurrent}
                setShow={setShowCurrent}
                onChange={handleChange}
                placeholder="Enter current password"
                disabled={passwordLocked || loading}
              />

              <div className="h-px w-full bg-white/50 my-6" />

              <PasswordInput
                id="newPassword"
                name="newPassword"
                label="New Password"
                value={form.newPassword}
                show={showNew}
                setShow={setShowNew}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={passwordLocked || loading}
              />

              {/* STRENGTH INDICATOR */}
              {form.newPassword && (
                <div className="-mt-2 rounded-2xl bg-white/30 p-4 border border-white/50">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Password strength
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${strength.textClass}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div
                        key={item}
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item <= strength.score ? strength.className : "bg-white/50 shadow-inner"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                value={form.confirmPassword}
                show={showConfirm}
                setShow={setShowConfirm}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={passwordLocked || loading}
              />

              {/* REQUIREMENTS LIST */}
              <div className="rounded-3xl border border-white/60 bg-white/40 p-5 sm:p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                  Password Requirements
                </p>
                <ul className="space-y-3.5 text-[13px]">
                  <Requirement valid={rules.length}>At least 8 characters</Requirement>
                  <Requirement valid={rules.match}>Passwords match</Requirement>
                  <Requirement valid={rules.different}>Different from current password</Requirement>
                  <Requirement valid={/[A-Z]/.test(form.newPassword)}>At least one uppercase letter</Requirement>
                  <Requirement valid={/[0-9]/.test(form.newPassword)}>At least one number</Requirement>
                </ul>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-[#0ea5e9] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating Security...
                  </span>
                ) : passwordLocked ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
                    </svg>
                    Change Password Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2zm10-9V7a4 4 0 00-8 0v3h8z" />
                    </svg>
                    Save New Password
                  </span>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}