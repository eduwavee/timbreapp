"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, MessageCircle, Send } from "lucide-react";
import { api } from "@/lib/api";
import { fecha, hace } from "@/lib/format";
import type { Colleague, Inquiry } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useToast } from "./toast";
import { Button, cx, ErrorState, Field, Select, Sheet, Textarea, WhatsAppLink } from "./ui";

const statusStyles: Record<string, string> = {
  nueva: "bg-marker text-ink border-marker",
  atendiendo: "bg-sheet text-ink border-ink/40",
  derivada: "bg-stamp-soft text-stamp border-stamp/30",
  cerrada: "bg-sheet-2 text-ink-2 border-rule-strong",
};

export function InquiryPill({ inquiry }: { inquiry: Pick<Inquiry, "status" | "outcome"> }) {
  const label = inquiry.status.value === "cerrada" && inquiry.outcome ? inquiry.outcome.label : inquiry.status.label;
  return <span className={cx("inline-flex h-6 items-center rounded-sm border px-2 text-[12px] font-semibold whitespace-nowrap", statusStyles[inquiry.status.value])}>{label}</span>;
}

/** "Venta" o "Alquiler" en tinta: el color queda para la deuda y lo cobrado. */
export function OperationTag({ operation }: { operation: Inquiry["operation"] }) {
  return <span className="label inline-flex h-6 items-center rounded-sm border border-ink px-1.5 text-[11px] text-ink">{operation.value === "venta" ? "Venta" : "Alquiler"}</span>;
}

type Detail = { data: Inquiry; suggested_colleague_id: number | null; same_person: { data: Inquiry[] } | Inquiry[] };

/**
 * Una consulta de Brunito: quién es, qué propiedad pidió y las dos salidas,
 * atenderla uno mismo o pasársela a un colega, las dos por WhatsApp.
 */
