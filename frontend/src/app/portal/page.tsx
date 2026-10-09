"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Upload } from "lucide-react";
import { ProofForm } from "@/components/forms/proof-form";
import { useToast } from "@/components/toast";
import { Button, ButtonLink, Empty, ErrorState, Money, Panel, Section, StageStrip, WhatsAppLink } from "@/components/ui";
import { ars, fecha, periodo } from "@/lib/format";
import type { Contract, Installment, Proof } from "@/lib/types";
import { useApi } from "@/lib/use-api";

type Summary = {
  tenant: { first_name: string; full_name: string };
  contract: { data: Contract } | Contract | null;
  debt: { overdue: number; overdue_count: number; next_amount: number | null; next_due: string | null };
  installments: { data: Installment[] } | Installment[];
  payment_info: { bank_alias: string; owner_name: string; owner_whatsapp_url: string | null };
  proofs: Proof[];
};

const un = <T,>(v: { data: T } | T): T => (v && typeof v === "object" && "data" in (v as object) ? (v as { data: T }).data : (v as T));

export default function PortalHome() {
  const s = useApi<Summary>("portal/summary");
  const toast = useToast();
  const [history, setHistory] = useState(false);
  const [informing, setInforming] = useState(false);

  if (s.error) return <ErrorState message={s.error.message} onRetry={s.reload} />;
  if (!s.data) return <div className="skeleton h-72" />;

  const contract = s.data.contract ? un(s.data.contract) : null;
  const installments = un(s.data.installments) as Installment[];
  const { debt, payment_info: pay } = s.data;
  const late = debt.overdue_count > 0;
  // Lo que importa arriba: lo vencido, lo de este mes y los últimos pagos; el resto queda en el historial.
  const firstPaid = installments.findIndex((i) => i.balance === 0);
  const recentCut = firstPaid === -1 ? installments.length : firstPaid + 3;
  const shown = history ? installments : installments.slice(0, recentCut);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.015em]">Hola, {s.data.tenant.first_name}</h1>
        {contract && (
          <p className="mt-1 text-ink-2">
            {contract.property?.address}, {contract.property?.city}
          </p>
        )}
      </div>

      <Panel className={late ? "border-debt/40" : ""}>
        <div className="flex flex-wrap items-end justify-between gap-4 p-5">
          {late ? (
            <div>
              <p className="text-[15px] font-semibold">
                Debés <span className="num text-[26px] text-debt">{ars(debt.overdue)}</span> vencidos
              </p>
              <p className="mt-1 text-sm text-ink-2">
                {debt.overdue_count} {debt.overdue_count === 1 ? "cuota vencida" : "cuotas vencidas"}, con intereses por mora al día de hoy.
                {debt.next_amount && debt.next_due && ` Además, ${ars(debt.next_amount)} vencen el ${fecha(debt.next_due)}.`}
              </p>
            </div>
          ) : debt.next_amount && debt.next_due ? (
            <p className="text-[15px] font-semibold">
              Tu próximo pago es de <span className="num text-[26px]">{ars(debt.next_amount)}</span> y vence el {fecha(debt.next_due)}
            </p>
          ) : (
            <p className="text-[15px] font-semibold">No tenés nada pendiente. ¡Gracias!</p>
          )}
          {!late && !debt.next_amount && <span className="stamp text-base">Al día</span>}
          {(late || !!debt.next_amount) && (
            <Button variant="primary" onClick={() => setInforming(true)}>
              <Upload className="size-4" /> Ya pagué: subir comprobante
            </Button>
          )}
        </div>
        {(pay.bank_alias || pay.owner_whatsapp_url) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule bg-paper px-5 py-3 text-sm">
            {pay.bank_alias && (
              <span className="flex items-center gap-2">
                Alias para transferir: <strong className="font-semibold">{pay.bank_alias}</strong>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pay.bank_alias);
                    toast("Alias copiado");
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-sm border border-rule-strong hover:border-ink"
                  aria-label="Copiar alias"
                >
                  <Copy className="size-3.5" />
                </button>
              </span>
            )}
            {pay.owner_whatsapp_url && (
              <WhatsAppLink href={pay.owner_whatsapp_url} className="ml-auto">
                Escribir a la administración
              </WhatsAppLink>
            )}
          </div>
        )}
      </Panel>

      {s.data.proofs.length > 0 && (
        <Section title="Mis comprobantes">
          <Panel>
            <ul className="divide-y divide-rule">
              {s.data.proofs.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <div>
                    <p className="font-semibold">
                      {periodo(p.installment.period)} · <span className="num">{ars(p.amount)}</span>
                    </p>
                    <p className="text-[13px] text-ink-2">
                      Enviado el {fecha(p.created_at)}
                      {p.status.value === "rechazado" && p.rejection_reason && <span className="text-debt"> · {p.rejection_reason}</span>}
                    </p>
                  </div>
                  {p.status.value === "aprobado" ? (
                    <span className="flex items-center gap-3">
                      <span className="stamp text-[11px]">Confirmado</span>
                      {p.payment_id && (
                        <Link href={`/recibo/${p.payment_id}`} target="_blank" className="num text-[13px] text-stamp hover:underline">
                          Recibo {String(p.receipt_number).padStart(5, "0")}
                        </Link>
                      )}
                    </span>
                  ) : p.status.value === "rechazado" ? (
                    <span className="text-[13px] font-semibold text-debt">Rechazado: mandalo de nuevo</span>
                  ) : (
                    <span className="inline-flex h-6 items-center rounded-sm border border-rule-strong bg-sheet px-2 text-[12px] font-semibold text-ink-2">Esperando confirmación</span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </Section>
      )}

      <Section title="Mis cuotas">
        <Panel>
          {installments.length === 0 && <Empty title="Todavía no hay cuotas" />}
          <ul className="divide-y divide-rule">
            {shown.map((i) => {
              const overdue = i.days_late > 0 && i.balance > 0;
              return (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      <span className={overdue ? "marker" : ""}>{periodo(i.period)}</span>
                    </p>
                    <div className="mt-1">
                      {i.status.value === "pagada" && !overdue ? <span className="stamp text-[11px]">Pagada</span> : <StageStrip status={overdue ? "vencida" : i.status.value} dueDate={i.due_date} />}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="num font-semibold">{ars(i.amount)}</p>
                    {i.balance > 0 && i.paid_amount > 0 && (
                      <p className="text-[12.5px] text-ink-2">
                        Falta <Money value={i.balance} tone={overdue ? "debt" : undefined} />
                      </p>
                    )}
                    <p className="flex gap-2 sm:justify-end">
                      {(i.payments ?? []).map((p) => (
                        <Link key={p.id} href={`/recibo/${p.id}`} target="_blank" className="num text-[13px] text-stamp hover:underline">
                          Recibo {String(p.receipt_number).padStart(5, "0")}
                        </Link>
                      ))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {installments.length > recentCut && (
            <div className="border-t border-rule px-4 py-2.5">
              <button onClick={() => setHistory((v) => !v)} aria-expanded={history} className="text-[13px] font-semibold underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                {history ? "Ocultar historial" : `Ver historial (${installments.length - recentCut} cuotas pagadas más)`}
              </button>
            </div>
          )}
        </Panel>
      </Section>

      {contract && (
        <Section title="Mi contrato">
          <Panel>
            <dl className="grid grid-cols-2 text-sm sm:grid-cols-4">
              {[
                ["Alquiler actual", ars(contract.rent_amount)],
                ["Vence cada mes", `el día ${contract.due_day}`],
                ["Ajuste", `${contract.adjustment_type.label} cada ${contract.adjustment_every_months} meses`],
                ["Termina", fecha(contract.end_date)],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-rule px-4 py-3 sm:border-b-0">
                  <dt className="label">{k}</dt>
                  <dd className="num mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </Section>
      )}

      {informing && (
        <ProofForm
          installments={installments}
          waitingIds={s.data.proofs.filter((p) => p.status.value === "pendiente").map((p) => p.installment.id)}
          onClose={() => setInforming(false)}
          onSaved={() => {
            setInforming(false);
            toast("Comprobante enviado. Te avisamos cuando lo confirmemos.");
            s.reload();
          }}
        />
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-semibold">¿Algo no anda en la casa?</p>
          <p className="text-sm text-ink-2">Contanos qué pasa y lo derivamos al técnico.</p>
        </div>
        <ButtonLink href="/portal/reclamos?nuevo=1" variant="primary">
          Cargar un reclamo
        </ButtonLink>
      </Panel>
    </div>
  );
}
