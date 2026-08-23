import { useState } from "react";
import {
  requestPasswordOtp,
  verifyPasswordOtp,
  changePasswordWithOtp,
} from "../services/authService";

// =====================================================
// FORGOT PASSWORD
// =====================================================

const ForgotPassword = () => {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [verificationToken, setVerificationToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Added UI states for premium password toggling
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // REQUEST OTP
  // =====================================================

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordOtp(email.trim());
      setSuccess("OTP has been sent to your registered email.");
      setStep(2);
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Unable to send OTP. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);
      const response = await verifyPasswordOtp(email.trim(), otp.trim());
      setVerificationToken(response.verificationToken);
      setSuccess("OTP verified successfully.");
      setStep(3);
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Invalid or expired OTP.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await changePasswordWithOtp(email.trim(), verificationToken, newPassword);
      setSuccess("Password changed successfully. You can now log in with your new password.");
      setStep(4);
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Unable to change password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    setError("");
    setSuccess("");

    if (step === 2) {
      setOtp("");
      setStep(1);
      return;
    }

    if (step === 3) {
      setNewPassword("");
      setConfirmPassword("");
      setVerificationToken("");
      setStep(2);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = () => {
    window.location.href = "/login";
  };

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const getPasswordStrength = () => {
    if (!newPassword) return "";
    if (newPassword.length < 8) return "Weak";

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    const score = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

    if (newPassword.length >= 10 && score >= 3) return "Strong";
    if (score >= 2) return "Medium";
    return "Weak";
  };

  const passwordStrength = getPasswordStrength();

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 overflow-hidden font-sans">
      
      {/* INJECT ANIMATIONS & BACKGROUND DECORATIONS */}
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

      {/* Decorative Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#0ea5e9]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#1e3a8a]/10 blur-[120px] pointer-events-none" />

      {/* Animated Floating Bubbles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-10px] left-[15%] h-6 w-6 rounded-full bg-[#0ea5e9]/20 blur-[2px] animate-[float-up_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20px] left-[45%] h-8 w-8 rounded-full bg-[#1e3a8a]/10 blur-[3px] animate-[float-up_8s_ease-in-out_infinite]" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-[-15px] left-[75%] h-5 w-5 rounded-full bg-[#0ea5e9]/15 blur-[1px] animate-[float-up_5s_ease-in-out_infinite]" style={{animationDelay: '1s'}} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-slide-up">
        
        {/* =================================================
            CARD
        ================================================= */}
        <div className="rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-xl shadow-[#1e3a8a]/5 overflow-hidden">
          
          {/* =================================================
              HEADER
          ================================================= */}
          <div className="px-6 py-8 sm:px-8 bg-gradient-to-br from-[#1e3a8a] to-[#0ea5e9] text-white relative">
            <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                  Reset Password
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1">
                  Secure Account Recovery
                </p>
              </div>
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-sm">
                <span className="text-xl">🔐</span>
              </div>
            </div>

            {/* =================================================
                PROGRESS INDICATOR
            ================================================= */}
            <div className="relative z-10 flex items-center mt-8">
              {[1, 2, 3].map((item, index) => (
                <div key={item} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
                      step >= item
                        ? "bg-white text-[#1e3a8a] shadow-sm"
                        : "bg-white/20 text-white/60 border border-white/30"
                    }`}
                  >
                    {step > item ? "✓" : item}
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${
                        step > item ? "bg-white" : "bg-white/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="relative z-10 flex justify-between text-[10px] font-black uppercase tracking-widest text-white/70 mt-2">
              <span>Email</span>
              <span>Verify</span>
              <span>Password</span>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}
          <div className="p-6 sm:p-8 relative">

            {/* =================================================
                ERROR / SUCCESS
            ================================================= */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 backdrop-blur-sm p-4 shadow-sm animate-fade-slide-up">
                <span className="shrink-0 text-rose-600 mt-0.5">⚠️</span>
                <span className="text-sm font-bold text-rose-800 leading-relaxed">{error}</span>
              </div>
            )}

            {success && step !== 4 && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 backdrop-blur-sm p-4 shadow-sm animate-fade-slide-up">
                <span className="shrink-0 text-emerald-600 mt-0.5">✓</span>
                <span className="text-sm font-bold text-emerald-800 leading-relaxed">{success}</span>
              </div>
            )}

            {/* =================================================
                STEP 1: REQUEST OTP
            ================================================= */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="animate-fade-slide-up">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">
                    Forgot your password?
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                    Enter your registered email address. We'll send you a secure one-time password.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-4 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 shadow-sm disabled:opacity-60 placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#1e3a8a]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? "Sending Secure OTP..." : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full mt-3 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-[#1e3a8a] active:scale-95"
                >
                  Back to Login
                </button>
              </form>
            )}

            {/* =================================================
                STEP 2: VERIFY OTP
            ================================================= */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="animate-fade-slide-up">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">
                    Verify Identity
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                    Enter the 6-digit secure code sent to:
                  </p>
                  <p className="font-bold text-[#0ea5e9] mt-1 break-all">
                    {email}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    autoComplete="one-time-code"
                    disabled={loading}
                    className="w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-4 py-4 text-center text-3xl tracking-[0.5em] sm:tracking-[1em] font-black text-[#1e3a8a] outline-none transition-all focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 shadow-sm disabled:opacity-60 placeholder:text-slate-300"
                  />
                </div>

                <p className="text-xs font-medium text-slate-400 text-center mt-3">
                  This code will expire shortly.
                </p>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#1e3a8a]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full mt-3 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-[#1e3a8a] active:scale-95 disabled:opacity-50"
                >
                  Change Email Address
                </button>
              </form>
            )}

            {/* =================================================
                STEP 3: NEW PASSWORD
            ================================================= */}
            {step === 3 && (
              <form onSubmit={handleChangePassword} className="animate-fade-slide-up">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">
                    Secure Your Account
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                    Identity verified. Create a strong, unique password for your account.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-4 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 shadow-sm disabled:opacity-60 placeholder:font-medium placeholder:text-slate-400 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#0ea5e9] transition-colors focus:outline-none"
                      >
                        {showNewPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="mt-2 rounded-xl bg-white/40 p-3 border border-white/50 shadow-sm">
                        <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">Strength</span>
                          <span
                            className={
                              passwordStrength === "Strong" ? "text-emerald-600" :
                              passwordStrength === "Medium" ? "text-amber-600" : "text-rose-600"
                            }
                          >
                            {passwordStrength}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
                          <div className={`h-full transition-all duration-500 ${
                            passwordStrength === "Strong" ? "w-full bg-emerald-500" :
                            passwordStrength === "Medium" ? "w-2/3 bg-amber-500" : "w-1/3 bg-rose-500"
                          }`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-4 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0ea5e9] focus:bg-white focus:ring-4 focus:ring-[#0ea5e9]/20 shadow-sm disabled:opacity-60 placeholder:font-medium placeholder:text-slate-400 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#0ea5e9] transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white/60 border border-white/80 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] mb-3">
                    Requirements
                  </p>
                  <ul className="space-y-2 text-xs font-semibold text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className={`text-[10px] ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-400'}`}>{newPassword.length >= 8 ? '✓' : '•'}</span>
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`text-[10px] ${newPassword && newPassword === confirmPassword ? 'text-emerald-500' : 'text-slate-400'}`}>{newPassword && newPassword === confirmPassword ? '✓' : '•'}</span>
                      Passwords match
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#1e3a8a]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? "Updating Password..." : "Save New Password"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full mt-3 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-sm px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-[#1e3a8a] active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* =================================================
                STEP 4: SUCCESS
            ================================================= */}
            {step === 4 && (
              <div className="text-center animate-fade-slide-up">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <h2 className="text-2xl font-black text-[#1e3a8a] tracking-tight mt-6">
                  Secured Successfully!
                </h2>

                <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed px-4">
                  Your password has been successfully updated.
                </p>

                <div className="mt-6 rounded-2xl bg-[#ecfdf5] border border-[#10b981]/20 p-5 text-center shadow-sm">
                  <p className="text-sm font-black text-[#185e3a]">
                    Ready to proceed
                  </p>
                  <p className="text-xs font-semibold text-emerald-700/80 mt-1">
                    You can now log in using your new credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#1e3a8a]/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mt-8 opacity-0 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
          UniEve AI • Smart Attendance
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;