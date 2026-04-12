"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SHOPS as DEFAULT_SHOPS, CATEGORIES as DEFAULT_CATEGORIES } from "@/lib/constants";
import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type CustomShop = { name: string; tag: string };
type CustomCategory = { emoji: string; label: string };

export default function QuickLogPage() {
  const router = useRouter();
  const { transactions, addTransaction } = useTransactions();
  const { profile, household, householdMembers, createHousehold, joinHousehold } = useAuth();
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPayer, setSelectedPayer] = useState(0);
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [shops, setShops] = useState<CustomShop[]>(DEFAULT_SHOPS);
  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopTag, setNewShopTag] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [setupView, setSetupView] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Load settings from Supabase on mount
  useEffect(() => {
    if (!household?.id) return;
    async function loadSettings() {
      const { data } = await supabase
        .from("household_settings")
        .select("custom_shops, custom_categories")
        .eq("household_id", household!.id)
        .maybeSingle();
      if (data) {
        const s = typeof data.custom_shops === "string" ? JSON.parse(data.custom_shops) : data.custom_shops;
        const c = typeof data.custom_categories === "string" ? JSON.parse(data.custom_categories) : data.custom_categories;
        if (s?.length) setShops(s);
        if (c?.length) setCategories(c);
      }
    }
    loadSettings();
  }, [household?.id]);

  // Explicit save helper — only called from add/delete handlers
  const saveSettings = async (newShops: CustomShop[], newCats: CustomCategory[]) => {
    if (!household?.id) return;
    const { error } = await supabase.from("household_settings").upsert({
      household_id: household.id,
      custom_shops: newShops,
      custom_categories: newCats,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("Save settings error:", error);
  };

  const payers = household
    ? householdMembers
    : profile
      ? [{ id: profile.id, initial: profile.initial, name: profile.name, color: profile.color }]
      : [];

  useEffect(() => {
    if (profile && payers.length > 0) {
      const myIndex = payers.findIndex((p) => p.name === profile.name);
      if (myIndex >= 0) setSelectedPayer(myIndex);
    }
  }, [profile, payers.length]);

  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleAmount = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(clean);
  };

  const canSave = selectedShop !== null && amount !== "" && selectedCategory !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError("");
    if (!household) {
      setSaveError("Set up your household first to save transactions");
      return;
    }
    const payer = payers[selectedPayer];
    await addTransaction({
      shop: shops[selectedShop].name,
      member: payer?.name || "Unknown",
      category: categories[selectedCategory].label,
      amount: parseFloat(amount),
      color: payer?.color || "#3B82F6",
    });
    setSaved(true);
    setTimeout(() => {
      setAmount("");
      setSelectedShop(null);
      setSelectedCategory(null);
      setSaved(false);
    }, 1200);
  };

  const handleAddShop = () => {
    if (!newShopName.trim()) return;
    const updated = [...shops, { name: newShopName.trim(), tag: newShopTag.trim() || "Custom" }];
    setShops(updated);
    saveSettings(updated, categories);
    setNewShopName("");
    setNewShopTag("");
    setShowAddShop(false);
  };

  const handleDeleteShop = (index: number) => {
    const updated = shops.filter((_, i) => i !== index);
    setShops(updated);
    saveSettings(updated, categories);
    if (selectedShop === index) setSelectedShop(null);
    else if (selectedShop !== null && selectedShop > index) setSelectedShop(selectedShop - 1);
  };

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    const updated = [...categories, { emoji: newCatEmoji.trim() || "🏷️", label: newCatLabel.trim() }];
    setCategories(updated);
    saveSettings(shops, updated);
    setNewCatEmoji("");
    setNewCatLabel("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    saveSettings(shops, updated);
    if (selectedCategory === index) setSelectedCategory(null);
    else if (selectedCategory !== null && selectedCategory > index) setSelectedCategory(selectedCategory - 1);
  };

  const handleCreate = async () => {
    if (!householdName.trim()) return;
    setSetupLoading(true);
    setSetupError("");
    const err = await createHousehold(householdName);
    if (err) setSetupError(err);
    setSetupLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setSetupLoading(true);
    setSetupError("");
    const err = await joinHousehold(inviteCode);
    if (err) setSetupError(err);
    setSetupLoading(false);
  };

  return (
    <div className="px-6 pt-6 pb-32 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="12" r="6" opacity="0.5" />
            <circle cx="12" cy="12" r="10" opacity="0.25" />
          </svg>
          <div>
            <div className="text-[10px] uppercase tracking-[3px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
              {household ? "Family Spend" : "My Spend"}
            </div>
            <div className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
              £{totalSpend.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: editMode ? "#3B82F6" : "#64748b" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <div
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full bg-[#0B0E14] border border-white/5 flex items-center justify-center font-bold text-sm cursor-pointer"
            style={{ fontFamily: "var(--font-mono)", color: profile?.color || "#3B82F6" }}
          >
            {profile?.initial || "?"}
          </div>
        </div>
      </div>

      {/* Floating Household Setup Card */}
      {!household && (
        <div className="bg-[#0B0E14] rounded-2xl border border-[#3B82F6]/20 overflow-hidden shadow-lg shadow-[#3B82F6]/5">
          {setupView === "choose" && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">👋</span>
                <h3 className="text-white font-bold text-[15px]">Welcome, {profile?.name}!</h3>
              </div>
              <p className="text-slate-400 text-[12px] mb-4 leading-relaxed">
                Create a household to start saving transactions, or join an existing one with a code.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => { setSetupView("create"); setSetupError(""); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm border-none cursor-pointer active:scale-[0.97] transition-transform"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #00B8D4)", color: "#050505" }}
                >
                  🏠 Create
                </button>
                <button
                  onClick={() => { setSetupView("join"); setSetupError(""); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.97] transition-transform bg-transparent border border-[#3B82F6]/30 text-[#3B82F6]"
                >
                  🔗 Join
                </button>
              </div>
            </div>
          )}
          {setupView === "create" && (
            <div className="p-5">
              <h3 className="text-white font-bold text-[15px] mb-3">Create Household</h3>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g. The Smiths"
                className="w-full bg-[#050505] rounded-xl px-4 py-3 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600 mb-3"
              />
              {setupError && <div className="text-[12px] text-[#FF4B4B] mb-3">{setupError}</div>}
              <div className="flex gap-2.5">
                <button onClick={() => { setSetupView("choose"); setSetupError(""); }} className="flex-1 py-2.5 rounded-xl bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer">Back</button>
                <button onClick={handleCreate} disabled={setupLoading} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer" style={{ background: "#3B82F6", color: "#050505", opacity: setupLoading ? 0.6 : 1 }}>
                  {setupLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          )}
          {setupView === "join" && (
            <div className="p-5">
              <h3 className="text-white font-bold text-[15px] mb-3">Join Household</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-[#050505] rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.4em] border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600 mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              {setupError && <div className="text-[12px] text-[#FF4B4B] mb-3">{setupError}</div>}
              <div className="flex gap-2.5">
                <button onClick={() => { setSetupView("choose"); setSetupError(""); }} className="flex-1 py-2.5 rounded-xl bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer">Back</button>
                <button onClick={handleJoin} disabled={setupLoading} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer" style={{ background: "#3B82F6", color: "#050505", opacity: setupLoading ? 0.6 : 1 }}>
                  {setupLoading ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shop Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)" }}>
            Select Shop
          </h2>
          {editMode && (
            <button
              onClick={() => setShowAddShop(true)}
              className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              + Add
            </button>
          )}
        </div>

        {showAddShop && (
          <div className="bg-[#0B0E14] rounded-xl p-3 mb-3 border border-[#3B82F6]/20 flex gap-2">
            <input type="text" value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="Shop name" className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none placeholder-slate-600" />
            <input type="text" value={newShopTag} onChange={(e) => setNewShopTag(e.target.value)} placeholder="Tag" className="w-20 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none placeholder-slate-600" />
            <button onClick={handleAddShop} className="px-3 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer" style={{ background: "#3B82F6", color: "#050505" }}>Add</button>
            <button onClick={() => setShowAddShop(false)} className="px-2 py-2 rounded-lg text-slate-400 text-sm bg-transparent border-none cursor-pointer">✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {shops.map((shop, i) => {
            const active = selectedShop === i;
            return (
              <div
                key={`${shop.name}-${i}`}
                onClick={() => !editMode && setSelectedShop(i)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-transform active:scale-95 duration-150 relative cursor-pointer ${active ? "bg-[#050505] debossed border border-[#3B82F6]/30" : "bg-[#0B0E14] embossed border border-white/[0.03]"}`}
              >
                {editMode && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(i); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF4B4B]/20 flex items-center justify-center text-[#FF4B4B] text-xs border-none cursor-pointer">✕</button>
                )}
                <span className={`font-semibold text-lg ${active ? "text-[#3B82F6]" : "text-white"}`}>{shop.name}</span>
                <span className={`text-[10px] mt-1 uppercase tracking-wide ${active ? "text-[#3B82F6]/60" : "text-slate-500"}`} style={{ fontFamily: "var(--font-mono)" }}>{active ? "Selected" : shop.tag}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Amount Input */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>Transaction Value</h2>
        <div className="bg-[#050505] debossed rounded-2xl p-6 flex items-baseline justify-center">
          <span className="text-2xl text-slate-500 mr-2" style={{ fontFamily: "var(--font-mono)" }}>£</span>
          <input type="text" inputMode="decimal" placeholder="0.00" maxLength={8} value={amount} onChange={(e) => handleAmount(e.target.value)} className="bg-transparent border-none focus:ring-0 focus:outline-none text-5xl text-white text-center w-full placeholder-slate-800" style={{ fontFamily: "var(--font-mono)", caretColor: "#3B82F6" }} />
        </div>
      </section>

      {/* Category Chips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)" }}>Category</h2>
          {editMode && (
            <button onClick={() => setShowAddCategory(true)} className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer" style={{ fontFamily: "var(--font-mono)" }}>+ Add</button>
          )}
        </div>

        {showAddCategory && (
          <div className="bg-[#0B0E14] rounded-xl p-3 mb-3 border border-[#3B82F6]/20 flex gap-2">
            <input type="text" value={newCatEmoji} onChange={(e) => setNewCatEmoji(e.target.value)} placeholder="🏷️" className="w-12 bg-[#050505] rounded-lg px-2 py-2 text-white text-center text-sm border-none focus:outline-none placeholder-slate-600" />
            <input type="text" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="Category name" className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none placeholder-slate-600" />
            <button onClick={handleAddCategory} className="px-3 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer" style={{ background: "#3B82F6", color: "#050505" }}>Add</button>
            <button onClick={() => setShowAddCategory(false)} className="px-2 py-2 rounded-lg text-slate-400 text-sm bg-transparent border-none cursor-pointer">✕</button>
          </div>
        )}

        <div className="flex overflow-x-auto gap-3 pt-3 pb-2 hide-scrollbar">
          {categories.map((cat, i) => {
            const active = selectedCategory === i;
            return (
              <div key={`${cat.label}-${i}`} className="relative">
                {editMode && (
                  <button onClick={() => handleDeleteCategory(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF4B4B]/20 flex items-center justify-center text-[#FF4B4B] text-[10px] border-none cursor-pointer z-10">✕</button>
                )}
                <button onClick={() => !editMode && setSelectedCategory(i)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${active ? "bg-[#050505] debossed border border-[#3B82F6]/30 text-[#3B82F6]" : "bg-[#0B0E14] embossed border border-white/5 hover:text-[#3B82F6]"}`}>
                  {cat.emoji} {cat.label}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payer Selection */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>Paid By</h2>
        <div className="flex justify-around items-center">
          {payers.map((m, i) => {
            const active = selectedPayer === i;
            return (
              <button key={m.id} onClick={() => setSelectedPayer(i)} className={`w-14 h-14 rounded-full bg-[#0B0E14] flex items-center justify-center font-bold text-lg transition-all ${active ? "debossed" : "embossed"}`}
                style={{ fontFamily: "var(--font-mono)", color: active ? m.color : "#64748b", boxShadow: active ? `inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.03), 0 0 15px ${m.color}40` : undefined }}>
                {m.initial}
              </button>
            );
          })}
        </div>
      </section>

      {/* Save Error */}
      {saveError && <div className="text-sm text-[#FBBF24] bg-[#FBBF24]/10 px-4 py-2.5 rounded-xl">{saveError}</div>}

      {/* Save Button */}
      <button onClick={handleSave} disabled={!canSave}
        className={`w-full py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all embossed ${canSave ? "bg-[#0B0E14] text-white cursor-pointer" : "bg-[#0B0E14] text-white/40 cursor-not-allowed"} ${saved ? "!bg-[#3B82F6]/10" : ""}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{saved ? "SAVED ✓" : "SAVE TRANSACTION"}</span>
      </button>
    </div>
  );
}