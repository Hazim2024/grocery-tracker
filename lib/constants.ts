import type { Shop, Category, FamilyMember } from "@/types";

export const SHOPS: Shop[] = [
  { name: "Lidl", tag: "" },
  { name: "Asda", tag: "" },
  { name: "Arab Shop", tag: "" },
  { name: "Ethiopian Shop", tag: "" },
];

export const CATEGORIES: Category[] = [
  { emoji: "🍎", label: "Grocery" },
  { emoji: "🥩", label: "Meat" },
];

export const MEMBERS: FamilyMember[] = [
  { initial: "D", name: "David", color: "#00E5FF" },
  { initial: "M", name: "Maria", color: "#FF6B35" },
  { initial: "Y", name: "Yasmin", color: "#A78BFA" },
  { initial: "S", name: "Sam", color: "#34D399" },
];