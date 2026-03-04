export type AttributionWindow = "1d_click" | "7d_click" | "1d_view";

export interface CampaignInsightRaw {
    campaign_id: string;
    campaign_name: string;
    spend: string;
    impressions: string;
    reach: string;
    cpm: string;
    ctr: string;
    cpc: string;
    purchase_roas: Array<{ action_type: string; value: string }>;
    actions: Array<{ action_type: string; value: string }>;
    action_values: Array<{ action_type: string; value: string }>;
    frequency: string;
    date_start: string;
    date_stop: string;
}

export interface AdSetInsightRaw {
    adset_id: string;
    adset_name: string;
    campaign_id: string;
    spend: string;
    impressions: string;
    ctr: string;
    cpc: string;
    frequency: string;
    purchase_roas: Array<{ action_type: string; value: string }>;
    date_start: string;
    date_stop: string;
}

export interface AdInsightRaw {
    ad_id: string;
    ad_name: string;
    adset_id: string;
    campaign_id: string;
    spend: string;
    impressions: string;
    ctr: string;
    cpc: string;
    purchase_roas: Array<{ action_type: string; value: string }>;
    video_3_sec_watched_actions?: Array<{ action_type: string; value: string }>;
    date_start: string;
    date_stop: string;
}

export interface NormalizedCampaignInsight {
    campaignId: string;
    campaignName: string;
    date: string;
    spend: number;
    impressions: number;
    reach: number;
    cpm: number;
    ctr: number;
    cpc: number;
    roas: number;
    purchases: number;
    revenue: number;
    frequency: number;
}

export function extractActionValue(
    actions: Array<{ action_type: string; value: string }> | undefined,
    type: string
): number {
    if (!actions) return 0;
    const found = actions.find((a) => a.action_type === type);
    return found ? parseFloat(found.value) : 0;
}

export function normalizeCampaignInsight(
    raw: CampaignInsightRaw
): NormalizedCampaignInsight {
    const roas = extractActionValue(raw.purchase_roas, "omni_purchase");
    const purchases = extractActionValue(raw.actions, "purchase");
    const revenue = extractActionValue(raw.action_values, "purchase");

    return {
        campaignId: raw.campaign_id,
        campaignName: raw.campaign_name,
        date: raw.date_start,
        spend: parseFloat(raw.spend),
        impressions: parseInt(raw.impressions),
        reach: parseInt(raw.reach),
        cpm: parseFloat(raw.cpm),
        ctr: parseFloat(raw.ctr),
        cpc: parseFloat(raw.cpc || "0"),
        roas,
        purchases,
        revenue,
        frequency: parseFloat(raw.frequency || "0"),
    };
}
