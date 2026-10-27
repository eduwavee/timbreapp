import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Arrow } from "@/components/arrow";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
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
  const keep = (target: Op) => new URLSearchParams(Object.entries({ ...filters, op: target, max_price: undefined }).filter(([, v]) => v) as [string, string][]);

  return (
    <>
      <SiteHeader ownerPhone={meta.owner_phone} current={op} />
      <main className="flex-1">
        <section className="mx-auto max-w-[1440px] px-4 pt-10 pb-10 sm:px-8 sm:pt-16 sm:pb-14">
          <nav aria-label="Operación" className="dato mb-6 flex gap-6">
            {(["venta", "alquiler"] as Op[]).map((o) => (
              <Link key={o} href={`/propiedades?${keep(o)}`} aria-current={o === op ? "page" : undefined} className={`link-dato ${o === op ? "font-bold" : "text-tinta-3 hover:text-tinta"}`}>
                {o === "venta" ? "En venta" : "En alquiler"} ({meta.counts[o]})
              </Link>
            ))}
          </nav>
          <h1 className="titulo text-[clamp(44px,6.4vw,104px)]">
            {result.total} {result.total === 1 ? "propiedad" : "propiedades"}
            <br />
            <span className="font-normal">
              en {op}
              {filters.place ? ` en ${filters.place}` : ""}.
            </span>
          </h1>
          <div className="mt-12 border-t border-tinta pt-8">
            <SearchForm key={JSON.stringify(filters)} op={op} meta={meta} initial={filters} />
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 sm:pb-32" aria-label="Resultados">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-filete py-3">
            <p className="dato text-tinta-2">
              {filtered ? (
                <>
                  Con filtros ·{" "}
                  <Link href={`/propiedades?op=${op}`} className="text-tinta underline decoration-1 underline-offset-4">
                    Sacarlos
                  </Link>
                </>
              ) : (
                <>Todo lo publicado en {op}</>
              )}
            </p>
            <Suspense>
              <SortSelect value={filters.sort ?? "recientes"} />
            </Suspense>
          </div>

          {result.data.length === 0 ? (
            <div className="py-16 sm:py-24">
              <p className="titulo max-w-[18ch] text-[clamp(32px,4vw,56px)]">No hay nada con esos filtros.</p>
              <p className="mt-5 max-w-[50ch] text-[17px] text-tinta-2">Probá con otro barrio o subí el precio máximo. También podés mirar lo que hay en {other}.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/propiedades?op=${op}`} className="dato flex h-12 items-center gap-3 bg-tinta px-6 text-[14px] text-hueso hover:bg-tinta-2">
                  Sacar filtros <Arrow className="size-4" />
                </Link>
                <Link href={`/propiedades?op=${other}`} className="dato flex h-12 items-center border border-tinta px-6 text-[14px] hover:bg-tinta hover:text-hueso">
                  Ver en {other}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
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
