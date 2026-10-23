import Link from "next/link";
import type { Meta } from "@/lib/types";
import { waLink } from "@/lib/format";
import { Wordmark } from "./choza-mark";

export function SiteFooter({ meta }: { meta: Meta | null }) {
  return (
    <footer className="border-t-2 border-tinta bg-tinta text-chapa">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-[40px]" aria-label="La Choza, inicio">
            <Wordmark />
          </Link>
          <p className="mt-3 max-w-sm text-[15px] text-chapa/75">
            Casas, departamentos y galpones en venta y alquiler. Tocás &ldquo;Me interesa&rdquo; y te escribimos por WhatsApp.
          </p>
        </div>
        <div>
          <p className="rotulo mb-3 text-chapa/60">Buscar</p>
          <ul className="flex flex-col gap-2 text-[15px]">
            <li>
              <Link href="/propiedades?op=venta" className="hover:underline">
                Propiedades en venta{meta ? ` (${meta.counts.venta})` : ""}
              </Link>
            </li>
            <li>
              <Link href="/propiedades?op=alquiler" className="hover:underline">
                Propiedades en alquiler{meta ? ` (${meta.counts.alquiler})` : ""}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="rotulo mb-3 text-chapa/60">Contacto</p>
          <p className="text-[15px]">{meta?.owner_name}</p>
          {meta?.owner_phone && (
            <a href={waLink(meta.owner_phone, "Hola, te escribo desde La Choza.")} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[15px] underline underline-offset-4 hover:text-faja">
              WhatsApp {meta.owner_phone}
            </a>
          )}
        </div>
      </div>
      {process.env.NEXT_PUBLIC_DEMO === "1" && (
        <p className="mx-auto max-w-[1440px] border-t border-chapa/15 px-4 py-4 text-[13px] text-chapa/60 sm:px-6">
          Propiedades, precios y teléfonos de demostración. Fotos ilustrativas de Pexels.
        </p>
      )}
    </footer>
  );
}
