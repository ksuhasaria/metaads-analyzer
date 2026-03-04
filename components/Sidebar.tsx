"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Megaphone,
    Palette,
    Users,
    Zap,
    Settings,
    TrendingUp,
    RefreshCw,
    Check,
    AlertCircle
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
    const [isSyncing, setIsSyncing] = useState(false);
    const [status, setStatus] = useState<"idle" | "syncing" | "success" | "cooldown" | "error">("idle");
    const [cooldownSecs, setCooldownSecs] = useState(0);
    const router = useRouter();

    const COOLDOWN_MINUTES = 5;

    useEffect(() => {
        const lastSync = localStorage.getItem("lastSyncTime");
        if (lastSync) {
            const elapsed = Date.now() - parseInt(lastSync);
            const remaining = Math.max(0, COOLDOWN_MINUTES * 60 * 1000 - elapsed);
            if (remaining > 0) {
                setCooldownSecs(Math.ceil(remaining / 1000));
                setStatus("cooldown");
            }
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldownSecs > 0) {
            timer = setInterval(() => {
                setCooldownSecs((prev) => {
                    if (prev <= 1) {
                        setStatus("idle");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldownSecs]);

    async function handleSync() {
        if (status !== "idle" && status !== "success" && status !== "error") return;

        setIsSyncing(true);
        setStatus("syncing");

        try {
            const res = await fetch("/api/sync", { method: "POST" });
            if (!res.ok) throw new Error("Sync failed");

            localStorage.setItem("lastSyncTime", Date.now().toString());
            setStatus("success");
            setCooldownSecs(COOLDOWN_MINUTES * 60);

            setTimeout(() => {
                router.refresh();
            }, 500);
        } catch (err) {
            console.error(err);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        } finally {
            setIsSyncing(false);
        }
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleSync}
                disabled={status === "syncing" || status === "cooldown"}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 border shadow-sm",
                    status === "syncing" && "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 cursor-wait",
                    status === "success" && "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
                    status === "cooldown" && "bg-[#1a1d26] border-[#252836] text-[#4b5563] cursor-not-allowed",
                    status === "error" && "bg-red-500/10 border-red-500/40 text-red-400",
                    status === "idle" && "bg-[#1a1d26] border-[#252836] text-[#e8eaf0] hover:bg-[#252836] hover:border-indigo-500/40 hover:text-white"
                )}
            >
                {status === "syncing" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : status === "success" ? (
                    <Check className="w-4 h-4" />
                ) : status === "cooldown" ? (
                    <Zap className="w-4 h-4" />
                ) : (
                    <Zap className="w-4 h-4" />
                )}

                {status === "syncing" ? "Syncing..." :
                    status === "success" ? "Done!" :
                        status === "cooldown" ? `Cooldown (${formatTime(cooldownSecs)})` :
                            status === "error" ? "Failed" :
                                "Sync Now"}
            </button>

            {status === "syncing" && (
                <p className="text-[10px] text-center text-indigo-400/80 animate-pulse font-medium uppercase tracking-wider">
                    UPDATING META INSIGHTS...
                </p>
            )}
            {status === "error" && (
                <p className="text-[10px] text-center text-red-400 font-medium flex items-center justify-center gap-1 uppercase tracking-wider">
                    <AlertCircle className="w-2.5 h-2.5" /> Rate limit or API error
                </p>
            )}
        </div>
    );
}
