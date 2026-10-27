import Link from "next/link";
import type { Meta } from "@/lib/types";
import { Arrow } from "./arrow";

/**
 * Los barrios como índice tipográfico: el nombre grande y, en mono,
 * cuántas hay en venta y en alquiler. Cada cantidad lleva a esa búsqueda.
 */
export function PlacesList({ meta }: { meta: Meta }) {
  if (!meta.places.length) return null;
  const places = [...meta.places].sort((a, b) => a.city.localeCompare(b.city, "es") || a.name.localeCompare(b.name, "es"));

  return (
    <ul className="border-t border-tinta">
      {places.map((p) => {
        const op = p.venta >= p.alquiler ? "venta" : "alquiler";
        return (
          <li key={p.name} className="group relative grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-filete py-4 sm:grid-cols-[1fr_10rem_10rem_2rem] sm:py-5">
            <Link href={`/propiedades?op=${op}&place=${encodeURIComponent(p.name)}`} className="titulo text-[clamp(26px,3.4vw,44px)] tracking-[-0.035em] after:absolute after:inset-0">
              {p.name}
              {p.city !== p.name && <span className="dato ml-3 align-middle text-tinta-3 tracking-[0.02em]">{p.city}</span>}
            </Link>
            <span className={`dato hidden sm:block ${p.venta ? "" : "text-tinta-3"}`}>{p.venta ? `${p.venta} en venta` : "Sin venta"}</span>
            <span className={`dato hidden sm:block ${p.alquiler ? "" : "text-tinta-3"}`}>{p.alquiler ? `${p.alquiler} en alquiler` : "Sin alquiler"}</span>
            <span className="dato text-right sm:hidden">{[p.venta && `${p.venta} venta`, p.alquiler && `${p.alquiler} alq.`].filter(Boolean).join(" · ")}</span>
            <Arrow className="hidden size-5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 sm:block" />
          </li>
        );
      })}
    </ul>
  );
}
