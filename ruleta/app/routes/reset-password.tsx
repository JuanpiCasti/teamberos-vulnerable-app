import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/reset-password";
import { API_BASE_URL } from "~/config/api";
import PasswordStrengthIndicator from "~/components/PasswordStrengthIndicator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - Casino Games" },
    { name: "description", content: "Create a new password for your casino account" },
  ];
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [countdown, setCountdown] = useState(3);

  // Verify token and fetch email on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link - no token provided");
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`);

        if (!response.ok) {
          throw new Error("Invalid or expired reset token");
        }

        const data = await response.json();
        setEmail(data.email);

        // EDUCATIONAL: Log the MD5 vulnerability
        console.log("%c🔓 VULNERABLE: A02 Cryptographic Failures", "color: #ff6b6b; font-weight: bold; font-size: 14px;");
        console.log("%cThis token was generated using MD5(email):", "color: #ffd93d; font-weight: bold;");
        console.log(`%cEmail: ${data.email}`, "color: #6bcf7f;");
        console.log(`%cToken: ${token}`, "color: #6bcf7f;");
        console.log("%cAttack: If you know someone's email (via IDOR), you can generate their reset token!", "color: #ff6b6b; font-weight: bold;");
        console.log(`%cProof: MD5("${data.email}") = ${token}`, "color: #ffd93d;");

        setIsVerifying(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify token");
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate("/login");
    }
  }, [success, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate minimum length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Failed to reset password" }));
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  // Check if password meets all criteria
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = hasMinLength && hasNumber && hasLetter && passwordsMatch;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-300">Create a new password for your account</p>
        </div>

        {/* Form */}
        <div className="bg-black/50 p-8 rounded-xl border-2 border-blue-600">
          {isVerifying ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Verifying reset token...</p>
            </div>
          ) : error && !email ? (
            <div className="space-y-6">
              {/* Error Message */}
              <div className="bg-red-600/80 p-4 rounded-lg text-center">
                <p className="font-semibold mb-2">Reset Link Invalid</p>
                <p className="text-sm text-gray-200">{error}</p>
              </div>

              {/* Request New Link */}
              <a
                href="/forgot-password"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition text-lg text-center"
              >
                Request New Reset Link
              </a>
            </div>
          ) : success ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-600/80 p-4 rounded-lg text-center">
                <p className="font-semibold mb-2">Password Reset Successful!</p>
                <p className="text-sm text-gray-200">
                  Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
                </p>
              </div>

              {/* Manual Login Link */}
              <a
                href="/login"
                className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition text-lg text-center"
              >
                Go to Login Now
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-600/80 p-4 rounded-lg text-center font-semibold">
                  {error}
                </div>
              )}

              {/* Email Display (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-300">
                  Account Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold mb-2 text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition pr-12"
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="mt-3">
                  <PasswordStrengthIndicator password={newPassword} />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-gray-300">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                {confirmPassword.length > 0 && (
                  <div className={`mt-2 text-sm flex items-center gap-2 ${passwordsMatch ? "text-green-400" : "text-red-400"}`}>
                    <span className="text-lg">{passwordsMatch ? "✓" : "✗"}</span>
                    <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition text-lg"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Login Link */}
          {!success && email && (
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Remember your password?{" "}
                <a
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Login here
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-gray-400 hover:text-gray-300 transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
