"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentSheet } from "@/components/payment-sheet";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, Money, Panel, PriorityMark, SearchBox, Section, SkeletonRows, StagePill, Table, Td, TextLink, Th, TicketPill, WhatsAppLink } from "@/components/ui";
import { api } from "@/lib/api";
import { ars, currentPeriod, fecha, fechaCorta, hace, periodo, shiftPeriod, today } from "@/lib/format";
import { matches } from "@/lib/search";
import type { ActivityEvent, Contract, ContractDocument, Inquiry, Ledger, LedgerRow, Proof, Ticket } from "@/lib/types";
import { OperationTag } from "@/components/inquiry-sheet";
import { ActivityFeed } from "@/components/activity-feed";
import { ProofReview } from "@/components/proof-review";
import { useApi } from "@/lib/use-api";

type OpenTicket = Ticket & { suggested_provider: { id: number; name: string; whatsapp_url: string } | null };

type Dashboard = {
  occupancy: { total: number; occupied: number; maintenance: number; by_type: { type: string; total: number; occupied: number }[] };
  series: { month: string; label: string; expected: number; collected: number }[];
  open_tickets: OpenTicket[];
  open_tickets_count: number;
  expiring_contracts: { data: Contract[] } | Contract[];
  pending_proofs: Proof[];
  expiring_documents: (ContractDocument & { contract_id: number; property_code: string; tenant: string })[];
};

const filters = [
  { key: "todas", label: "Todas" },
  { key: "deuda", label: "Con deuda" },
  { key: "pendientes", label: "Por cobrar este mes" },
  { key: "aldia", label: "Al día" },
] as const;

function unwrap<T>(v: { data: T[] } | T[]): T[] {
  return Array.isArray(v) ? v : v.data;
}

