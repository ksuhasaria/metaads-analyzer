"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PRESETS = [
    { label: "Today", days: 0 },
    { label: "7d", days: 7 },
    { label: "14d", days: 14 },
    { label: "30d", days: 30 },
    { label: "60d", days: 60 },
    { label: "90d", days: 90 },
];

function toDateStr(date: Date) {
    return date.toISOString().split("T")[0];
}

export default function DateRangePicker() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentSince = searchParams.get("since");

    const activeDays = (() => {
        if (!currentSince) return 30;
        const diff = Math.round((Date.now() - new Date(currentSince).getTime()) / 86400000);
        return diff;
    })();

    const applyPreset = useCallback(
        (days: number) => {
            const params = new URLSearchParams(searchParams.toString());
            if (days === 0) {
                const today = toDateStr(new Date());
                params.set("since", today);
                params.set("until", today);
            } else {
                params.set("since", toDateStr(new Date(Date.now() - days * 86400000)));
                params.set("until", toDateStr(new Date()));
            }
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="flex items-center gap-1 bg-[#0d0f14] border border-[#252836] rounded-lg p-1">
            {PRESETS.map((p) => {
                const isActive = p.days === 0 ? activeDays === 0 : activeDays === p.days;
                return (
                    <button
                        key={p.label}
                        onClick={() => applyPreset(p.days)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isActive
                                ? "bg-indigo-600 text-white shadow"
                                : "text-[#6b7280] hover:text-white hover:bg-[#1a1d26]"
                            }`}
                    >
                        {p.label}
                    </button>
                );
            })}
        </div>
    );
}
