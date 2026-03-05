import { prisma } from "@/lib/db";
import Badge from "@/components/Badge";
import DateRangePicker from "@/components/DateRangePicker";
import StatusFilter from "@/components/StatusFilter";
import { formatCurrency, formatNumber, formatRoas, formatPercent, campaignHealthStatus } from "@/lib/utils";
import type { CampaignRow } from "@/lib/types";
import { Suspense } from "react";


async function getCampaigns(since: Date, until: Date, status?: string): Promise<CampaignRow[]> {
    try {
        const where: Record<string, unknown> = { date: { gte: since, lte: until } };
        if (status && status !== "all") {
            where.status = status;
        }
        const campaigns = (await prisma.metaCampaignInsight.groupBy({
            by: ["campaignId", "campaignName"],
            where,
            _sum: { spend: true, impressions: true, reach: true, purchases: true, revenue: true },
            _avg: { roas: true, ctr: true, cpc: true, cpm: true, frequency: true },
        })) as unknown as Array<{
            campaignId: string; campaignName: string;
            _sum: { spend: number | null; impressions: number | null; reach: number | null; purchases: number | null; revenue: number | null };
            _avg: { roas: number | null; ctr: number | null; cpc: number | null; cpm: number | null; frequency: number | null };
        }>;
        return campaigns.map((c) => ({
            campaignId: c.campaignId, campaignName: c.campaignName,
            spend: c._sum.spend ?? 0, impressions: c._sum.impressions ?? 0,
            reach: c._sum.reach ?? 0, purchases: c._sum.purchases ?? 0,
            revenue: c._sum.revenue ?? 0, roas: c._avg.roas ?? 0,
            ctr: c._avg.ctr ?? 0, cpc: c._avg.cpc ?? 0, cpm: c._avg.cpm ?? 0,
            frequency: c._avg.frequency ?? 0,
        })).sort((a, b) => b.spend - a.spend);
    } catch {
        return [];
    }
}


export default async function CampaignsPage({
    searchParams,
}: {
    searchParams: Promise<{ since?: string; until?: string; status?: string }>;
}) {
    const params = await searchParams;
    const since = params.since ? new Date(params.since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until = params.until ? new Date(params.until) : new Date();
    const days = Math.round((until.getTime() - since.getTime()) / 86400000) || 30;
    const statusFilter = params.status ?? "all";
    const campaigns = await getCampaigns(since, until, statusFilter);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Campaign Analysis</h1>
                    <p className="text-sm text-[#6b7280] mt-0.5">Last {days} days · {statusFilter === "all" ? "All campaigns" : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} only`}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Suspense>
                        <StatusFilter />
                    </Suspense>
                    <Suspense>
                        <DateRangePicker />
                    </Suspense>
                </div>
            </div>

            <div className="rounded-xl border border-[#252836] bg-[#12141a] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#252836] text-xs text-[#6b7280] uppercase tracking-wide">
                                <th className="text-left px-5 py-3">Campaign</th>
                                <th className="text-right px-4 py-3">Spend</th>
                                <th className="text-right px-4 py-3">Reach</th>
                                <th className="text-right px-4 py-3">Impressions</th>
                                <th className="text-right px-4 py-3">CPM</th>
                                <th className="text-right px-4 py-3">CTR</th>
                                <th className="text-right px-4 py-3">CPC</th>
                                <th className="text-right px-4 py-3">ROAS</th>
                                <th className="text-right px-4 py-3">Freq.</th>
                                <th className="text-right px-4 py-3">Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#252836]">
                            {campaigns.length === 0 && (
                                <tr><td colSpan={10} className="text-center py-10 text-[#6b7280]">No campaign data — click Sync Now in the sidebar</td></tr>
                            )}
                            {campaigns.map((c) => {
                                const health = campaignHealthStatus(c.roas, c.frequency);
                                return (
                                    <tr key={c.campaignId} className="hover:bg-[#1a1d26] transition-colors">
                                        <td className="px-5 py-3 font-medium text-white max-w-[220px]">
                                            <div className="truncate">{c.campaignName}</div>
                                            <div className="text-xs text-[#6b7280] font-normal">{formatNumber(c.purchases)} purchases</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatCurrency(c.spend)}</td>
                                        <td className="px-4 py-3 text-right text-[#6b7280]">{formatNumber(c.reach)}</td>
                                        <td className="px-4 py-3 text-right text-[#6b7280]">{formatNumber(c.impressions)}</td>
                                        <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatCurrency(c.cpm)}</td>
                                        <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatPercent(c.ctr)}</td>
                                        <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatCurrency(c.cpc)}</td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            <span className={c.roas >= 3 ? "text-emerald-400" : c.roas >= 1.5 ? "text-amber-400" : "text-red-400"}>
                                                {formatRoas(c.roas)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={c.frequency >= 4 ? "text-red-400" : c.frequency >= 3 ? "text-amber-400" : "text-[#e8eaf0]"}>
                                                {c.frequency.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge
                                                label={health.label}
                                                variant={health.color === "green" ? "green" : health.color === "yellow" ? "yellow" : "red"}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
