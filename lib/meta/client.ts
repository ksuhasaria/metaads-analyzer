const META_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID!;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

export class MetaAPIError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: number
    ) {
        super(message);
        this.name = "MetaAPIError";
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function metaFetch<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retries = 3
): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("access_token", ACCESS_TOKEN);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    try {
        const res = await fetch(url.toString(), { next: { revalidate: 0 } } as RequestInit);
        const data = await res.json();

        if (!res.ok || data.error) {
            // Meta rate limit error codes are usually 4, 17, 32, 613, 80000, 80001, 80002, 80003, 80004, 80005, 80006, 80008, 80009
            const isRateLimit = res.status === 429 || [4, 17, 32, 613].includes(data.error?.code);

            if (isRateLimit && retries > 0) {
                console.log(`Rate limit hit, retrying in 2s... (${retries} retries left)`);
                await sleep(2000);
                return metaFetch<T>(endpoint, params, retries - 1);
            }

            throw new MetaAPIError(
                data.error?.message ?? "Meta API request failed",
                res.status,
                data.error?.code
            );
        }

        return data as T;
    } catch (err) {
        if (retries > 0 && !(err instanceof MetaAPIError)) {
            await sleep(1000);
            return metaFetch<T>(endpoint, params, retries - 1);
        }
        throw err;
    }
}

// Paginate through all results (handles Meta cursor-based pagination)
export async function metaFetchAll<T extends { data: unknown[]; paging?: { next?: string }; error?: { message: string } }>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<unknown[]> {
    const results: unknown[] = [];
    let nextUrl: string | null = null;

    const firstPage = await metaFetch<T>(endpoint, params);
    results.push(...firstPage.data);
    nextUrl = firstPage.paging?.next ?? null;

    while (nextUrl) {
        // Add a small delay between paginated requests to avoid hammering the API
        await sleep(300);
        const res = await fetch(nextUrl, { next: { revalidate: 0 } } as RequestInit);
        const page = await res.json() as T;

        if (page.error) {
            // Basic retry for pagination if it fails
            console.log("Pagination error, waiting 2s...");
            await sleep(2000);
            const retryRes = await fetch(nextUrl, { next: { revalidate: 0 } } as RequestInit);
            const retryPage = await retryRes.json() as T;
            if (retryPage.error) throw new Error(retryPage.error.message);
            results.push(...retryPage.data);
            nextUrl = retryPage.paging?.next ?? null;
        } else {
            results.push(...page.data);
            nextUrl = page.paging?.next ?? null;
        }
    }

    return results;
}

export { AD_ACCOUNT_ID };
