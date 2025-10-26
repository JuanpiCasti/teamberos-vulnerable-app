import { useState } from "react";
import type { Route } from "./+types/roulette";
import { useBalance } from "~/contexts/BalanceContext";
import { RouletteWheel } from "~/components/RouletteWheel";
import { BettingBoard } from "~/components/BettingBoard";
import { ROULETTE_WHEEL, type Bet } from "~/constants/roulette";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Roulette - Casino Game" },
    { name: "description", content: "Play American Roulette" },
  ];
};

export default function Roulette() {
  const { balance, addBalance, subtractBalance } = useBalance();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

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

  const spin = () => {
    if (totalBet === 0) {
      setMessage("Place a bet first!");
      return;
    }

    if (!subtractBalance(totalBet)) {
      setMessage("Insufficient balance!");
      return;
    }

    setIsSpinning(true);
    setMessage("");

    // Simulate spinning animation delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * ROULETTE_WHEEL.length);
      const winner = ROULETTE_WHEEL[randomIndex];
      setWinningNumber(winner.number);
      setWinningIndex(randomIndex);

      // Check for wins - both number and color bets
      let totalWinnings = 0;
      const winningBets: string[] = [];

      bets.forEach((bet) => {
        if (bet.type === "number" && bet.value === winner.number) {
          // Direct number bet: 35:1 payout + original bet = 36x
          const payout = bet.amount * 36;
          totalWinnings += payout;
          winningBets.push(`${bet.value} (number)`);
        } else if (bet.type === "color" && bet.value === winner.color) {
          // Color bet: 1:1 payout + original bet = 2x
          const payout = bet.amount * 2;
          totalWinnings += payout;
          winningBets.push(`${bet.value} (color)`);
        }
      });

      if (totalWinnings > 0) {
        addBalance(totalWinnings);
        setMessage(
          `Winner! ${winner.number} ${winner.color}! You won $${totalWinnings}! (${winningBets.join(", ")})`
        );
      } else {
        setMessage(`${winner.number} ${winner.color}. Better luck next time!`);
      }

      setIsSpinning(false);
      setBets([]);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">American Roulette</h1>
          <div className="flex items-center gap-4">
            <div className="bg-black/50 px-6 py-3 rounded-lg border border-yellow-500">
              <span className="text-yellow-500 font-semibold">Balance: </span>
              <span className="text-2xl font-bold">${balance}</span>
            </div>
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
                <div className={`p-4 rounded-lg text-center font-semibold ${
                  message.includes("Winner") || message.includes("won")
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
