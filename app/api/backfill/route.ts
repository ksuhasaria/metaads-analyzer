import { prisma } from "@/lib/db";
import { syncMeta } from "../sync/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { since, until } = body;

        if (!since || !until) {
            return NextResponse.json({ success: false, error: "Missing since or until params" }, { status: 400 });
        }

        const results = await syncMeta(since, until);

        await prisma.syncLog.create({
            data: {
                source: "meta_backfill",
                dateRange: `${since} to ${until}`,
                status: "success",
                message: `Backfill success. +${results.campaigns} campaigns, +${results.adsets} adsets, +${results.ads} ads.`,
            },
        });

        return NextResponse.json({ success: true, ...results });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Backfill failed";
        console.error("Backfill error:", message);

        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
