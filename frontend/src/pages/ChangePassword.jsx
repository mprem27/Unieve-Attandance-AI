import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changePassword,
  getCurrentUser,
} from "../services/authService";


// =====================================================
// PASSWORD INPUT
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
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-500">
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
          className={`w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all ${
            disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "hover:bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          }`}
        />

        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() =>
              setShow((current) => !current)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
            aria-label={
              show
                ? "Hide password"
                : "Show password"
            }
          >
            {show ? (
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
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
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
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};


// =====================================================
// REQUIREMENT
// =====================================================

const Requirement = ({
  valid,
  children,
}) => {
  return (
    <li
      className={`flex items-center gap-2.5 transition-colors ${
        valid
          ? "text-emerald-600"
          : "text-slate-500"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-300"
        }`}
      >
        {valid ? (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>

      {children}
    </li>
  );
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

export default function ChangePassword() {

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingPasswordStatus, setCheckingPasswordStatus] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // 30-DAY PASSWORD LOCK
  // =====================================================

  const [passwordLocked, setPasswordLocked] =
    useState(false);

  const [remainingDays, setRemainingDays] =
    useState(null);

  const [availableDate, setAvailableDate] =
    useState("");

  // =====================================================
  // CHECK PASSWORD STATUS WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {

    let mounted = true;

    const loadPasswordStatus = async () => {

      try {

        const user =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        const allowed =
          user?.passwordChangeAllowed;

        const days =
          user?.passwordChangeRemainingDays;

        const date =
          user?.passwordChangeAvailableDate;

        // -------------------------------------------------
        // Backend says password change is locked.
        // -------------------------------------------------

        if (allowed === false) {

          setPasswordLocked(true);

          setRemainingDays(
            typeof days === "number"
              ? days
              : null
          );

          setAvailableDate(
            typeof date === "string"
              ? date
              : ""
          );

        } else {

          setPasswordLocked(false);

          setRemainingDays(null);

          setAvailableDate("");
        }

      } catch (err) {

        // -------------------------------------------------
        // Do NOT block the page if status request fails.
        //
        // The backend will still enforce the 30-day
        // restriction when the password is submitted.
        // -------------------------------------------------

        console.error(
          "Unable to load password change status:",
          err
        );

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
  // PASSWORD RULES
  // =====================================================

  const rules = useMemo(
    () => ({
      length:
        form.newPassword.length >= 8,

      match:
        form.newPassword.length > 0 &&
        form.newPassword ===
          form.confirmPassword,

      different:
        form.newPassword.length > 0 &&
        form.newPassword !==
          form.currentPassword,

      current:
        form.currentPassword.length > 0,
    }),
    [form]
  );


  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const strength = useMemo(() => {

    let score = 0;

    if (
      form.newPassword.length >= 8
    ) {
      score += 1;
    }

    if (
      /[A-Z]/.test(
        form.newPassword
      )
    ) {
      score += 1;
    }

    if (
      /[a-z]/.test(
        form.newPassword
      )
    ) {
      score += 1;
    }

    if (
      /[0-9]/.test(
        form.newPassword
      )
    ) {
      score += 1;
    }

    if (
      /[^A-Za-z0-9]/.test(
        form.newPassword
      )
    ) {
      score += 1;
    }

    if (!form.newPassword) {
      return {
        score: 0,
        label: "Enter a password",
        className: "bg-slate-200",
        textClass: "text-slate-400",
      };
    }

    if (score <= 2) {
      return {
        score,
        label: "Weak",
        className: "bg-rose-500",
        textClass: "text-rose-600",
      };
    }

    if (score <= 3) {
      return {
        score,
        label: "Fair",
        className: "bg-amber-500",
        textClass: "text-amber-600",
      };
    }

    if (score === 4) {
      return {
        score,
        label: "Good",
        className: "bg-blue-500",
        textClass: "text-blue-600",
      };
    }

    return {
      score,
      label: "Strong",
      className: "bg-emerald-500",
      textClass: "text-emerald-600",
    };

  }, [form.newPassword]);


  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };


  // =====================================================
  // EXTRACT DAYS FROM BACKEND MESSAGE
  // =====================================================

  const extractRemainingDays = (
    message
  ) => {

    if (
      typeof message !==
      "string"
    ) {
      return null;
    }

    const match =
      message.match(
        /wait\s+(\d+)\s+day/i
      );

    if (!match) {
      return null;
    }

    return Number(
      match[1]
    );
  };


  // =====================================================
  // EXTRACT AVAILABLE DATE
  // =====================================================

  const extractAvailableDate = (
    message
  ) => {

    if (
      typeof message !==
      "string"
    ) {
      return "";
    }

    const match =
      message.match(
        /again on (.+?)\.?$/i
      );

    return match
      ? match[1]
      : "";
  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");

    // -----------------------------------------------------
    // Don't submit if locked.
    // -----------------------------------------------------

    if (passwordLocked) {
      return;
    }

    if (
      form.currentPassword === ""
    ) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (
      form.newPassword === ""
    ) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    if (
      form.newPassword.length <
      8
    ) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (
      form.currentPassword ===
      form.newPassword
    ) {
      setError(
        "Your new password must be different from your current password."
      );
      return;
    }

    try {

      setLoading(true);

      await changePassword(
        form.currentPassword,
        form.newPassword
      );

      // ---------------------------------------------------
      // SUCCESS
      // ---------------------------------------------------

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      setPasswordLocked(true);

      setRemainingDays(30);

      const nextDate =
        new Date();

      nextDate.setDate(
        nextDate.getDate() + 30
      );

      setAvailableDate(
        nextDate.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        )
      );

      setSuccess(
        "Your password has been changed successfully. You can change it again after 30 days."
      );

    } catch (err) {

      const detail =
        err?.response?.data
          ?.detail;

      // ===================================================
      // 30-DAY LOCK RESPONSE
      // ===================================================

      if (
        err?.response?.status ===
        429
      ) {

        const days =
          extractRemainingDays(
            detail
          );

        const date =
          extractAvailableDate(
            detail
          );

        setPasswordLocked(
          true
        );

        setRemainingDays(
          days
        );

        setAvailableDate(
          date
        );

        setError("");

        return;
      }

      // ===================================================
      // NORMAL ERROR
      // ===================================================

      setError(
        typeof detail ===
          "string"
          ? detail
          : "Unable to change password. Please verify your current password and try again."
      );

    } finally {

      setLoading(false);

    }
  };


  const canSubmit =
    rules.current &&
    rules.length &&
    rules.match &&
    rules.different &&
    !loading &&
    !passwordLocked;


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8">

      <div className="mb-8">

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
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>

          </span>

          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Security
          </p>

        </div>

        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Change Password
        </h1>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Update your password to keep your account secure.
        </p>

      </div>


      <div className="mx-auto max-w-xl">

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:p-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">

              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="10"
                  rx="2"
                />

                <path d="M8 10V7a4 4 0 018 0v3" />

                <circle
                  cx="12"
                  cy="15"
                  r="1.5"
                />

              </svg>

            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Account Password
              </h2>

              <p className="text-xs font-medium text-slate-500">
                Choose a strong and unique password.
              </p>

            </div>

          </div>


          {/* =================================================
              PASSWORD STATUS CHECK
          ================================================= */}

          {checkingPasswordStatus && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">

              <svg
                className="h-5 w-5 animate-spin text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>

              <p className="text-sm font-semibold text-indigo-700">
                Checking password change availability...
              </p>

            </div>
          )}


          {/* =================================================
              30-DAY LOCK CARD
          ================================================= */}

          {passwordLocked && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">

              <div className="p-5 sm:p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">

                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10V7a4 4 0 018 0v3"
                      />

                      <circle
                        cx="12"
                        cy="15"
                        r="1"
                      />
                    </svg>

                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="text-base font-black text-amber-900">
                      Password Change Locked
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-relaxed text-amber-800">
                      You have already changed your password recently.
                    </p>

                  </div>

                </div>


                {/* =================================================
                    COUNTDOWN
                ================================================= */}

                <div className="mt-5 rounded-xl border border-amber-200 bg-white/70 p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                        Time remaining
                      </p>

                      <p className="mt-1 text-2xl font-black text-amber-900">

                        {remainingDays !== null
                          ? `${remainingDays} day${
                              remainingDays === 1
                                ? ""
                                : "s"
                            }`
                          : "30 days"}

                      </p>

                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">

                      <svg
                        className="h-6 w-6 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 7v5l3 2"
                        />

                      </svg>

                    </div>

                  </div>


                  {availableDate && (
                    <div className="mt-4 border-t border-amber-200 pt-3">

                      <p className="text-xs font-semibold text-amber-800">

                        You can change your password again on{" "}

                        <span className="font-black">
                          {availableDate}
                        </span>

                        .

                      </p>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              ERROR / SUCCESS
          ================================================= */}

          {(error || success) && (
            <div className="mb-6">

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">

                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m0 3.75h.008v.008H12v-.008z"
                      />
                    </svg>

                  </div>

                  <p className="pt-1 text-sm font-semibold leading-relaxed text-rose-700">
                    {error}
                  </p>

                </div>
              )}


              {success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>

                  </div>

                  <p className="pt-1 text-sm font-semibold text-emerald-700">
                    {success}
                  </p>

                </div>
              )}

            </div>
          )}


          {/* =================================================
              PASSWORD FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className={`space-y-6 ${
              passwordLocked
                ? "opacity-60"
                : ""
            }`}
          >

            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              value={
                form.currentPassword
              }
              show={showCurrent}
              setShow={
                setShowCurrent
              }
              onChange={handleChange}
              placeholder="Enter current password"
              disabled={
                passwordLocked
              }
            />


            <div className="h-px w-full bg-slate-100" />


            <PasswordInput
              id="newPassword"
              name="newPassword"
              label="New Password"
              value={
                form.newPassword
              }
              show={showNew}
              setShow={setShowNew}
              onChange={handleChange}
              placeholder="Enter new password"
              disabled={
                passwordLocked
              }
            />


            {/* =================================================
                STRENGTH
            ================================================= */}

            {form.newPassword && (
              <div className="-mt-3">

                <div className="flex items-center justify-between">

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Password strength
                  </span>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${strength.textClass}`}
                  >
                    {strength.label}
                  </span>

                </div>

                <div className="mt-2 grid grid-cols-5 gap-1">

                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className={`h-1.5 rounded-full ${
                          item <=
                          strength.score
                            ? strength.className
                            : "bg-slate-200"
                        }`}
                      />
                    )
                  )}

                </div>

              </div>
            )}


            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              value={
                form.confirmPassword
              }
              show={showConfirm}
              setShow={
                setShowConfirm
              }
              onChange={handleChange}
              placeholder="Confirm new password"
              disabled={
                passwordLocked
              }
            />


            {/* =================================================
                REQUIREMENTS
            ================================================= */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Password Requirements
              </p>

              <ul className="mt-3 space-y-2.5 text-xs font-semibold">

                <Requirement
                  valid={
                    rules.length
                  }
                >
                  At least 8 characters
                </Requirement>

                <Requirement
                  valid={
                    rules.match
                  }
                >
                  Passwords match
                </Requirement>

                <Requirement
                  valid={
                    rules.different
                  }
                >
                  Different from current password
                </Requirement>

                <Requirement
                  valid={/[A-Z]/.test(
                    form.newPassword
                  )}
                >
                  At least one uppercase letter
                </Requirement>

                <Requirement
                  valid={/[0-9]/.test(
                    form.newPassword
                  )}
                >
                  At least one number
                </Requirement>

              </ul>

            </div>


            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={!canSubmit}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >

              {loading ? (
                <span className="flex items-center gap-2">

                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Updating...

                </span>
              ) : passwordLocked ? (
                <>

                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10V7a4 4 0 018 0v3"
                    />

                  </svg>

                  Change Password Locked

                </>
              ) : (
                <>

                  <svg
                    className="mr-2 h-4 w-4 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2zm10-9V7a4 4 0 00-8 0v3h8z"
                    />
                  </svg>

                  Change Password

                </>
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}