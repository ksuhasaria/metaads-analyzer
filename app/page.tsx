import { prisma } from "@/lib/db";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { formatCurrency, formatNumber, formatRoas, formatPercent, campaignHealthStatus } from "@/lib/utils";
import { detectFatigue, budgetSignals } from "@/lib/insights/engine";
import { AlertTriangle, TrendingUp, DollarSign, Target, Zap } from "lucide-react";

async function getOverviewData() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const campaigns = (await prisma.metaCampaignInsight.groupBy({
      by: ["campaignId", "campaignName"],
      where: { date: { gte: since } },
      _sum: { spend: true, impressions: true, reach: true, purchases: true, revenue: true },
      _avg: { roas: true, ctr: true, cpc: true, frequency: true },
    })) as unknown as Array<{
      campaignId: string; campaignName: string;
      _sum: { spend: number | null; impressions: number | null; reach: number | null; purchases: number | null; revenue: number | null };
      _avg: { roas: number | null; ctr: number | null; cpc: number | null; frequency: number | null };
    }>;

    const totalSpend = campaigns.reduce((s, c) => s + (c._sum.spend ?? 0), 0);
    const totalRevenue = campaigns.reduce((s, c) => s + (c._sum.revenue ?? 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c._sum.impressions ?? 0), 0);
    const totalPurchases = campaigns.reduce((s, c) => s + (c._sum.purchases ?? 0), 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const campaignList = campaigns.map((c) => ({
      campaignId: c.campaignId, campaignName: c.campaignName,
      spend: c._sum.spend ?? 0, impressions: c._sum.impressions ?? 0,
      roas: c._avg.roas ?? 0, frequency: c._avg.frequency ?? 0,
      ctr: c._avg.ctr ?? 0, cpc: c._avg.cpc ?? 0,
    }));

    const fatigued = detectFatigue(campaignList);
    const budgets = budgetSignals(campaignList);

    const topCreative = await prisma.metaAdInsight.findFirst({
      where: { date: { gte: since }, spend: { gt: 10 } },
      orderBy: { creativeScore: "desc" },
    });

    const lastSync = await prisma.syncLog.findFirst({ orderBy: { syncedAt: "desc" } });
    return {
      totalSpend, totalRevenue, avgRoas, totalImpressions, totalPurchases,
      campaignList, fatigued, budgets, topCreative, lastSync
    };
  } catch (err) {
    console.error("Overview data error:", err);
    return {
      totalSpend: 0, totalRevenue: 0, avgRoas: 0, totalImpressions: 0, totalPurchases: 0,
      campaignList: [], fatigued: [], budgets: [], topCreative: null, lastSync: null
    };
  }
}


