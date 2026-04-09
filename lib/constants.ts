import type { Shop, Category, FamilyMember } from "../types";

export const SHOPS: Shop[] = [
  { name: "Aldi", tag: "Freq: High" },
  { name: "Costco", tag: "Freq: Mid" },
  { name: "Butcher", tag: "Local" },
  { name: "Walmart", tag: "Retail" },
  { name: "Target", tag: "Retail" },
  { name: "Shell", tag: "Fuel" },
];

export const CATEGORIES: Category[] = [
  { emoji: "🍎", label: "Grocery" },
  { emoji: "🥩", label: "Meat" },
  { emoji: "🍕", label: "Food" },
  { emoji: "🧼", label: "Household" },
  { emoji: "✨", label: "Misc" },
];

export const MEMBERS: FamilyMember[] = [
  { initial: "D", name: "David", color: "#00E5FF" },
  { initial: "M", name: "Maria", color: "#FF6B35" },
  { initial: "Y", name: "Yasmin", color: "#A78BFA" },
  { initial: "S", name: "Sam", color: "#34D399" },
];