export default function LedgerPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const ledger = useApi<Ledger>(`ledger?period=${period}`);
  const dash = useApi<Dashboard>("dashboard");
  const activity = useApi<{ data: ActivityEvent[] }>("activity?limit=7");
  const inquiries = useApi<{ data: Inquiry[] }>("inquiries?status=nueva");
  const [reviewing, setReviewing] = useState<Proof | null>(null);
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("todas");
  const [q, setQ] = useState("");
  const [paying, setPaying] = useState<number | null>(null);
  const [stamped, setStamped] = useState<Set<number>>(new Set());

  const rows = useMemo(() => {
    const all = ledger.data?.rows ?? [];
    return all.filter((r) => {
      if (filter === "deuda" && r.days_late === 0) return false;
      if (filter === "pendientes" && (r.stage?.value === "pagada" || r.days_late > 0)) return false;
      if (filter === "aldia" && (r.days_late > 0 || r.stage?.value !== "pagada")) return false;
      return matches(q, r.property.code, r.property.address, r.tenant.name);
    });
  }, [ledger.data, filter, q]);

  const t = ledger.data?.totals;
  const collectedPct = t && t.expected ? Math.round((t.collected / t.expected) * 100) : 0;
  const isCurrent = period === currentPeriod();

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

  async function attendInquiry(inquiry: Inquiry) {
    try {
      await api(`inquiries/${inquiry.id}/contact`, { method: "POST" });
      inquiries.setData((d) => (d ? { ...d, data: d.data.filter((i) => i.id !== inquiry.id) } : d));
      toast(`Le escribiste a ${inquiry.name}`);
    } catch {
      toast("No se pudo registrar la respuesta", "error");
    }
  }

  function openProof(row: LedgerRow) {
    const proof = dash.data?.pending_proofs.find((p) => p.tenant?.id === row.tenant.id);
    if (proof) setReviewing(proof);
  }

  async function derive(ticketId: number, providerId: number, name: string) {
    try {
      await api(`tickets/${ticketId}/derive`, { method: "POST", body: { provider_id: providerId } });
      toast(`Reclamo derivado a ${name}`);
      dash.reload();
    } catch {
      toast("No se pudo marcar como derivado", "error");
    }
  }

  function onPaid(contractId: number) {
    setPaying(null);
    setStamped((s) => new Set(s).add(contractId));
    toast("Cobro registrado. El recibo quedó en Cobros.");
    ledger.reload();
    dash.reload();
  }

  const payingRow = rows.find((r) => r.action_installment_id === paying || r.current_installment_id === paying);

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.015em]">Liquidación de {ledger.data?.period_label.toLowerCase() ?? "…"}</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Emitida el {fecha(today())} · {t ? `${t.units} unidades alquiladas` : "…"}
            {dash.data && ` de ${dash.data.occupancy.total}`} · primero las que deben
          </p>
        </div>
        <div className="no-print flex items-center gap-1" role="group" aria-label="Cambiar período">
          <Button variant="secondary" size="sm" className="w-8 px-0" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} aria-label="Mes anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPeriod(currentPeriod())} disabled={isCurrent}>
            Este mes
          </Button>
          <Button variant="secondary" size="sm" className="w-8 px-0" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} aria-label="Mes siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* Resumen de la liquidación, como el pie de la hoja de expensas. */}
      <Panel className="mb-6">
        <dl className="grid grid-cols-2 md:grid-cols-3">
          <div className="border-r border-b border-rule px-4 py-3 md:border-b-0">
            <dt className="label">Esperado del mes</dt>
            <dd className="num mt-1 text-[19px] font-semibold tracking-[-0.01em] sm:text-[22px]">{t ? ars(t.expected, { short: true }) : <span className="skeleton inline-block h-6 w-32" />}</dd>
          </div>
          <div className="border-b border-rule px-4 py-3 md:border-r md:border-b-0">
            <dt className="label">Cobrado del mes</dt>
            <dd className="num mt-1 text-[19px] font-semibold tracking-[-0.01em] text-stamp sm:text-[22px]">
              {t ? ars(t.collected, { short: true }) : <span className="skeleton inline-block h-6 w-32" />}
              {t && <span className="block text-[13px] font-medium text-ink-3 sm:ml-2 sm:inline sm:text-[14px]">{collectedPct}% de lo esperado</span>}
            </dd>
          </div>
          <div className="col-span-2 px-4 py-3 md:col-span-1">
            <dt className="label">Adeudado vencido</dt>
            <dd className="num mt-1 text-[19px] font-semibold tracking-[-0.01em] text-debt sm:text-[22px]">
              {t ? ars(t.owed, { short: true }) : <span className="skeleton inline-block h-6 w-32" />}
              {t && t.debtors > 0 && <span className="block text-[13px] font-medium text-ink-3 sm:ml-2 sm:inline sm:text-[14px]">en {t.debtors} {t.debtors === 1 ? "unidad" : "unidades"}, con mora</span>}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* Comprobantes que mandaron los inquilinos: confirmar es un clic. */}
      {!!dash.data?.pending_proofs.length && (
        <Section className="no-print mb-6" title="Comprobantes para confirmar" actions={<TextLink href="/admin/cobros?tab=comprobantes">Todos</TextLink>}>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dash.data.pending_proofs.map((p) => (
              <li key={p.id}>
                <button onClick={() => setReviewing(p)} className="flex w-full items-center gap-3 rounded-sm border border-rule bg-sheet p-3 text-left transition-colors hover:border-ink">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-rule bg-paper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {!p.is_pdf && <img src={p.file_url} alt="" className="size-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {p.tenant?.name} <span className="font-normal text-ink-2">· {p.installment.property_code}</span>
                    </span>
                    <span className="block text-[13px] text-ink-2">
                      <span className="num">{ars(p.amount, { short: true })}</span> · {hace(p.created_at)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-sm bg-ink px-2.5 py-1.5 text-[13px] font-semibold text-white">Revisar</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Consultas de la web: alguien tocó "Me interesa" en La Choza. */}
      {!!inquiries.data?.data.length && (
        <Section className="no-print mb-6" title={`Consultas nuevas de La Choza (${inquiries.data.data.length})`} actions={<TextLink href="/admin/consultas">Todas las consultas</TextLink>}>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inquiries.data.data.slice(0, 6).map((iq) => (
              <li key={iq.id} className="flex flex-col justify-between gap-3 rounded-sm border border-rule bg-sheet p-3">
                <div className="flex gap-3">
                  {iq.property?.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iq.property.cover_url} alt="" className="size-12 shrink-0 rounded-sm border border-rule object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/consultas?id=${iq.id}`} className="marker font-semibold hover:underline">
                        {iq.name}
                      </Link>
                      <OperationTag operation={iq.operation} />
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-3">
                      <span className="font-bold text-ink">{iq.property?.code}</span> · <span className="num">{iq.listing?.price_label}</span> · {hace(iq.created_at)}
                    </p>
                    {iq.message && <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{iq.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {iq.reply_url && (
                    <WhatsAppLink href={iq.reply_url} onSent={() => attendInquiry(iq)}>
                      La atiendo yo
                    </WhatsAppLink>
                  )}
                  <TextLink href={`/admin/consultas?id=${iq.id}`} className="ml-auto">
                    Derivar a un colega
                  </TextLink>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Timbres sin derivar: lo que pide acción va antes de la planilla. */}
      {dash.data && dash.data.open_tickets.some((tk) => tk.status.value === "abierto") && (
        <Section className="no-print mb-6" title="Timbres sin derivar" actions={<TextLink href="/admin/reclamos">Todos los reclamos</TextLink>}>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dash.data.open_tickets
              .filter((tk) => tk.status.value === "abierto")
              .map((tk) => (
                <li key={tk.id} className="flex flex-col justify-between gap-3 rounded-sm border border-rule bg-sheet p-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/reclamos/${tk.id}`} className="font-semibold hover:underline">
                        {tk.title}
                      </Link>
                      {(tk.priority.value === "urgente" || tk.priority.value === "alta") && <PriorityMark priority={tk.priority} />}
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-3">
                      <span className="font-bold text-ink">{tk.property?.code}</span> · {tk.tenant?.full_name ?? "sin inquilino"} · {tk.category.label} · {hace(tk.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tk.suggested_provider ? (
                      <>
                        <WhatsAppLink href={tk.suggested_provider.whatsapp_url} onSent={() => derive(tk.id, tk.suggested_provider!.id, tk.suggested_provider!.name)}>
                          Derivar
                        </WhatsAppLink>
                        <span className="min-w-0 truncate text-[12.5px] text-ink-2">a {tk.suggested_provider.name}</span>
                      </>
                    ) : (
                      <span className="text-[12.5px] text-ink-3">Sin proveedor de {tk.category.label.toLowerCase()}</span>
                    )}
                    <TextLink href={`/admin/reclamos/${tk.id}`} className="ml-auto">
                      {tk.suggested_provider ? "Elegir otro" : "Ver reclamo"}
                    </TextLink>
                  </div>
                </li>
              ))}
          </ul>
        </Section>
      )}

      <div className="flex flex-col gap-10">
        <Section
          title="Planilla de unidades"
          actions={<span className="num text-[13px] text-ink-3">{rows.length} de {ledger.data?.rows.length ?? 0}</span>}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="no-print flex flex-wrap gap-1" role="tablist" aria-label="Filtrar planilla">
              {filters.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cx(
                    "h-8 rounded-sm border px-3 text-[13px] font-semibold transition-colors",
                    filter === f.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink hover:text-ink",
                  )}
                >
                  {f.label}
                  {f.key === "deuda" && !!t?.debtors && <span className={cx("num ml-1.5", filter === f.key ? "text-marker" : "text-debt")}>{t.debtors}</span>}
                </button>
              ))}
            </div>
            <SearchBox value={q} onChange={setQ} placeholder="Buscar unidad o inquilino" className="no-print ml-auto" />
          </div>

          <Panel>
            {ledger.error && (
              <div className="p-4">
                <ErrorState message={ledger.error.message} onRetry={ledger.reload} />
              </div>
            )}
            {ledger.loading && !ledger.data && <SkeletonRows rows={8} cols={7} />}
            {ledger.data && rows.length === 0 && (
              <Empty title={filter === "deuda" ? "Nadie debe nada. Un mes tranquilo." : "No hay unidades con ese filtro."}>
                {q ? `No encontramos “${q}”. Probá con el código (AZC-8), la calle o el apellido.` : "Cambiá el filtro para ver el resto de la planilla."}
              </Empty>
            )}
            {ledger.data && rows.length > 0 && (
              <>
                {/* Escritorio: la planilla completa. */}
                <Table className="hidden md:block">
                  <thead>
                    <tr>
                      <Th>Unidad</Th>
                      <Th>Inquilino</Th>
                      <Th align="right">Saldo anterior</Th>
                      <Th align="right">Cuota</Th>
                      <Th align="right">Pagado</Th>
                      <Th align="right">Intereses</Th>
                      <Th align="right">Saldo</Th>
                      <Th>Etapa</Th>
                      <Th className="no-print w-0">
                        <span className="sr-only">Acciones</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const late = r.days_late > 0;
                      return (
                        <tr key={r.contract_id} className="group hover:bg-paper/70">
                          <Td>
                            <Link href={`/admin/propiedades/${r.property.id}`} className={cx("font-bold whitespace-nowrap hover:underline", late && "marker marker-draw")} style={{ ["--i" as string]: i }}>
                              {r.property.code}
                            </Link>
                            <p className="max-w-[13rem] truncate text-[12.5px] text-ink-3">{r.property.address}</p>
                          </Td>
                          <Td>
                            <Link href={`/admin/inquilinos/${r.tenant.id}`} className="whitespace-nowrap hover:underline">
                              {r.tenant.name}
                            </Link>
                            {late && (
                              <p className="text-[12.5px] whitespace-nowrap text-debt">
                                {r.days_late} días{r.overdue_count > 1 ? ` · ${r.overdue_count} cuotas` : ""}
                              </p>
                            )}
                          </Td>
                          <Td align="right">
                            <Money value={r.previous_balance} tone="debt" short />
                          </Td>
                          <Td align="right">
                            <Money value={r.month_amount} short />
                          </Td>
                          <Td align="right">
                            <Money value={r.month_paid} tone="stamp" short />
                          </Td>
                          <Td align="right">
                            <Money value={r.late_fees} tone="debt" short />
                          </Td>
                          <Td align="right">
                            <span className={cx("num font-bold", late ? "text-debt" : r.total_due === 0 ? "text-ink-3" : "")}>{r.total_due === 0 ? "—" : ars(r.total_due, { short: true })}</span>
                          </Td>
                          <Td>
                            {stamped.has(r.contract_id) ? <span className="stamp stamp-land text-[11px]">Cobrado</span> : r.stage?.value === "pagada" && !late ? <span className="stamp text-[11px]">Pagada</span> : <StagePill stage={late ? { value: "vencida", label: "Vencida" } : r.stage} />}
                          </Td>
                          <Td className="no-print">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.action_installment_id && (
                                <Button size="sm" variant={late ? "primary" : "secondary"} onClick={() => setPaying(r.action_installment_id)}>
                                  Cobrar
                                </Button>
                              )}
                              {r.whatsapp_url && <WhatsAppLink href={r.whatsapp_url} onSent={() => logReminder(r)} compact />}
                            </div>
                            {r.pending_proofs > 0 ? (
                              <button onClick={() => openProof(r)} className="mt-1 ml-auto block rounded-sm px-1 text-right text-[11.5px] font-semibold whitespace-nowrap underline decoration-rule-strong underline-offset-2 hover:decoration-ink">
                                <span className="marker">Mandó comprobante</span>
                              </button>
                            ) : (
                              late && r.last_reminder_at && <p className="mt-0.5 text-right text-[11.5px] whitespace-nowrap text-ink-3">Avisado {hace(r.last_reminder_at)}</p>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold [&>td]:border-t-[3px] [&>td]:border-double [&>td]:border-t-ink">
                      <Td colSpan={2}>Totales</Td>
                      <Td align="right">
                        <Money value={rows.reduce((a, r) => a + r.previous_balance, 0)} tone="debt" short />
                      </Td>
                      <Td align="right">
                        <Money value={rows.reduce((a, r) => a + r.month_amount, 0)} short />
                      </Td>
                      <Td align="right">
                        <Money value={rows.reduce((a, r) => a + r.month_paid, 0)} tone="stamp" short />
                      </Td>
                      <Td align="right">
                        <Money value={rows.reduce((a, r) => a + r.late_fees, 0)} tone="debt" short />
                      </Td>
                      <Td align="right">
                        <Money value={rows.reduce((a, r) => a + r.total_due, 0)} short />
                      </Td>
                      <Td colSpan={2} />
                    </tr>
                  </tfoot>
                </Table>

                {/* Celular: cada unidad como renglón apilado. */}
                <ul className="divide-y divide-rule md:hidden">
                  {rows.map((r, i) => {
                    const late = r.days_late > 0;
                    return (
                      <li key={r.contract_id} className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/admin/propiedades/${r.property.id}`} className={cx("font-bold", late && "marker marker-draw")} style={{ ["--i" as string]: i }}>
                              {r.property.code}
                            </Link>
                            <span className="ml-2 text-[13px] text-ink-2">{r.tenant.name}</span>
                            <p className="truncate text-[12.5px] text-ink-3">{r.property.address}</p>
                          </div>
                          <div className="text-right">
                            <p className={cx("num font-bold", late && "text-debt")}>{r.total_due === 0 ? "—" : ars(r.total_due, { short: true })}</p>
                            {r.pending_proofs > 0 ? (
                              <button onClick={() => openProof(r)} className="text-[12px] font-semibold underline">
                                <span className="marker">Mandó comprobante</span>
                              </button>
                            ) : late ? <p className="text-[12px] text-debt">{r.days_late} días</p> : r.stage?.value === "pagada" ? <span className="stamp text-[10.5px]">Pagada</span> : <StagePill stage={r.stage} />}
                          </div>
                        </div>
                        {(r.action_installment_id || r.whatsapp_url) && (
                          <div className="mt-2.5 flex gap-2">
                            {r.action_installment_id && (
                              <Button size="sm" variant={late ? "primary" : "secondary"} onClick={() => setPaying(r.action_installment_id)} className="flex-1">
                                Cobrar
                              </Button>
                            )}
                            {r.whatsapp_url && (
                              <WhatsAppLink href={r.whatsapp_url} onSent={() => logReminder(r)} className="flex-1">
                                Avisar
                              </WhatsAppLink>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Panel>
        </Section>

        <div className="no-print grid content-start gap-8 lg:grid-cols-2">
          <Section title="Cobranza de los últimos 6 meses">
            <Panel>
              {!dash.data ? (
                <SkeletonRows rows={6} cols={3} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Mes</Th>
                      <Th align="right">Esperado</Th>
                      <Th align="right">Cobrado</Th>
                      <Th align="right">Sin cobrar</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dash.data.series].reverse().map((m) => {
                      const missing = Math.max(0, m.expected - m.collected);
                      return (
                        <tr key={m.month}>
                          <Td className="whitespace-nowrap">{periodo(m.month)}</Td>
                          <Td align="right">
                            <Money value={m.expected} short />
                          </Td>
                          <Td align="right">
                            <Money value={m.collected} tone="stamp" short />
                          </Td>
                          <Td align="right">
                            <Money value={missing} tone={m.month === currentPeriod() ? "muted" : "debt"} short />
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Panel>
            {dash.data && (
              <p className="mt-2 text-[13px] text-ink-2">
                Ocupación: {dash.data.occupancy.occupied} de {dash.data.occupancy.total} alquiladas ({dash.data.occupancy.by_type.map((b) => `${b.occupied}/${b.total} ${b.type.toLowerCase()}s`).join(", ").replace("galpóns", "galpones")}){dash.data.occupancy.maintenance > 0 && `, ${dash.data.occupancy.maintenance} en mantenimiento`}.
              </p>
            )}
          </Section>

          <Section title="Reclamos en seguimiento" actions={<TextLink href="/admin/reclamos">Ver todos</TextLink>}>
            <Panel>
              {!dash.data && <SkeletonRows rows={3} cols={2} />}
              {dash.data && dash.data.open_tickets.filter((tk) => tk.status.value !== "abierto").length === 0 && <Empty title="Nada en seguimiento">Los reclamos derivados aparecen acá hasta que los cierres.</Empty>}
              <ul className="divide-y divide-rule">
                {dash.data?.open_tickets
                  .filter((tk) => tk.status.value !== "abierto")
                  .map((tk) => (
                    <li key={tk.id}>
                      <Link href={`/admin/reclamos/${tk.id}`} className="block px-4 py-3 hover:bg-paper">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">{tk.title}</span>
                          <TicketPill status={tk.status} />
                        </div>
                        <p className="mt-1 text-[12.5px] text-ink-3">
                          <span className="font-semibold text-ink-2">{tk.property?.code}</span>
                          {tk.provider && ` · ${tk.provider.name}`} · {hace(tk.derived_at ?? tk.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Panel>
          </Section>

          <Section title="Contratos y garantías por vencer" actions={<TextLink href="/admin/agenda">Agenda</TextLink>}>
            <Panel>
              {dash.data && unwrap(dash.data.expiring_contracts).length === 0 && dash.data.expiring_documents.length === 0 && <Empty title="Nada vence en los próximos 90 días" />}
              {!!dash.data?.expiring_documents.length && (
                <ul className="divide-y divide-rule border-b border-rule">
                  {dash.data.expiring_documents.map((d) => (
                    <li key={d.id}>
                      <Link href={`/admin/contratos/${d.contract_id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-paper">
                        <span className="min-w-0">
                          <span className="font-semibold">{d.property_code}</span>
                          <span className="ml-2 text-[13px] text-ink-2">{d.kind.label}</span>
                        </span>
                        <span className={cx("text-[13px] font-semibold whitespace-nowrap", (d.days_to_expire ?? 0) < 0 ? "text-debt" : "text-ink")}>{(d.days_to_expire ?? 0) < 0 ? "vencida" : `vence en ${d.days_to_expire} días`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="divide-y divide-rule">
                {dash.data &&
                  unwrap(dash.data.expiring_contracts).map((c) => (
                    <li key={c.id}>
                      <Link href={`/admin/contratos/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-paper">
                        <span className="min-w-0">
                          <span className="font-semibold">{c.property?.code}</span>
                          <span className="ml-2 truncate text-[13px] text-ink-2">{c.tenant?.full_name}</span>
                        </span>
                        <span className={cx("text-[13px] whitespace-nowrap", c.days_to_end < 30 ? "font-semibold text-debt" : "text-ink-2")}>
                          {c.days_to_end < 0 ? `venció el ${fechaCorta(c.end_date)}` : `${fecha(c.end_date)} · ${c.days_to_end} días`}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Panel>
          </Section>
          <Section title="Actividad reciente" actions={<TextLink href="/admin/actividad">Ver todo</TextLink>}>
            <Panel>{activity.data ? <ActivityFeed events={activity.data.data} compact /> : <SkeletonRows rows={5} cols={2} />}</Panel>
          </Section>
        </div>
      </div>

      {reviewing && (
        <ProofReview
          key={reviewing.id}
          proof={reviewing}
          onClose={() => setReviewing(null)}
          onDone={(msg) => {
            setReviewing(null);
            toast(msg);
            ledger.reload();
            dash.reload();
            activity.reload();
          }}
        />
      )}

      {paying !== null && <PaymentSheet key={paying} installmentId={paying} onClose={() => setPaying(null)} onPaid={() => onPaid(payingRow?.contract_id ?? -1)} />}
    </>
  );
}
