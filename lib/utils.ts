import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}

export function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}

export function formatRoas(value: number): string {
    return `${value.toFixed(2)}x`;
}

export function getDateRange(preset: "7d" | "14d" | "30d" | "90d"): {
    since: string;
    until: string;
} {
    const until = new Date();
    const since = new Date();
    const days = parseInt(preset.replace("d", ""));
    since.setDate(until.getDate() - days);

    return {
        since: since.toISOString().split("T")[0],
        until: until.toISOString().split("T")[0],
    };
}

export function campaignHealthStatus(roas: number, frequency: number): {
    label: string;
    color: "green" | "yellow" | "red";
} {
    if (frequency > 4 || roas < 1)
        return { label: "Intervention Needed", color: "red" };
    if (frequency > 3 || roas < 2)
        return { label: "Monitor", color: "yellow" };
    return { label: "Scaling", color: "green" };
}

export function creativeScore(ctr: number, roas: number, hookRate = 0): number {
    // Weighted composite: CTR 40%, ROAS 40%, Hook rate 20%
    const ctrScore = Math.min(ctr / 5, 1) * 40;        // 5% CTR = perfect
    const roasScore = Math.min(roas / 4, 1) * 40;      // 4x ROAS = perfect
    const hookScore = Math.min(hookRate / 0.3, 1) * 20; // 30% hook = perfect
    return Math.round(ctrScore + roasScore + hookScore);
}
