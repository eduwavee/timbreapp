import Link from "next/link";
import { CartelHero, OpScope } from "@/components/cartel-hero";
import { Arrow } from "@/components/arrow";
import { ListingCard } from "@/components/listing-card";
import { PlacesList } from "@/components/places-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getListings, getMeta } from "@/lib/api";
import { isOp, waLink } from "@/lib/format";
import type { Op } from "@/lib/types";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const op: Op = isOp(params.op) ? params.op : "venta";
  const [meta, latest] = await Promise.all([getMeta(), getListings({ op, limit: 6 })]);

  return (
    <>
      <SiteHeader ownerPhone={meta.owner_phone} />
      <main>
        <OpScope initial={op}>
          <CartelHero meta={meta} />

          <section id="recien-colgados" aria-labelledby="recien-titulo" className="mx-auto max-w-[1440px] px-3 pt-16 pb-6 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-tinta pb-3">
              <h2 id="recien-titulo" className="cartel text-[56px] sm:text-[76px]">
                Recién colgados
              </h2>
              <Link href={`/propiedades?op=${op}`} className="rotulo flex items-center gap-2 pb-2 text-[17px] hover:text-op">
                Ver las {latest.total} <Arrow className="size-5" />
              </Link>
            </div>
            {latest.data.length === 0 ? (
              <p className="border-2 border-tinta bg-chapa px-5 py-8 text-[17px]">Por ahora no hay nada colgado en {op === "venta" ? "venta" : "alquiler"}. Volvé en unos días.</p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {latest.data.map((l, i) => (
                  <li key={l.slug}>
                    <ListingCard listing={l} op={op} priority={i < 3} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="barrios-titulo" className="mx-auto max-w-[1440px] px-3 pt-14 pb-20 sm:px-6">
            <h2 id="barrios-titulo" className="cartel mb-5 text-[44px] sm:text-[56px]">
              ¿Por dónde buscás?
            </h2>
            <PlacesList meta={meta} op={op} />
          </section>
        </OpScope>

        <section aria-labelledby="publicar-titulo" className="border-t-2 border-tinta bg-chapa">
          <div className="mx-auto grid max-w-[1440px] items-end gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 id="publicar-titulo" className="cartel text-[54px] sm:text-[80px]">
                ¿Tenés algo para vender o alquilar?
              </h2>
              <p className="mt-4 max-w-[52ch] text-[18px] text-tinta-2">
                Te colgamos el cartel acá. Mandanos fotos y datos por WhatsApp; cada consulta te llega con nombre y teléfono del interesado.
              </p>
            </div>
            {meta.owner_phone && (
              <a
                href={waLink(meta.owner_phone, "Hola, quiero publicar una propiedad en La Choza.")}
                target="_blank"
                rel="noreferrer"
                className="cartel inline-flex h-16 items-center justify-center gap-3 bg-whatsapp px-8 text-[30px] text-white transition-colors hover:bg-[#126536]"
              >
                Escribinos por WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>
      <SiteFooter meta={meta} />
    </>
  );
}
