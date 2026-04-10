"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SetupPage() {
  const { profile, createHousehold, joinHousehold } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!householdName.trim()) return;
    setLoading(true);
    setError("");
    const err = await createHousehold(householdName);
    if (err) setError(err);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    const err = await joinHousehold(inviteCode);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="px-6 pt-16 pb-32 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-2">
        Hey {profile?.name} 👋
      </h1>
      <p className="text-slate-400 text-sm mb-10">
        Set up your household to start tracking groceries together.
      </p>

      {mode === "choose" && (
        <div className="space-y-4">
          <button
            onClick={() => setMode("create")}
            className="w-full bg-[#0B0E14] embossed rounded-2xl p-6 text-left border border-white/[0.03] active:scale-[0.98] transition-transform"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-white font-bold text-lg">Create a Household</div>
            <div className="text-slate-400 text-sm mt-1">
              Start a new household and invite family members with a code
            </div>
          </button>

          <button
            onClick={() => setMode("join")}
            className="w-full bg-[#0B0E14] embossed rounded-2xl p-6 text-left border border-white/[0.03] active:scale-[0.98] transition-transform"
          >
            <div className="text-2xl mb-2">🔗</div>
            <div className="text-white font-bold text-lg">Join a Household</div>
            <div className="text-slate-400 text-sm mt-1">
              Enter an invite code from a family member
            </div>
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
              Household Name
            </label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. The Smiths"
              className="w-full bg-[#0B0E14] embossed rounded-xl px-4 py-3 text-white border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600"
            />
          </div>

          {error && (
            <div className="text-sm text-[#FF4B4B] bg-[#FF4B4B]/10 px-4 py-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-lg embossed active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #00E5FF, #00B8D4)", color: "#050505", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Creating..." : "CREATE HOUSEHOLD"}
          </button>

          <button onClick={() => setMode("choose")} className="w-full text-slate-400 text-sm bg-transparent border-none cursor-pointer">
            ← Back
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="space-y-4">
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
              className="w-full bg-[#0B0E14] embossed rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          {error && (
            <div className="text-sm text-[#FF4B4B] bg-[#FF4B4B]/10 px-4 py-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-lg embossed active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #00E5FF, #00B8D4)", color: "#050505", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Joining..." : "JOIN HOUSEHOLD"}
          </button>

          <button onClick={() => setMode("choose")} className="w-full text-slate-400 text-sm bg-transparent border-none cursor-pointer">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}