"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfileMenu() {
  const { profile, household, signOut, createHousehold, joinHousehold } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "create" | "join">("menu");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
        setError("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleCreate = async () => {
    if (!householdName.trim()) return;
    setLoading(true);
    setError("");
    const err = await createHousehold(householdName);
    if (err) setError(err);
    else { setView("menu"); setHouseholdName(""); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    const err = await joinHousehold(inviteCode);
    if (err) setError(err);
    else { setView("menu"); setInviteCode(""); }
    setLoading(false);
  };

  const handleCopy = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => { setOpen(!open); setView("menu"); setError(""); }}
        className="w-10 h-10 rounded-full bg-[#0B0E14] border border-white/5 flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
        style={{ fontFamily: "var(--font-mono)", color: profile?.color || "#00E5FF" }}
      >
        {profile?.initial || "?"}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-72 bg-[#0B0E14] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
          
          {view === "menu" && (
            <div>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-white font-semibold text-sm">{profile?.name}</div>
                <div className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
                  {household ? household.name : "No household"}
                </div>
              </div>

              {/* Household Section */}
              {household ? (
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                    Invite Code
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#00E5FF] font-bold tracking-[0.2em] text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {household.invite_code}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-[11px] px-2.5 py-1 rounded-md border-none cursor-pointer"
                      style={{ background: copied ? "#34D39920" : "#00E5FF15", color: copied ? "#34D399" : "#00E5FF" }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  <button
                    onClick={() => setView("create")}
                    className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
                  >
                    <span>🏠</span> Create Household
                  </button>
                  <button
                    onClick={() => setView("join")}
                    className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
                  >
                    <span>🔗</span> Join Household
                  </button>
                </div>
              )}

              {/* Sign Out */}
              <div className="p-2 border-t border-white/5">
                <button
                  onClick={signOut}
                  className="w-full px-3 py-2.5 text-left text-sm text-[#FF4B4B] hover:bg-[#FF4B4B]/5 rounded-lg transition-colors flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </div>
          )}

          {view === "create" && (
            <div className="p-4">
              <div className="text-white font-semibold text-sm mb-3">Create Household</div>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g. The Smiths"
                className="w-full bg-[#050505] rounded-lg px-3 py-2.5 text-white text-sm border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600 mb-2"
              />
              {error && <div className="text-[11px] text-[#FF4B4B] mb-2">{error}</div>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setView("menu"); setError(""); }}
                  className="flex-1 py-2 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer"
                  style={{ background: "#00E5FF", color: "#050505", opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "..." : "Create"}
                </button>
              </div>
            </div>
          )}

          {view === "join" && (
            <div className="p-4">
              <div className="text-white font-semibold text-sm mb-3">Join Household</div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-[#050505] rounded-lg px-3 py-2.5 text-white text-sm text-center tracking-[0.3em] border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600 mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              {error && <div className="text-[11px] text-[#FF4B4B] mb-2">{error}</div>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setView("menu"); setError(""); }}
                  className="flex-1 py-2 rounded-lg bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg font-semibold text-sm border-none cursor-pointer"
                  style={{ background: "#00E5FF", color: "#050505", opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "..." : "Join"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}