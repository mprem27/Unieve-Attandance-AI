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

  const [verificationToken, setVerificationToken] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // REQUEST OTP
  // =====================================================

  const handleRequestOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(
        "Please enter your registered email address."
      );
      return;
    }

    try {
      setLoading(true);

      await requestPasswordOtp(
        email.trim()
      );

      setSuccess(
        "OTP has been sent to your registered email."
      );

      setStep(2);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Unable to send OTP. Please try again.";

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
      setError(
        "OTP must contain exactly 6 digits."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await verifyPasswordOtp(
          email.trim(),
          otp.trim()
        );

      setVerificationToken(
        response.verificationToken
      );

      setSuccess(
        "OTP verified successfully."
      );

      setStep(3);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Invalid or expired OTP.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      await changePasswordWithOtp(
        email.trim(),
        verificationToken,
        newPassword
      );

      setSuccess(
        "Password changed successfully. You can now log in with your new password."
      );

      setStep(4);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Unable to change password.";

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
    if (!newPassword) {
      return "";
    }

    if (newPassword.length < 8) {
      return "Weak";
    }

    const hasUppercase =
      /[A-Z]/.test(newPassword);

    const hasLowercase =
      /[a-z]/.test(newPassword);

    const hasNumber =
      /[0-9]/.test(newPassword);

    const hasSpecial =
      /[^A-Za-z0-9]/.test(newPassword);

    const score = [
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;

    if (
      newPassword.length >= 10 &&
      score >= 3
    ) {
      return "Strong";
    }

    if (score >= 2) {
      return "Medium";
    }

    return "Weak";
  };

  const passwordStrength =
    getPasswordStrength();

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* =================================================
            CARD
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="px-7 py-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">

            <div className="flex items-center justify-between">

              <div>
                <h1 className="text-2xl font-bold">
                  Reset Password
                </h1>

                <p className="text-blue-100 text-sm mt-1">
                  Smart Attendance System
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <span className="text-xl">
                  🔐
                </span>
              </div>

            </div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="flex items-center mt-7">

              {[1, 2, 3].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center flex-1 last:flex-none"
                  >

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step >= item
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {step > item
                        ? "✓"
                        : item}
                    </div>

                    {index < 2 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          step > item
                            ? "bg-white"
                            : "bg-white/20"
                        }`}
                      />
                    )}

                  </div>
                )
              )}

            </div>

            <div className="flex justify-between text-xs text-blue-100 mt-2">
              <span>Email</span>
              <span>Verify</span>
              <span>Password</span>
            </div>

          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="p-7">

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex gap-2">
                  <span>⚠️</span>

                  <span>
                    {error}
                  </span>
                </div>
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && step !== 4 && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <div className="flex gap-2">
                  <span>✓</span>

                  <span>
                    {success}
                  </span>
                </div>
              </div>
            )}

            {/* =================================================
                STEP 1
            ================================================= */}

            {step === 1 && (
              <form
                onSubmit={
                  handleRequestOtp
                }
              >

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Forgot your password?
                  </h2>

                  <p className="text-sm text-slate-500 mt-2 leading-6">
                    Enter your registered email address.
                    We'll send you a one-time password
                    to verify your identity.
                  </p>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registered Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full mt-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Login
                </button>

              </form>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {step === 2 && (
              <form
                onSubmit={
                  handleVerifyOtp
                }
              >

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Verify OTP
                  </h2>

                  <p className="text-sm text-slate-500 mt-2 leading-6">
                    Enter the 6-digit OTP sent to:
                  </p>

                  <p className="font-semibold text-slate-800 mt-1 break-all">
                    {email}
                  </p>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="text-xs text-slate-500 text-center mt-3">
                  The OTP is valid for a limited time.
                </p>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                  className="w-full mt-5 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full mt-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Change Email
                </button>

              </form>
            )}

            {/* =================================================
                STEP 3
            ================================================= */}

            {step === 3 && (
              <form
                onSubmit={
                  handleChangePassword
                }
              >

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Create new password
                  </h2>

                  <p className="text-sm text-slate-500 mt-2 leading-6">
                    Your email has been verified.
                    Create a new password for your account.
                  </p>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                {newPassword && (
                  <div className="mt-2">

                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">
                        Password strength
                      </span>

                      <span
                        className={`font-semibold ${
                          passwordStrength ===
                          "Strong"
                            ? "text-green-600"
                            : passwordStrength ===
                              "Medium"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {passwordStrength}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength ===
                          "Strong"
                            ? "w-full bg-green-500"
                            : passwordStrength ===
                              "Medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-1/3 bg-red-500"
                        }`}
                      />
                    </div>

                  </div>
                )}

                <label className="block text-sm font-medium text-slate-700 mt-5 mb-2">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2">
                    Password requirements
                  </p>

                  <ul className="space-y-1 text-xs text-blue-700">
                    <li>
                      • At least 8 characters
                    </li>
                    <li>
                      • Use a strong password
                    </li>
                    <li>
                      • Password can only be changed once every 30 days
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full mt-5 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Changing Password..."
                    : "Change Password"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full mt-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Back
                </button>

              </form>
            )}

            {/* =================================================
                STEP 4
            ================================================= */}

            {step === 4 && (
              <div className="text-center">

                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-4xl">
                    ✓
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mt-6">
                  Password Changed!
                </h2>

                <p className="text-sm text-slate-500 mt-3 leading-6">
                  Your password has been updated
                  successfully.
                </p>

                <div className="mt-5 rounded-xl bg-green-50 border border-green-100 p-4 text-left">
                  <p className="text-sm font-semibold text-green-800">
                    Your account is secure
                  </p>

                  <p className="text-xs text-green-700 mt-1">
                    You can now log in using your new password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full mt-6 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Go to Login
                </button>

              </div>
            )}

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="text-center text-xs text-slate-400 mt-5">
          Smart Attendance System
        </p>

      </div>

    </div>
  );
};

export default ForgotPassword;