import { prisma } from "@/lib/db";
import { formatCurrency, formatPercent, formatRoas } from "@/lib/utils";
import type { AudienceSegment } from "@/lib/types";

const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDERS = ["female", "male", "unknown"];
const GENDER_LABELS: Record<string, string> = { female: "Female", male: "Male", unknown: "Other" };

async function getAudienceData(since: Date): Promise<AudienceSegment[]> {
    try {
        const breakdown = (await prisma.metaAdSetInsight.groupBy({
            by: ["age", "gender"],
            where: {
                date: { gte: since },
                age: { not: null, notIn: ["", "unknown"] },
                gender: { not: null, notIn: ["", "unknown"] }
            },
            _sum: { spend: true, impressions: true },
            _avg: { ctr: true, cpc: true, roas: true, frequency: true },
            orderBy: { _avg: { roas: "desc" } },
        })) as unknown as Array<{
            age: string | null; gender: string | null;
            _sum: { spend: number | null; impressions: number | null };
            _avg: { ctr: number | null; cpc: number | null; roas: number | null; frequency: number | null };
        }>;
        return breakdown.map((b) => ({
            age: b.age ?? "Unknown", gender: b.gender ?? "Unknown",
            spend: b._sum.spend ?? 0, impressions: b._sum.impressions ?? 0,
            ctr: b._avg.ctr ?? 0, cpc: b._avg.cpc ?? 0,
            roas: b._avg.roas ?? 0, frequency: b._avg.frequency ?? 0,
        }));
    } catch {
        return [];
    }
}

function cellBg(roas: number, maxRoas: number): string {
    if (maxRoas === 0) return "bg-[#1a1d26]";
    const intensity = roas / maxRoas;
    if (intensity >= 0.8) return "bg-emerald-500/20 border-emerald-500/40";
    if (intensity >= 0.6) return "bg-emerald-500/10 border-emerald-500/20";
    if (intensity >= 0.4) return "bg-amber-500/15 border-amber-500/25";
    if (intensity >= 0.2) return "bg-red-500/10 border-red-500/20";
    return "bg-[#1a1d26] border-[#252836]";
}

function cellText(roas: number): string {
    if (roas >= 3) return "text-emerald-400";
    if (roas >= 1.5) return "text-amber-400";
    if (roas > 0) return "text-red-400";
    return "text-[#6b7280]";
}

