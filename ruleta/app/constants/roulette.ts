export type RouletteColor = "red" | "black" | "green";

export interface RouletteNumber {
  number: string;
  color: RouletteColor;
}

// American Roulette wheel order
export const ROULETTE_WHEEL: RouletteNumber[] = [
  { number: "0", color: "green" },
  { number: "28", color: "black" },
  { number: "9", color: "red" },
  { number: "26", color: "black" },
  { number: "30", color: "red" },
  { number: "11", color: "black" },
  { number: "7", color: "red" },
  { number: "20", color: "black" },
  { number: "32", color: "red" },
  { number: "17", color: "black" },
  { number: "5", color: "red" },
  { number: "22", color: "black" },
  { number: "34", color: "red" },
  { number: "15", color: "black" },
  { number: "3", color: "red" },
  { number: "24", color: "black" },
  { number: "36", color: "red" },
  { number: "13", color: "black" },
  { number: "1", color: "red" },
  { number: "00", color: "green" },
  { number: "27", color: "red" },
  { number: "10", color: "black" },
  { number: "25", color: "red" },
  { number: "29", color: "black" },
  { number: "12", color: "red" },
  { number: "8", color: "black" },
  { number: "19", color: "red" },
  { number: "31", color: "black" },
  { number: "18", color: "red" },
  { number: "6", color: "black" },
  { number: "21", color: "red" },
  { number: "33", color: "black" },
  { number: "16", color: "red" },
  { number: "4", color: "black" },
  { number: "23", color: "red" },
  { number: "35", color: "black" },
  { number: "14", color: "red" },
  { number: "2", color: "black" },
];

export type BetType = "number" | "color";

export interface Bet {
  type: BetType;
  value: string; // number string (e.g., "5", "0", "00") or color ("red", "black", "green")
  amount: number;
}

export const getColorClass = (color: RouletteColor): string => {
  switch (color) {
    case "red":
      return "bg-red-600";
    case "black":
      return "bg-black";
    case "green":
      return "bg-green-600";
  }
};

export const getTextColorClass = (color: RouletteColor): string => {
  return "text-white";
};
