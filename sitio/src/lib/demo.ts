import "server-only";
import demo from "@/data/demo.json";
import type { Filters, ListingDetail, ListingSummary, Meta } from "./types";

/**
 * Brunito sin servidor: la foto de datos de src/data/demo.json (npm run demo:exportar),
 * filtrada y ordenada igual que la API de Laravel.
 */
const listings = demo.listings as unknown as ListingDetail[];

/** Lo que el listado no trae: queda solo para la ficha. */
const DETAIL_ONLY = new Set(["description", "amenities", "photos"]);

function summary(listing: ListingDetail): ListingSummary {
  return Object.fromEntries(Object.entries(listing).filter(([key]) => !DETAIL_ONLY.has(key))) as ListingSummary;
}

export const demoMeta = demo.meta as unknown as Meta;

export function demoListings(filters: Partial<Filters> & { limit?: number; exclude?: string }): { data: ListingSummary[]; total: number } {
  const op = filters.op;
  const priceOf = (l: ListingDetail) => l.operations.find((o) => o.value === (op === "alquiler" ? "alquiler" : "venta"))?.price ?? null;
  const rooms = filters.rooms ? Number(filters.rooms) : null;
  const max = filters.max_price ? Number(filters.max_price) : null;

  const rows = listings.filter(
    (l) =>
      (!op || l.operations.some((o) => o.value === op)) &&
      (!filters.type || l.type.value === filters.type) &&
      (!filters.place || l.place === filters.place) &&
      (rooms === null || (rooms >= 4 ? (l.rooms ?? 0) >= 4 : l.rooms === rooms)) &&
      (!op || max === null || (priceOf(l) ?? Infinity) <= max) &&
      l.slug !== filters.exclude,
  );

  // "recientes" es el orden en que se exportó; por precio, los que no tienen precio van al final.
  if (filters.sort === "precio_asc" || filters.sort === "precio_desc") {
    const dir = filters.sort === "precio_asc" ? 1 : -1;
    rows.sort((a, b) => {
      const pa = priceOf(a);
      const pb = priceOf(b);
      if (pa === null || pb === null) return pa === pb ? 0 : pa === null ? 1 : -1;
      return (pa - pb) * dir;
    });
  }

  return { data: rows.slice(0, filters.limit ?? 48).map(summary), total: rows.length };
}

export function demoListing(slug: string): ListingDetail | null {
  return listings.find((l) => l.slug === slug) ?? null;
}
