"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { profile, household, householdMembers, signOut, joinHousehold } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleCopyCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    const err = await joinHousehold(inviteCode);
    if (err) setJoinError(err);
    else setShowJoinModal(false);
    setJoinLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="px-6 pt-6 pb-32">
      <h2 className="font-bold text-[28px] text-white mb-6">Settings</h2>

      {/* Profile Card */}
      <div
        onClick={() => router.push("/profile")}
        className="bg-[#0B0E14] embossed rounded-[20px] p-6 mb-6 border border-white/[0.03] cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl"
            style={{
              fontFamily: "var(--font-mono)",
              background: `${profile?.color || "#3B82F6"}15`,
              border: `2px solid ${profile?.color || "#3B82F6"}40`,
              color: profile?.color || "#3B82F6",
            }}
          >
            {profile?.initial || "?"}
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg">{profile?.name || "User"}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
              {profile?.role === "admin" ? "Household Admin" : "Member"}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Household Info */}
      {household && (
        <section className="mb-7">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
            Household
          </h3>
          <div className="bg-[#0B0E14] embossed rounded-2xl p-5 border border-white/[0.03]">
            <div className="text-white font-semibold text-[15px] mb-3">{household.name}</div>
            <div className="flex items-center justify-between bg-[#050505] rounded-xl p-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                  Invite Code
                </div>
                <div className="text-[#3B82F6] font-bold text-xl tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)" }}>
                  {household.invite_code}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer"
                style={{
                  background: copied ? "#34D39920" : "#3B82F615",
                  color: copied ? "#34D399" : "#3B82F6",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Share this code with family members so they can join your household.
            </p>
          </div>
        </section>
      )}

      {/* Family Members */}
      <section className="mb-7">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Family Members ({householdMembers.length})
        </h3>
        <div className="flex flex-col gap-2">
          {householdMembers.map((m) => (
            <div key={m.id} className="bg-[#0B0E14] embossed rounded-2xl p-4 flex items-center gap-3.5 border border-white/[0.03]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
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
                <span className="text-white font-semibold text-[15px]">{m.name}</span>
                {m.id === profile?.id && (
                  <span className="text-[10px] text-slate-500 ml-2">(You)</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="mb-7">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-mono)" }}>
          Actions
        </h3>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center justify-between px-[18px] py-4 bg-[#0B0E14] border-none cursor-pointer text-white hover:bg-white/[0.02] transition-colors w-full"
            style={{ borderRadius: "16px 16px 4px 4px" }}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">🔗</span>
              <span className="text-[15px] font-medium">Join Another Household</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center justify-between px-[18px] py-4 bg-[#0B0E14] border-none cursor-pointer text-white hover:bg-white/[0.02] transition-colors w-full"
            style={{ borderRadius: "4px 4px 16px 16px" }}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-lg">🚪</span>
              <span className="text-[15px] font-medium text-[#FF4B4B]">Sign Out</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </section>
      {showSignOutConfirm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-7">
          <p className="text-white font-semibold text-sm mb-1">Sign out?</p>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            You'll need to sign back in to access your household and transactions.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer bg-white/10 text-white"
            >
              Yes, sign out
            </button>
          </div>
        </div>
      )}
      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-[#0B0E14] rounded-2xl p-6 w-full max-w-[400px] border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4">Join a Household</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full bg-[#050505] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] border-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-slate-600"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>

            {joinError && (
              <div className="mt-3 text-sm text-[#FF4B4B] bg-[#FF4B4B]/10 px-4 py-2 rounded-lg">{joinError}</div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowJoinModal(false); setJoinError(""); setInviteCode(""); }}
                className="flex-1 py-3 rounded-full bg-transparent border border-white/10 text-slate-400 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joinLoading}
                className="flex-1 py-3 rounded-full font-bold cursor-pointer border-none"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #00B8D4)",
                  color: "#050505",
                  opacity: joinLoading ? 0.6 : 1,
                }}
              >
                {joinLoading ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}