export default async function AudiencesPage({
    searchParams,
}: {
    searchParams: Promise<{ since?: string; until?: string }>;
}) {
    const params = await searchParams;
    const days = params.since ? Math.round((Date.now() - new Date(params.since).getTime()) / 86400000) : 30;
    const since = params.since ? new Date(params.since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const segments = await getAudienceData(since);
    const maxRoas = Math.max(...segments.map((s) => s.roas), 1);

    // Build lookup: segmentMap[age][gender] = segment
    const segmentMap: Record<string, Record<string, AudienceSegment>> = {};
    for (const s of segments) {
        const ageKey = s.age;
        const genderKey = s.gender.toLowerCase();
        if (!segmentMap[ageKey]) segmentMap[ageKey] = {};
        segmentMap[ageKey][genderKey] = s;
    }

    const ageGroups = AGE_ORDER.filter((a) => segmentMap[a]).concat(
        Object.keys(segmentMap).filter((a) => !AGE_ORDER.includes(a)).sort()
    );
    const activeGenders = GENDERS.filter((g) =>
        segments.some((s) => s.gender.toLowerCase() === g)
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Audience Intelligence</h1>
                    <p className="text-sm text-[#6b7280] mt-0.5">Last {days} days · Age &amp; Gender breakdown</p>
                </div>
            </div>

            {segments.length === 0 ? (
                <div className="rounded-xl border border-[#252836] bg-[#12141a] p-10 text-center text-[#6b7280]">
                    No audience data yet — click Sync Now in the sidebar
                </div>
            ) : (
                <>
                    {/* --- Visual Heatmap Grid --- */}
                    <div className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-semibold text-white">ROAS Heatmap — Age × Gender</h2>
                            <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/30 inline-block" />Low</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500/30 inline-block" />Mid</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/40 inline-block" />High ROAS</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div
                                className="grid gap-2 min-w-[400px]"
                                style={{
                                    gridTemplateColumns: `120px repeat(${activeGenders.length}, 1fr)`,
                                }}
                            >
                                {/* Header row */}
                                <div />
                                {activeGenders.map((g) => (
                                    <div key={g} className="text-center text-xs font-semibold text-[#6b7280] uppercase tracking-wider py-1">
                                        {GENDER_LABELS[g] ?? g}
                                    </div>
                                ))}

                                {/* Data rows */}
                                {ageGroups.map((age) => (
                                    <>
                                        {/* Age label */}
                                        <div key={`label-${age}`} className="flex items-center text-sm font-medium text-[#e8eaf0] pr-2">
                                            {age}
                                        </div>

                                        {/* Gender cells */}
                                        {activeGenders.map((gender) => {
                                            const seg = segmentMap[age]?.[gender];
                                            if (!seg) {
                                                return (
                                                    <div
                                                        key={`${age}-${gender}-empty`}
                                                        className="rounded-lg border border-[#252836] bg-[#0d0f14] p-3 flex items-center justify-center"
                                                    >
                                                        <span className="text-xs text-[#3d4051]">—</span>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div
                                                    key={`${age}-${gender}`}
                                                    title={`CTR: ${formatPercent(seg.ctr)} · CPC: ${formatCurrency(seg.cpc)} · Freq: ${seg.frequency.toFixed(1)} · Spend: ${formatCurrency(seg.spend)}`}
                                                    className={`rounded-lg border p-3 cursor-default transition-transform hover:scale-105 ${cellBg(seg.roas, maxRoas)}`}
                                                >
                                                    <p className={`text-base font-bold text-center ${cellText(seg.roas)}`}>
                                                        {seg.roas > 0 ? formatRoas(seg.roas) : "—"}
                                                    </p>
                                                    <p className="text-[10px] text-center text-[#6b7280] mt-0.5">
                                                        {formatCurrency(seg.spend)}
                                                    </p>
                                                    <p className="text-[10px] text-center text-[#6b7280]">
                                                        {formatPercent(seg.ctr)} CTR
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- Ranked Table --- */}
                    <div className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Ranked Segments · All Data</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-[#6b7280] uppercase tracking-wide border-b border-[#252836]">
                                        <th className="text-left py-2 pr-4">Age</th>
                                        <th className="text-left py-2 pr-4">Gender</th>
                                        <th className="text-right py-2 px-4">ROAS</th>
                                        <th className="text-right py-2 px-4">CTR</th>
                                        <th className="text-right py-2 px-4">CPC</th>
                                        <th className="text-right py-2 px-4">Freq.</th>
                                        <th className="text-right py-2 px-4">Spend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#252836]">
                                    {segments.map((s, i) => (
                                        <tr key={i} className="hover:bg-[#1a1d26] transition-colors">
                                            <td className="py-2.5 pr-4 font-medium text-white">{s.age}</td>
                                            <td className="py-2.5 pr-4 text-[#6b7280] capitalize">{s.gender}</td>
                                            <td className={`py-2.5 px-4 text-right font-bold ${cellText(s.roas)}`}>{formatRoas(s.roas)}</td>
                                            <td className="py-2.5 px-4 text-right text-[#e8eaf0]">{formatPercent(s.ctr)}</td>
                                            <td className="py-2.5 px-4 text-right text-[#e8eaf0]">{formatCurrency(s.cpc)}</td>
                                            <td className={`py-2.5 px-4 text-right ${s.frequency >= 4 ? "text-red-400" : s.frequency >= 3 ? "text-amber-400" : "text-[#e8eaf0]"}`}>
                                                {s.frequency.toFixed(1)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right text-[#6b7280]">{formatCurrency(s.spend)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
