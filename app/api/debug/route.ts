import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const campaignCount = await prisma.metaCampaignInsight.count();
        const adsetCount = await prisma.metaAdSetInsight.count();
        const adInsightCount = await prisma.metaAdInsight.count();
        const adsetSample = await prisma.metaAdSetInsight.findFirst();
        const syncLogCount = await prisma.syncLog.count();
        const lastSync = await prisma.syncLog.findFirst({ orderBy: { syncedAt: "desc" } });

        return NextResponse.json({
            success: true,
            counts: {
                campaigns: campaignCount,
                adsets: adsetCount,
                ads: adInsightCount,
                syncLogs: syncLogCount,
            },
            adsetSample,
            lastSync,
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasDirectUrl: !!process.env.DIRECT_URL,
            }
        });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        }, { status: 500 });
    }
}
