import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { useBalance } from "~/contexts/BalanceContext";
import { useAuth } from "~/contexts/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Casino Games - Home" },
    { name: "description", content: "Welcome to the Casino!" },
  ];
}

export default function Home() {
  const { balance, fetchBalance } = useBalance();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      // Fetch balance from backend on mount
      fetchBalance();
    }
  }, [isAuthenticated, navigate, fetchBalance]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
            Welcome to the Casino
          </h1>
          <p className="text-xl text-gray-300">Try your luck and win big!</p>
        </div>

        {/* User Info and Balance Display */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-black/50 p-6 rounded-xl border-2 border-yellow-500 mb-4">
            <div className="text-center">
              <p className="text-gray-400 mb-2">Welcome, {user?.username}!</p>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
              <p className="text-gray-400 mb-2">Your Balance</p>
              <p className="text-5xl font-bold text-yellow-500">${balance}</p>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Available Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Roulette Game Card */}
            <a
              href="/roulette"
              className="group bg-gradient-to-br from-green-800 to-green-900 p-6 rounded-xl border-2 border-green-600 hover:border-yellow-500 transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🎰</div>
                <h3 className="text-2xl font-bold mb-2">Roulette</h3>
                <p className="text-gray-300 mb-4">
                  American Roulette with 35:1 payouts
                </p>
                <div className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg group-hover:bg-yellow-400 transition">
                  Play Now
                </div>
              </div>
            </a>

            {/* Placeholder for future games */}
            <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700 opacity-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h3 className="text-2xl font-bold mb-2">Craps</h3>
                <p className="text-gray-300 mb-4">Coming Soon</p>
                <div className="bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  Locked
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700 opacity-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🃏</div>
                <h3 className="text-2xl font-bold mb-2">Blackjack</h3>
                <p className="text-gray-300 mb-4">Coming Soon</p>
                <div className="bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  Locked
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="max-w-2xl mx-auto mt-16 text-center text-gray-400">
          <p className="mb-4">
            Play responsibly. This is a demo casino application.
          </p>
          <p className="text-sm">
            Built with React Router 7 + TypeScript + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
