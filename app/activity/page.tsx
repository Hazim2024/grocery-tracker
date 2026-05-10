"use client";

import { useState, useMemo } from "react";
import { useTransactions, timeAgo } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";
import { SHOPS, CATEGORIES } from "@/lib/constants";

export default function ActivityPage() {
  const { transactions, loading, updateTransaction, deleteTransaction } = useTransactions();
  const { profile, household, householdMembers } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editShop, setEditShop] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMember, setEditMember] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const members = household
    ? householdMembers
    : profile
      ? [{ id: profile.id, initial: profile.initial, name: profile.name, color: profile.color }]
      : [];

  // Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Map<string, { label: string; value: string }>();
    
    // Add current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    months.set(currentKey, {
      label: "Recent (This Month)",
      value: "current"
    });

    // Add months from transactions
    transactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months.has(key)) {
        months.set(key, {
          label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          value: key
        });
      }
    });

    return Array.from(months.values()).sort((a, b) => {
      if (a.value === "current") return -1;
      if (b.value === "current") return 1;
      return b.value.localeCompare(a.value);
    });
  }, [transactions]);

  // Get unique shops and categories from transactions
  const uniqueShops = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.shop))).sort(),
    [transactions]
  );

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.category))).sort(),
    [transactions]
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      
      // Month filter
      if (selectedMonth === "current") {
        const now = new Date();
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (selectedMonth !== "current") {
        const [year, month] = selectedMonth.split("-").map(Number);
        if (txDate.getMonth() !== month || txDate.getFullYear() !== year) {
          return false;
        }
      }

      // Member filter
      if (selectedMembers.length > 0 && !selectedMembers.includes(tx.member)) {
        return false;
      }

      // Shop filter
      if (selectedShops.length > 0 && !selectedShops.includes(tx.shop)) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(tx.category)) {
        return false;
      }

      // Amount filter
      const min = amountMin ? parseFloat(amountMin) : null;
      const max = amountMax ? parseFloat(amountMax) : null;
      if (min !== null && tx.amount < min) return false;
      if (max !== null && tx.amount > max) return false;

      return true;
    });
  }, [transactions, selectedMonth, selectedMembers, selectedShops, selectedCategories, amountMin, amountMax]);

  const handleEdit = (tx: typeof transactions[0]) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditShop(tx.shop);
    setEditCategory(tx.category);
    setEditMember(tx.member);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const selectedMember = members.find((m) => m.name === editMember);
    await updateTransaction(editingId, {
      amount: parseFloat(editAmount),
      shop: editShop,
      category: editCategory,
      member: editMember,
      color: selectedMember?.color || "#3B82F6",
    });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setTimeout(async () => {
      await deleteTransaction(id);
      setDeletingId(null);
      setConfirmingId(null);
    }, 300);
  };

  const generateShareText = () => {
    if (filteredTransactions.length === 0) return;

    const total = filteredTransactions.reduce((s, t) => s + t.amount, 0);
    const monthName = selectedMonth === "current" 
      ? new Date().toLocaleString("default", { month: "long" })
      : availableMonths.find(m => m.value === selectedMonth)?.label || "";

    let text = `${monthName}\n`;

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      text += `${tx.shop} - ${tx.category} - £${tx.amount.toFixed(2)} - ${tx.member} - ${date}\n`;
    });

    text += `\nTotal: £${total.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMemberFilter = (memberName: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberName) 
        ? prev.filter(m => m !== memberName)
        : [...prev, memberName]
    );
  };

  const toggleShopFilter = (shop: string) => {
    setSelectedShops(prev => 
      prev.includes(shop) 
        ? prev.filter(s => s !== shop)
        : [...prev, shop]
    );
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllFilters = () => {
    setSelectedMonth("current");
    setSelectedMembers([]);
    setSelectedShops([]);
    setSelectedCategories([]);
    setAmountMin("");
    setAmountMax("");
  };

  const activeFilterCount = 
    (selectedMonth !== "current" ? 1 : 0) +
    selectedMembers.length +
    selectedShops.length +
    selectedCategories.length +
    (amountMin ? 1 : 0) +
    (amountMax ? 1 : 0);

  if (loading) {
    return (
      <div className="px-6 pt-6 pb-32 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-32">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-[28px] text-white">Recent Activity</h2>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="relative px-3 py-2 rounded-lg border cursor-pointer transition-all"
            style={{
              background: activeFilterCount > 0 
                ? "linear-gradient(135deg, #3B82F620, #3B82F610)" 
                : "rgba(255,255,255,0.02)",
              backdropFilter: "blur(10px)",
              border: activeFilterCount > 0 ? "1px solid #3B82F640" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeFilterCount > 0 ? "#3B82F6" : "#64748b"} strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount > 0 && (
                <span 
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "#3B82F6",
                    color: "#050505",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34D399] inline-block" style={{ animation: "pulse 2s infinite" }} />
          <span className="text-[10px] text-[#34D399] uppercase tracking-[2px]" style={{ fontFamily: "var(--font-mono)" }}>
            {household ? "Live Family Sync Active" : "No Household Yet"}
          </span>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowFilterModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(11,14,20,0.95), rgba(11,14,20,0.85))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59,130,246,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold text-lg">Filters</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-[#3B82F6] bg-transparent border-none cursor-pointer"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
              
              {/* Month Filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                  Time Period
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-[#050505] rounded-lg px-3 py-2.5 text-white text-sm border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
                >
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                  Amount Range
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-[#050505] rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-slate-500 text-sm mr-1" style={{ fontFamily: "var(--font-mono)" }}>£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="Min"
                      className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder-slate-600"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                  <div className="flex-1 flex items-center bg-[#050505] rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-slate-500 text-sm mr-1" style={{ fontFamily: "var(--font-mono)" }}>£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="Max"
                      className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder-slate-600"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Members Filter */}
              {members.length > 1 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                    Members
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => toggleMemberFilter(member.name)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                        style={{
                          background: selectedMembers.includes(member.name)
                            ? `${member.color}20`
                            : "rgba(255,255,255,0.02)",
                          border: selectedMembers.includes(member.name)
                            ? `1px solid ${member.color}40`
                            : "1px solid rgba(255,255,255,0.05)",
                          color: selectedMembers.includes(member.name) ? member.color : "#64748b"
                        }}
                      >
                        {member.initial} {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shops Filter */}
              {uniqueShops.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                    Shops
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueShops.map((shop) => (
                      <button
                        key={shop}
                        onClick={() => toggleShopFilter(shop)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                        style={{
                          background: selectedShops.includes(shop)
                            ? "linear-gradient(135deg, #3B82F620, #3B82F610)"
                            : "rgba(255,255,255,0.02)",
                          border: selectedShops.includes(shop)
                            ? "1px solid #3B82F640"
                            : "1px solid rgba(255,255,255,0.05)",
                          color: selectedShops.includes(shop) ? "#3B82F6" : "#64748b"
                        }}
                      >
                        {shop}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Filter */}
              {uniqueCategories.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCategories.map((category) => {
                      const emoji = CATEGORIES.find(c => c.label === category)?.emoji || "🏷️";
                      return (
                        <button
                          key={category}
                          onClick={() => toggleCategoryFilter(category)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                          style={{
                            background: selectedCategories.includes(category)
                              ? "linear-gradient(135deg, #3B82F620, #3B82F610)"
                              : "rgba(255,255,255,0.02)",
                            border: selectedCategories.includes(category)
                              ? "1px solid #3B82F640"
                              : "1px solid rgba(255,255,255,0.05)",
                            color: selectedCategories.includes(category) ? "#3B82F6" : "#64748b"
                          }}
                        >
                          {emoji} {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex gap-2">
              <button
                onClick={() => {
                  clearAllFilters();
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-2.5 rounded-lg border-none text-sm cursor-pointer font-semibold"
                style={{ background: "#3B82F6", color: "#050505" }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center text-slate-500 mt-20">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-sm mb-2">No transactions found</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[#3B82F6] text-sm bg-transparent border-none cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          {activeFilterCount > 0 && (
            <div className="mb-4 text-[11px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          )}

          <div className="flex flex-col gap-3">
            {filteredTransactions.map((tx) => {
              const isDeleting = deletingId === tx.id;
              const isEditing = editingId === tx.id;
              const isOwner = tx.member === profile?.name || profile?.role === "admin";

              return (
                <div
                  key={tx.id}
                  className="transition-all duration-300"
                  style={{
                    opacity: isDeleting ? 0 : 1,
                    transform: isDeleting ? "translateX(-100%)" : "translateX(0)",
                    maxHeight: isDeleting ? "0px" : "300px",
                    overflow: "hidden",
                  }}
                >
                  {isEditing ? (
                    <div className="bg-[#0B0E14] rounded-2xl p-4 border border-[#3B82F6]/20">
                      <div className="flex gap-2 mb-3">
                        <select
                          value={editShop}
                          onChange={(e) => setEditShop(e.target.value)}
                          className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
                        >
                          {SHOPS.map((s) => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.label} value={c.label}>{c.emoji} {c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1 flex items-center bg-[#050505] rounded-lg px-3 py-2">
                          <span className="text-slate-500 text-sm mr-1" style={{ fontFamily: "var(--font-mono)" }}>£</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                            className="bg-transparent border-none focus:outline-none text-white text-sm w-full"
                            style={{ fontFamily: "var(--font-mono)" }}
                          />
                        </div>
                        <select
                          value={editMember}
                          onChange={(e) => setEditMember(e.target.value)}
                          className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer"
                          style={{ background: "#3B82F6", color: "#050505" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0B0E14] embossed rounded-2xl border border-white/[0.03] overflow-hidden">
                      {confirmingId === tx.id && (
                        <div className="bg-[#FF4B4B]/10 px-4 py-3 flex items-center justify-between border-b border-[#FF4B4B]/20">
                          <span className="text-[#FF4B4B] text-sm font-medium">Delete this transaction?</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-transparent border border-white/10 text-slate-400 text-[12px] cursor-pointer"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#FF4B4B] text-white text-[12px] font-semibold border-none cursor-pointer"
                            >
                              Yes, delete
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{
                              fontFamily: "var(--font-mono)",
                              background: `${tx.color}15`,
                              border: `1px solid ${tx.color}30`,
                              color: tx.color,
                            }}
                          >
                            {tx.member[0]}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-[15px]">{tx.shop}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {tx.member} · {tx.category} · {timeAgo(tx.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="font-bold text-base px-3.5 py-1.5 rounded-xl"
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: tx.color,
                              background: `${tx.color}10`,
                            }}
                          >
                            £{tx.amount.toFixed(2)}
                          </div>
                          {isOwner && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleEdit(tx)}
                                className="text-slate-500 hover:text-[#3B82F6] transition-colors bg-transparent border-none cursor-pointer p-0.5"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmingId(tx.id)}
                                className="text-slate-500 hover:text-[#FF4B4B] transition-colors bg-transparent border-none cursor-pointer p-0.5"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Share Button */}
          <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 z-30">
            <button
              onClick={generateShareText}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] border border-white/[0.03] cursor-pointer"
              style={{
                background: copied ? "#34D399" : "#0B0E14",
                color: copied ? "#050505" : "#3B82F6",
                backdropFilter: "blur(10px)",
              }}
            >
              {copied ? (
                <>✅ Copied — paste in WhatsApp</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Generate &amp; Copy Summary
                </>
              )}
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}