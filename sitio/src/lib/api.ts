import "server-only";
import type { Filters, ListingDetail, ListingSummary, Meta } from "./types";

export const API_URL = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api";

/** Clave compartida con Laravel: le dice a la API que el pedido viene de este servidor. */
export const PROXY_HEADERS: Record<string, string> = process.env.SITE_PROXY_KEY ? { "X-Site-Key": process.env.SITE_PROXY_KEY } : {};

export class SiteApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/site/${path}`, { headers: { Accept: "application/json", ...PROXY_HEADERS }, next: { revalidate: 30 } });
  if (!res.ok) {
    throw new SiteApiError(res.status, `La API respondió ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getMeta(): Promise<Meta> {
  return get<Meta>("meta");
}

export function getListings(filters: Partial<Filters> & { limit?: number; exclude?: string }): Promise<{ data: ListingSummary[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  return get(`listings?${params}`);
}

export async function getListing(slug: string): Promise<ListingDetail | null> {
  try {
    const res = await get<{ data: ListingDetail }>(`listings/${encodeURIComponent(slug)}`);
    return res.data;
  } catch (e) {
    if (e instanceof SiteApiError && e.status === 404) return null;
    throw e;
  }
}
