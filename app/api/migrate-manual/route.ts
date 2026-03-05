import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("Starting manual SQL migration...");

        // Add status to meta_campaign_insights
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "meta_campaign_insights" ADD COLUMN IF NOT EXISTS "status" TEXT;
    `);
        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "meta_campaign_insights_status_idx" ON "meta_campaign_insights"("status");
    `);

        // Add status to meta_ad_insights
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "meta_ad_insights" ADD COLUMN IF NOT EXISTS "status" TEXT;
    `);
        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "meta_ad_insights_status_idx" ON "meta_ad_insights"("status");
    `);

        return NextResponse.json({
            success: true,
            message: "Manual migration successful. Status columns added."
        });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        }, { status: 500 });
    }
}
