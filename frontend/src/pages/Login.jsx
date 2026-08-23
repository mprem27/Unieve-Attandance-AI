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
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = () => {
    if (loading) {
      return;
    }
    navigate("/forgot-password");
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
      const loggedInUser = await login(email, password);

      // ---------------------------------------------------
      // ROLE
      // ---------------------------------------------------

      const role = loggedInUser?.role || loggedInUser?.user?.role;

      // ---------------------------------------------------
      // REDIRECT
      // ---------------------------------------------------

      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (role === "student") {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Unknown role
      setError("Your account role could not be determined.");
    } catch (err) {
      console.error("Login error:", err);

      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;

      if (typeof backendMessage === "string" && backendMessage.trim()) {
        setError(backendMessage);
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  const isFormValid = form.email.trim().length > 0 && form.password.length > 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/80 p-4 antialiased sm:p-6 lg:p-8 overflow-hidden">
      
      {/* INJECT ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeInSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}} />

      {/* ================================================= */}
      {/* MAIN CONTAINER */}
      {/* ================================================= */}
      <div className="flex min-h-[650px] w-full max-w-[1200px] overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-2xl shadow-indigo-900/10 lg:min-h-[750px] animate-fade-slide-up">

        {/* ================================================= */}
        {/* LEFT SIDE (LOGIN FORM) */}
        {/* ================================================= */}

        <div className="relative z-10 flex w-full flex-col justify-center bg-white p-6 sm:p-12 lg:w-1/2 xl:p-16">
          <div className="mx-auto w-full max-w-[400px]">

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <div className="mb-8 flex items-center gap-3 sm:mb-10">
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200 transition-transform hover:scale-105">
                <img
                  src="/logo.png"
                  alt="UniEve AI Logo"
                  className="h-8 w-8 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                {/* Note: The 'UA' text overlay has been entirely removed */}
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
                  UniEve AI
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0ea5e9]">
                  Smart Attendance
                </p>
              </div>
            </div>

            {/* ================================================= */}
            {/* HEADING */}
            {/* ================================================= */}

            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-[#1e3a8a]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Sign in to securely access your student dashboard.
              </p>
            </div>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 backdrop-blur-sm p-4 shadow-sm"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm border border-rose-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="mt-0.5 text-sm font-bold leading-snug text-rose-800">
                  {error}
                </p>
              </div>
            )}

            {/* ================================================= */}
            {/* LOGIN FORM */}
            {/* ================================================= */}

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">

              {/* ================================================= */}
              {/* EMAIL */}
              {/* ================================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
                >
                  Email Address
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-[#0ea5e9]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition-all hover:bg-slate-50 focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 disabled:cursor-not-allowed disabled:opacity-60 placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1 mr-1">
                  <label
                    htmlFor="password"
                    className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-[10px] sm:text-xs font-black text-[#0ea5e9] transition-colors hover:text-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-[#0ea5e9]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 py-4 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition-all hover:bg-slate-50 focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 disabled:cursor-not-allowed disabled:opacity-60 placeholder:font-medium placeholder:text-slate-400"
                  />

                  {/* SHOW PASSWORD TOGGLE */}
                  {form.password.length > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0ea5e9] disabled:cursor-not-allowed focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
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

              {/* ================================================= */}
              {/* LOGIN BUTTON */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#1e3a8a]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#1e3a8a]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In to Dashboard
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                )}
              </button>

            </form>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <div className="mt-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                UniEve AI Integration
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400/80">
                Secure portal synchronization
              </p>
            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT SIDE (DASHBOARD PREVIEW & ANIMATIONS) */}
        {/* ================================================= */}

        <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[#0f172a] lg:flex">
          
          {/* Animated Background Gradients */}
          <div className="absolute -right-[20%] -top-[10%] h-[600px] w-[600px] rounded-full bg-[#0ea5e9]/20 blur-[120px] animate-[pulse-soft_8s_ease-in-out_infinite]" />
          <div className="absolute -left-[10%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-[#1e3a8a]/40 blur-[100px] animate-[pulse-soft_10s_ease-in-out_infinite_reverse]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/20 via-transparent to-[#0ea5e9]/10" />

          {/* Dashboard Preview Card */}
          <div className="relative z-20 w-[380px] rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl animate-[float-slow_6s_ease-in-out_infinite]">
            
            {/* Header */}
            <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0ea5e9]/20 text-[#0ea5e9] ring-1 ring-[#0ea5e9]/40">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-black text-white tracking-tight">
                  Attendance Sync
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9] mt-0.5">
                  Live Dashboard
                </p>
              </div>
            </div>

            {/* Circular Percentage */}
            <div className="mb-10 mt-2 flex justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-[#0ea5e9]/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                {/* Simulated inner progress ring */}
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeDasharray="276" strokeDashoffset="45" className="opacity-90" strokeLinecap="round" />
                </svg>
                <div className="text-center z-10">
                  <p className="text-4xl font-black text-white drop-shadow-md">84%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">Overall</p>
                </div>
              </div>
            </div>

            {/* Dynamic Project Metrics (Replaced Subjects) */}
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">Daily Status</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Present</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0ea5e9]/20 text-[#0ea5e9]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">Portal Sync</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#0ea5e9]">Active</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">Weekly Average</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">88%</span>
              </div>

            </div>
          </div>

          {/* Floating Warning Badge */}
          <div className="absolute left-10 top-32 z-30 animate-[float-delayed_5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="text-sm font-black text-white">
                  Attendance Alert
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Keep above 75%
                </p>
              </div>
            </div>
          </div>

          {/* Floating Success Badge */}
          <div className="absolute bottom-32 right-8 z-30 animate-[float-slow_6s_ease-in-out_infinite_reverse] rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-sm font-black text-white">
                  College Portal
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Successfully Synced
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;