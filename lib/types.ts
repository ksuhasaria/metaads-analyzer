// Shared typed interfaces for dashboard data (avoids implicit `any` from Prisma groupBy before client is generated)

export interface CampaignRow {
    campaignId: string;
    campaignName: string;
    spend: number;
    impressions: number;
    reach: number;
    purchases: number;
    revenue: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpm: number;
    frequency: number;
}

export interface AdSetRow {
    adSetId: string;
    adSetName: string;
    campaignId: string;
    age: string | null;
    gender: string | null;
    placement: string | null;
    spend: number;
    impressions: number;
    ctr: number;
    cpc: number;
    roas: number;
    frequency: number;
}

export interface AdRow {
    adId: string;
    adName: string;
    campaignId: string;
    adSetId: string;
    thumbnailUrl: string | null;
    spend: number;
    impressions: number;
    ctr: number;
    cpc: number;
    hookRate: number | null;
    roas: number;
    creativeScore: number | null;
}

export interface AudienceSegment {
    age: string;
    gender: string;
    spend: number;
    impressions: number;
    ctr: number;
    cpc: number;
    roas: number;
    frequency: number;
}
