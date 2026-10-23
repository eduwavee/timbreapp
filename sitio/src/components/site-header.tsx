import Link from "next/link";
import { waLink } from "@/lib/format";
import { Wordmark } from "./choza-mark";

/** La baranda del balcón: de acá cuelga el cartel. */
export function SiteHeader({ ownerPhone }: { ownerPhone?: string | null }) {
  return (
    <header className="relative z-20 border-b-2 border-tinta bg-pared">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="text-[30px] text-tinta" aria-label="La Choza, inicio">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/propiedades?op=venta" className="rotulo flex h-10 items-center px-2.5 text-[16px] hover:text-rojo sm:px-3">
            Comprar
          </Link>
          <Link href="/propiedades?op=alquiler" className="rotulo flex h-10 items-center px-2.5 text-[16px] hover:text-azul sm:px-3">
            Alquilar
          </Link>
          {ownerPhone && (
            <a
              href={waLink(ownerPhone, "Hola, quiero publicar una propiedad en La Choza.")}
              target="_blank"
              rel="noreferrer"
              className="rotulo hidden h-10 items-center border-2 border-tinta px-3 text-[16px] transition-colors hover:bg-tinta hover:text-chapa md:flex"
            >
              Publicá tu propiedad
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
