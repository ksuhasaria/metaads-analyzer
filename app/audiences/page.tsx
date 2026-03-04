import { prisma } from "@/lib/db";
import { formatCurrency, formatPercent, formatRoas } from "@/lib/utils";
import type { AudienceSegment } from "@/lib/types";


async function getAudienceData(): Promise<AudienceSegment[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
        const breakdown = (await prisma.metaAdSetInsight.groupBy({
            by: ["age", "gender"],
            where: { date: { gte: since }, age: { not: null }, gender: { not: null } },
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



export default async function AudiencesPage() {
    const segments = await getAudienceData();
    const maxRoas = Math.max(...segments.map((s) => s.roas), 1);

    const femaleSegments = segments.filter((s) => s.gender?.toLowerCase() === "female");
    const maleSegments = segments.filter((s) => s.gender?.toLowerCase() === "male");

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Audience Intelligence</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">Last 30 days · Age & Gender breakdown</p>
            </div>

            {segments.length === 0 ? (
                <div className="rounded-xl border border-[#252836] bg-[#12141a] p-10 text-center text-[#6b7280]">
                    No audience data yet — click Sync Now in the sidebar
                </div>
            ) : (
                <>
                    {/* Heatmap */}
                    <div className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">ROAS Heatmap — Age × Gender</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-[#6b7280] uppercase tracking-wide border-b border-[#252836]">
                                        <th className="text-left py-2 pr-4">Age Group</th>
                                        <th className="text-left py-2 pr-4">Gender</th>
                                        <th className="text-right py-2 px-4">ROAS</th>
                                        <th className="text-right py-2 px-4">CTR</th>
                                        <th className="text-right py-2 px-4">CPC</th>
                                        <th className="text-right py-2 px-4">Freq.</th>
                                        <th className="text-right py-2 px-4">Spend</th>
                                        <th className="py-2 px-4">ROAS Bar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#252836]">
                                    {segments.map((s, i) => {
                                        const roasPct = maxRoas > 0 ? (s.roas / maxRoas) * 100 : 0;
                                        const roasColor = s.roas >= 3 ? "bg-emerald-500" : s.roas >= 1.5 ? "bg-amber-500" : "bg-red-500";
                                        return (
                                            <tr key={i} className="hover:bg-[#1a1d26] transition-colors">
                                                <td className="py-2.5 pr-4 font-medium text-white">{s.age}</td>
                                                <td className="py-2.5 pr-4 text-[#6b7280] capitalize">{s.gender}</td>
                                                <td className={`py-2.5 px-4 text-right font-bold ${s.roas >= 3 ? "text-emerald-400" : s.roas >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                                                    {formatRoas(s.roas)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-[#e8eaf0]">{formatPercent(s.ctr)}</td>
                                                <td className="py-2.5 px-4 text-right text-[#e8eaf0]">{formatCurrency(s.cpc)}</td>
                                                <td className={`py-2.5 px-4 text-right ${s.frequency >= 4 ? "text-red-400" : s.frequency >= 3 ? "text-amber-400" : "text-[#e8eaf0]"}`}>
                                                    {s.frequency.toFixed(1)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-[#6b7280]">{formatCurrency(s.spend)}</td>
                                                <td className="py-2.5 px-4">
                                                    <div className="w-24 h-2 rounded-full bg-[#252836]">
                                                        <div className={`h-2 rounded-full ${roasColor}`} style={{ width: `${roasPct}%` }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Side by side gender summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ label: "Female", data: femaleSegments, color: "text-pink-400" }, { label: "Male", data: maleSegments, color: "text-blue-400" }].map(({ label, data, color }) => (
                            <div key={label} className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                                <h2 className={`text-sm font-semibold mb-3 ${color}`}>{label} Segments</h2>
                                <div className="space-y-2">
                                    {data.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-[#252836] last:border-0">
                                            <span className="text-[#6b7280]">{s.age}</span>
                                            <span className={`font-semibold ${s.roas >= 3 ? "text-emerald-400" : s.roas >= 1.5 ? "text-amber-400" : "text-red-400"}`}>{formatRoas(s.roas)}</span>
                                        </div>
                                    ))}
                                    {data.length === 0 && <p className="text-[#6b7280] text-xs">No data</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
