import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/user-profile";
import { authenticatedFetch } from "~/config/api";
import { useAuth } from "~/contexts/AuthContext";

export function meta({ }: Route.MetaArgs) {
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

interface Bet {
  id: number;
  user_id: number;
  bet_type: string;
  bet_value: string;
  bet_amount: number;
  winning_number?: string;
  winning_color?: string;
  result: string;
  payout: number;
  created_at: string;
}

type TabType = 'profile' | 'history';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBetsLoading, setIsBetsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filterError, setFilterError] = useState<string | null>(null);

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

  // Fetch betting history
  const fetchBets = async (filter?: string) => {
    try {
      setIsBetsLoading(true);
      setFilterError(null);

      // VULNERABLE: User-controlled filter parameter sent directly to backend
      // The backend concatenates this into SQL query without sanitization
      const endpoint = filter
        ? `/api/bets?filter=${encodeURIComponent(filter)}`
        : '/api/bets';

      const response = await authenticatedFetch(endpoint);

      if (!response.ok) {
        setFilterError("Failed to load betting history");
        setIsBetsLoading(false);
        return;
      }

      const data = await response.json();
      setBets(data || []);
      setIsBetsLoading(false);
    } catch (err) {
      console.error("Error fetching bets:", err);
      setFilterError("Network error loading bets");
      setIsBetsLoading(false);
    }
  };

  // Load bets when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      fetchBets();
    }
  }, [activeTab, isAuthenticated]);

  const handleFilterBets = () => {
    fetchBets(dateFilter);
  };

  const handleClearFilter = () => {
    setDateFilter('');
    fetchBets();
  };

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex gap-4 border-b-2 border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'profile'
                ? 'border-b-4 border-yellow-500 text-yellow-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              👤 Profile Info
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'history'
                ? 'border-b-4 border-yellow-500 text-yellow-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              🎲 Betting History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
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
                      className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${profile?.role === "admin"
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

              {/* Actions */}
              <div className="text-center">
                <button
                  onClick={() => navigate("/roulette")}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  Play Roulette
                </button>
              </div>
            </>
          )}

          {/* Betting History Tab */}
          {activeTab === 'history' && (
            <>
              {/* Date Filter */}
              <div className="bg-black/50 p-6 rounded-xl border-2 border-purple-500 mb-6">
                <h3 className="text-xl font-bold mb-4 text-purple-400">📅 Filter by Date</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm mb-2">
                      Date Filter (YYYY-MM-DD)
                    </label>
                    <input
                      type="text"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      placeholder="date"
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={handleFilterBets}
                    disabled={isBetsLoading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    {isBetsLoading ? 'Loading...' : 'Filter'}
                  </button>
                  <button
                    onClick={handleClearFilter}
                    disabled={isBetsLoading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    Clear
                  </button>
                </div>
                {filterError && (
                  <div className="mt-3 text-red-400 text-sm">
                    ⚠️ {filterError}
                  </div>
                )}
              </div>

              {/* Betting History List */}
              <div className="bg-black/50 p-6 rounded-xl border-2 border-yellow-500">
                <h3 className="text-2xl font-bold mb-4 text-yellow-500">
                  🎲 Betting History
                  {dateFilter && ` (Filtered by: ${dateFilter})`}
                </h3>

                {isBetsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 animate-spin">🎰</div>
                    <p className="text-gray-400">Loading bets...</p>
                  </div>
                ) : bets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎲</div>
                    <p className="text-gray-400 text-lg">No bets found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {dateFilter ? 'Try a different filter or clear it' : 'Place some bets to see them here!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bets.map((bet) => (
                      <div
                        key={bet.id}
                        className={`p-4 rounded-lg border-2 ${bet.result === 'win'
                          ? 'bg-green-900/30 border-green-500'
                          : bet.result === 'loss'
                            ? 'bg-red-900/30 border-red-500'
                            : 'bg-gray-800/30 border-gray-600'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-gray-400 text-sm">Bet #{bet.id}</span>
                            <p className="text-white font-semibold">
                              {bet.bet_type === 'number' ? '🎯' : '🎨'}{' '}
                              {bet.bet_type.toUpperCase()}: {bet.bet_value}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${bet.result === 'win'
                                ? 'bg-green-600 text-white'
                                : bet.result === 'loss'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-600 text-white'
                                }`}
                            >
                              {bet.result.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">User ID</p>
                            <p className="text-white font-semibold">{bet.user_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Bet Amount</p>
                            <p className="text-white font-semibold">${bet.bet_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Payout</p>
                            <p className={`font-semibold ${bet.payout > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                              ${bet.payout.toFixed(2)}
                            </p>
                          </div>
                          {bet.winning_number && (
                            <div>
                              <p className="text-gray-400">Winning Number</p>
                              <p className="text-white font-semibold">{bet.winning_number}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">Date</p>
                            <p className="text-white font-semibold text-xs">
                              {formatDateTime(bet.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {bets.length > 0 && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-400 text-sm">Total Bets</p>
                        <p className="text-white text-2xl font-bold">{bets.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Wagered</p>
                        <p className="text-yellow-500 text-2xl font-bold">
                          ${bets.reduce((sum, bet) => sum + bet.bet_amount, 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Won</p>
                        <p className="text-green-500 text-2xl font-bold">
                          ${bets.reduce((sum, bet) => sum + bet.payout, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
