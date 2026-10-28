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

const OPS: { value: Op; label: string }[] = [
  { value: "venta", label: "Comprar" },
  { value: "alquiler", label: "Alquilar" },
];

const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111110' stroke-width='1.6'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
export const selectStyle = { backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center", backgroundSize: "16px" };
export const field =
  "h-11 w-full min-w-0 appearance-none rounded-none border-0 border-b border-tinta bg-transparent pr-6 text-[16px] font-semibold text-tinta outline-none placeholder:font-normal placeholder:text-tinta-3 focus-visible:border-b-2";

/**
 * El buscador. Es un formulario GET común, así funciona sin JavaScript.
 * En el inicio trae el selector Comprar / Alquilar; en el listado la operación ya viene dada.
 */
export function SearchForm({ op: initialOp, meta, initial = {}, withOp = false }: { op: Op; meta: Meta; initial?: Partial<Filters>; withOp?: boolean }) {
  const [op, setOp] = useState<Op>(initialOp);
  const [place, setPlace] = useState(initial.place ?? "");
  const places = meta.places.filter((p) => p[op] > 0);
  const chosen = places.find((p) => p.name === place);
  const total = chosen ? chosen[op] : meta.counts[op];
  // Con tipo, ambientes o precio no sabemos cuántas quedan: el botón solo dice "Buscar".
  const refined = Boolean(initial.type || initial.rooms || initial.max_price);

  // Con el selector de operación son 6 campos: en una fila recién entran desde xl; antes van en dos filas de 4.
  return (
    <form
      action="/propiedades"
      method="get"
      className={`grid grid-cols-2 items-end gap-x-5 gap-y-5 lg:gap-x-7 ${withOp ? "md:grid-cols-4 xl:grid-cols-[auto_1.4fr_1fr_1fr_1fr_auto]" : "lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"}`}
    >
      {withOp ? (
        <fieldset className="col-span-2 xl:col-span-1">
          <legend className="dato mb-2 text-tinta-3">Operación</legend>
          <div className="flex h-11 items-center gap-6 border-b border-tinta">
            {OPS.map((o) => (
              <label key={o.value} className="dato cursor-pointer text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
                <input
                  type="radio"
                  name="op"
                  value={o.value}
                  checked={op === o.value}
                  onChange={() => {
                    setOp(o.value);
                    setPlace("");
                  }}
                  className="sr-only"
                />
                <span className={op === o.value ? "font-bold text-tinta underline decoration-1 underline-offset-[6px]" : "text-tinta-3 hover:text-tinta"}>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="op" value={op} />
      )}
      <label className={`col-span-2 flex min-w-0 flex-col gap-2 ${withOp ? "xl:col-span-1" : "lg:col-span-1"}`}>
        <span className="dato text-tinta-3">Barrio</span>
        <select name="place" value={place} onChange={(e) => setPlace(e.target.value)} className={field} style={selectStyle}>
          <option value="">Todos los barrios</option>
          {places.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p[op]})
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2">
        <span className="dato text-tinta-3">Tipo</span>
        <select name="type" defaultValue={initial.type ?? ""} className={field} style={selectStyle}>
          <option value="">Cualquiera</option>
          {meta.types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2">
        <span className="dato text-tinta-3">Ambientes</span>
        <select name="rooms" defaultValue={initial.rooms ?? ""} className={field} style={selectStyle}>
          <option value="">Da igual</option>
          {ROOMS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2">
        <span className="dato text-tinta-3">Hasta {op === "venta" ? "USD" : "$ / mes"}</span>
        <input
          key={op}
          name="max_price"
          type="number"
          inputMode="numeric"
          min={0}
          step={op === "venta" ? 1000 : 10000}
          defaultValue={initial.max_price ?? ""}
          placeholder={op === "venta" ? "200.000" : "700.000"}
          className={`${field} pr-0`}
        />
      </label>
      <button type="submit" className="dato group flex h-12 items-center justify-center gap-3 bg-tinta px-6 text-[14px] text-hueso transition-colors hover:bg-tinta-2">
        {refined ? "Buscar" : `Ver ${total}`}
        <Arrow className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
      </button>
    </form>
  );
}
