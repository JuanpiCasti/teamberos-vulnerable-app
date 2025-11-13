import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/roulette";
import { useBalance } from "~/contexts/BalanceContext";
import { useAuth } from "~/contexts/AuthContext";
import { RouletteWheel } from "~/components/RouletteWheel";
import { BettingBoard } from "~/components/BettingBoard";
import { ROULETTE_WHEEL, type Bet } from "~/constants/roulette";
import { authenticatedFetch } from "~/config/api";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Roulette - Casino Game" },
    { name: "description", content: "Play American Roulette" },
  ];
};

export default function Roulette() {
  const { balance, addBalance, subtractBalance, fetchBalance, deductBalance, addBalanceWithBet, setBalance } = useBalance();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [lastBetId, setLastBetId] = useState<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      // Fetch balance from backend on mount
      fetchBalance();
    }
  }, [isAuthenticated, navigate, fetchBalance]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Don't render anything if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return null;
  }

  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const addBet = (type: "number" | "color", value: string, amount: number) => {
    const existingBetIndex = bets.findIndex(
      (bet) => bet.type === type && bet.value === value
    );

    if (existingBetIndex !== -1) {
      // Update existing bet
      const newBets = [...bets];
      newBets[existingBetIndex].amount += amount;
      setBets(newBets);
    } else {
      // Add new bet
      setBets([...bets, { type, value, amount }]);
    }
    setMessage("");
  };

  const clearBets = () => {
    setBets([]);
    setMessage("");
  };

  const spin = async () => {
    if (totalBet === 0) {
      setMessage("Place a bet first!");
      return;
    }

    setIsSpinning(true);
    setMessage("Processing bet...");

    try {
      // Step 1: Deduct balance via backend
      const deductResult = await deductBalance(totalBet);
      if (!deductResult.success) {
        setMessage(deductResult.message || "Failed to deduct balance!");
        setIsSpinning(false);
        return;
      }

      // Step 2: Record bet via backend (just records, doesn't process)
      const primaryBet = bets[0];
      const betResponse = await authenticatedFetch("/api/bets", {
        method: "POST",
        body: JSON.stringify({
          bet_type: primaryBet.type,
          bet_value: primaryBet.value,
          bet_amount: totalBet,
        }),
      });

      if (!betResponse.ok) {
        setMessage("Failed to record bet. Please try again.");
        setIsSpinning(false);
        return;
      }

      const betData = await betResponse.json();
      const betId = betData.bet_id;
      setLastBetId(betId);

      setMessage("Spinning...");

      // Step 3: Frontend determines winner (VULNERABLE DESIGN)
      setTimeout(async () => {
        const randomIndex = Math.floor(Math.random() * ROULETTE_WHEEL.length);
        const winner = ROULETTE_WHEEL[randomIndex];
        setWinningNumber(winner.number);
        setWinningIndex(randomIndex);

        // Step 4: Calculate winnings based on FRONTEND determination
        let totalWinnings = 0;
        const winningBets: string[] = [];
        let result = "loss";

        bets.forEach((bet) => {
          if (bet.type === "number" && bet.value === winner.number) {
            // Direct number bet: 35:1 payout + original bet = 36x
            const payout = bet.amount * 36;
            totalWinnings += payout;
            winningBets.push(`${bet.value} (number)`);
            result = "win";
          } else if (bet.type === "color" && bet.value === winner.color) {
            // Color bet: 1:1 payout + original bet = 2x
            const payout = bet.amount * 2;
            totalWinnings += payout;
            winningBets.push(`${bet.value} (color)`);
            result = "win";
          }
        });

        // Step 5: Update bet record with result
        try {
          await authenticatedFetch(`/api/bets/${betId}`, {
            method: "PUT",
            body: JSON.stringify({
              winning_number: winner.number,
              winning_color: winner.color,
              result: result,
              payout: totalWinnings,
            }),
          });
        } catch (error) {
          console.error("Failed to update bet record:", error);
        }

        // Step 6: If frontend determines win, credit via backend
        // VULNERABLE: Frontend decides if user won and amount
        if (totalWinnings > 0) {
          const addResult = await addBalanceWithBet(betId, totalWinnings);
          if (addResult.success) {
            setMessage(
              `Winner! ${winner.number} ${winner.color}! You won $${totalWinnings}! (${winningBets.join(", ")})`
            );
          } else {
            setMessage(
              `Winner! ${winner.number} ${winner.color}! But failed to credit winnings: ${addResult.message}`
            );
          }
        } else {
          setMessage(`${winner.number} ${winner.color}. Better luck next time!`);
        }

        setIsSpinning(false);
        setBets([]);
      }, 3000);
    } catch (error) {
      console.error("Error placing bet:", error);
      setMessage("Network error. Please try again.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">American Roulette</h1>
            <p className="text-gray-400 mt-1">
              Playing as {user?.username}{" "}
              <a
                href={`/user/profile/${user?.id}`}
                className="text-yellow-500 hover:text-yellow-400 transition text-sm ml-2"
              >
                (👤 View Profile)
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-black/50 px-6 py-3 rounded-lg border border-yellow-500">
              <span className="text-yellow-500 font-semibold">Balance: </span>
              <span className="text-2xl font-bold">${balance}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition font-semibold"
            >
              Logout
            </button>
            <a
              href="/"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              Home
            </a>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Roulette Wheel */}
          <div className="bg-black/30 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-center">Roulette Wheel</h2>
            <RouletteWheel
              isSpinning={isSpinning}
              winningNumber={winningNumber}
              winningIndex={winningIndex}
            />

            {/* Game Controls */}
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center bg-black/50 p-4 rounded-lg">
                <span className="text-lg">Total Bet:</span>
                <span className="text-2xl font-bold text-yellow-500">${totalBet}</span>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-center font-semibold ${message.includes("Winner") || message.includes("won")
                    ? "bg-green-600/80"
                    : message.includes("Insufficient") || message.includes("Place a bet")
                      ? "bg-red-600/80"
                      : "bg-blue-600/80"
                  }`}>
                  {message}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={spin}
                  disabled={isSpinning || totalBet === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold text-xl transition"
                >
                  {isSpinning ? "Spinning..." : "SPIN"}
                </button>
                <button
                  onClick={clearBets}
                  disabled={isSpinning}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition"
                >
                  Clear Bets
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Betting Board */}
          <div className="bg-black/30 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-center">Place Your Bets</h2>
            <BettingBoard
              onAddBet={addBet}
              currentBets={bets}
              disabled={isSpinning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
