"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { TicketThread } from "@/components/ticket-thread";
import { useToast } from "@/components/toast";
import { cx, ErrorState, Field, Input, PageHeader, Panel, PriorityMark, Section, Select, TicketPill, WhatsAppLink } from "@/components/ui";
import { api } from "@/lib/api";
import { fecha, hace } from "@/lib/format";
import { PRIORITIES, type Enum, type Ticket } from "@/lib/types";
import { useApi } from "@/lib/use-api";

type Detail = {
  data: Ticket;
  providers: { id: number; name: string; trade: Enum; phone: string; matches: boolean; whatsapp_url: string }[];
  tenant_whatsapp_url: string | null;
};

const statuses = [
  { value: "abierto", label: "Abierto" },
  { value: "derivado", label: "Derivado" },
  { value: "en_curso", label: "En curso" },
  { value: "resuelto", label: "Resuelto" },
];

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useApi<Detail>(`tickets/${id}`);
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);
  const [cost, setCost] = useState<string | null>(null);

  if (detail.error) return <ErrorState message={detail.error.status === 404 ? "Ese reclamo no existe." : detail.error.message} onRetry={detail.reload} />;
  if (!detail.data) return <div className="skeleton h-64" />;

  const t = detail.data.data;
  const matching = detail.data.providers.filter((p) => p.matches);
  const providers = showAll || matching.length === 0 ? detail.data.providers : matching;

  async function derive(providerId: number, name: string) {
    try {
      await api(`tickets/${t.id}/derive`, { method: "POST", body: { provider_id: providerId } });
      toast(`Derivado a ${name}. Mandale el mensaje en WhatsApp.`);
      detail.reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function update(body: Record<string, unknown>, message: string) {
    try {
      await api(`tickets/${t.id}`, { method: "PUT", body });
      toast(message);
      detail.reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <>
      <PageHeader
        back={{ href: "/admin/reclamos", label: "Reclamos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t.title} <TicketPill status={t.status} />
          </span>
        }
        subtitle={
          <>
            Reclamo #{t.id} ·{" "}
            <Link href={`/admin/propiedades/${t.property?.id}`} className="font-semibold text-ink hover:underline">
              {t.property?.code}
            </Link>{" "}
            {t.property?.address} · {t.tenant?.full_name ?? "sin inquilino"} · cargado {hace(t.created_at)}
          </>
        }
        actions={detail.data.tenant_whatsapp_url && <WhatsAppLink href={detail.data.tenant_whatsapp_url} size="md">Escribirle al inquilino</WhatsAppLink>}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-8">
          <Section title="Qué pasa">
            <Panel className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-sm border border-rule-strong px-2 py-0.5 font-semibold">{t.category.label}</span>
                <PriorityMark priority={t.priority} />
              </div>
              <p className="max-w-prose whitespace-pre-line">{t.description}</p>
              {!!t.photos?.length && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {t.photos.map((p) => (
                    <li key={p.id}>
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="Foto del reclamo" className="size-28 rounded-sm border border-rule object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Section>

          <Section title="Conversación con el inquilino">
            <Panel>
              <TicketThread ticketId={t.id} comments={t.comments ?? []} viewerIsAdmin onAdded={() => detail.reload()} />
            </Panel>
          </Section>
        </div>

        <div className="flex flex-col gap-8">
          <Section
            title={t.provider ? "Derivado a" : "Derivar a un proveedor"}
            actions={
              matching.length > 0 && matching.length < detail.data.providers.length ? (
                <button className="text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? `Solo ${t.category.label.toLowerCase()}` : "Ver todos"}
                </button>
              ) : undefined
            }
          >
            <Panel>
              {t.provider && (
                <div className="flex items-center gap-3 border-b border-rule bg-stamp-soft px-4 py-3">
                  <span className="stamp text-[11px]">Derivado</span>
                  <span className="text-sm">
                    <strong>{t.provider.name}</strong> · {t.derived_at && fecha(t.derived_at)}
                  </span>
                </div>
              )}
              <ul className="divide-y divide-rule">
                {providers.map((p) => {
                  const current = t.provider?.id === p.id;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-semibold">
                          {p.name}
                          {current && <Check className="size-4 text-stamp" aria-label="asignado" />}
                        </p>
                        <p className="text-[12.5px] text-ink-3">
                          {p.trade.label} · <span className="num">{p.phone}</span>
                        </p>
                      </div>
                      <a
                        href={p.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => derive(p.id, p.name)}
                        className={cx("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-semibold transition-colors", current ? "border-rule-strong bg-sheet text-ink hover:border-ink" : "border-whatsapp bg-whatsapp text-white hover:bg-[#136a39]")}
                      >
                        <MessageCircle className="size-4" aria-hidden />
                        {current ? "Reenviar" : "Derivar"}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-rule px-4 py-2.5 text-[12.5px] text-ink-3">“Derivar” abre WhatsApp con la dirección, el inquilino y la falla ya escritos, y marca el reclamo como derivado.</p>
            </Panel>
          </Section>

          <Section title="Seguimiento">
            <Panel className="grid grid-cols-2 gap-4 p-4">
              <Field label="Estado">
                {(fid) => (
                  <Select id={fid} value={t.status.value} onChange={(e) => update({ status: e.target.value }, "Estado actualizado")}>
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Prioridad">
                {(fid) => (
                  <Select id={fid} value={t.priority.value} onChange={(e) => update({ priority: e.target.value }, "Prioridad actualizada")}>
                    {PRIORITIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Costo del arreglo" hint="Para saber cuánto se gastó por unidad." className="col-span-2">
                {(fid, d) => (
                  <Input
                    id={fid}
                    aria-describedby={d}
                    type="number"
                    min="0"
                    step="0.01"
                    className="num"
                    value={cost ?? t.cost ?? ""}
                    onChange={(e) => setCost(e.target.value)}
                    onBlur={() => {
                      if (cost !== null && Number(cost) !== (t.cost ?? 0)) update({ cost: cost === "" ? null : Number(cost) }, "Costo guardado");
                    }}
                  />
                )}
              </Field>
              {t.resolved_at && <p className="col-span-2 text-sm text-ok">Resuelto el {fecha(t.resolved_at)}.</p>}
            </Panel>
          </Section>
        </div>
      </div>
    </>
  );
}
