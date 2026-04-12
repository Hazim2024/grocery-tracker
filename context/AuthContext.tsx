"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  name: string;
  initial: string;
  color: string;
  household_id: string | null;
  role: string;
};

type Household = {
  id: string;
  name: string;
  invite_code: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  householdMembers: Profile[];
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<string | null>;
  joinHousehold: (code: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate a random color for new users
  const randomColor = () => {
    const colors = ["#3B82F6", "#FF6B35", "#A78BFA", "#34D399", "#F472B6", "#FBBF24"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Load user session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
        setHouseholdMembers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profileData) {
      // User exists in auth but no profile — sign them out so they see login
      console.log("No profile found, signing out");
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setHousehold(null);
      setHouseholdMembers([]);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    if (profileData.household_id) {
      const { data: householdData } = await supabase
        .from("households")
        .select("*")
        .eq("id", profileData.household_id)
        .single();

      if (householdData) setHousehold(householdData);

      const { data: members } = await supabase
        .from("profiles")
        .select("*")
        .eq("household_id", profileData.household_id);

      if (members) setHouseholdMembers(members);
    }

    setLoading(false);
  }

  async function signUp(email: string, password: string, name: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (!data.user) return "Signup failed";

    // Create profile
    const initial = name.charAt(0).toUpperCase();
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      initial,
      color: randomColor(),
      role: "member",
    });

    if (profileError) return profileError.message;

    // Force sign out so user must confirm email first
    await supabase.auth.signOut();
    return null;
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    console.log("signIn called with:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("signIn result:", { data, error });
    if (error) return error.message;
    return null;
  }

  async function signInWithGoogle(): Promise<string | null> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHousehold(null);
    setHouseholdMembers([]);
  }

  async function createHousehold(name: string): Promise<string | null> {
    if (!user) return "Not logged in";

    // Generate invite code
    const { data: codeData } = await supabase.rpc("generate_invite_code");
    const code = codeData || Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create household
    const { data: newHousehold, error } = await supabase
      .from("households")
      .insert({ name, invite_code: code, created_by: user.id })
      .select()
      .single();

    if (error) return error.message;

    // Update profile to link to household and set as admin
    await supabase
      .from("profiles")
      .update({ household_id: newHousehold.id, role: "admin" })
      .eq("id", user.id);

    // Reload profile
    await loadProfile(user.id);
    return null;
  }

  async function joinHousehold(code: string): Promise<string | null> {
    if (!user) return "Not logged in";

    // Find household by invite code
    const { data: found, error } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !found) return "Invalid invite code";

    // Update profile to join household
    await supabase
      .from("profiles")
      .update({ household_id: found.id })
      .eq("id", user.id);

    // Reload profile
    await loadProfile(user.id);
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        household,
        householdMembers,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        createHousehold,
        joinHousehold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}