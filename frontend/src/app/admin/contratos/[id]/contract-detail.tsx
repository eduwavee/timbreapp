"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ContractDocuments } from "@/components/contract-documents";
import { InstallmentTable } from "@/components/installment-table";
import { useToast } from "@/components/toast";
import { Button, ErrorState, Field, FormError, Input, PageHeader, Panel, Section, Select, WhatsAppLink } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { ars, currentPeriod, fecha } from "@/lib/format";
import type { Contract } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useApi<{ data: Contract }>(`contracts/${id}`);
  const toast = useToast();
  const [pct, setPct] = useState("");
  const [from, setFrom] = useState(currentPeriod());
  const [adjError, setAdjError] = useState<ApiError | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  if (detail.error) return <ErrorState message={detail.error.status === 404 ? "Ese contrato no existe." : detail.error.message} onRetry={detail.reload} />;
  if (!detail.data) return <div className="skeleton h-64" />;
  const c = detail.data.data;
  const installments = [...(c.installments ?? [])].reverse();
  const preview = pct ? Math.round(c.rent_amount * (1 + Number(pct) / 100) * 100) / 100 : null;

  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    setAdjusting(true);
    setAdjError(null);
    try {
      await api(`contracts/${c.id}/adjust`, { method: "POST", body: { percentage: Number(pct), from_period: from } });
      toast(`Alquiler ajustado a ${ars(preview)}`);
      setPct("");
      detail.reload();
    } catch (err) {
      setAdjError(err as ApiError);
    } finally {
      setAdjusting(false);
    }
  }

  async function setStatus(status: string) {
    try {
      await api(`contracts/${c.id}`, {
        method: "PUT",
        body: {
          property_id: c.property_id,
          tenant_id: c.tenant_id,
          start_date: c.start_date,
          end_date: c.end_date,
          rent_amount: c.rent_amount,
          due_day: c.due_day,
          adjustment_type: c.adjustment_type.value,
          adjustment_every_months: c.adjustment_every_months,
          deposit: c.deposit,
          late_fee_daily_pct: c.late_fee_daily_pct,
          status,
          notes: c.notes,
        },
      });
      toast("Estado del contrato actualizado");
      detail.reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <>
      <PageHeader
        back={{ href: "/admin/contratos", label: "Contratos" }}
        title={
          <>
            {c.property?.code} <span className="font-normal text-ink-2">· {c.tenant?.full_name}</span>
          </>
        }
        subtitle={`${c.property?.address} · ${c.status.label} del ${fecha(c.start_date)} al ${fecha(c.end_date)}`}
        actions={c.tenant && <WhatsAppLink href={c.tenant.whatsapp_url} size="md">Escribirle</WhatsAppLink>}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Section title="Cuotas">
          <Panel>
            <InstallmentTable installments={installments} onChanged={detail.reload} />
          </Panel>
        </Section>

        <div className="flex flex-col gap-8">
          <Section title="Condiciones">
            <Panel>
              <dl className="divide-y divide-rule text-sm">
                {[
                  ["Alquiler", <span key="a" className="num font-semibold">{ars(c.rent_amount)}</span>],
                  ["Vencimiento", `día ${c.due_day} de cada mes`],
                  ["Ajuste", `${c.adjustment_type.label} cada ${c.adjustment_every_months} meses`],
                  ["Depósito", <span key="d" className="num">{ars(c.deposit)}</span>],
                  ["Mora", `${c.late_fee_daily_pct.toLocaleString("es-AR")} % diario`],
                  ["Inquilino", <Link key="t" href={`/admin/inquilinos/${c.tenant_id}`} className="hover:underline">{c.tenant?.full_name}</Link>],
                ].map(([k, v], i) => (
                  <div key={i} className="grid grid-cols-[96px_1fr] gap-3 px-4 py-2.5">
                    <dt className="text-ink-3">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </Section>

          <Section title="Documentos">
            <ContractDocuments contractId={c.id} documents={c.documents ?? []} onChanged={detail.reload} />
          </Section>

          {c.status.value === "vigente" && (
            <Section title="Aplicar ajuste">
              <Panel className="p-4">
                <form onSubmit={adjust} className="flex flex-col gap-3">
                  <p className="text-sm text-ink-2">Cargá el porcentaje del {c.adjustment_type.label} del período. Se actualizan el alquiler y las cuotas sin pagar desde el mes que elijas.</p>
                  <FormError message={adjError?.message} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Aumento (%)" error={adjError?.field("percentage")}>
                      {(id) => <Input id={id} type="number" step="0.01" min="-50" max="500" value={pct} onChange={(e) => setPct(e.target.value)} required className="num" />}
                    </Field>
                    <Field label="Desde">
                      {(id) => <Input id={id} type="month" value={from} onChange={(e) => setFrom(e.target.value)} required />}
                    </Field>
                  </div>
                  {preview && (
                    <p className="num text-sm">
                      {ars(c.rent_amount)} <ArrowRight className="inline size-3.5" aria-label="pasa a" /> <strong>{ars(preview)}</strong>
                    </p>
                  )}
                  <Button type="submit" variant="primary" loading={adjusting} disabled={!pct}>
                    Aplicar ajuste
                  </Button>
                </form>
              </Panel>
            </Section>
          )}

          <Section title="Estado">
            <Panel className="p-4">
              <Field label="Estado del contrato" hint="Al finalizar o rescindir, la unidad vuelve a quedar disponible.">
                {(id, d) => (
                  <Select id={id} aria-describedby={d} value={c.status.value} onChange={(e) => setStatus(e.target.value)}>
                    <option value="vigente">Vigente</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="rescindido">Rescindido</option>
                  </Select>
                )}
              </Field>
            </Panel>
          </Section>
        </div>
      </div>
    </>
  );
}
