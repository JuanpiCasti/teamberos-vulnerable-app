import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Casino Games" },
    { name: "description", content: "Login to your casino account" },
  ];
}

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-300">Login to continue playing</p>
        </div>

        {/* Login Form */}
        <div className="bg-black/50 p-8 rounded-xl border-2 border-purple-600">
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
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                placeholder="player@example.com"
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
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition text-lg"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-yellow-500 hover:text-yellow-400 font-semibold transition"
              >
                Register here
              </a>
            </p>
          </div>
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
