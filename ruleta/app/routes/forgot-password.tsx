import { useState } from "react";
import type { Route } from "./+types/forgot-password";
import { API_BASE_URL } from "~/config/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forgot Password - Casino Games" },
    { name: "description", content: "Reset your casino account password" },
  ];
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Failed to request password reset" }));
        throw new Error(data.message || "Failed to request password reset");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-gray-300">Enter your email to reset your password</p>
        </div>

        {/* Form */}
        <div className="bg-black/50 p-8 rounded-xl border-2 border-purple-600">
          {success ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-600/80 p-4 rounded-lg text-center">
                <p className="font-semibold mb-2">Check your reset link!</p>
                <p className="text-sm text-gray-200">
                  If an account exists with that email, you'll receive reset instructions.
                </p>
              </div>

              {/* Educational Console Log */}
              <div className="bg-yellow-600/20 border border-yellow-600/50 p-4 rounded-lg text-center text-sm">
                <p className="text-yellow-400 font-semibold mb-1">Educational Note:</p>
                <p className="text-gray-300">
                  Check your browser console to see the vulnerable MD5 token generation.
                </p>
              </div>

              {/* Back to Login Link */}
              <a
                href="/login"
                className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition text-lg text-center"
              >
                Back to Login
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

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                  placeholder="player@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition text-lg"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {/* Login Link */}
          {!success && (
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Remember your password?{" "}
                <a
                  href="/login"
                  className="text-purple-400 hover:text-purple-300 font-semibold transition"
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
