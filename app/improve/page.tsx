import { prisma } from "@/lib/db";
import Badge from "@/components/Badge";
import { formatCurrency, formatRoas } from "@/lib/utils";
import { detectFatigue, budgetSignals, scoreCreatives } from "@/lib/insights/engine";

async function getImproveData() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
        const campaigns = (await prisma.metaCampaignInsight.groupBy({
            by: ["campaignId", "campaignName"],
            where: { date: { gte: since } },
            _sum: { spend: true },
            _avg: { roas: true, frequency: true, ctr: true, cpc: true },
        })) as unknown as Array<{
            campaignId: string; campaignName: string;
            _sum: { spend: number | null };
            _avg: { roas: number | null; frequency: number | null; ctr: number | null; cpc: number | null };
        }>;

        const ads = await prisma.metaAdInsight.findMany({
            where: { date: { gte: since }, spend: { gt: 10 } },
            select: { adId: true, adName: true, campaignId: true, ctr: true, roas: true, hookRate: true, spend: true, cpc: true },
        });

        const campaignList = campaigns.map((c) => ({
            campaignId: c.campaignId, campaignName: c.campaignName,
            spend: c._sum.spend ?? 0, roas: c._avg.roas ?? 0,
            frequency: c._avg.frequency ?? 0, ctr: c._avg.ctr ?? 0, cpc: c._avg.cpc ?? 0,
        }));

        const fatigued = detectFatigue(campaignList);
        const budgets = budgetSignals(campaignList);
        const scoredAds = scoreCreatives(ads.map((a: { adId: string; adName: string; campaignId: string; ctr: number; roas: number; hookRate: number | null; spend: number; cpc: number }) => ({
            adId: a.adId, adName: a.adName, campaignId: a.campaignId,
            spend: a.spend, ctr: a.ctr, cpc: a.cpc, roas: a.roas, hookRate: a.hookRate ?? 0,
        })));

        return { fatigued, budgets, scoredAds: scoredAds.slice(0, 10), campaignList };
    } catch {
        return { fatigued: [], budgets: [], scoredAds: [], campaignList: [] };
    }
}


export default async function ImprovePage() {
    const { fatigued, budgets, scoredAds } = await getImproveData();

    const scale = budgets.filter((b) => b.signal === "scale");
    const cut = budgets.filter((b) => b.signal === "cut");
    const monitor = budgets.filter((b) => b.signal === "monitor");

    const allActions: Array<{ type: string; priority: number; campaign: string; action: string; roas: number; spend: number; variant: "red" | "green" | "yellow" }> = [
        ...fatigued.map((f) => ({
            type: "Fatigue", priority: f.severity === "critical" ? 1 : 2,
            campaign: f.campaignName, action: f.action,
            roas: f.roas, spend: f.spend,
            variant: (f.severity === "critical" ? "red" : "yellow") as "red" | "yellow",
        })),
        ...cut.map((c) => ({
            type: "Cut", priority: 2,
            campaign: c.campaignName, action: c.reason,
            roas: c.roas, spend: c.spend, variant: "red" as const,
        })),
        ...scale.map((c) => ({
            type: "Scale", priority: 3,
            campaign: c.campaignName, action: c.reason,
            roas: c.roas, spend: c.spend, variant: "green" as const,
        })),
        ...monitor.map((c) => ({
            type: "Monitor", priority: 4,
            campaign: c.campaignName, action: c.reason || "No strong signal",
            roas: c.roas, spend: c.spend, variant: "yellow" as const,
        })),
    ].sort((a, b) => a.priority - b.priority);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Improvement Actions</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">Prioritized signals — what to do right now</p>
            </div>

            {/* Prioritized Action List */}
            <div className="rounded-xl border border-[#252836] bg-[#12141a] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#252836]">
                    <h2 className="text-sm font-semibold text-white">Action Queue · {allActions.length} items</h2>
                </div>
                {allActions.length === 0 ? (
                    <p className="text-[#6b7280] text-sm p-5">All clear. Sync data to see action signals.</p>
                ) : (
                    <div className="divide-y divide-[#252836]">
                        {allActions.map((a, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#1a1d26] transition-colors">
                                <span className="text-xs text-[#6b7280] w-5 text-right font-mono">{i + 1}</span>
                                <Badge
                                    label={a.type === "Fatigue" ? "⚡ Fatigue" : a.type === "Scale" ? "↑ Scale" : a.type === "Cut" ? "↓ Cut" : "👁 Monitor"}
                                    variant={a.variant}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{a.campaign}</p>
                                    <p className="text-xs text-[#6b7280] mt-0.5">{a.action}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-white">{formatRoas(a.roas)}</p>
                                    <p className="text-xs text-[#6b7280]">{formatCurrency(a.spend)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top & Bottom Creatives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                    <h2 className="text-sm font-semibold text-emerald-400 mb-3">🏆 Top Creatives to Double Down</h2>
                    <div className="space-y-2">
                        {scoredAds.filter((a) => a.tier === "top").slice(0, 5).map((a, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-[#252836] last:border-0">
                                <span className="text-white truncate max-w-[200px]">{a.adName}</span>
                                <span className="text-emerald-400 font-semibold ml-2">{a.score}/100</span>
                            </div>
                        ))}
                        {scoredAds.filter((a) => a.tier === "top").length === 0 && <p className="text-[#6b7280] text-xs">No top performers yet</p>}
                    </div>
                </div>

                <div className="rounded-xl border border-[#252836] bg-[#12141a] p-5">
                    <h2 className="text-sm font-semibold text-red-400 mb-3">🔻 Underperformers to Pause</h2>
                    <div className="space-y-2">
                        {scoredAds.filter((a) => a.tier === "underperformer").slice(0, 5).map((a, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-[#252836] last:border-0">
                                <span className="text-white truncate max-w-[200px]">{a.adName}</span>
                                <span className="text-red-400 font-semibold ml-2">{a.score}/100</span>
                            </div>
                        ))}
                        {scoredAds.filter((a) => a.tier === "underperformer").length === 0 && <p className="text-[#6b7280] text-xs">No weak creatives detected</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
