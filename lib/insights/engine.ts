import { creativeScore } from "@/lib/utils";

export function detectFatigue(campaigns: Array<{ campaignId: string; campaignName: string; frequency: number; roas: number; spend: number }>) {
    return campaigns
        .map((c) => {
            let severity: "critical" | "warning" | "ok" = "ok";
            let action = "";

            if (c.frequency >= 5) {
                severity = "critical";
                action = "Pause and refresh creative immediately";
            } else if (c.frequency >= 3.5) {
                severity = "warning";
                action = "Rotate creative or expand audience";
            } else if (c.frequency >= 3) {
                severity = "warning";
                action = "Monitor closely — approaching fatigue";
            }

            return { ...c, severity, action };
        })
        .filter((c) => c.severity !== "ok")
        .sort((a, b) => b.frequency - a.frequency);
}

export function scoreCreatives(
    ads: Array<{
        adId: string;
        adName: string;
        campaignId: string;
        spend: number;
        ctr: number;
        cpc: number;
        roas: number;
        hookRate?: number;
    }>
) {
    return ads
        .filter((a) => a.spend > 0)
        .map((a) => {
            const score = creativeScore(a.ctr, a.roas, a.hookRate ?? 0);
            const tier: "top" | "average" | "underperformer" =
                score >= 65 ? "top" : score >= 35 ? "average" : "underperformer";
            return { ...a, score, tier };
        })
        .sort((a, b) => b.score - a.score);
}

export function budgetSignals(
    campaigns: Array<{
        campaignId: string;
        campaignName: string;
        spend: number;
        roas: number;
        frequency: number;
    }>
) {
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);

    return campaigns.map((c) => {
        const spendShare = totalSpend > 0 ? (c.spend / totalSpend) * 100 : 0;
        let signal: "scale" | "monitor" | "cut" = "monitor";
        let reason = "";

        if (c.roas >= 3 && spendShare < 20) {
            signal = "scale";
            reason = `High ROAS (${c.roas.toFixed(1)}x) with only ${spendShare.toFixed(0)}% of budget`;
        } else if (c.roas < 1.5 && spendShare > 15) {
            signal = "cut";
            reason = `Low ROAS (${c.roas.toFixed(1)}x) consuming ${spendShare.toFixed(0)}% of budget`;
        } else if (c.frequency > 3.5) {
            signal = "monitor";
            reason = `High frequency (${c.frequency.toFixed(1)}) — audience saturation risk`;
        }

        return { ...c, spendShare, signal, reason };
    });
}

export function attributionWindowComparison(
    campaigns: Array<{
        campaignId: string;
        campaignName: string;
        roas1dClick: number;
        roas7dClick: number;
        roas1dView: number;
        spend: number;
    }>
) {
    return campaigns.map((c) => {
        const maxRoas = Math.max(c.roas1dClick, c.roas7dClick, c.roas1dView);
        const minRoas = Math.min(c.roas1dClick, c.roas7dClick, c.roas1dView);
        const variance = maxRoas > 0 ? ((maxRoas - minRoas) / maxRoas) * 100 : 0;

        return {
            ...c,
            variance,
            alert: variance > 40 ? "High attribution variance — check window settings" : null,
        };
    });
}
