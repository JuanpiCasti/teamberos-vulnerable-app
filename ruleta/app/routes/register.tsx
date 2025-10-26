import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register - Casino Games" },
    { name: "description", content: "Create your casino account" },
  ];
}

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const result = await register(username, email, password);

    if (result.success) {
      setSuccess(result.message || "Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.message || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">
            Join the Casino
          </h1>
          <p className="text-gray-300">Create your account and start winning</p>
        </div>

        {/* Register Form */}
        <div className="bg-black/50 p-8 rounded-xl border-2 border-green-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-600/80 p-4 rounded-lg text-center font-semibold">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-600/80 p-4 rounded-lg text-center font-semibold">
                {success}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-2 text-gray-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                placeholder="At least 6 characters"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition text-lg"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-500 hover:text-green-400 font-semibold transition"
              >
                Login here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-2">
            By registering, you start with $1000 in your account
          </p>
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