export function InquirySheet({ id, onClose, onChanged }: { id: number | null; onClose: () => void; onChanged: () => void }) {
  const detail = useApi<Detail>(id ? `inquiries/${id}` : null);
  const colleagues = useApi<{ data: Colleague[] }>(id ? "colleagues" : null);
  const toast = useToast();
  const [colleagueId, setColleagueId] = useState<string>("");
  const [notes, setNotes] = useState<{ id: number; value: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const inquiry = detail.data?.data;
  const others = detail.data ? (Array.isArray(detail.data.same_person) ? detail.data.same_person : detail.data.same_person.data) : [];
  const active = (colleagues.data?.data ?? []).filter((c) => c.active);
  const suggested = detail.data?.suggested_colleague_id;
  const chosen = colleagueId || (suggested ? String(suggested) : active[0] ? String(active[0].id) : "");
  const noteValue = notes && notes.id === inquiry?.id ? notes.value : (inquiry?.notes ?? "");

  async function markContacted() {
    if (!inquiry) return;
    try {
      await api(`inquiries/${inquiry.id}/contact`, { method: "POST" });
      toast(`Le escribiste a ${inquiry.name}`);
      detail.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function derive() {
    if (!inquiry || !chosen) return;
    // La pestaña se abre en el clic (si no, el navegador la bloquea) y recibe el link cuando vuelve la API.
    const tab = window.open("", "_blank");
    setBusy("derive");
    try {
      const res = await api<{ data: Inquiry; whatsapp: { url: string } }>(`inquiries/${inquiry.id}/derive`, { method: "POST", body: { colleague_id: Number(chosen) } });
      if (tab) tab.location.href = res.whatsapp.url;
      else window.location.href = res.whatsapp.url;
      toast(`Consulta derivada a ${res.data.colleague?.name}`);
      detail.reload();
      onChanged();
    } catch (e) {
      tab?.close();
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function patch(body: Record<string, unknown>, message: string) {
    if (!inquiry) return;
    setBusy(JSON.stringify(body));
    try {
      await api(`inquiries/${inquiry.id}`, { method: "PATCH", body });
      toast(message);
      detail.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  const closed = inquiry?.status.value === "cerrada";

  return (
    <Sheet
      open={id !== null}
      onClose={onClose}
      title={inquiry ? `Consulta de ${inquiry.name}` : "Consulta"}
      description={inquiry && <span>Entró por Brunito {hace(inquiry.created_at)}</span>}
      footer={
        inquiry &&
        (closed ? (
          <Button onClick={() => patch({ status: "atendiendo" }, "Consulta reabierta")} loading={busy === JSON.stringify({ status: "atendiendo" })}>
            Reabrir
          </Button>
        ) : (
          <>
            <Button variant="ghost" className="mr-auto" onClick={() => patch({ outcome: "descartada" }, "Consulta cerrada")} loading={busy === JSON.stringify({ outcome: "descartada" })}>
              No avanzó
            </Button>
            <Button variant="stamp" onClick={() => patch({ outcome: "concretada" }, "¡Operación concretada!")} loading={busy === JSON.stringify({ outcome: "concretada" })}>
              Se concretó
            </Button>
          </>
        ))
      }
    >
      {detail.error && <ErrorState message={detail.error.message} onRetry={detail.reload} />}
      {!inquiry && !detail.error && <div className="skeleton h-48" />}
      {inquiry && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <OperationTag operation={inquiry.operation} />
              <InquiryPill inquiry={inquiry} />
              {inquiry.colleague && inquiry.status.value === "derivada" && <span className="text-[13px] text-ink-2">a {inquiry.colleague.name}</span>}
            </div>
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-[14px]">
              <dt className="text-ink-3">WhatsApp</dt>
              <dd className="num">{inquiry.phone}</dd>
              {inquiry.email && (
                <>
                  <dt className="text-ink-3">Mail</dt>
                  <dd className="truncate">
                    <a href={`mailto:${inquiry.email}`} className="underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                      {inquiry.email}
                    </a>
                  </dd>
                </>
              )}
              {inquiry.contacted_at && (
                <>
                  <dt className="text-ink-3">Le escribiste</dt>
                  <dd>{hace(inquiry.contacted_at)}</dd>
                </>
              )}
              {inquiry.derived_at && (
                <>
                  <dt className="text-ink-3">Derivada</dt>
                  <dd>
                    {fecha(inquiry.derived_at)} {inquiry.colleague && <>a {inquiry.colleague.name}</>}
                  </dd>
                </>
              )}
            </dl>
            {inquiry.message && <p className="rounded-sm border border-whatsapp-bubble-rule bg-whatsapp-bubble px-3 py-2 text-[14px] leading-relaxed">{inquiry.message}</p>}
          </section>

          {inquiry.property && inquiry.listing && (
            <section className="flex gap-3 rounded-sm border border-rule bg-paper p-3">
              {inquiry.property.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inquiry.property.cover_url} alt="" className="size-16 shrink-0 rounded-sm border border-rule object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px]">
                  <Link href={`/admin/propiedades/${inquiry.property.id}`} className="font-bold hover:underline">
                    {inquiry.property.code}
                  </Link>{" "}
                  <span className="text-ink-2">· {inquiry.property.address}</span>
                </p>
                <p className="mt-0.5 truncate text-[13.5px] font-semibold">{inquiry.listing.headline}</p>
                <p className="num mt-0.5 text-[13px] text-ink-2">
                  {inquiry.listing.price_label}
                  {inquiry.listing.reserved && <span className="ml-1.5 font-semibold text-ink">· Reservada</span>}
                </p>
                <a href={inquiry.listing.public_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                  Ver en la web <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>
            </section>
          )}

          {!closed && (
            <section className="flex flex-col gap-4">
              <div className="rounded-sm border border-rule bg-sheet p-3">
                <p className="font-semibold">La atiendo yo</p>
                <p className="mt-0.5 mb-3 text-[13px] text-ink-2">Se abre WhatsApp con la respuesta ya escrita y la consulta queda a tu cargo.</p>
                {inquiry.reply_url && (
                  <WhatsAppLink href={inquiry.reply_url} onSent={markContacted} size="md">
                    Escribirle a {inquiry.name.split(" ")[0]}
                  </WhatsAppLink>
                )}
              </div>
              <div className="rounded-sm border border-rule bg-sheet p-3">
                <p className="font-semibold">Derivar a un colega</p>
                <p className="mt-0.5 mb-3 text-[13px] text-ink-2">Le pasa los datos de {inquiry.name.split(" ")[0]} y de la propiedad al vendedor que elijas.</p>
                {colleagues.data && active.length === 0 ? (
                  <p className="text-[13px] text-ink-2">
                    Todavía no cargaste colegas.{" "}
                    <Link href="/admin/colegas" className="font-semibold text-ink underline decoration-rule-strong underline-offset-4">
                      Cargar uno
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Colega" className="min-w-0 flex-1">
                      {(fid) => (
                        <Select id={fid} value={chosen} onChange={(e) => setColleagueId(e.target.value)}>
                          {active.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                              {c.zone ? ` · ${c.zone}` : ""}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <Button variant="whatsapp" onClick={derive} loading={busy === "derive"} disabled={!chosen}>
                      <Send className="size-4" aria-hidden /> Derivar
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          <Field label="Notas internas" hint="Solo las ves vos.">
            {(fid, d) => (
              <Textarea
                id={fid}
                aria-describedby={d}
                rows={3}
                className="min-h-20"
                value={noteValue}
                onChange={(e) => setNotes({ id: inquiry.id, value: e.target.value })}
                onBlur={() => notes && notes.value !== (inquiry.notes ?? "") && patch({ notes: notes.value || null }, "Nota guardada")}
                placeholder="Visita el sábado 11 h, pidió fotos del baño…"
              />
            )}
          </Field>

          {others.length > 0 && (
            <section>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-2">{inquiry.name.split(" ")[0]} también consultó por</p>
              <ul className="divide-y divide-rule rounded-sm border border-rule">
                {others.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                    <span className="truncate">
                      <span className="font-bold">{o.listing?.headline ?? o.property?.code}</span> <span className="text-ink-3">· {hace(o.created_at)}</span>
                    </span>
                    <InquiryPill inquiry={o} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
            <MessageCircle className="size-3.5" aria-hidden /> Los mensajes se editan en Ajustes y mensajes.
          </p>
        </div>
      )}
    </Sheet>
  );
}
