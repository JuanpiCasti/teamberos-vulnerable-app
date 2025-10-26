import { createContext, useContext, useState } from "react";
import type React from "react";
import { authenticatedFetch } from "~/config/api";

interface BalanceContextType {
  balance: number;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => boolean;
  setBalance: (amount: number) => void;
  fetchBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(1000); // Starting balance of $1000

  const fetchBalance = async () => {
    try {
      const response = await authenticatedFetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.amount);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

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
      value={{ balance, addBalance, subtractBalance, setBalance, fetchBalance }}
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
