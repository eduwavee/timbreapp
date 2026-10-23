"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { number, OP_LABEL, pesos, price, waLink } from "@/lib/format";
import type { ListingDetail, Op } from "@/lib/types";
import { Arrow } from "./arrow";

type Errors = Record<string, string[]>;

const input =
  "h-12 w-full border-2 border-tinta bg-chapa px-3 text-[17px] text-tinta placeholder:text-tinta-3 outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_var(--op)] aria-invalid:border-op";

/**
 * El cartel de la ficha: verbo, precio, datos y el "Me interesa".
 * La consulta llega a Timbre; el dueño la atiende o se la pasa a un colega.
 */
export function InquiryPanel({ listing, initialOp, ownerPhone }: { listing: ListingDetail; initialOp: Op; ownerPhone: string | null }) {
  const [op, setOp] = useState<Op>(listing.operations.some((o) => o.value === initialOp) ? initialOp : listing.operations[0].value);
  const operation = listing.operations.find((o) => o.value === op)!;
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: `Hola, me interesa “${listing.headline}” (${listing.code}). ¿Cuándo se puede ver?`, website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const id = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    setMessage(null);
    try {
      const res = await fetch(`/api/consultas/${listing.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, operation: op, email: form.email || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("sent");
        return;
      }
      setErrors(data.errors ?? {});
      setMessage(data.errors ? null : (data.message ?? "No pudimos enviar la consulta. Probá de nuevo."));
      setState("idle");
    } catch {
      setMessage("No hay conexión. Revisá internet y probá de nuevo.");
      setState("idle");
    }
  }

  const err = (k: string) => errors[k]?.[0];
  const rows: [string, string][] = [
    ["Superficie", listing.surface_m2 ? `${number(listing.surface_m2)} m²` : "—"],
    ["Ambientes", listing.rooms ? (listing.rooms === 1 ? "Monoambiente" : String(listing.rooms)) : "—"],
    ["Baños", listing.bathrooms ? String(listing.bathrooms) : "—"],
    ["Cochera", listing.garage ? "Sí" : "No"],
    ["Antigüedad", listing.age_years === null ? "—" : listing.age_years === 0 ? "A estrenar" : `${listing.age_years} años`],
    ["Código", listing.code],
  ];

  return (
    <div data-op={op} className="relative border-2 border-tinta bg-chapa">
      <div className="relative bg-op px-5 pt-6 pb-5 text-chapa transition-colors duration-300">
        <span className="remache top-2.5 left-2.5" />
        <span className="remache top-2.5 right-2.5" />
        {listing.operations.length > 1 && (
          <div role="tablist" aria-label="Operación" className="mb-3 flex gap-1">
            {listing.operations.map((o) => (
              <button
                key={o.value}
                role="tab"
                aria-selected={op === o.value}
                onClick={() => setOp(o.value)}
                className={`rotulo h-9 border-2 px-3 text-[15px] transition-colors ${op === o.value ? "border-chapa bg-chapa text-op" : "border-chapa/60 text-chapa hover:border-chapa"}`}
              >
                {OP_LABEL[o.value]}
              </button>
            ))}
          </div>
        )}
        <p className="cartel text-[88px]">{operation.verb}</p>
        <p className="cartel mt-2 text-[56px]">{price(operation)}</p>
        {op === "alquiler" && operation.price !== null && <p className="rotulo mt-1 text-[15px] text-chapa/85">por mes{listing.expenses ? ` + ${pesos(listing.expenses)} de expensas` : ""}</p>}
        {op === "venta" && listing.expenses ? <p className="rotulo mt-1 text-[15px] text-chapa/85">Expensas {pesos(listing.expenses)}</p> : null}
      </div>

      <dl className="grid grid-cols-2 border-b-2 border-tinta">
        {rows.map(([k, v], i) => (
          <div key={k} className={`px-4 py-2.5 ${i % 2 === 0 ? "border-r-2 border-tinta" : ""} ${i < rows.length - 2 ? "border-b-2 border-tinta" : ""}`}>
            <dt className="rotulo text-[12.5px] text-tinta-3">{k}</dt>
            <dd className="mt-1 text-[17px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <div id="me-interesa" className="relative scroll-mt-6 overflow-hidden px-5 pt-5 pb-6">
        {listing.reserved ? (
          <div className="flex flex-col gap-3">
            <p className="cartel text-[44px]">Ya está reservada</p>
            <p className="text-[16px] text-tinta-2">Alguien llegó primero. Mirá otras parecidas en {listing.place}.</p>
            <Link href={`/propiedades?op=${op}&place=${encodeURIComponent(listing.place)}`} className="cartel flex h-14 items-center justify-center gap-2 bg-tinta text-[28px] text-chapa">
              Ver parecidas <Arrow className="size-6" />
            </Link>
          </div>
        ) : state === "sent" ? (
          <div className="flex min-h-[340px] flex-col justify-end gap-3 pt-24" role="status">
            <span className="faja pegar absolute top-[92px] left-1/2 w-[125%] py-2 text-[50px]">¡Consulta enviada!</span>
            <p className="text-[18px] leading-snug">
              Listo, <strong>{form.name.split(" ")[0]}</strong>. Te escribimos al <strong className="whitespace-nowrap">{form.phone}</strong> por WhatsApp.
            </p>
            {ownerPhone && (
              <a
                href={waLink(ownerPhone, `Hola, acabo de consultar por ${listing.headline} (${listing.code}) en La Choza.`)}
                target="_blank"
                rel="noreferrer"
                className="rotulo flex h-12 items-center justify-center bg-whatsapp text-[17px] text-white transition-colors hover:bg-[#126536]"
              >
                ¿Apurado? Escribinos vos
              </a>
            )}
            <Link href={`/propiedades?op=${op}`} className="rotulo flex h-12 items-center justify-center gap-2 border-2 border-tinta text-[17px] hover:bg-tinta hover:text-chapa">
              Seguir mirando <Arrow className="size-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
            <h2 className="cartel text-[44px]">¿Te interesa?</h2>
            <p className="-mt-1.5 text-[15px] text-tinta-2">Dejá tu WhatsApp y te escribimos para coordinar la visita.</p>
            {message && (
              <p role="alert" className="border-2 border-op bg-chapa px-3 py-2 text-[15px] font-semibold text-op">
                {message}
              </p>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-name`} className="rotulo text-[13px] text-tinta-2">
                Nombre
              </label>
              <input id={`${id}-name`} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required aria-invalid={!!err("name")} aria-describedby={err("name") ? `${id}-name-e` : undefined} />
              {err("name") && <p id={`${id}-name-e`} className="text-[14px] font-semibold text-op">{err("name")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-phone`} className="rotulo text-[13px] text-tinta-2">
                WhatsApp
              </label>
              <input id={`${id}-phone`} className={input} type="tel" inputMode="tel" placeholder="11 6123-4410" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" required aria-invalid={!!err("phone")} aria-describedby={err("phone") ? `${id}-phone-e` : undefined} />
              {err("phone") && <p id={`${id}-phone-e`} className="text-[14px] font-semibold text-op">{err("phone")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-email`} className="rotulo text-[13px] text-tinta-2">
                Mail <span className="normal-case tracking-normal text-tinta-3">(opcional)</span>
              </label>
              <input id={`${id}-email`} className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" aria-invalid={!!err("email")} />
              {err("email") && <p className="text-[14px] font-semibold text-op">{err("email")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-msg`} className="rotulo text-[13px] text-tinta-2">
                Mensaje
              </label>
              <textarea id={`${id}-msg`} className={`${input} h-auto min-h-24 py-2 leading-snug`} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
            <button type="submit" disabled={state === "sending"} className="cartel mt-1 flex h-16 items-center justify-center gap-3 bg-tinta text-[34px] text-chapa transition-colors hover:bg-op-hondo disabled:cursor-wait disabled:opacity-70">
              {state === "sending" ? "Enviando…" : "Me interesa"}
            </button>
            <p className="text-[13px] text-tinta-3">Usamos tus datos solo para responder esta consulta.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/** Barra fija en el celular: precio y atajo al formulario. */
export function MobileBar({ listing, op }: { listing: ListingDetail; op: Op }) {
  const operation = listing.operations.find((o) => o.value === op) ?? listing.operations[0];
  if (listing.reserved) return null;
  return (
    <div data-op={operation.value} className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t-2 border-tinta bg-chapa px-3 py-2.5 lg:hidden">
      <div className="min-w-0">
        <p className="rotulo text-[12px] text-tinta-3">{operation.verb}</p>
        <p className="cartel truncate text-[32px] text-op">{price(operation)}</p>
      </div>
      <a href="#me-interesa" className="cartel ml-auto flex h-12 items-center bg-tinta px-5 text-[26px] text-chapa">
        Me interesa
      </a>
    </div>
  );
}

