"use client";

import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import LoginPage from "@/app/login/page";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-[480px] mx-auto flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="max-w-[480px] mx-auto relative min-h-screen">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto relative min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}