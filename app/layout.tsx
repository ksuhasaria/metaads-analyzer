import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Meta Ads Dashboard",
  description: "Meta Ads Performance & Improvement Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex h-screen overflow-hidden bg-[#0a0b0f] text-[#e8eaf0]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <ChatPanel />
      </body>
    </html>
  );
}
