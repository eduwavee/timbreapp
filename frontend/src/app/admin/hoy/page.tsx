"use client";

import Link from "next/link";
import { AdjustmentCard } from "@/components/adjustment-card";
import { useToast } from "@/components/toast";
import { cx, Empty, ErrorState, Money, PageHeader, Panel, Section, SkeletonRows, TextLink, WhatsAppLink } from "@/components/ui";
import { api } from "@/lib/api";
import { ars, currentPeriod, diasDesde, fecha, hace, hoyLargo, today } from "@/lib/format";
import type { AdjustmentSuggestion, Contract, ContractDocument, Ledger, LedgerRow, Proof, Ticket } from "@/lib/types";
import { useApi } from "@/lib/use-api";

/** Cada cuánto se vuelve a avisar a un moroso. */
const REMIND_EVERY_DAYS = 7;

type Dashboard = {
  open_tickets: Ticket[];
  pending_proofs: Proof[];
  expiring_contracts: { data: Contract[] } | Contract[];
  expiring_documents: (ContractDocument & { contract_id: number; property_code: string; tenant: string })[];
};

/**
 * Tus avisos de hoy: lo que pide acción, en el orden en que conviene hacerlo.
 * Lo que ya se resolvió (avisado esta semana, ajuste aplicado) sale solo de la lista.
 */
