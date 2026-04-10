"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user, profile, household, householdMembers, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // Delete profile (cascades via FK to auth)
      await supabase.from("profiles").delete().eq("id", user!.id);
      await supabase.auth.admin.deleteUser(user!.id); // may need server-side
      await signOut();
    } catch {
      // Fallback: just sign out and let them contact support
      setDeleteError("Could not fully delete — please contact support.");
      setDeleteLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="px-6 pt-6 pb-32">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 text-sm bg-transparent border-none cursor-pointer mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl mb-3"
          style={{
            fontFamily: "var(--font-mono)",
            background: `${profile.color}15`,
            border: `2px solid ${profile.color}40`,
            color: profile.color,
          }}
        >
          {profile.initial}
        </div>
        <h2 className="text-white font-bold text-xl">{profile.name}</h2>
        <span className="text-slate-500 text-xs uppercase tracking-widest mt-1" style={{ fontFamily: "var(--font-mono)" }}>
          {profile.role === "admin" ? "Household Admin" : "Member"}
        </span>
      </div>

      {/* Info Cards */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-mono)" }}>Email</div>
          <div className="text-white text-sm">{user?.email}</div>
        </div>

        {household && (
          <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-mono)" }}>Household</div>
            <div className="text-white text-sm">{household.name}</div>
            <div className="text-[#00E5FF] text-xs tracking-[0.3em] mt-1" style={{ fontFamily: "var(--font-mono)" }}>{household.invite_code}</div>
          </div>
        )}

        {householdMembers.length > 0 && (
          <div className="bg-[#0B0E14] embossed rounded-2xl p-4 border border-white/[0.03]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-mono)" }}>
              Members ({householdMembers.length})
            </div>
            <div className="flex gap-2 flex-wrap">
              {householdMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}
                >
                  <span className="font-bold text-xs" style={{ color: m.color, fontFamily: "var(--font-mono)" }}>{m.initial}</span>
                  <span className="text-white text-xs">{m.name}</span>
                  {m.id === profile.id && <span className="text-slate-500 text-[10px]">(you)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      {!showSignOutConfirm ? (
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full py-3.5 rounded-full bg-transparent border border-white/10 text-slate-300 font-semibold text-sm cursor-pointer mb-3"
        >
          Sign Out
        </button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-3">
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
              onClick={signOut}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer bg-white/10 text-white"
            >
              Yes, sign out
            </button>
          </div>
        </div>
      )}

      {/* Delete Account */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3.5 rounded-full bg-transparent border border-[#FF4B4B]/30 text-[#FF4B4B] font-semibold text-sm cursor-pointer"
        >
          Delete Account
        </button>
      ) : (
        <div className="bg-[#FF4B4B]/10 border border-[#FF4B4B]/30 rounded-2xl p-5">
          <p className="text-white font-semibold text-sm mb-1">Are you sure?</p>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            This will permanently delete your account and remove you from your household. This cannot be undone.
          </p>
          {deleteError && <p className="text-[#FF4B4B] text-xs mb-3">{deleteError}</p>}
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-transparent border border-white/10 text-slate-400 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer"
              style={{ background: "#FF4B4B", color: "white", opacity: deleteLoading ? 0.6 : 1 }}
            >
              {deleteLoading ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}