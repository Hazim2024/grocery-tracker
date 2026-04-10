import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TransactionProvider } from "@/context/TransactionContext";
import AppShell from "../components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AuraGrocery",
  description: "Family grocery spend tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-[#050505] text-white min-h-screen`}>
        <AuthProvider>
          <TransactionProvider>
            <AppShell>{children}</AppShell>
          </TransactionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}