export default function TodayPage() {
  const ledger = useApi<Ledger>(`ledger?period=${currentPeriod()}`);
  const adjustments = useApi<{ data: AdjustmentSuggestion[] }>("adjustments");
  const dash = useApi<Dashboard>("dashboard");
  const inquiries = useApi<{ data: unknown[] }>("inquiries?status=nueva");
  const toast = useToast();

  const rows = ledger.data?.rows ?? [];
  const toRemind = rows
    .filter((r) => r.days_late > 0 && r.whatsapp_url && (!r.last_reminder_at || diasDesde(r.last_reminder_at) >= REMIND_EVERY_DAYS))
    .sort((a, b) => b.days_late - a.days_late);
  const dueToday = rows.filter((r) => r.due_date === today() && r.stage?.value !== "pagada");
  const pendingAdjustments = adjustments.data?.data ?? [];
  const unassigned = (dash.data?.open_tickets ?? []).filter((t) => t.status.value === "abierto");
  const proofs = dash.data?.pending_proofs ?? [];
  const newInquiries = inquiries.data?.data.length ?? 0;
  const ending = dash.data ? (Array.isArray(dash.data.expiring_contracts) ? dash.data.expiring_contracts : dash.data.expiring_contracts.data) : [];
  const documents = dash.data?.expiring_documents ?? [];

  const loaded = ledger.data && adjustments.data && dash.data;
  const nothing = loaded && !toRemind.length && !dueToday.length && !pendingAdjustments.length && !unassigned.length && !proofs.length && !newInquiries && !ending.length && !documents.length;

  async function logReminder(row: LedgerRow) {
    if (!row.action_installment_id) return;
    try {
      await api(`installments/${row.action_installment_id}/reminder`, { method: "POST" });
      ledger.setData((d) => (d ? { ...d, rows: d.rows.map((r) => (r.contract_id === row.contract_id ? { ...r, last_reminder_at: new Date().toISOString() } : r)) } : d));
      toast(`Aviso a ${row.tenant.name} registrado`);
    } catch {
      toast("No se pudo registrar el aviso", "error");
    }
  }

  const error = ledger.error ?? adjustments.error ?? dash.error;

  return (
    <>
      <PageHeader title={`Hoy, ${hoyLargo().toLowerCase()}`} subtitle="Lo que pide acción, en el orden en que conviene hacerlo. Lo que resolvés sale de la lista." />
      {error && <ErrorState message={error.message} onRetry={() => (ledger.reload(), adjustments.reload(), dash.reload())} />}
      {!loaded && !error && (
        <Panel>
          <SkeletonRows rows={6} cols={3} />
        </Panel>
      )}
      {nothing && (
        <Panel>
          <Empty title="Nada pendiente por hoy">Nadie para avisar, ningún ajuste por aplicar y ningún reclamo esperando. Buen día.</Empty>
        </Panel>
      )}

      {loaded && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {(!!proofs.length || !!unassigned.length || !!newInquiries) && (
            <Section title="Para revisar" className="xl:col-span-2">
              <ul className="grid gap-3 sm:grid-cols-3">
                {[
                  { n: proofs.length, label: proofs.length === 1 ? "comprobante para confirmar" : "comprobantes para confirmar", href: "/admin/cobros?tab=comprobantes" },
                  { n: unassigned.length, label: unassigned.length === 1 ? "reclamo sin derivar" : "reclamos sin derivar", href: "/admin" },
                  { n: newInquiries, label: newInquiries === 1 ? "consulta nueva de Brunito" : "consultas nuevas de Brunito", href: "/admin/consultas" },
                ]
                  .filter((t) => t.n > 0)
                  .map((t) => (
                    <li key={t.href}>
                      <Link href={t.href} className="flex items-baseline gap-2 rounded-sm border border-rule bg-sheet px-4 py-3 hover:border-ink">
                        <span className="num marker text-[22px] font-semibold">{t.n}</span>
                        <span className="text-sm">{t.label}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {!!toRemind.length && (
            <Section title={`Avisar por WhatsApp (${toRemind.length})`} actions={<TextLink href="/admin?ver=deuda">Ver en la liquidación</TextLink>}>
              <Panel>
                <ul className="divide-y divide-rule">
                  {toRemind.map((r) => (
                    <li key={r.contract_id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate">
                          <Link href={`/admin/propiedades/${r.property.id}`} className="font-bold hover:underline">
                            {r.property.code}
                          </Link>{" "}
                          <span className="text-ink-2">· {r.tenant.name}</span>
                        </p>
                        <p className="text-[13px] text-ink-3">
                          <Money value={r.total_due} tone="debt" short /> · {r.days_late} {r.days_late === 1 ? "día" : "días"} de atraso · {r.last_reminder_at ? `último aviso ${hace(r.last_reminder_at)}` : "nunca se le avisó"}
                        </p>
                      </div>
                      <WhatsAppLink href={r.whatsapp_url!} onSent={() => logReminder(r)}>
                        Avisar
                      </WhatsAppLink>
                    </li>
                  ))}
                </ul>
              </Panel>
            </Section>
          )}

          {!!pendingAdjustments.length && (
            <Section title={`Ajustes para aplicar (${pendingAdjustments.length})`} actions={<TextLink href="/admin/agenda">Agenda</TextLink>}>
              <Panel>
                <ul className="divide-y divide-rule">
                  {pendingAdjustments.map((s) => (
                    <li key={s.contract_id} className="px-4 py-3">
                      <AdjustmentCard suggestion={s} onApplied={adjustments.reload} showContract />
                    </li>
                  ))}
                </ul>
              </Panel>
            </Section>
          )}

          {!!dueToday.length && (
            <Section title={`Vencen hoy (${dueToday.length})`}>
              <Panel>
                <ul className="divide-y divide-rule">
                  {dueToday.map((r) => (
                    <li key={r.contract_id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-bold">{r.property.code}</span> <span className="text-ink-2">· {r.tenant.name}</span>
                      </span>
                      <span className="num font-semibold">{ars(r.total_due, { short: true })}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </Section>
          )}

          {(!!ending.length || !!documents.length) && (
            <Section title="Se vienen">
              <Panel>
                <ul className="divide-y divide-rule text-sm">
                  {ending.map((c) => (
                    <li key={`c${c.id}`}>
                      <Link href={`/admin/contratos/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-paper">
                        <span className="min-w-0 truncate">
                          Termina el contrato de <span className="font-bold">{c.property?.code}</span> <span className="text-ink-2">· {c.tenant?.full_name}</span>
                        </span>
                        <span className={cx("num shrink-0 text-[13px]", c.days_to_end < 60 ? "font-semibold text-debt" : "text-ink-2")}>{c.days_to_end < 0 ? "vencido" : `en ${c.days_to_end} días`}</span>
                      </Link>
                    </li>
                  ))}
                  {documents.map((d) => (
                    <li key={`d${d.id}`}>
                      <Link href={`/admin/contratos/${d.contract_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-paper">
                        <span className="min-w-0 truncate">
                          Vence {d.kind.label.toLowerCase()} de <span className="font-bold">{d.property_code}</span> <span className="text-ink-2">· {d.tenant}</span>
                        </span>
                        <span className="num shrink-0 text-[13px] text-ink-2">{d.expires_on && fecha(d.expires_on)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </Section>
          )}
        </div>
      )}
    </>
  );
}
