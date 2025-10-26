import { useState, useEffect } from "react";
import { ROULETTE_WHEEL, getColorClass } from "~/constants/roulette";

interface RouletteWheelProps {
  isSpinning: boolean;
  winningNumber: string | null;
  winningIndex: number | null;
}

export function RouletteWheel({ isSpinning, winningNumber, winningIndex }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning && winningIndex !== null) {
      // Calculate the angle for the winning number
      const degreesPerSegment = 360 / ROULETTE_WHEEL.length;
      // We want the winning number to end up at the top (under the pointer)
      // Numbers are positioned at the center of their segments (index * degreesPerSegment + degreesPerSegment/2)
      // To align with the top pointer, we need to rotate so the winning number's center is at top
      const winningNumberAngle = (winningIndex * degreesPerSegment) + (degreesPerSegment / 2);
      const targetAngle = -winningNumberAngle;
      // Add 5 full rotations (1800 degrees) for the spinning effect
      const fullRotations = 1800;
      const finalRotation = fullRotations + targetAngle;

      setRotation(finalRotation);
    }
  }, [isSpinning, winningIndex]);
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Wheel Container */}
      <div className="relative w-96 h-96 mx-auto">
        {/* Outer rim */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-2xl">
          {/* Inner wheel */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
            {/* Spinning wheel segments */}
            <div
              className="w-full h-full rounded-full relative"
              style={{
                background: `conic-gradient(from -90deg, ${ROULETTE_WHEEL.map((item, index) => {
                  const startAngle = (index / ROULETTE_WHEEL.length) * 360;
                  const endAngle = ((index + 1) / ROULETTE_WHEEL.length) * 360;
                  const color =
                    item.color === "red"
                      ? "#dc2626"
                      : item.color === "black"
                      ? "#000000"
                      : "#16a34a";
                  return `${color} ${startAngle}deg ${endAngle}deg`;
                }).join(", ")})`,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none",
              }}
            >
              {/* Numbers on wheel */}
              {ROULETTE_WHEEL.map((item, index) => {
                const degreesPerSegment = 360 / ROULETTE_WHEEL.length;
                // Position number at the center of its segment
                const angle = (index * degreesPerSegment) + (degreesPerSegment / 2);
                const radius = 140;
                return (
                  <div
                    key={index}
                    className="absolute text-xs font-bold text-white"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
                    }}
                  >
                    {item.number}
                  </div>
                );
              })}
            </div>

            {/* Center circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 border-4 border-yellow-500 flex items-center justify-center shadow-lg">
                <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center">
                  {winningNumber && !isSpinning ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-500">
                        {winningNumber}
                      </div>
                      <div className="text-xs text-gray-400">Winner</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">$</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pointer/Indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg"></div>
        </div>
      </div>

      {/* Wheel base */}
      <div className="mt-4 w-80 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-xl"></div>
    </div>
  );
}