export default async function CommandCenter() {
  const data = await getOverviewData();
  const scaleCandidates = data.budgets.filter((b) => b.signal === "scale");
  const cutCandidates = data.budgets.filter((b) => b.signal === "cut");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Last 30 days · Last sync: {data.lastSync ? new Date(data.lastSync.syncedAt).toLocaleString() : "Never"}</p>
        </div>
        {data.fatigued.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {data.fatigued.length} campaign{data.fatigued.length > 1 ? "s" : ""} fatigued
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spend" value={formatCurrency(data.totalSpend)} subtext="Last 30 days" color="default" />
        <StatCard title="Revenue (Meta)" value={formatCurrency(data.totalRevenue)} subtext="Reported conversions" color="green" />
        <StatCard title="ROAS" value={formatRoas(data.avgRoas)} subtext="Meta reported" color={data.avgRoas >= 3 ? "green" : data.avgRoas >= 1.5 ? "yellow" : "red"} />
        <StatCard title="Purchases" value={formatNumber(data.totalPurchases)} subtext={`${formatNumber(data.totalImpressions)} impressions`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fatigue Alerts */}
        <div className="lg:col-span-1 rounded-xl border border-[#252836] bg-[#12141a] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Ad Fatigue Alerts</h2>
          </div>
          {data.fatigued.length === 0 ? (
            <p className="text-sm text-[#6b7280]">No fatigued campaigns 🎉</p>
          ) : (
            <div className="space-y-3">
              {data.fatigued.slice(0, 5).map((c) => (
                <div key={c.campaignId} className="flex flex-col gap-1 p-3 rounded-lg bg-[#1a1d26]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">{c.campaignName}</span>
                    <Badge label={c.severity === "critical" ? "Critical" : "Warning"} variant={c.severity === "critical" ? "red" : "yellow"} />
                  </div>
                  <p className="text-xs text-[#6b7280]">Frequency: {c.frequency.toFixed(1)} · {c.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scale / Cut Signals */}
        <div className="lg:col-span-1 rounded-xl border border-[#252836] bg-[#12141a] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Budget Signals</h2>
          </div>
          {scaleCandidates.length === 0 && cutCandidates.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Budget allocation looks balanced.</p>
          ) : (
            <div className="space-y-3">
              {[...scaleCandidates, ...cutCandidates].slice(0, 6).map((c) => (
                <div key={c.campaignId} className="flex flex-col gap-1 p-3 rounded-lg bg-[#1a1d26]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">{c.campaignName}</span>
                    <Badge label={c.signal === "scale" ? "↑ Scale" : "↓ Cut"} variant={c.signal === "scale" ? "green" : "red"} />
                  </div>
                  <p className="text-xs text-[#6b7280]">{c.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Creative */}
        <div className="lg:col-span-1 rounded-xl border border-[#252836] bg-[#12141a] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Top Creative (30d)</h2>
          </div>
          {!data.topCreative ? (
            <p className="text-sm text-[#6b7280]">No creative data yet. Sync to load.</p>
          ) : (
            <div className="space-y-3">
              {data.topCreative.thumbnailUrl && (
                <img src={data.topCreative.thumbnailUrl} alt="Top ad" className="w-full h-32 object-cover rounded-lg" />
              )}
              <p className="text-sm font-medium text-white truncate">{data.topCreative.adName}</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-[#6b7280]">
                <div><span className="block text-white font-semibold">{formatPercent(data.topCreative.ctr)}</span>CTR</div>
                <div><span className="block text-white font-semibold">{formatRoas(data.topCreative.roas)}</span>ROAS</div>
                <div><span className="block text-white font-semibold">{data.topCreative.creativeScore ?? "-"}</span>Score</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Table */}
      <div className="rounded-xl border border-[#252836] bg-[#12141a] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#252836]">
          <h2 className="text-sm font-semibold text-white">All Campaigns · 30d Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252836] text-xs text-[#6b7280] uppercase tracking-wide">
                <th className="text-left px-5 py-3">Campaign</th>
                <th className="text-right px-4 py-3">Spend</th>
                <th className="text-right px-4 py-3">CTR</th>
                <th className="text-right px-4 py-3">CPC</th>
                <th className="text-right px-4 py-3">ROAS</th>
                <th className="text-right px-4 py-3">Freq.</th>
                <th className="text-right px-4 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252836]">
              {data.campaignList.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-[#6b7280]">No data — click Sync Now to load campaigns</td></tr>
              )}
              {data.campaignList.map((c: any) => {
                const health = campaignHealthStatus(c.roas, c.frequency);
                return (
                  <tr key={c.campaignId} className="hover:bg-[#1a1d26] transition-colors">
                    <td className="px-5 py-3 font-medium text-white max-w-[220px] truncate">{c.campaignName}</td>
                    <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatCurrency(c.spend)}</td>
                    <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatPercent(c.ctr)}</td>
                    <td className="px-4 py-3 text-right text-[#e8eaf0]">{formatCurrency(c.cpc)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRoas(c.roas)}</td>
                    <td className="px-4 py-3 text-right">{c.frequency.toFixed(1)}</td>
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
