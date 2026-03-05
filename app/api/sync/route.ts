import { prisma } from "@/lib/db";
import { fetchCampaignInsights, fetchAdSetInsights, fetchAdInsights } from "@/lib/meta/insights";
import { creativeScore } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function syncMeta(since: string, until: string) {
    const campaigns = await fetchCampaignInsights(since, until);
    const adsets = await fetchAdSetInsights(since, until);
    const ads = await fetchAdInsights(since, until);

    // Upsert campaigns
    for (const c of campaigns) {
        await prisma.metaCampaignInsight.upsert({
            where: { date_campaignId: { date: new Date(c.date), campaignId: c.campaignId } },
            create: {
                date: new Date(c.date),
                campaignId: c.campaignId,
                campaignName: c.campaignName,
                spend: c.spend,
                impressions: c.impressions,
                reach: c.reach,
                cpm: c.cpm,
                ctr: c.ctr,
                cpc: c.cpc,
                roas: c.roas,
                purchases: c.purchases,
                revenue: c.revenue,
                frequency: c.frequency,
            },
            update: {
                spend: c.spend,
                impressions: c.impressions,
                reach: c.reach,
                cpm: c.cpm,
                ctr: c.ctr,
                cpc: c.cpc,
                roas: c.roas,
                purchases: c.purchases,
                revenue: c.revenue,
                frequency: c.frequency,
            },
        });
    }

    // Upsert ad sets
    for (const a of adsets) {
        await prisma.metaAdSetInsight.upsert({
            where: {
                date_adSetId_age_gender_placement: {
                    date: new Date(a.date),
                    adSetId: a.adSetId,
                    age: a.age ?? "",
                    gender: a.gender ?? "",
                    placement: a.placement ?? "",
                },
            },
            create: {
                date: new Date(a.date),
                adSetId: a.adSetId,
                adSetName: a.adSetName,
                campaignId: a.campaignId,
                spend: a.spend,
                impressions: a.impressions,
                ctr: a.ctr,
                cpc: a.cpc,
                frequency: a.frequency,
                roas: a.roas,
            },
            update: { spend: a.spend, impressions: a.impressions, ctr: a.ctr, cpc: a.cpc, roas: a.roas, frequency: a.frequency },
        });
    }

    // Upsert ads with computed creative score
    for (const ad of ads) {
        const score = creativeScore(ad.ctr, ad.roas, ad.hookRate);
        await prisma.metaAdInsight.upsert({
            where: { date_adId: { date: new Date(ad.date), adId: ad.adId } },
            create: {
                date: new Date(ad.date),
                adId: ad.adId,
                adName: ad.adName,
                adSetId: ad.adSetId,
                campaignId: ad.campaignId,
                spend: ad.spend,
                impressions: ad.impressions,
                ctr: ad.ctr,
                cpc: ad.cpc,
                hookRate: ad.hookRate,
                roas: ad.roas,
                creativeScore: score,
            },
            update: { spend: ad.spend, impressions: ad.impressions, ctr: ad.ctr, cpc: ad.cpc, roas: ad.roas, hookRate: ad.hookRate, creativeScore: score },
        });
    }

    return { campaigns: campaigns.length, adsets: adsets.length, ads: ads.length };
}


export async function POST() {
    // Only pull the last 1 day of data on production by default to avoid triggering Meta API rate limits on massive datasets.
    const since = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const until = new Date().toISOString().split("T")[0];

    try {
        const results = await syncMeta(since, until);
        await prisma.syncLog.create({
            data: {
                source: "meta",
                dateRange: `${since} to ${until}`,
                status: "success",
                message: `Meta sync successful. Updated ${results.campaigns} campaigns.`,
            },
        });
        return NextResponse.json({ success: true, ...results });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        await prisma.syncLog.create({
            data: {
                source: "meta",
                dateRange: `${since} to ${until}`,
                status: "error",
                message: message,
            },
        });
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}


