"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { facts, OP_LABEL, price } from "@/lib/format";
import type { ListingSummary, Op } from "@/lib/types";
import { Arrow } from "./arrow";

/** Paleta propia de las franjas: fondo y letra de cada una. */
const FRANJAS = [
  { bg: "#3f46c8", fg: "#ffffff" },
  { bg: "#f0d8d2", fg: "#8a2b1d" },
  { bg: "#1f3a31", fg: "#a6e3bd" },
  { bg: "#d9a441", fg: "#2b1d05" },
  { bg: "#d3eaec", fg: "#1d4d57" },
];

export type Reciente = { listing: ListingSummary; op: Op };

/**
 * Recién publicadas como acordeón de franjas: cada propiedad es una franja de color
 * con su dirección en mono; la elegida se abre a la foto con sus datos.
 * En el celular las franjas son filas que se despliegan.
 */
export function Recientes({ items }: { items: Reciente[] }) {
  const [open, setOpen] = useState(0);
  const id = useId();
  if (items.length === 0) return null;

  return (
    <>
      <div className="hidden h-[min(640px,72vh)] min-h-[480px] lg:flex">
        {items.map(({ listing, op }, i) => {
          const c = FRANJAS[i % FRANJAS.length];
          const active = open === i;
          const operation = listing.operations.find((o) => o.value === op) ?? listing.operations[0];
          return (
            <div key={listing.slug} className="franja flex min-w-0" style={{ flexGrow: active ? 1 : 0, flexBasis: "52px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={active}
                aria-controls={`${id}-${i}`}
                className="dato flex w-[52px] shrink-0 cursor-pointer items-end justify-center pb-8 text-[14px] transition-[filter] hover:brightness-95"
                style={{ background: c.bg, color: c.fg }}
              >
                <span className="whitespace-nowrap [writing-mode:vertical-rl] rotate-180">{active ? `${listing.place} · ${OP_LABEL[operation.value]}` : listing.address_hint}</span>
              </button>
              <div id={`${id}-${i}`} className="relative min-w-0 flex-1 overflow-hidden bg-tinta" hidden={!active}>
                {listing.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.cover.url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.55)_100%)]" aria-hidden />
                <div key={active ? "on" : "off"} className="aparecer absolute inset-0 flex flex-col justify-between p-10 text-white">
                  <p className="titulo max-w-[16ch] text-[clamp(44px,4.6vw,72px)]">{listing.address_hint}</p>
                  <div className="flex items-end justify-between gap-8">
                    <dl className="dato grid gap-y-2.5 text-[14px]">
                      <div>
                        <dt className="sr-only">Barrio</dt>
                        <dd>{listing.place}</dd>
                      </div>
                      <div>
                        <dt className="sr-only">Tipo</dt>
                        <dd>{listing.type.label}</dd>
                      </div>
                      <div>
                        <dt className="sr-only">Datos</dt>
                        <dd>{facts(listing).join(" · ")}</dd>
                      </div>
                      <div>
                        <dt className="sr-only">Precio</dt>
                        <dd>
                          {OP_LABEL[operation.value]} {price(operation)}
                        </dd>
                      </div>
                    </dl>
                    <Link href={`/propiedades/${listing.slug}?op=${operation.value}`} className="dato link-dato group flex shrink-0 items-center gap-2 text-[14px]">
                      Ver propiedad <Arrow className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="lg:hidden">
        {items.map(({ listing, op }, i) => {
          const c = FRANJAS[i % FRANJAS.length];
          const active = open === i;
          const operation = listing.operations.find((o) => o.value === op) ?? listing.operations[0];
          return (
            <li key={listing.slug}>
              <button
                type="button"
                onClick={() => setOpen(active ? -1 : i)}
                aria-expanded={active}
                aria-controls={`${id}-m-${i}`}
                className="dato flex h-14 w-full items-center justify-between gap-4 px-4 text-left text-[13px]"
                style={{ background: c.bg, color: c.fg }}
              >
                <span className="truncate">{listing.address_hint}</span>
                <span className="shrink-0">{listing.place}</span>
              </button>
              {/* Se despliega a lo alto (0fr → 1fr); cerrada queda inerte, fuera del foco y del lector. */}
              <div id={`${id}-m-${i}`} className="franja-fila grid" style={{ gridTemplateRows: active ? "1fr" : "0fr" }} inert={!active}>
                <Link href={`/propiedades/${listing.slug}?op=${operation.value}`} className="block min-h-0 overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-hueso-2">
                    {listing.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.cover.url} alt={listing.headline} className={`franja-foto absolute inset-0 size-full object-cover ${active ? "" : "scale-[1.08]"}`} />
                    )}
                  </div>
                  <div key={active ? "on" : "off"} className={`border-b border-filete py-5 ${active ? "aparecer" : ""}`}>
                    <p className="dato text-tinta-2">
                      {OP_LABEL[operation.value]} · {listing.type.label} · {facts(listing).join(" · ")}
                    </p>
                    <p className="titulo mt-3 text-[30px]">{price(operation)}</p>
                    <p className="mt-2 text-[17px] leading-snug font-medium">{listing.headline}</p>
                    <span className="dato mt-4 inline-flex items-center gap-2 underline decoration-1 underline-offset-4">
                      Ver propiedad <Arrow className="size-4" />
                    </span>
                  </div>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
