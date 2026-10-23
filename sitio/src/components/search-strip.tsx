"use client";

import { useState } from "react";
import type { Filters, Meta, Op } from "@/lib/types";
import { Arrow } from "./arrow";

const ROOMS = [
  { value: "1", label: "Monoambiente" },
  { value: "2", label: "2 ambientes" },
  { value: "3", label: "3 ambientes" },
  { value: "4", label: "4 o más" },
];

const field = "h-12 w-full appearance-none bg-transparent pr-7 text-[17px] font-semibold text-tinta outline-none";
const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23141414' stroke-width='2.4'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/**
 * La línea del cartel donde iría el teléfono: acá va el buscador.
 * Es un formulario GET común, así funciona sin JavaScript.
 */
export function SearchStrip({ op, meta, initial = {}, count }: { op: Op; meta: Meta; initial?: Partial<Filters>; count?: number }) {
  const [place, setPlace] = useState(initial.place ?? "");
  const places = meta.places.filter((p) => p[op] > 0);
  const total = count ?? meta.counts[op];

  return (
    <form action="/propiedades" method="get" className="grid grid-cols-2 border-2 border-tinta bg-chapa text-tinta lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
      <input type="hidden" name="op" value={op} />
      <label className="flex min-w-0 flex-col justify-center col-span-2 border-b-2 border-tinta px-4 pt-2.5 lg:col-span-1 lg:border-r-2 lg:border-b-0">
        <span className="rotulo text-[13px] text-tinta-2">Barrio</span>
        <select name="place" value={place} onChange={(e) => setPlace(e.target.value)} className={field} style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right center", backgroundSize: "18px" }}>
          <option value="">Todos los barrios</option>
          {places.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p[op]})
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col justify-center border-r-2 border-b-2 border-tinta px-4 pt-2.5 lg:border-b-0">
        <span className="rotulo text-[13px] text-tinta-2">Tipo</span>
        <select name="type" defaultValue={initial.type ?? ""} className={field} style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right center", backgroundSize: "18px" }}>
          <option value="">Cualquiera</option>
          {meta.types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col justify-center border-b-2 border-tinta px-4 pt-2.5 lg:border-r-2 lg:border-b-0">
        <span className="rotulo text-[13px] text-tinta-2">Ambientes</span>
        <select name="rooms" defaultValue={initial.rooms ?? ""} className={field} style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right center", backgroundSize: "18px" }}>
          <option value="">Da igual</option>
          {ROOMS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col justify-center col-span-2 border-b-2 border-tinta px-4 pt-2.5 lg:col-span-1 lg:border-r-2 lg:border-b-0">
        <span className="rotulo text-[13px] text-tinta-2">Hasta {op === "venta" ? "(USD)" : "($ por mes)"}</span>
        <input
          key={op}
          name="max_price"
          type="number"
          inputMode="numeric"
          min={0}
          step={op === "venta" ? 1000 : 10000}
          defaultValue={initial.max_price ?? ""}
          placeholder={op === "venta" ? "200.000" : "700.000"}
          className={`${field} placeholder:font-normal placeholder:text-tinta-3`}
        />
      </label>
      <button type="submit" className="cartel flex col-span-2 min-h-16 items-center justify-center gap-2 bg-tinta px-7 text-[30px] text-chapa transition-colors hover:bg-op-hondo lg:col-span-1">
        Ver {total} <Arrow className="size-7" />
      </button>
    </form>
  );
}
