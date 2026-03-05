import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import * as z from 'zod';
import { prisma } from '@/lib/db';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasOpenAI) {
        console.error('Chat API: Missing OpenAI API Key');
        return new Response('Missing OpenAI API Key', { status: 400 });
    }

    const model = openai('gpt-4o-mini');

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });

    console.log('Chat API: Starting streamText with OpenAI...');
    const result = streamText({
        model,
        messages: await convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        system: `You are an elite Media Buyer and Data Analyst. Your job is to analyze the user's Meta Ads data accurately. 
    Today's date is: ${currentDate}. Always use this context when determining date ranges for 'today', 'this month', etc.
    Never guess metrics; always use your provided tools to query the database first.
    When reporting metrics:
    - Format Spend and Revenue as Indian Rupees (INR) using the ₹ symbol (e.g., ₹1,234.56).
    - Format ROAS to 2 decimal places (e.g., 2.45x).
    - Format CTR and Hook Rate as percentages (e.g., 1.25%).
    Always be concise and actionable in your responses.`,
        tools: {
            getAccountSummary: tool({
                description: 'Get a high-level KPI summary of the entire ad account for a date range.',
                inputSchema: z.object({
                    since: z.string().describe('Start date in YYYY-MM-DD format'),
                    until: z.string().describe('End date in YYYY-MM-DD format'),
                }),
                execute: async ({ since, until }) => {
                    console.log(`Tool: getAccountSummary(${since}, ${until})`);
                    const summary = await prisma.metaCampaignInsight.aggregate({
                        where: {
                            date: {
                                gte: new Date(since),
                                lte: new Date(until),
                            },
                        },
                        _sum: {
                            spend: true,
                            impressions: true,
                            purchases: true,
                            revenue: true,
                        },
                    });

                    const spend = summary._sum.spend || 0;
                    const revenue = summary._sum.revenue || 0;
                    const roas = spend > 0 ? revenue / spend : 0;

                    return {
                        since,
                        until,
                        spend,
                        impressions: summary._sum.impressions || 0,
                        purchases: summary._sum.purchases || 0,
                        revenue,
                        roas,
                    };
                },
            }),
            listCampaigns: tool({
                description: 'List all unique campaign names and IDs currently in the database.',
                inputSchema: z.object({
                    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'ALL']).optional().default('ALL'),
                }),
                execute: async ({ status }) => {
                    console.log(`Tool: listCampaigns(status=${status})`);
                    const where: any = {};
                    if (status !== 'ALL') {
                        where.status = status;
                    }

                    const campaigns = await prisma.metaCampaignInsight.findMany({
                        where,
                        select: {
                            campaignId: true,
                            campaignName: true,
                        },
                        distinct: ['campaignId'],
                    });

                    return campaigns;
                },
            }),
            queryAdPerformance: tool({
                description: 'Query detailed performance metrics at the campaign, adset, or ad level.',
                inputSchema: z.object({
                    level: z.enum(['campaign', 'adset', 'ad']),
                    since: z.string().describe('Start date in YYYY-MM-DD format'),
                    until: z.string().describe('End date in YYYY-MM-DD format'),
                    campaignName: z.string().optional().describe('Filter by a specific campaign name (partial match)'),
                    limit: z.number().optional().default(10),
                    sortBy: z.enum(['spend', 'roas', 'purchases', 'ctr']).optional().default('spend'),
                }),
                execute: async ({ level, since, until, campaignName, limit, sortBy }) => {
                    console.log(`Tool: queryAdPerformance(${level}, ${since}, ${until})`);
                    const where: any = {
                        date: {
                            gte: new Date(since),
                            lte: new Date(until),
                        },
                    };

                    if (campaignName) {
                        if (level === 'campaign') where.campaignName = { contains: campaignName, mode: 'insensitive' };
                    }

                    let data;
                    if (level === 'campaign') {
                        data = await prisma.metaCampaignInsight.findMany({
                            where,
                            orderBy: { [sortBy as any]: 'desc' },
                            take: limit,
                        });
                    } else if (level === 'adset') {
                        data = await prisma.metaAdSetInsight.findMany({
                            where,
                            orderBy: { [sortBy as any]: 'desc' },
                            take: limit,
                        });
                    } else {
                        data = await prisma.metaAdInsight.findMany({
                            where,
                            orderBy: { [sortBy as any]: 'desc' },
                            take: limit,
                        });
                    }

                    return data;
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}

