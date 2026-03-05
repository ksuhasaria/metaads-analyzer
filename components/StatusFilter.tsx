"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type StatusOption = "all" | "ACTIVE" | "PAUSED";

const OPTIONS: { value: StatusOption; label: string }[] = [
    { value: "all", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
];

export default function StatusFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const current = (searchParams.get("status") ?? "all") as StatusOption;

    const apply = useCallback(
        (val: StatusOption) => {
            const params = new URLSearchParams(searchParams.toString());
            if (val === "all") {
                params.delete("status");
            } else {
                params.set("status", val);
            }
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="flex items-center gap-1 bg-[#0d0f14] border border-[#252836] rounded-lg p-1">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => apply(opt.value)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${current === opt.value
                            ? opt.value === "ACTIVE"
                                ? "bg-emerald-600 text-white shadow"
                                : opt.value === "PAUSED"
                                    ? "bg-amber-600 text-white shadow"
                                    : "bg-indigo-600 text-white shadow"
                            : "text-[#6b7280] hover:text-white hover:bg-[#1a1d26]"
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
