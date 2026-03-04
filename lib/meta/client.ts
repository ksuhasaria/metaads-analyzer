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

export async function metaFetch<T>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("access_token", ACCESS_TOKEN);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = await res.json();

    if (!res.ok || data.error) {
        throw new MetaAPIError(
            data.error?.message ?? "Meta API request failed",
            res.status,
            data.error?.code
        );
    }

    return data as T;
}

// Paginate through all results (handles Meta cursor-based pagination)
export async function metaFetchAll<T extends { data: unknown[]; paging?: { next?: string } }>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<unknown[]> {
    const results: unknown[] = [];
    let nextUrl: string | null = null;

    const firstPage = await metaFetch<T>(endpoint, params);
    results.push(...firstPage.data);
    nextUrl = firstPage.paging?.next ?? null;

    while (nextUrl) {
        const res = await fetch(nextUrl, { next: { revalidate: 0 } });
        const page = await res.json() as T;
        results.push(...page.data);
        nextUrl = page.paging?.next ?? null;
    }

    return results;
}

export { AD_ACCOUNT_ID };
