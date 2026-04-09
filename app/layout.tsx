import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
        <div className="max-w-[480px] mx-auto relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}