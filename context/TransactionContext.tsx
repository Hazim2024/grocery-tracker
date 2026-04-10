"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Transaction = {
  id: number;
  household_id: string;
  shop: string;
  member: string;
  category: string;
  amount: number;
  color: string;
  created_at: string;
};

type TransactionContextType = {
  transactions: Transaction[];
  addTransaction: (tx: { shop: string; member: string; category: string; amount: number; color: string }) => Promise<void>;
  updateTransaction: (id: number, updates: Partial<Pick<Transaction, "shop" | "member" | "category" | "amount" | "color">>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  loading: boolean;
};

const TransactionContext = createContext<TransactionContextType | null>(null);

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
  if (seconds < 172800) return "Yesterday";
  return `${Math.floor(seconds / 86400)} days ago`;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { household } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("household_id", household!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
      } else {
        setTransactions(data || []);
      }
      setLoading(false);
    }

    fetchTransactions();
  }, [household]);

  const addTransaction = async (tx: { shop: string; member: string; category: string; amount: number; color: string }) => {
    if (!household) return;

    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...tx, household_id: household.id }])
      .select()
      .single();

    if (error) {
      console.error("Error saving transaction:", error);
      return;
    }

    setTransactions((prev) => [data, ...prev]);
  };

  const updateTransaction = async (id: number, updates: Partial<Pick<Transaction, "shop" | "member" | "category" | "amount" | "color">>) => {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating transaction:", error);
      return;
    }

    setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
  };

  const deleteTransaction = async (id: number) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, loading }}>
      {children}
    </TransactionContext.Provider>
  );
}