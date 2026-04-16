"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";

export default function StatsPage() {
  const { transactions } = useTransactions();
  const { profile, householdMembers, household, updateBudget } = useAuth();
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [statsView, setStatsView] = useState<"category" | "shop">("category");

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;

  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.created_at);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });

  const total = monthTxs.reduce((sum, t) => sum + t.amount, 0);

  const categorySpend = Array.from(
    monthTxs.reduce((map, t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
      return map;
    }, new Map<string, number>())
  )
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);

  const shopSpend = Array.from(
    monthTxs.reduce((map, t) => {
      map.set(t.shop, (map.get(t.shop) || 0) + t.amount);
      return map;
    }, new Map<string, number>())
  )
    .map(([shop, amount]) => ({ label: shop, amount }))
    .sort((a, b) => b.amount - a.amount);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const dailySpend: number[] = Array(daysInMonth).fill(0);
  monthTxs.forEach((t) => {
    const day = new Date(t.created_at).getDate();
    dailySpend[day - 1] += t.amount;
  });
  const maxDaily = Math.max(...dailySpend, 1);

  const members = household
    ? householdMembers
    : profile
      ? [{ id: profile.id, initial: profile.initial, name: profile.name, color: profile.color }]
      : [];

  const breakdownItems = statsView === "category" ? categorySpend : shopSpend;

  return (
    <div className="px-6 pt-6 pb-32">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMonthOffset((p) => p + 1)}
          className="w-9 h-9 rounded-full bg-[#0B0E14] embossed flex items-center justify-center border-none cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="font-bold text-[22px] text-white">{monthName}</h2>
          <p className="text-sm text-slate-500 mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
            £{total.toFixed(2)} · {monthTxs.length} transactions
          </p>
        </div>
        <button
          onClick={() => !isCurrentMonth && setMonthOffset((p) => p - 1)}
          className="w-9 h-9 rounded-full bg-[#0B0E14] embossed flex items-center justify-center border-none cursor-pointer"
          style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          disabled={isCurrentMonth}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Budget Card */}
      {household && isCurrentMonth && (() => {
        const budget = household.monthly_budget || 0;
        const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
        const over = total > budget && budget > 0;
        const color = over ? "#FF4B4B" : pct >= 80 ? "#FBBF24" : "#3B82F6";
        const remaining = budget - total;

        const handleSaveBudget = async () => {
          const val = parseFloat(budgetInput);
          if (isNaN(val) || val < 0) return;
          setBudgetSaving(true);
          await updateBudget(val);
          setBudgetSaving(false);
          setEditingBudget(false);
        };

        return (
          <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03] mb-6">
            {editingBudget ? (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                  Set Monthly Budget
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-[#050505] rounded-lg px-3 py-2">
                    <span className="text-slate-500 mr-1" style={{ fontFamily: "var(--font-mono)" }}>£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0.00"
                      className="bg-transparent border-none focus:outline-none text-white w-full"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                  <button
                    onClick={() => setEditingBudget(false)}
                    className="px-3 py-2 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    disabled={budgetSaving}
                    className="px-4 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer"
                    style={{ background: "#3B82F6", color: "#050505", opacity: budgetSaving ? 0.6 : 1 }}
                  >
                    {budgetSaving ? "..." : "Save"}
                  </button>
                </div>
              </div>
            ) : budget > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
                      Monthly Budget
                    </div>
                    <div className="text-[20px] font-bold text-white mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                      £{total.toFixed(2)} <span className="text-slate-500 text-[14px]">/ £{budget.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setBudgetInput(budget.toString()); setEditingBudget(true); }}
                    className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Edit
                  </button>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-[11px] mt-2" style={{ fontFamily: "var(--font-mono)", color }}>
                  {over
                    ? `£${Math.abs(remaining).toFixed(2)} over budget`
                    : `£${remaining.toFixed(2)} remaining · ${pct.toFixed(0)}% used`}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-[12px] text-slate-400 mb-3">No monthly budget set</div>
                <button
                  onClick={() => { setBudgetInput(""); setEditingBudget(true); }}
                  className="px-4 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer"
                  style={{ background: "#3B82F6", color: "#050505" }}
                >
                  Set Budget
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Bar Chart */}
      <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03] mb-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          Daily Spending
        </h3>
        <div className="flex items-end gap-[2px] h-[120px] relative">
          {dailySpend.map((val, i) => {
            const height = maxDaily > 0 ? (val / maxDaily) * 100 : 0;
            const isToday = isCurrentMonth && i + 1 === now.getDate();
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
              >
                {/* Tooltip */}
                {val > 0 && (
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#1E2533] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    £{val.toFixed(2)}
                  </div>
                )}
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(height, val > 0 ? 4 : 0)}%`,
                    background: isToday ? "#3B82F6" : val > 0 ? "#3B82F640" : "transparent",
                    minHeight: val > 0 ? "3px" : "0px",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-slate-600" style={{ fontFamily: "var(--font-mono)" }}>1</span>
          <span className="text-[9px] text-slate-600" style={{ fontFamily: "var(--font-mono)" }}>{Math.ceil(daysInMonth / 2)}</span>
          <span className="text-[9px] text-slate-600" style={{ fontFamily: "var(--font-mono)" }}>{daysInMonth}</span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatsView("category")}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
          style={{
            background: statsView === "category" ? "#00E5FF15" : "#0B0E14",
            color: statsView === "category" ? "#00E5FF" : "#64748b",
            border: statsView === "category" ? "1px solid #00E5FF30" : "1px solid transparent",
          }}
        >
          By Category
        </button>
        <button
          onClick={() => setStatsView("shop")}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
          style={{
            background: statsView === "shop" ? "#00E5FF15" : "#0B0E14",
            color: statsView === "shop" ? "#00E5FF" : "#64748b",
            border: statsView === "shop" ? "1px solid #00E5FF30" : "1px solid transparent",
          }}
        >
          By Shop
        </button>
      </div>

      {/* Breakdown Grid */}
      {breakdownItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 mb-7">
          {breakdownItems.map((item, i) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0;
            const emoji = CATEGORIES.find((c) => c.label === item.label)?.emoji || "";
            return (
              <div
                key={item.label}
                className={`bg-[#0B0E14] embossed rounded-2xl p-[18px] border border-white/[0.03] ${i === 0 ? "col-span-2" : ""}`}
              >
                {emoji && <span className={i === 0 ? "text-[32px]" : "text-2xl"}>{emoji}</span>}
                <div className="text-[11px] text-slate-500 uppercase mt-2" style={{ fontFamily: "var(--font-mono)" }}>
                  {item.label}
                </div>
                <div
                  className={`font-bold text-white mt-1 ${i === 0 ? "text-[36px]" : "text-[22px]"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  £{item.amount.toFixed(2)}
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "#00E5FF", transition: "width 0.6s ease" }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                  {pct.toFixed(0)}% of total
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 my-10">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm">No spending data for {monthName}</p>
        </div>
      )}

      {/* Family Contribution */}
      {members.length > 0 && (
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            {household ? "Family Contribution" : "Your Spending"}
          </h3>
          <div className="flex flex-col gap-3.5">
            {members.map((m) => {
              const memberSpend = monthTxs
                .filter((t) => t.member === m.name)
                .reduce((s, t) => s + t.amount, 0);
              const pct = total > 0 ? (memberSpend / total) * 100 : 0;
              return (
                <div key={m.id} className="flex items-center gap-3.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: `${m.color}15`,
                      border: `1px solid ${m.color}30`,
                      color: m.color,
                    }}
                  >
                    {m.initial}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-[13px] font-semibold">
                        {m.name}
                        {m.id === profile?.id && <span className="text-slate-500 text-[10px] ml-1">(You)</span>}
                      </span>
                      <span className="text-[13px]" style={{ fontFamily: "var(--font-mono)", color: m.color }}>
                        £{memberSpend.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: m.color, transition: "width 0.6s ease" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}