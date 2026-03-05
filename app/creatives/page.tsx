import { prisma } from "@/lib/db";
import Badge from "@/components/Badge";
import DateRangePicker from "@/components/DateRangePicker";
import { formatCurrency, formatPercent, formatRoas } from "@/lib/utils";
import { Suspense } from "react";

type CreativeRow = {
    adId: string; adName: string; campaignId: string; thumbnailUrl: string | null;
    _sum: { spend: number | null; impressions: number | null };
    _avg: { ctr: number | null; cpc: number | null; roas: number | null; hookRate: number | null; creativeScore: number | null };
};

async function getCreatives(since: Date, until: Date): Promise<CreativeRow[]> {
    try {
        return await (prisma.metaAdInsight.groupBy({
            by: ["adId", "adName", "campaignId", "thumbnailUrl"],
            where: { date: { gte: since, lte: until }, spend: { gt: 0 } },
            _sum: { spend: true, impressions: true },
            _avg: { ctr: true, cpc: true, roas: true, hookRate: true, creativeScore: true },
            orderBy: { _avg: { creativeScore: "desc" } },
            take: 50,
        }) as unknown as Promise<CreativeRow[]>);
    } catch {
        return [];
    }
}




function tierBadge(score: number): { label: string; variant: "green" | "yellow" | "red" } {
    if (score >= 65) return { label: "🏆 Top", variant: "green" };
    if (score >= 35) return { label: "Average", variant: "yellow" };
    return { label: "Weak", variant: "red" };
}

export default async function CreativesPage({
    searchParams,
}: {
    searchParams: Promise<{ since?: string; until?: string }>;
}) {
    const params = await searchParams;
    const since = params.since ? new Date(params.since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until = params.until ? new Date(params.until) : new Date();
    const days = Math.round((until.getTime() - since.getTime()) / 86400000) || 30;
    const creatives = await getCreatives(since, until);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Creative Lab</h1>
                    <p className="text-sm text-[#6b7280] mt-0.5">Last {days} days · Ranked by Creative Score</p>
                </div>
                <Suspense>
                    <DateRangePicker />
                </Suspense>
            </div>

            {creatives.length === 0 ? (
                <div className="rounded-xl border border-[#252836] bg-[#12141a] p-10 text-center text-[#6b7280]">
                    No creative data yet — click Sync Now in the sidebar
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {creatives.map((ad, idx) => {
                        const score = Math.round(ad._avg.creativeScore ?? 0);
                        const tier = tierBadge(score);
                        const hookRate = ad._avg.hookRate ?? 0;

                        return (
                            <div key={`${ad.adId}-${idx}`} className="rounded-xl border border-[#252836] bg-[#12141a] overflow-hidden hover:border-indigo-500/30 transition-colors">
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-[#1a1d26] flex items-center justify-center">
                                    {ad.thumbnailUrl ? (
                                        <img src={ad.thumbnailUrl} alt={ad.adName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[#6b7280] text-xs">No preview</span>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge label={tier.label} variant={tier.variant} />
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-white text-sm font-bold">
                                        {score}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4 space-y-3">
                                    <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{ad.adName}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg bg-[#1a1d26] p-2">
                                            <span className="block text-[#6b7280]">CTR</span>
                                            <span className="font-semibold text-white">{formatPercent(ad._avg.ctr ?? 0)}</span>
                                        </div>
                                        <div className="rounded-lg bg-[#1a1d26] p-2">
                                            <span className="block text-[#6b7280]">ROAS</span>
                                            <span className="font-semibold text-white">{formatRoas(ad._avg.roas ?? 0)}</span>
                                        </div>
                                        <div className="rounded-lg bg-[#1a1d26] p-2">
                                            <span className="block text-[#6b7280]">CPC</span>
                                            <span className="font-semibold text-white">{formatCurrency(ad._avg.cpc ?? 0)}</span>
                                        </div>
                                        <div className="rounded-lg bg-[#1a1d26] p-2">
                                            <span className="block text-[#6b7280]">Hook Rate</span>
                                            <span className="font-semibold text-white">
                                                {hookRate > 0 ? formatPercent(hookRate * 100) : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#6b7280]">Spend: {formatCurrency(ad._sum.spend ?? 0)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
