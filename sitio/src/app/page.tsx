import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { Intro } from "@/components/intro";
import { PlacesList } from "@/components/places-list";
import { Recientes, type Reciente } from "@/components/recientes";
import { SearchForm } from "@/components/search-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { getListings, getMeta } from "@/lib/api";
import { isOp, waLink } from "@/lib/format";
import type { Op } from "@/lib/types";

const PASOS = [
  { titulo: "Buscás", texto: "Filtrá por barrio, tipo y ambientes, y mirá las fotos, el precio y la ficha de cada una." },
  { titulo: "Tocás Me interesa", texto: "Dejás tu nombre y tu WhatsApp en la ficha. Sin registrarte." },
  { titulo: "Te escribimos", texto: "Coordinamos la visita por WhatsApp y te contamos lo que necesites saber." },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const op: Op = isOp(params.op) ? params.op : "venta";
  const [meta, venta, alquiler] = await Promise.all([getMeta(), getListings({ op: "venta", limit: 5 }), getListings({ op: "alquiler", limit: 5 })]);

  // Lo último de las dos operaciones, sin repetir propiedades que están en ambas.
  const seen = new Set<string>();
  const recientes: Reciente[] = [...venta.data.map((l) => ({ listing: l, op: "venta" as Op })), ...alquiler.data.map((l) => ({ listing: l, op: "alquiler" as Op }))]
    .sort((a, b) => (b.listing.published_at ?? "").localeCompare(a.listing.published_at ?? ""))
    .filter((r) => (seen.has(r.listing.slug) ? false : (seen.add(r.listing.slug), true)))
    .slice(0, 5);

  // El acordeón abre con la primera; la portada y la foto de "Así de simple" usan otras, para no repetir.
  const conFoto = recientes.filter((r) => r.listing.cover).map((r) => r.listing);
  const portada = conFoto[1] ?? conFoto[0];
  const segunda = conFoto.find((l) => l.slug !== portada?.slug && l.slug !== conFoto[0]?.slug);
  const cities = Array.from(new Set(meta.places.map((p) => p.city)));
  const citiesText = cities.length > 1 ? `${cities.slice(0, -1).join(", ")} y ${cities.at(-1)}` : (cities[0] ?? "");

  return (
    <>
      <Intro />
      <SiteHeader ownerPhone={meta.owner_phone} overlay />
      <main className="flex-1">
        <section aria-labelledby="inicio-titulo">
          <div className="relative h-[68svh] max-h-[640px] min-h-[460px] overflow-hidden bg-tinta lg:h-[100svh] lg:max-h-[980px] lg:min-h-[680px]">
            {portada?.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portada.cover.url} alt="" fetchPriority="high" className="hero-foto absolute inset-0 size-full object-cover" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.05)_22%,rgba(0,0,0,0.2)_38%,rgba(0,0,0,0.62)_62%,rgba(0,0,0,0.72)_100%)]" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-4 pb-8 sm:px-8 lg:pb-[188px]">
              <h1 id="inicio-titulo" className="titulo tras-intro max-w-[14ch] text-[clamp(40px,6.2vw,96px)] text-white">
                Casas, deptos y galpones para comprar o alquilar.
              </h1>
              {portada && (
                <Link href={`/propiedades/${portada.slug}`} className="dato link-dato mt-5 inline-block text-white/90">
                  En la foto: {portada.address_hint}, {portada.place}
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto max-w-[1440px] lg:-mt-[132px] lg:px-8">
            <div className="tras-intro-2 bg-hueso px-4 pt-7 pb-8 sm:px-8 lg:px-10 lg:pt-9 lg:pb-10">
              <SearchForm op={op} meta={meta} withOp />
            </div>
          </div>
        </section>

        <section aria-label="Qué es La Choza" className="mx-auto max-w-[1440px] px-4 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32">
          <p className="max-w-[26ch] text-[clamp(28px,3.6vw,54px)] leading-[1.12] tracking-[-0.025em] text-balance">
            Publicamos <strong className="font-bold">casas, departamentos y galpones</strong> en {citiesText}. Elegís uno, tocás <strong className="font-bold">Me interesa</strong> y te escribimos por WhatsApp para ir a verlo.
          </p>
        </section>

        {recientes.length > 0 && (
          <section aria-labelledby="recientes-titulo" className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 sm:pb-32">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="recientes-titulo" className="titulo text-[clamp(36px,4.4vw,64px)]">
                Recién publicadas
              </h2>
              <Link href={`/propiedades?op=${op}`} className="dato link-dato inline-flex items-center gap-2 pb-2">
                Ver todas <Arrow className="size-4" />
              </Link>
            </div>
            <Recientes items={recientes} />
          </section>
        )}

        <section aria-labelledby="como-titulo" className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-24 sm:px-8 sm:pb-32 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-12 lg:gap-16">
            <h2 id="como-titulo" className="titulo text-[clamp(40px,5vw,76px)]">
              Así de simple.
            </h2>
            <ol className="border-t border-tinta">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-filete py-6">
                  <span className="dato pt-1.5 text-tinta-3">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[21px] font-bold tracking-[-0.02em]">{p.titulo}</p>
                    <p className="mt-1.5 max-w-[44ch] text-[16px] text-tinta-2">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {segunda?.cover && (
            <Link href={`/propiedades/${segunda.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-hueso-2 lg:aspect-auto lg:min-h-[640px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={segunda.cover.url} alt={segunda.headline} loading="lazy" className="foto absolute inset-0 size-full object-cover" />
              <span className="dato absolute bottom-4 left-4 bg-hueso px-2.5 py-1.5">
                {segunda.address_hint}, {segunda.place}
              </span>
            </Link>
          )}
        </section>

        <section aria-labelledby="barrios-titulo" className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 sm:pb-32">
          <div className="mb-8 grid gap-4 lg:grid-cols-2 lg:gap-20">
            <h2 id="barrios-titulo" className="titulo text-[clamp(40px,5vw,76px)]">
              Dónde estamos
            </h2>
            <p className="max-w-[44ch] self-end text-[17px] text-tinta-2">Propiedades en barrios de Capital y del sur del conurbano. Tocá un barrio para ver lo que hay.</p>
          </div>
          <PlacesList meta={meta} />
        </section>

        <section aria-labelledby="publicar-titulo" className="border-t border-tinta">
          <div className="mx-auto grid max-w-[1440px] items-end gap-10 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 id="publicar-titulo" className="titulo max-w-[16ch] text-[clamp(40px,5vw,76px)]">
                ¿Tenés algo para vender o alquilar?
              </h2>
              <p className="mt-6 max-w-[50ch] text-[17px] text-tinta-2">Mandanos fotos y datos por WhatsApp y lo publicamos acá. Cada consulta te llega con el nombre y el teléfono del interesado.</p>
            </div>
            {meta.owner_phone && (
              <a
                href={waLink(meta.owner_phone, "Hola, quiero publicar una propiedad en La Choza.")}
                target="_blank"
                rel="noreferrer"
                className="dato flex h-14 items-center justify-center gap-3 bg-tinta px-7 text-[14px] text-hueso transition-colors hover:bg-tinta-2"
              >
                <WhatsAppIcon className="size-5" />
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
