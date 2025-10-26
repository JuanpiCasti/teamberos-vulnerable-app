import { useState } from "react";
import { ROULETTE_WHEEL, getColorClass, type Bet, type RouletteColor } from "~/constants/roulette";

interface BettingBoardProps {
  onAddBet: (type: "number" | "color", value: string, amount: number) => void;
  currentBets: Bet[];
  disabled: boolean;
}

export function BettingBoard({ onAddBet, currentBets, disabled }: BettingBoardProps) {
  const [betAmount, setBetAmount] = useState(10);

  const betAmounts = [5, 10, 25, 50, 100, 500];

  const handleNumberClick = (number: string) => {
    if (!disabled) {
      onAddBet("number", number, betAmount);
    }
  };

  const handleColorBet = (color: "red" | "black" | "green") => {
    if (!disabled) {
      onAddBet("color", color, betAmount);
    }
  };

  const getBetForNumber = (number: string): number => {
    const bet = currentBets.find((b) => b.type === "number" && b.value === number);
    return bet ? bet.amount : 0;
  };

  const getColorBet = (color: RouletteColor): Bet | undefined => {
    return currentBets.find((b) => b.type === "color" && b.value === color);
  };

  return (
    <div className="space-y-6">
      {/* Bet Amount Selector */}
      <div className="bg-black/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Select Chip Value</h3>
        <div className="grid grid-cols-3 gap-2">
          {betAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={disabled}
              className={`py-3 px-4 rounded-lg font-bold transition ${
                betAmount === amount
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Color Shortcuts */}
      <div className="bg-black/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Bet on Colors (x2 payout)</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleColorBet("red")}
            disabled={disabled}
            className="relative bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-bold transition border-2 border-transparent hover:border-yellow-400"
          >
            All Red
            {getColorBet("red") && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                ${getColorBet("red")!.amount}
              </div>
            )}
          </button>
          <button
            onClick={() => handleColorBet("black")}
            disabled={disabled}
            className="relative bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-bold border-2 border-white hover:border-yellow-400 transition"
          >
            All Black
            {getColorBet("black") && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                ${getColorBet("black")!.amount}
              </div>
            )}
          </button>
          <button
            onClick={() => handleColorBet("green")}
            disabled={disabled}
            className="relative bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-bold transition border-2 border-transparent hover:border-yellow-400"
          >
            All Green
            {getColorBet("green") && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                ${getColorBet("green")!.amount}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Number Grid */}
      <div className="bg-black/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Bet on Numbers (x36 payout)</h3>
        <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
          {ROULETTE_WHEEL.map((item) => {
            const currentBet = getBetForNumber(item.number);
            return (
              <button
                key={item.number}
                onClick={() => handleNumberClick(item.number)}
                disabled={disabled}
                className={`relative ${getColorClass(
                  item.color
                )} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed py-4 px-2 rounded-lg font-bold text-white transition border-2 ${
                  currentBet > 0 ? "border-yellow-400" : "border-transparent"
                }`}
              >
                <div className="text-lg">{item.number}</div>
                {currentBet > 0 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ${currentBet.toFixed(0)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Bets Summary */}
      {currentBets.length > 0 && (
        <div className="bg-black/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Your Bets</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentBets.map((bet, index) => {
              if (bet.type === "color") {
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-800/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`${getColorClass(
                          bet.value as RouletteColor
                        )} w-6 h-6 rounded flex items-center justify-center border border-white`}
                      ></div>
                      <span className="capitalize">{bet.value} (color x2)</span>
                    </div>
                    <span className="font-bold text-yellow-500">${bet.amount.toFixed(2)}</span>
                  </div>
                );
              } else {
                const wheelItem = ROULETTE_WHEEL.find((w) => w.number === bet.value);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-800/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`${getColorClass(
                          wheelItem?.color || "black"
                        )} w-6 h-6 rounded flex items-center justify-center text-xs font-bold`}
                      >
                        {bet.value}
                      </div>
                      <span>{wheelItem?.color} (number x36)</span>
                    </div>
                    <span className="font-bold text-yellow-500">${bet.amount.toFixed(2)}</span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
