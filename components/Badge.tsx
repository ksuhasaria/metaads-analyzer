import { cn } from "@/lib/utils";

interface BadgeProps {
    label: string;
    variant: "green" | "yellow" | "red" | "indigo" | "blue" | "gray";
    className?: string;
}

const variantMap = {
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    yellow: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    red: "bg-red-500/15 text-red-400 border border-red-500/25",
    indigo: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
    blue: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    gray: "bg-[#1a1d26] text-[#6b7280] border border-[#252836]",
};

export default function Badge({ label, variant, className }: BadgeProps) {
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", variantMap[variant], className)}>
            {label}
        </span>
    );
}
