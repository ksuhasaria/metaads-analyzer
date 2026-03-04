import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    subtext?: string;
    trend?: number; // positive = up, negative = down
    color?: "default" | "green" | "yellow" | "red" | "blue" | "indigo";
    className?: string;
}

const colorMap = {
    default: "border-[#252836]",
    green: "border-emerald-500/30 bg-emerald-500/5",
    yellow: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    indigo: "border-indigo-500/30 bg-indigo-500/5",
};

const trendColor = (t: number) => (t >= 0 ? "text-emerald-400" : "text-red-400");

export default function StatCard({ title, value, subtext, trend, color = "default", className }: StatCardProps) {
    return (
        <div className={cn(
            "rounded-xl border bg-[#12141a] p-5 transition-all hover:border-indigo-500/30 hover:bg-[#1a1d26]",
            colorMap[color],
            className
        )}>
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">{title}</p>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            {(subtext || trend !== undefined) && (
                <div className="mt-2 flex items-center gap-2">
                    {trend !== undefined && (
                        <span className={cn("text-xs font-medium", trendColor(trend))}>
                            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                        </span>
                    )}
                    {subtext && <span className="text-xs text-[#6b7280]">{subtext}</span>}
                </div>
            )}
        </div>
    );
}
