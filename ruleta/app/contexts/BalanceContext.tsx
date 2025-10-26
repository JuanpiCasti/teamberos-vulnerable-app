import { createContext, useContext, useState } from "react";
import type React from "react";

interface BalanceContextType {
  balance: number;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => boolean;
  setBalance: (amount: number) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(1000); // Starting balance of $1000

  const addBalance = (amount: number) => {
    setBalance((prev) => prev + amount);
  };

  const subtractBalance = (amount: number): boolean => {
    if (balance >= amount) {
      setBalance((prev) => prev - amount);
      return true;
    }
    return false;
  };

  return (
    <BalanceContext.Provider
      value={{ balance, addBalance, subtractBalance, setBalance }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}
