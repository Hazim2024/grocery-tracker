"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type ListItem = {
  id: number;
  household_id: string;
  shop_name: string;
  item: string;
  note: string;
  checked: boolean;
  added_by: string;
  created_at: string;
};

export default function ShoppingListPage() {
  const { profile, household } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddShop, setShowAddShop] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});
  const [newItemByShop, setNewItemByShop] = useState<Record<string, string>>({});
  const [newNoteByShop, setNewNoteByShop] = useState<Record<string, string>>({});
  const [showNoteByShop, setShowNoteByShop] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteShop, setConfirmDeleteShop] = useState<string | null>(null);

  useEffect(() => {
    if (!household?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    async function load() {
      const { data } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("household_id", household!.id)
        .order("checked", { ascending: true })
        .order("created_at", { ascending: false });
      if (data) {
        setItems(data);
        // Auto-expand all shops by default
        const shops = Array.from(new Set(data.map((d) => d.shop_name)));
        const exp: Record<string, boolean> = {};
        shops.forEach((s) => (exp[s] = true));
        setExpandedShops(exp);
      }
      setLoading(false);
    }
    load();
  }, [household?.id]);

  // Group items by shop
  const groupedByShop = items.reduce((acc, item) => {
    if (!acc[item.shop_name]) acc[item.shop_name] = [];
    acc[item.shop_name].push(item);
    return acc;
  }, {} as Record<string, ListItem[]>);

  const shopNames = Object.keys(groupedByShop);

  const handleAddShop = () => {
    if (!newShopName.trim()) return;
    const name = newShopName.trim();
    if (groupedByShop[name]) {
      // Shop already exists, just expand it
      setExpandedShops((prev) => ({ ...prev, [name]: true }));
    } else {
      // Create empty shop by adding to state (will persist once first item is added)
      setExpandedShops((prev) => ({ ...prev, [name]: true }));
      // Add a placeholder so the shop card shows
      setItems((prev) => [...prev, {
        id: -Date.now(), // negative ID = placeholder
        household_id: household?.id || "",
        shop_name: name,
        item: "",
        note: "",
        checked: false,
        added_by: profile?.name || "",
        created_at: new Date().toISOString(),
      }]);
    }
    setNewShopName("");
    setShowAddShop(false);
  };

  const handleAddItem = async (shopName: string) => {
    const item = newItemByShop[shopName]?.trim();
    const note = newNoteByShop[shopName]?.trim() || "";
    if (!item || !household?.id || !profile) return;

    const { data, error } = await supabase
      .from("shopping_list")
      .insert({
        household_id: household.id,
        shop_name: shopName,
        item,
        note,
        added_by: profile.name,
      })
      .select()
      .single();

    if (!error && data) {
      // Remove placeholder if exists and add real item
      setItems((prev) => [data, ...prev.filter((i) => !(i.id < 0 && i.shop_name === shopName))]);
      setNewItemByShop((prev) => ({ ...prev, [shopName]: "" }));
      setNewNoteByShop((prev) => ({ ...prev, [shopName]: "" }));
      setShowNoteByShop((prev) => ({ ...prev, [shopName]: false }));
    }
  };

  const handleToggle = async (id: number, currentChecked: boolean) => {
    if (id < 0) return; // placeholder
    const newChecked = !currentChecked;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: newChecked } : it)));
    await supabase.from("shopping_list").update({ checked: newChecked }).eq("id", id);
  };

  const handleDeleteItem = async (id: number) => {
    if (id < 0) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      return;
    }
    setDeletingId(id);
    setTimeout(async () => {
      await supabase.from("shopping_list").delete().eq("id", id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const handleDeleteShop = async (shopName: string) => {
    if (!household?.id) return;
    const ids = groupedByShop[shopName].filter((i) => i.id > 0).map((i) => i.id);
    if (ids.length > 0) {
      await supabase.from("shopping_list").delete().in("id", ids);
    }
    setItems((prev) => prev.filter((i) => i.shop_name !== shopName));
    setConfirmDeleteShop(null);
  };

  const toggleExpand = (shopName: string) => {
    setExpandedShops((prev) => ({ ...prev, [shopName]: !prev[shopName] }));
  };

  if (!household) {
    return (
      <div className="px-6 pt-6 pb-32">
        <h2 className="font-bold text-[28px] text-white mb-2">Shopping List</h2>
        <div className="text-center text-slate-500 mt-20">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-sm">Set up your household first to create a shared shopping list.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-6 pt-6 pb-32 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 text-sm" style={{ fontFamily: "var(--font-mono)" }}>Loading list...</div>
      </div>
    );
  }

  const totalActive = items.filter((i) => i.id > 0 && !i.checked).length;
  const totalChecked = items.filter((i) => i.id > 0 && i.checked).length;

  return (
    <div className="px-6 pt-6 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-[28px] text-white mb-2">Shopping List</h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-[2px]" style={{ fontFamily: "var(--font-mono)" }}>
            {totalActive} to buy · {totalChecked} checked
          </p>
        </div>
        <button
          onClick={() => setShowAddShop(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
          style={{ background: "#3B82F6", color: "#050505" }}
          title="Add new shop"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Add Shop Form */}
      {showAddShop && (
        <div className="bg-[#0B0E14] rounded-2xl p-4 border border-[#3B82F6]/20 mb-5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            New Shop
          </div>
          <input
            type="text"
            autoFocus
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddShop()}
            placeholder="e.g. Lidl, Asda, Tesco"
            className="w-full bg-[#050505] rounded-lg px-3 py-2.5 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddShop(false); setNewShopName(""); }}
              className="flex-1 py-2 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddShop}
              disabled={!newShopName.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer"
              style={{ background: "#3B82F6", color: "#050505", opacity: newShopName.trim() ? 1 : 0.5 }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {shopNames.length === 0 ? (
        <div className="text-center text-slate-500 mt-16">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-sm mb-2">No shops added yet.</p>
          <p className="text-xs text-slate-600">Tap the + button to create your first shop list.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shopNames.map((shopName) => {
            const shopItems = groupedByShop[shopName].filter((i) => i.id > 0); // hide placeholders from list
            const expanded = expandedShops[shopName];
            const activeItems = shopItems.filter((i) => !i.checked).length;
            const checkedItems = shopItems.filter((i) => i.checked).length;

            return (
              <div key={shopName} className="bg-[#0B0E14] embossed rounded-2xl border border-white/[0.03] overflow-hidden">
                {/* Shop Header */}
                {confirmDeleteShop === shopName ? (
                  <div className="bg-[#FF4B4B]/10 p-3 flex items-center justify-between border-b border-[#FF4B4B]/20">
                    <span className="text-[#FF4B4B] text-sm font-medium">Delete "{shopName}" list?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDeleteShop(null)}
                        className="px-3 py-1.5 rounded-lg bg-transparent border border-white/10 text-slate-400 text-[12px] cursor-pointer"
                      >
                        No
                      </button>
                      <button
                        onClick={() => handleDeleteShop(shopName)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF4B4B] text-white text-[12px] font-semibold border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleExpand(shopName)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#3B82F615", border: "1px solid #3B82F630" }}>
                        <span className="text-lg">🛒</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-[15px] truncate">{shopName}</div>
                        <div className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
                          {activeItems} to buy · {checkedItems} done
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteShop(shopName); }}
                        className="text-slate-500 hover:text-[#FF4B4B] bg-transparent border-none cursor-pointer p-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Expanded Content */}
                {expanded && confirmDeleteShop !== shopName && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    {/* Add Item Input */}
                    <div className="mt-3 mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newItemByShop[shopName] || ""}
                          onChange={(e) => setNewItemByShop((prev) => ({ ...prev, [shopName]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAddItem(shopName)}
                          placeholder="Add item..."
                          className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600"
                        />
                        <button
                          onClick={() => handleAddItem(shopName)}
                          disabled={!newItemByShop[shopName]?.trim()}
                          className="w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center"
                          style={{ background: newItemByShop[shopName]?.trim() ? "#3B82F6" : "#1E2533", color: "#050505" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                      {showNoteByShop[shopName] ? (
                        <input
                          type="text"
                          value={newNoteByShop[shopName] || ""}
                          onChange={(e) => setNewNoteByShop((prev) => ({ ...prev, [shopName]: e.target.value }))}
                          placeholder="Optional note (e.g. 2L, organic)"
                          className="mt-2 w-full bg-[#050505] rounded-lg px-3 py-2 text-white text-xs border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600"
                        />
                      ) : (
                        <button
                          onClick={() => setShowNoteByShop((prev) => ({ ...prev, [shopName]: true }))}
                          className="mt-1.5 text-[11px] text-slate-500 bg-transparent border-none cursor-pointer"
                        >
                          + Add note
                        </button>
                      )}
                    </div>

                    {/* Items */}
                    {shopItems.length === 0 ? (
                      <div className="text-center text-slate-600 text-xs py-4">No items yet — add one above.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {shopItems.map((it) => {
                          const isDeleting = deletingId === it.id;
                          return (
                            <div
                              key={it.id}
                              className="transition-all duration-300 overflow-hidden"
                              style={{
                                opacity: isDeleting ? 0 : 1,
                                transform: isDeleting ? "translateX(-100%)" : "translateX(0)",
                                maxHeight: isDeleting ? "0px" : "120px",
                              }}
                            >
                              <div className="bg-[#050505] rounded-lg p-2.5 flex items-center gap-2.5">
                                <button
                                  onClick={() => handleToggle(it.id, it.checked)}
                                  className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 bg-transparent cursor-pointer"
                                  style={{
                                    borderColor: it.checked ? "#34D399" : "#334155",
                                    background: it.checked ? "#34D39920" : "transparent",
                                  }}
                                >
                                  {it.checked && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[14px] font-medium truncate ${it.checked ? "text-slate-500 line-through" : "text-white"}`}>
                                    {it.item}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {it.note && <span className="text-slate-400">{it.note} · </span>}
                                    by {it.added_by}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteItem(it.id)}
                                  className="text-slate-600 hover:text-[#FF4B4B] bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}