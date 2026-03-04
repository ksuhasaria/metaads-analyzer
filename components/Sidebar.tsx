"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Megaphone,
    Palette,
    Users,
    Zap,
    Settings,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
    { label: "Command Center", href: "/", icon: LayoutDashboard },
    { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    { label: "Creative Lab", href: "/creatives", icon: Palette },
    { label: "Audiences", href: "/audiences", icon: Users },
    { label: "Improve", href: "/improve", icon: Zap },
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-60 flex-shrink-0 bg-[#12141a] border-r border-[#252836] flex flex-col">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-[#252836]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white leading-tight">Meta Ads</p>
                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {nav.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                active
                                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                                    : "text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1a1d26]"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", active ? "text-indigo-400" : "")} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Sync button */}
            <div className="px-3 py-4 border-t border-[#252836]">
                <SyncButton />
            </div>
        </aside>
    );
}

function SyncButton() {
    async function handleSync() {
        await fetch("/api/sync", { method: "POST" });
        window.location.reload();
    }

    return (
        <button
            onClick={handleSync}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-white hover:bg-[#1a1d26] transition-all border border-[#252836] hover:border-indigo-500/40"
        >
            <Zap className="w-4 h-4" />
            Sync Now
        </button>
    );
}
