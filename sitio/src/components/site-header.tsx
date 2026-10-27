import Link from "next/link";
import { waLink } from "@/lib/format";
import { Wordmark } from "./choza-mark";

/**
 * Header mínimo: la marca a la izquierda y la navegación en mono a la derecha.
 * Sobre la foto del inicio va transparente y en blanco.
 */
export function SiteHeader({ ownerPhone, overlay = false, current }: { ownerPhone?: string | null; overlay?: boolean; current?: "venta" | "alquiler" }) {
  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 text-white" : "relative border-b border-filete text-tinta"} z-20`}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:h-20 sm:px-8">
        <Link href="/" className="text-[26px] sm:text-[30px]" aria-label="La Choza, inicio">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="dato ml-auto flex items-center gap-4 sm:gap-8">
          <Link href="/propiedades?op=venta" aria-current={current === "venta" ? "page" : undefined} className="link-dato py-2">
            Comprar
          </Link>
          <Link href="/propiedades?op=alquiler" aria-current={current === "alquiler" ? "page" : undefined} className="link-dato py-2">
            Alquilar
          </Link>
          {ownerPhone && (
            <a href={waLink(ownerPhone, "Hola, quiero publicar una propiedad en La Choza.")} target="_blank" rel="noreferrer" className="link-dato hidden py-2 md:inline">
              Publicar
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
