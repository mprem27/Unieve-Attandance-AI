import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // INPUT HANDLER
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear error when user starts correcting input
    if (error) {
      setError("");
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = form.email.trim();
    const password = form.password;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(
        email,
        password
      );

      // ---------------------------------------------------
      // ROLE
      // ---------------------------------------------------

      const role =
        loggedInUser?.role ||
        loggedInUser?.user?.role;

      // ---------------------------------------------------
      // REDIRECT
      // ---------------------------------------------------

      if (role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      if (role === "student") {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // Unknown role
      setError(
        "Your account role could not be determined."
      );
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      // FastAPI commonly returns:
      //
      // {
      //   "detail": "Invalid email or password"
      // }
      //
      // Handle multiple possible formats safely.

      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;

      if (
        typeof backendMessage === "string" &&
        backendMessage.trim()
      ) {
        setError(
          backendMessage
        );
      } else {
        setError(
          "Incorrect email or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  const isFormValid =
    form.email.trim().length > 0 &&
    form.password.length > 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-4 antialiased sm:p-6 lg:p-8">

      {/* ================================================= */}
      {/* MAIN CONTAINER */}
      {/* ================================================= */}

      <div className="flex min-h-[650px] w-full max-w-[1200px] overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] lg:min-h-[750px]">

        {/* ================================================= */}
        {/* LEFT SIDE */}
        {/* ================================================= */}

        <div className="relative z-10 flex w-full flex-col justify-center bg-white p-6 sm:p-12 lg:w-1/2 xl:p-16">

          <div className="mx-auto w-full max-w-[400px]">

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <div className="mb-8 flex items-center gap-3 sm:mb-10">

              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">

                <img
                  src="/logo.png"
                  alt="UniEve AI Logo"
                  className="h-8 w-8 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />

                <span className="pointer-events-none absolute font-black text-indigo-600">
                  UA
                </span>

              </div>

              <div>
                <h1 className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
                  UniEve AI
                </h1>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Attendance
                </p>
              </div>

            </div>

            {/* ================================================= */}
            {/* HEADING */}
            {/* ================================================= */}

            <div className="mb-8">

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Sign in to access your attendance dashboard.
              </p>

            </div>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 p-4"
              >

                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-600">

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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>

                </div>

                <p className="text-sm font-semibold leading-snug text-rose-700">
                  {error}
                </p>

              </div>
            )}

            {/* ================================================= */}
            {/* LOGIN FORM */}
            {/* ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-5"
            >

              {/* ================================================= */}
              {/* EMAIL */}
              {/* ================================================= */}

              <div className="space-y-1.5">

                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Email Address
                </label>

                <div className="group relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-500">

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
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>

                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="student@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <div className="space-y-1.5">

                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Password
                </label>

                <div className="group relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-500">

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
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {/* SHOW PASSWORD */}

                  {form.password.length > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (
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

              {/* ================================================= */}
              {/* LOGIN BUTTON */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !isFormValid
                }
                className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(99,102,241,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
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

                    Authenticating...

                  </span>
                ) : (
                  "Sign In to Dashboard"
                )}

              </button>

            </form>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <div className="mt-8 text-center sm:mt-10">

              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Smart Attendance System
              </p>

              <p className="mt-1.5 text-[10px] font-medium text-slate-400/80">
                Secure portal synchronization
              </p>

            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT SIDE */}
        {/* ================================================= */}

        <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-slate-900 lg:flex">

          {/* Background */}

          <div className="absolute -right-[20%] -top-[10%] h-[600px] w-[600px] rounded-full bg-violet-600/30 blur-[120px]" />

          <div className="absolute -left-[10%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/30 blur-[100px]" />

          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-violet-950/30" />

          {/* Dashboard Preview */}

          <div className="relative z-20 w-[360px] rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">

            <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50">

                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" />
                  <path d="M4 19h16" />
                  <path d="M8 15l3-3 2 2 4-5" />
                </svg>

              </div>

              <div>
                <p className="text-lg font-bold text-white">
                  Live Analytics
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Student Dashboard
                </p>
              </div>

            </div>

            {/* Percentage */}

            <div className="mb-8 mt-2 flex justify-center">

              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-indigo-400/30">

                <div className="text-center">
                  <p className="text-4xl font-black text-white">
                    79%
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Overall
                  </p>
                </div>

              </div>

            </div>

            {/* Subjects */}

            <div className="space-y-3">

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10">
                <span className="text-xs font-semibold text-slate-200">
                  Coding Practices-II
                </span>

                <span className="text-xs font-black text-emerald-400">
                  90%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10">
                <span className="text-xs font-semibold text-slate-200">
                  Innovation & Ent.
                </span>

                <span className="text-xs font-black text-emerald-400">
                  92%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10">
                <span className="text-xs font-semibold text-slate-200">
                  Python Prog.
                </span>

                <span className="text-xs font-black text-rose-400">
                  57%
                </span>
              </div>

            </div>
          </div>

          {/* Warning */}

          <div className="absolute left-6 top-24 z-30 animate-[float_5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-lg">

            <div className="flex items-center gap-3.5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50">
                ⚠
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Attendance Alert
                </p>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Keep attendance above 75%
                </p>
              </div>

            </div>

          </div>

          {/* Success */}

          <div className="absolute bottom-24 right-4 z-30 animate-[float_6s_ease-in-out_infinite_reverse] rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-lg">

            <div className="flex items-center gap-3.5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  College Portal
                </p>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Successfully Synced
                </p>
              </div>

            </div>

          </div>

          {/* Catchphrase */}

          <div className="absolute bottom-8 left-0 z-40 w-full px-10 text-center">

            <h3 className="text-xl font-black tracking-tight text-white">
              Track. Attend. Succeed.
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Your attendance, fully automated.
            </p>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* ANIMATION */}
      {/* ================================================= */}

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-15px);
            }
          }
        `}
      </style>

    </div>
  );
}

export default Login;