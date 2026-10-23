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
import { facts, isOp, operationFor, price } from "@/lib/format";
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

  return (
    <>
      <SiteHeader ownerPhone={meta.owner_phone} />
      <main data-op={op} className="pb-24 lg:pb-0">
        <div className="mx-auto max-w-[1440px] px-3 pt-5 sm:px-6">
          <Link href={`/propiedades?op=${op}`} className="rotulo inline-flex items-center gap-2 text-[15px] hover:text-op">
            <Arrow className="size-4" direction="left" /> Volver {op === "venta" ? "a las ventas" : "a los alquileres"}
          </Link>
        </div>

        <div className="mx-auto grid max-w-[1440px] gap-8 px-3 pt-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_1fr]">
          <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">
            <Gallery photos={listing.photos} title={listing.headline} reserved={listing.reserved} />

            <header className="flex flex-col gap-3 border-b-2 border-tinta pb-6">
              <h1 className="text-[clamp(30px,3.6vw,46px)] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance">{listing.headline}</h1>
              <p className="text-[18px] text-tinta-2">
                <span className="font-semibold text-op">{listing.type.label}</span> · {listing.address_hint}, {listing.place}
                {listing.neighborhood && listing.city !== listing.neighborhood ? `, ${listing.city}` : ""}
              </p>
              <ul className="flex flex-wrap gap-2 pt-1">
                {facts(listing).map((f) => (
                  <li key={f} className="cartel border-2 border-tinta bg-chapa px-3 pt-1.5 pb-1 text-[26px]">
                    {f}
                  </li>
                ))}
              </ul>
            </header>
          </div>

          <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start" aria-label="Precio y consulta">
            <InquiryPanel listing={listing} initialOp={op} ownerPhone={meta.owner_phone} />
          </aside>

          <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">

            {paragraphs.length > 0 && (
              <section aria-labelledby="desc-titulo" className="max-w-[68ch]">
                <h2 id="desc-titulo" className="cartel mb-3 text-[44px]">
                  Cómo es
                </h2>
                <div className="flex flex-col gap-3 text-[18px] leading-relaxed text-tinta">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            )}

            {listing.amenities.length > 0 && (
              <section aria-labelledby="carac-titulo">
                <h2 id="carac-titulo" className="cartel mb-3 text-[44px]">
                  Qué tiene
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <li key={a.value} className="flex items-center gap-2 border-2 border-tinta bg-chapa px-3 py-2 text-[16px] font-semibold">
                      <span className="size-2.5 bg-op" aria-hidden />
                      {a.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <section aria-labelledby="mas-titulo" className="border-t-2 border-tinta bg-chapa-2">
            <div className="mx-auto max-w-[1440px] px-3 pt-10 pb-20 sm:px-6">
              <h2 id="mas-titulo" className="cartel mb-6 text-[48px] sm:text-[64px]">
                {related.data.length >= 2 ? `Más en ${listing.place}` : "Otras que te pueden gustar"}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
