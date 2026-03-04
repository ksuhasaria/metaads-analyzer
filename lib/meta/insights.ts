import { metaFetchAll, AD_ACCOUNT_ID } from "./client";
import {
    CampaignInsightRaw,
    AdSetInsightRaw,
    AdInsightRaw,
    normalizeCampaignInsight,
    extractActionValue,
} from "./types";

const CAMPAIGN_FIELDS = [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "reach",
    "cpm",
    "ctr",
    "cpc",
    "frequency",
    "purchase_roas",
    "actions",
    "action_values",
].join(",");

const ADSET_FIELDS = [
    "adset_id",
    "adset_name",
    "campaign_id",
    "spend",
    "impressions",
    "ctr",
    "cpc",
    "frequency",
    "purchase_roas",
].join(",");

const AD_FIELDS = [
    "ad_id",
    "ad_name",
    "adset_id",
    "campaign_id",
    "spend",
    "impressions",
    "ctr",
    "cpc",
    "purchase_roas",
    "video_play_actions",
    "video_thruplay_watched_actions",
].join(",");

export async function fetchCampaignInsights(since: string, until: string) {
    const raw = await metaFetchAll<{ data: CampaignInsightRaw[]; paging?: { next?: string } }>(
        `/${AD_ACCOUNT_ID}/insights`,
        {
            level: "campaign",
            fields: CAMPAIGN_FIELDS,
            time_range: JSON.stringify({ since, until }),
            time_increment: "1",
            action_attribution_windows: '["1d_click","7d_click","1d_view"]',
            limit: "500",
        }
    );

    return (raw as CampaignInsightRaw[]).map(normalizeCampaignInsight);
}

export async function fetchAdSetInsights(since: string, until: string) {
    const raw = await metaFetchAll<{ data: (AdSetInsightRaw & { age?: string; gender?: string; publisher_platform?: string })[]; paging?: { next?: string } }>(
        `/${AD_ACCOUNT_ID}/insights`,
        {
            level: "adset",
            fields: ADSET_FIELDS,
            time_range: JSON.stringify({ since, until }),
            time_increment: "1",
            breakdowns: "age,gender",
            limit: "500",
        }
    );

    return (raw as (AdSetInsightRaw & { age?: string; gender?: string; publisher_platform?: string })[]).map((r) => ({
        adSetId: r.adset_id,
        adSetName: r.adset_name,
        campaignId: r.campaign_id,
        date: r.date_start,
        age: r.age ?? null,
        gender: r.gender ?? null,
        placement: r.publisher_platform ?? null,
        spend: parseFloat(r.spend),
        impressions: parseInt(r.impressions),
        ctr: parseFloat(r.ctr),
        cpc: parseFloat(r.cpc || "0"),
        frequency: parseFloat(r.frequency || "0"),
        roas: extractActionValue(r.purchase_roas, "omni_purchase"),
    }));
}

export async function fetchAdInsights(since: string, until: string) {
    const raw = await metaFetchAll<{ data: AdInsightRaw[]; paging?: { next?: string } }>(
        `/${AD_ACCOUNT_ID}/insights`,
        {
            level: "ad",
            fields: AD_FIELDS,
            time_range: JSON.stringify({ since, until }),
            time_increment: "1",
            limit: "500",
        }
    );

    return (raw as AdInsightRaw[]).map((r) => {
        const impressions = parseInt(r.impressions);
        // Hook rate = video plays / impressions (3-sec play proxy)
        const videoPlays = extractActionValue(
            (r as AdInsightRaw & { video_play_actions?: Array<{ action_type: string; value: string }> }).video_play_actions,
            "video_view"
        );
        const hookRate = impressions > 0 ? videoPlays / impressions : 0;

        return {
            adId: r.ad_id,
            adName: r.ad_name,
            adSetId: r.adset_id,
            campaignId: r.campaign_id,
            date: r.date_start,
            spend: parseFloat(r.spend),
            impressions,
            ctr: parseFloat(r.ctr),
            cpc: parseFloat(r.cpc || "0"),
            roas: extractActionValue(r.purchase_roas, "omni_purchase"),
            hookRate,
        };
    });
}

export async function fetchPlacementInsights(since: string, until: string) {
    const raw = await metaFetchAll<{ data: AdSetInsightRaw[]; paging?: { next?: string } }>(
        `/${AD_ACCOUNT_ID}/insights`,
        {
            level: "adset",
            fields: "adset_id,adset_name,campaign_id,spend,impressions,ctr,cpc,purchase_roas,frequency",
            time_range: JSON.stringify({ since, until }),
            breakdowns: "publisher_platform,platform_position",
            limit: "500",
        }
    );
    return raw;
}
