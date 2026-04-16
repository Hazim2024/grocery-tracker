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
  monthly_budget: number;
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
  updateBudget: (amount: number) => Promise<string | null>;
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

  const randomColor = () => {
    const colors = ["#3B82F6", "#FF6B35", "#A78BFA", "#34D399", "#F472B6", "#FBBF24"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

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

    const initial = name.charAt(0).toUpperCase();
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      initial,
      color: randomColor(),
      role: "member",
    });

    if (profileError) return profileError.message;

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

    const { data: codeData } = await supabase.rpc("generate_invite_code");
    const code = codeData || Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newHousehold, error } = await supabase
      .from("households")
      .insert({ name, invite_code: code, created_by: user.id })
      .select()
      .single();

    if (error) return error.message;

    await supabase
      .from("profiles")
      .update({ household_id: newHousehold.id, role: "admin" })
      .eq("id", user.id);

    await loadProfile(user.id);
    return null;
  }

  async function joinHousehold(code: string): Promise<string | null> {
    if (!user) return "Not logged in";

    const { data: found, error } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !found) return "Invalid invite code";

    await supabase
      .from("profiles")
      .update({ household_id: found.id })
      .eq("id", user.id);

    await loadProfile(user.id);
    return null;
  }

  async function updateBudget(amount: number): Promise<string | null> {
    if (!household) return "No household";
    const { error } = await supabase
      .from("households")
      .update({ monthly_budget: amount })
      .eq("id", household.id);
    if (error) return error.message;
    setHousehold({ ...household, monthly_budget: amount });
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
        updateBudget,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}