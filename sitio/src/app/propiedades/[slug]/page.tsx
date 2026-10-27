import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow } from "@/components/arrow";
import { Gallery } from "@/components/gallery";
import { InquiryPanel, MobileBar } from "@/components/inquiry-panel";
import { ListingCard } from "@/components/listing-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getListing, getListings, getMeta } from "@/lib/api";
import { facts, isOp, number, operationFor, price } from "@/lib/format";
import type { Op } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/propiedades/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Propiedad no encontrada" };
  const op = listing.operations[0];
  return {
    title: `${listing.headline} · ${listing.place}`,
    description: `${op.verb} ${price(op)}. ${facts(listing).join(", ")}. ${listing.address_hint}, ${listing.place}.`,
    openGraph: listing.cover ? { images: [listing.cover.url] } : undefined,
  };
}

export default async function ListingPage({ params, searchParams }: PageProps<"/propiedades/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const wanted = Array.isArray(query.op) ? query.op[0] : query.op;
  const op: Op = isOp(wanted) && listing.operations.some((o) => o.value === wanted) ? wanted : listing.operations[0].value;
  const [meta, related, others] = await Promise.all([
    getMeta(),
    getListings({ op, place: listing.place, limit: 3, exclude: listing.slug }),
    getListings({ op, limit: 6, exclude: listing.slug }),
  ]);
  // Primero las del mismo barrio; si no llegan a tres, se completa con otras de la misma operación.
  const seen = new Set(related.data.map((l) => l.slug));
  const more = [...related.data, ...others.data.filter((l) => !seen.has(l.slug))].slice(0, 3);
  const paragraphs = (listing.description ?? "").split(/\n+/).filter(Boolean);
  const rows: [string, string][] = [
    ["Barrio", `${listing.place}${listing.neighborhood && listing.city !== listing.neighborhood ? `, ${listing.city}` : ""}`],
    ["Ubicación", listing.address_hint],
    ["Tipo", listing.type.label],
    ["Superficie", listing.surface_m2 ? `${number(listing.surface_m2)} m²` : "—"],
    ["Ambientes", listing.rooms ? (listing.rooms === 1 ? "Monoambiente" : String(listing.rooms)) : "—"],
    ["Baños", listing.bathrooms ? String(listing.bathrooms) : "—"],
    ["Cochera", listing.garage ? "Sí" : "No"],
    ["Antigüedad", listing.age_years === null ? "—" : listing.age_years === 0 ? "A estrenar" : `${listing.age_years} años`],
    ["Código", listing.code],
  ];

  return (
    <>
      <SiteHeader ownerPhone={meta.owner_phone} current={op} />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
          <Link href={`/propiedades?op=${op}`} className="dato link-dato inline-flex items-center gap-2">
            <Arrow className="size-3.5" direction="left" /> Volver {op === "venta" ? "a la venta" : "al alquiler"}
          </Link>
          <h1 className="titulo mt-10 max-w-[22ch] text-[clamp(36px,5.2vw,84px)] text-balance">{listing.headline}</h1>
          <p className="dato mt-6 flex flex-wrap gap-x-2 gap-y-1 text-tinta-2">
            {[listing.place, listing.type.label, ...facts(listing)].map((f, i, all) => (
              <span key={f} className="whitespace-nowrap">
                {f}
                {i < all.length - 1 && <span aria-hidden> ·</span>}
              </span>
            ))}
          </p>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-8 sm:pt-14">
          <Gallery photos={listing.photos} title={listing.headline} reserved={listing.reserved} />
        </div>

        <div className="mx-auto grid max-w-[1440px] gap-14 px-4 pt-14 pb-24 sm:px-8 sm:pt-20 sm:pb-32 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-24">
          <aside className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1 lg:self-start" aria-label="Precio y consulta">
            <InquiryPanel listing={listing} initialOp={op} ownerPhone={meta.owner_phone} />
          </aside>

          <div className="flex min-w-0 flex-col gap-16 lg:col-start-1 lg:row-start-1">
            {paragraphs.length > 0 && (
              <section aria-labelledby="desc-titulo">
                <h2 id="desc-titulo" className="dato mb-6 border-t border-tinta pt-6 text-tinta-2">
                  Cómo es
                </h2>
                <div className="flex max-w-[34ch] flex-col gap-5 text-[clamp(22px,2vw,28px)] leading-[1.3] tracking-[-0.015em]">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="ficha-titulo">
              <h2 id="ficha-titulo" className="dato mb-2 border-t border-tinta pt-6 text-tinta-2">
                Ficha
              </h2>
              <dl className="grid sm:grid-cols-2 sm:gap-x-10">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-filete py-3.5">
                    <dt className="dato text-tinta-3">{k}</dt>
                    <dd className="text-right text-[16px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {listing.amenities.length > 0 && (
              <section aria-labelledby="carac-titulo">
                <h2 id="carac-titulo" className="dato mb-2 border-t border-tinta pt-6 text-tinta-2">
                  Qué tiene
                </h2>
                <ul className="grid sm:grid-cols-2 sm:gap-x-10">
                  {listing.amenities.map((a) => (
                    <li key={a.value} className="border-b border-filete py-3.5 text-[16px] font-semibold">
                      {a.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <section aria-labelledby="mas-titulo" className="border-t border-tinta">
            <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-32">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <h2 id="mas-titulo" className="titulo text-[clamp(32px,4vw,56px)]">
                  {related.data.length >= 2 ? `Más en ${listing.place}` : "Otras que te pueden gustar"}
                </h2>
                <Link href={`/propiedades?op=${op}`} className="dato link-dato inline-flex items-center gap-2 pb-1.5">
                  Ver todas <Arrow className="size-4" />
                </Link>
              </div>
              <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {more.map((l) => (
                  <li key={l.slug}>
                    <ListingCard listing={l} op={operationFor(l, op).value} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        <MobileBar listing={listing} op={op} />
      </main>
      <SiteFooter meta={meta} />
    </>
  );
}
