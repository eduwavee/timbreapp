import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { SearchStrip } from "@/components/search-strip";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SortSelect } from "@/components/sort-select";
import { getListings, getMeta } from "@/lib/api";
import { isOp } from "@/lib/format";
import type { Filters, Op } from "@/lib/types";

export const metadata: Metadata = { title: "Propiedades" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ListingsPage({ searchParams }: PageProps<"/propiedades">) {
  const params = await searchParams;
  const op: Op = isOp(one(params.op)) ? (one(params.op) as Op) : "venta";
  const filters: Filters = {
    op,
    place: one(params.place) || undefined,
    type: one(params.type) || undefined,
    rooms: one(params.rooms) || undefined,
    max_price: one(params.max_price) || undefined,
    sort: one(params.sort) || undefined,
  };
  const [meta, result] = await Promise.all([getMeta(), getListings(filters)]);
  const filtered = Boolean(filters.place || filters.type || filters.rooms || filters.max_price);
  const other: Op = op === "venta" ? "alquiler" : "venta";
  const keep = new URLSearchParams(Object.entries({ ...filters, op: other, max_price: undefined }).filter(([, v]) => v) as [string, string][]);

  return (
    <>
      <SiteHeader ownerPhone={meta.owner_phone} />
      <main data-op={op}>
        <section className="border-b-2 border-tinta bg-op text-chapa">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-3 pt-8 pb-7 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
              <h1 className="cartel text-[clamp(72px,11vw,160px)]">
                {op === "venta" ? "Vende" : "Alquila"}
                <span className="sr-only"> · propiedades en {op}</span>
              </h1>
              <div className="flex flex-col items-start gap-2 pb-2 sm:items-end">
                <p className="cartel text-[40px] sm:text-[52px]">
                  {result.total} {result.total === 1 ? "propiedad" : "propiedades"}
                  {filters.place ? ` en ${filters.place}` : ""}
                </p>
                <Link href={`/propiedades?${keep}`} className="rotulo border-2 border-chapa px-3 py-2 text-[15px] transition-colors hover:bg-chapa hover:text-op">
                  Ver en {other}
                </Link>
              </div>
            </div>
            <SearchStrip key={JSON.stringify(filters)} op={op} meta={meta} initial={filters} count={undefined} />
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-3 pt-8 pb-20 sm:px-6" aria-label="Resultados">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-tinta-2">
              {filtered ? (
                <>
                  Con los filtros elegidos.{" "}
                  <Link href={`/propiedades?op=${op}`} className="font-semibold text-tinta underline underline-offset-4">
                    Ver todas
                  </Link>
                </>
              ) : (
                <>Todo lo que está colgado en {op}.</>
              )}
            </p>
            <Suspense>
              <SortSelect value={filters.sort ?? "recientes"} />
            </Suspense>
          </div>

          {result.data.length === 0 ? (
            <div className="relative overflow-hidden border-2 border-tinta bg-chapa px-6 py-14 text-center">
              <p className="cartel text-[48px] sm:text-[64px]">Ningún cartel con esos filtros</p>
              <p className="mx-auto mt-3 max-w-[46ch] text-[17px] text-tinta-2">Probá con otro barrio o subí el precio máximo. También podés mirar lo que hay en {other}.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={`/propiedades?op=${op}`} className="rotulo border-2 border-tinta bg-tinta px-4 py-3 text-[16px] text-chapa">
                  Sacar filtros
                </Link>
                <Link href={`/propiedades?op=${other}`} className="rotulo border-2 border-tinta px-4 py-3 text-[16px]">
                  Ver en {other}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.map((l, i) => (
                <li key={l.slug}>
                  <ListingCard listing={l} op={op} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter meta={meta} />
    </>
  );
}
