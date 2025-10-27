import { createContext, useContext, useState } from "react";
import type React from "react";
import { authenticatedFetch } from "~/config/api";

interface BalanceContextType {
  balance: number;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => boolean;
  setBalance: (amount: number) => void;
  fetchBalance: () => Promise<void>;
  deductBalance: (amount: number) => Promise<{ success: boolean; message?: string }>;
  addBalanceWithBet: (betId: number, amount: number) => Promise<{ success: boolean; message?: string }>;
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

  const deductBalance = async (amount: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authenticatedFetch("/api/balance/deduct", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local balance from backend response
        if (data.balance && data.balance.amount !== undefined) {
          setBalance(data.balance.amount);
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to deduct balance" };
      }
    } catch (error) {
      console.error("Failed to deduct balance:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  const addBalanceWithBet = async (betId: number, amount: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authenticatedFetch("/api/balance/add", {
        method: "POST",
        body: JSON.stringify({ amount }), // Backend no longer requires bet_id
      });

      const data = await response.json();

      if (response.ok) {
        // Update local balance from backend response
        if (data.balance && data.balance.amount !== undefined) {
          setBalance(data.balance.amount);
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to add balance" };
      }
    } catch (error) {
      console.error("Failed to add balance:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  return (
    <BalanceContext.Provider
      value={{ balance, addBalance, subtractBalance, setBalance, fetchBalance, deductBalance, addBalanceWithBet }}
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
