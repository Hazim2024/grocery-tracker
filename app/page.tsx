"use client";

import { useState } from "react";
import { SHOPS, CATEGORIES, MEMBERS } from "@/lib/constants";

export default function QuickLogPage() {
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPayer, setSelectedPayer] = useState(0);
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAmount = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(clean);
  };

  const canSave = selectedShop !== null && amount !== "" && selectedCategory !== null;

  const handleSave = () => {
    if (!canSave) return;
    setSaved(true);
    setTimeout(() => {
      setAmount("");
      setSelectedShop(null);
      setSelectedCategory(null);
      setSaved(false);
    }, 1200);
  };

  return (
    <div className="px-6 pt-6 pb-32 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="12" r="6" opacity="0.5" />
            <circle cx="12" cy="12" r="10" opacity="0.25" />
          </svg>
          <div>
            <div className="text-[10px] uppercase tracking-[3px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
              Family Spend
            </div>
            <div className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
              $1,240.50
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#0B0E14] border border-white/5 flex items-center justify-center font-bold text-[#00E5FF] text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          D
        </div>
      </div>

      {/* Shop Grid */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Select Shop
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {SHOPS.map((shop, i) => {
            const active = selectedShop === i;
            return (
              <button
                key={shop.name}
                onClick={() => setSelectedShop(i)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-transform active:scale-95 duration-150 ${
                  active
                    ? "bg-[#050505] debossed border border-[#00E5FF]/30"
                    : "bg-[#0B0E14] embossed border border-white/[0.03]"
                }`}
              >
                <span className={`font-semibold text-lg ${active ? "text-[#00E5FF]" : "text-white"}`}>
                  {shop.name}
                </span>
                <span
                  className={`text-[10px] mt-1 uppercase tracking-wide ${active ? "text-[#00E5FF]/60" : "text-slate-500"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {active ? "Selected" : shop.tag}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Amount Input */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Transaction Value
        </h2>
        <div className="bg-[#050505] debossed rounded-2xl p-6 flex items-baseline justify-center">
          <span className="text-2xl text-slate-500 mr-2" style={{ fontFamily: "var(--font-mono)" }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            maxLength={8}
            value={amount}
            onChange={(e) => handleAmount(e.target.value)}
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-5xl text-white text-center w-full placeholder-slate-800"
            style={{ fontFamily: "var(--font-mono)", caretColor: "#00E5FF" }}
          />
        </div>
      </section>

      {/* Category Chips */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Category
        </h2>
        <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
          {CATEGORIES.map((cat, i) => {
            const active = selectedCategory === i;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(i)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#050505] debossed border border-[#00E5FF]/30 text-[#00E5FF]"
                    : "bg-[#0B0E14] embossed border border-white/5 hover:text-[#00E5FF]"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Payer Selection */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Paid By
        </h2>
        <div className="flex justify-around items-center">
          {MEMBERS.map((m, i) => {
            const active = selectedPayer === i;
            return (
              <button
                key={m.initial}
                onClick={() => setSelectedPayer(i)}
                className={`w-14 h-14 rounded-full bg-[#0B0E14] flex items-center justify-center font-bold text-lg transition-all ${
                  active ? "debossed" : "embossed"
                }`}
                style={{
                  fontFamily: "var(--font-mono)",
                  color: active ? m.color : "#64748b",
                  boxShadow: active
                    ? `inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.03), 0 0 15px ${m.color}40`
                    : undefined,
                }}
              >
                {m.initial}
              </button>
            );
          })}
        </div>
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className={`w-full py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all embossed ${
          canSave ? "bg-[#0B0E14] text-white cursor-pointer" : "bg-[#0B0E14] text-white/40 cursor-not-allowed"
        } ${saved ? "!bg-[#00E5FF]/10" : ""}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{saved ? "SAVED ✓" : "SAVE TRANSACTION"}</span>
      </button>
    </div>
  );
}