import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/user-profile";
import { authenticatedFetch } from "~/config/api";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Profile - Casino Games" },
    { name: "description", content: "View user profile" },
  ];
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  balance: number;
  balance_updated_at: string;
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // VULNERABLE: Intentional IDOR - no check if user has permission to view this profile
    // Fetch profile for the ID in the URL parameter
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authenticatedFetch(`/api/user/profile/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else if (response.status === 400) {
            setError("Invalid user ID");
          } else {
            setError("Failed to load profile");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setProfile(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Network error. Please check your connection.");
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎰</div>
          <p className="text-xl text-yellow-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-600/80 p-6 rounded-lg text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="mb-4">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - display profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header with navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate("/")}
              className="text-yellow-500 hover:text-yellow-400 transition"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
            User Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-black/50 p-8 rounded-xl border-2 border-yellow-500 mb-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">👤</div>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Username</label>
                <p className="text-white text-xl font-semibold">{profile?.username}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email Address</label>
                <p className="text-white text-xl font-semibold">{profile?.email}</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Account Role</label>
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
                    profile?.role === "admin"
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {profile?.role.toUpperCase()}
                </span>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Member Since</label>
                <p className="text-white text-xl font-semibold">
                  {profile && formatDate(profile.created_at)}
                </p>
              </div>

              {/* Balance */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Current Balance</label>
                <p className="text-yellow-500 text-3xl font-bold font-mono">
                  ${profile?.balance.toFixed(2)}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {profile && formatDate(profile.balance_updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* IDOR Vulnerability Warning Banner */}
          <div className="bg-yellow-900/50 border-2 border-yellow-500 p-6 rounded-lg mb-6">
            <h3 className="font-bold text-yellow-500 text-lg mb-2">
              ⚠️ Educational Vulnerability: IDOR
            </h3>
            <p className="text-sm text-gray-300 mb-2">
              This page demonstrates <strong>Insecure Direct Object Reference (IDOR)</strong>.
            </p>
            <p className="text-sm text-gray-300">
              Try changing the user ID in the URL to view other profiles! Example: /user/profile/1,
              /user/profile/2, etc.
            </p>
          </div>

          {/* Actions */}
          <div className="text-center">
            <button
              onClick={() => navigate("/roulette")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Play Roulette
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
