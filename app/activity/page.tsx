"use client";

import { useState } from "react";
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

  const members = household
    ? householdMembers
    : profile
      ? [{ id: profile.id, initial: profile.initial, name: profile.name, color: profile.color }]
      : [];

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
    if (transactions.length === 0) return;

    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const monthName = new Date().toLocaleString("default", { month: "long" });

    let text = `${monthName}\n`;

    transactions.forEach((tx) => {
      const date = new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      text += `${tx.shop} - ${tx.category} - £${tx.amount.toFixed(2)} - ${tx.member} - ${date}\n`;
    });

    text += `\nTotal: £${total.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <h2 className="font-bold text-[28px] text-white mb-2">Recent Activity</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34D399] inline-block" style={{ animation: "pulse 2s infinite" }} />
          <span className="text-[10px] text-[#34D399] uppercase tracking-[2px]" style={{ fontFamily: "var(--font-mono)" }}>
            {household ? "Live Family Sync Active" : "No Household Yet"}
          </span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center text-slate-500 mt-20">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-sm">No transactions yet. Go to LOG to add one.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {transactions.map((tx) => {
              const isDeleting = deletingId === tx.id;
              const isEditing = editingId === tx.id;
              const isOwner = tx.member === profile?.name;

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
                      {/* Confirm Delete Bar */}
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

                      {/* Transaction Row */}
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
          <button
            onClick={generateShareText}
            className="w-full mt-6 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] embossed border border-white/[0.03] cursor-pointer"
            style={{
              background: copied ? "#34D39915" : "#0B0E14",
              color: copied ? "#34D399" : "#3B82F6",
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
        </>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}