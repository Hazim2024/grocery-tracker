"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (!name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      const err = await signUp(email, password, name);
      if (err) setError(err);
      else setCheckEmail(true);
    } else {
      const err = await signIn(email, password);
      if (err) setError(err);
    }

    setLoading(false);
  };

  if (checkEmail) {
    return (
      <div className="px-6 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-slate-400 text-sm text-center">
          We sent a confirmation link to <span className="text-[#00E5FF]">{email}</span>. Click it to activate your account, then come back and sign in.
        </p>
        <button
          onClick={() => { setCheckEmail(false); setIsSignUp(false); }}
          className="mt-6 text-[#00E5FF] text-sm font-medium bg-transparent border-none cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 pt-14 pb-32 flex flex-col min-h-screen">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-4">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="12" r="6" opacity="0.5" />
            <circle cx="12" cy="12" r="10" opacity="0.25" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-mono)" }}>
          AuraGrocery
        </span>
        <span className="text-slate-500 text-sm text-center">
          Family grocery spend tracker
        </span>
      </div>

      {/* Feature Highlights */}
      <div className="flex flex-col gap-3 mb-10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-sm">📊</div>
          <span className="text-slate-300 text-sm">Track every grocery trip in seconds</span>
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-sm">👨‍👩‍👧‍👦</div>
          <span className="text-slate-300 text-sm">Sync spending across your household</span>
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-sm">📈</div>
          <span className="text-slate-300 text-sm">See who spends what, and where</span>
        </div>
      </div>

      {/* Form */}
      <h1 className="text-2xl font-bold text-white mb-1">
        {isSignUp ? "Create account" : "Welcome back"}
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        {isSignUp ? "Sign up to start tracking" : "Sign in to continue"}
      </p>

      <div className="space-y-3">
        {isSignUp && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hazim"
              className="w-full bg-[#0B0E14] embossed rounded-xl px-4 py-3 text-white border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600"
            />
          </div>
        )}

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-[#0B0E14] embossed rounded-xl px-4 py-3 text-white border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full bg-[#0B0E14] embossed rounded-xl px-4 py-3 text-white border-none focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30 placeholder-slate-600"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-[#FF4B4B] bg-[#FF4B4B]/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full mt-5 py-4 rounded-full font-bold text-lg flex items-center justify-center embossed transition-all active:scale-95 border-none cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #00E5FF, #00B8D4)",
          color: "#050505",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Please wait..." : isSignUp ? "SIGN UP" : "SIGN IN"}
      </button>

      <button
        onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
        className="w-full mt-4 text-slate-400 text-sm bg-transparent border-none cursor-pointer"
      >
        {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
      </button>
    </div>
  );
}