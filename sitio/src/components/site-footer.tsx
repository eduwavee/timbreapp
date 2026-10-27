import Link from "next/link";
import type { Meta } from "@/lib/types";
import { waLink } from "@/lib/format";
import { Arrow } from "./arrow";
import { Wordmark } from "./choza-mark";

/** Pie gris con los links en mono, en columnas. */
export function SiteFooter({ meta }: { meta: Meta | null }) {
  const places = meta ? [...meta.places].sort((a, b) => a.venta + a.alquiler - (b.venta + b.alquiler)).reverse().slice(0, 6) : [];

  return (
    <footer className="bg-gris-pie text-tinta">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="dato flex items-center justify-between gap-4 border-b border-tinta py-6">
          <a href="#" className="link-dato inline-flex items-center gap-2">
            Volver arriba <Arrow direction="up" className="size-3.5" />
          </a>
          <span>© La Choza {new Date().getFullYear()}</span>
        </div>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-[34px]" aria-label="La Choza, inicio">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-[15px]">Casas, departamentos y galpones en venta y alquiler. Tocás “Me interesa” y te escribimos por WhatsApp.</p>
          </div>
          <ul className="dato flex flex-col gap-3">
            <li>
              <Link href="/propiedades?op=venta" className="link-dato">
                Comprar{meta ? ` (${meta.counts.venta})` : ""}
              </Link>
            </li>
            <li>
              <Link href="/propiedades?op=alquiler" className="link-dato">
                Alquilar{meta ? ` (${meta.counts.alquiler})` : ""}
              </Link>
            </li>
          </ul>
          {places.length > 0 && (
            <ul className="dato flex flex-col gap-3">
              {places.map((p) => (
                <li key={p.name}>
                  <Link href={`/propiedades?op=${p.venta >= p.alquiler ? "venta" : "alquiler"}&place=${encodeURIComponent(p.name)}`} className="link-dato">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ul className="dato flex flex-col gap-3">
            {meta?.owner_phone && (
              <li>
                <a href={waLink(meta.owner_phone, "Hola, te escribo desde La Choza.")} target="_blank" rel="noreferrer" className="link-dato">
                  WhatsApp {meta.owner_phone}
                </a>
              </li>
            )}
            {meta?.owner_phone && (
              <li>
                <a href={waLink(meta.owner_phone, "Hola, quiero publicar una propiedad en La Choza.")} target="_blank" rel="noreferrer" className="link-dato">
                  Publicar una propiedad
                </a>
              </li>
            )}
          </ul>
        </div>
        {process.env.NEXT_PUBLIC_DEMO === "1" && (
          <p className="dato border-t border-tinta/30 py-5">Propiedades, precios y teléfonos de demostración. Fotos ilustrativas de Pexels.</p>
        )}
      </div>
    </footer>
  );
}
