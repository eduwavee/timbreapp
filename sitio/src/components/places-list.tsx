import Link from "next/link";
import type { Meta, Op } from "@/lib/types";

/** Los barrios como un listado de cartelitos de calle: nombre grande y cuántos avisos hay. */
export function PlacesList({ meta, op }: { meta: Meta; op: Op }) {
  const places = meta.places.filter((p) => p[op] > 0);
  if (!places.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-2">
      {places.map((p) => (
        <li key={p.name}>
          <Link
            href={`/propiedades?op=${op}&place=${encodeURIComponent(p.name)}`}
            className="group flex items-baseline gap-2 border-2 border-tinta bg-chapa px-3 pt-2 pb-1.5 transition-colors hover:bg-tinta hover:text-chapa"
          >
            <span className="cartel text-[34px] sm:text-[40px]">{p.name}</span>
            <span className="cartel text-[24px] text-op group-hover:text-faja">{p[op]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
