"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { OP_LABEL, pesos, price, waLink } from "@/lib/format";
import type { ListingDetail, Op } from "@/lib/types";
import { Arrow } from "./arrow";
import { WhatsAppIcon } from "./whatsapp-icon";

type Errors = Record<string, string[]>;

const input =
  "h-11 w-full rounded-none border-0 border-b border-tinta bg-transparent px-0 text-[16px] text-tinta outline-none placeholder:text-tinta-3 focus-visible:border-b-2 aria-invalid:border-error";

/**
 * Precio y "Me interesa". La consulta llega a Timbre; el dueño la atiende
 * o se la pasa a un colega.
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

  return (
    <div className="border-t border-tinta pt-6">
      {listing.operations.length > 1 ? (
        <div role="tablist" aria-label="Operación" className="dato flex gap-6">
          {listing.operations.map((o) => (
            <button
              key={o.value}
              role="tab"
              aria-selected={op === o.value}
              onClick={() => setOp(o.value)}
              className={`py-1 ${op === o.value ? "font-bold underline decoration-1 underline-offset-[6px]" : "text-tinta-3 hover:text-tinta"}`}
            >
              {OP_LABEL[o.value]}
            </button>
          ))}
        </div>
      ) : (
        <p className="dato text-tinta-2">{OP_LABEL[op]}</p>
      )}
      <p className="titulo mt-4 text-[clamp(40px,4vw,56px)]">{price(operation)}</p>
      {op === "alquiler" && operation.price !== null && <p className="dato mt-3 text-tinta-2">Por mes{listing.expenses ? ` + ${pesos(listing.expenses)} de expensas` : ""}</p>}
      {op === "venta" && listing.expenses ? <p className="dato mt-3 text-tinta-2">Expensas {pesos(listing.expenses)}</p> : null}

      <div id="me-interesa" className="mt-10 scroll-mt-8">
        {listing.reserved ? (
          <div className="flex flex-col gap-4">
            <p className="dato self-start bg-tinta px-3 py-2 text-hueso">Reservada</p>
            <p className="text-[16px] text-tinta-2">Alguien llegó primero. Mirá otras parecidas en {listing.place}.</p>
            <Link href={`/propiedades?op=${op}&place=${encodeURIComponent(listing.place)}`} className="dato flex h-12 items-center justify-center gap-3 bg-tinta text-[14px] text-hueso hover:bg-tinta-2">
              Ver parecidas <Arrow className="size-4" />
            </Link>
          </div>
        ) : state === "sent" ? (
          <div className="aparecer flex flex-col gap-4" role="status">
            <p className="titulo text-[34px]">Consulta enviada.</p>
            <p className="text-[17px] leading-snug text-tinta-2">
              Listo, <strong className="text-tinta">{form.name.split(" ")[0]}</strong>. Te escribimos al <strong className="whitespace-nowrap text-tinta">{form.phone}</strong> por WhatsApp.
            </p>
            {ownerPhone && (
              <a
                href={waLink(ownerPhone, `Hola, acabo de consultar por ${listing.headline} (${listing.code}) en Brunito.`)}
                target="_blank"
                rel="noreferrer"
                className="dato mt-2 flex h-12 items-center justify-center gap-3 bg-whatsapp text-[14px] text-white transition-colors hover:bg-whatsapp-hondo"
              >
                <WhatsAppIcon className="size-5" />
                ¿Apurado? Escribinos vos
              </a>
            )}
            <Link href={`/propiedades?op=${op}`} className="dato flex h-12 items-center justify-center gap-3 border border-tinta text-[14px] hover:bg-tinta hover:text-hueso">
              Seguir mirando <Arrow className="size-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="relative flex flex-col gap-6">
            <div>
              <h2 className="titulo text-[30px]">¿Te interesa?</h2>
              <p className="mt-2 text-[15px] text-tinta-2">Dejá tu WhatsApp y te escribimos para coordinar la visita.</p>
            </div>
            {message && (
              <p role="alert" className="text-[15px] font-medium text-error">
                {message}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-name`} className="dato text-tinta-3">
                Nombre
              </label>
              <input id={`${id}-name`} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required aria-invalid={!!err("name")} aria-describedby={err("name") ? `${id}-name-e` : undefined} />
              {err("name") && <p id={`${id}-name-e`} className="text-[14px] font-medium text-error">{err("name")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-phone`} className="dato text-tinta-3">
                WhatsApp
              </label>
              <input id={`${id}-phone`} className={input} type="tel" inputMode="tel" placeholder="11 6123-4410" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" required aria-invalid={!!err("phone")} aria-describedby={err("phone") ? `${id}-phone-e` : undefined} />
              {err("phone") && <p id={`${id}-phone-e`} className="text-[14px] font-medium text-error">{err("phone")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-email`} className="dato text-tinta-3">
                Mail (opcional)
              </label>
              <input id={`${id}-email`} className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" aria-invalid={!!err("email")} aria-describedby={err("email") ? `${id}-email-e` : undefined} />
              {err("email") && <p id={`${id}-email-e`} className="text-[14px] font-medium text-error">{err("email")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-msg`} className="dato text-tinta-3">
                Mensaje
              </label>
              <textarea id={`${id}-msg`} className={`${input} h-auto min-h-24 py-2 leading-snug [field-sizing:content]`} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
            <button type="submit" disabled={state === "sending"} className="dato group flex h-14 items-center justify-center gap-3 bg-tinta text-[14px] text-hueso transition-colors hover:bg-tinta-2 disabled:cursor-wait disabled:opacity-70">
              {state === "sending" ? "Enviando…" : "Me interesa"}
              {state !== "sending" && <Arrow className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />}
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
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-tinta bg-hueso px-4 py-3 lg:hidden">
      <div className="min-w-0">
        <p className="dato text-[12px] text-tinta-3">{OP_LABEL[operation.value]}</p>
        <p className="titulo truncate text-[24px] tracking-[-0.03em]">{price(operation)}</p>
      </div>
      <a href="#me-interesa" className="dato ml-auto flex h-12 items-center gap-2 bg-tinta px-5 text-[14px] text-hueso">
        Me interesa
      </a>
    </div>
  );
}
