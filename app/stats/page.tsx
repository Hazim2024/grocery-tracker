"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";

export default function StatsPage() {
  const { transactions } = useTransactions();
  const { profile, householdMembers, household } = useAuth();
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

      {/* Bar Chart */}
      <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03] mb-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          Daily Spending
        </h3>
        <div className="flex items-end gap-[2px] h-[120px]">
          {dailySpend.map((val, i) => {
            const height = maxDaily > 0 ? (val / maxDaily) * 100 : 0;
            const isToday = isCurrentMonth && i + 1 === now.getDate();
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
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
            background: statsView === "category" ? "#3B82F615" : "#0B0E14",
            color: statsView === "category" ? "#3B82F6" : "#64748b",
            border: statsView === "category" ? "1px solid #3B82F630" : "1px solid transparent",
          }}
        >
          By Category
        </button>
        <button
          onClick={() => setStatsView("shop")}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
          style={{
            background: statsView === "shop" ? "#3B82F615" : "#0B0E14",
            color: statsView === "shop" ? "#3B82F6" : "#64748b",
            border: statsView === "shop" ? "1px solid #3B82F630" : "1px solid transparent",
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
                    style={{ width: `${pct}%`, background: "#3B82F6", transition: "width 0.6s ease" }}
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