"use client";

import Link from "next/link";
import Link2 from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { ProofReview } from "@/components/proof-review";
import { useToast } from "@/components/toast";
import {
  Button,
  cx,
  Empty,
  ErrorState,
  PageHeader,
  Panel,
  SearchBox,
  SkeletonRows,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  ars,
  currentPeriod,
  fecha,
  hace,
  periodo,
  shiftPeriod,
} from "@/lib/format";
import { matches } from "@/lib/search";
import type { Payment, Proof } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function PaymentsView() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "comprobantes" ? "comprobantes" : "pagos";
  const [month, setMonth] = useState(currentPeriod());
  const proofs = useApi<{ data: Proof[] }>("proofs");
  const [reviewing, setReviewing] = useState<Proof | null>(null);
  const [q, setQ] = useState("");
  const pendingCount =
    proofs.data?.data.filter((p) => p.status.value === "pendiente").length ?? 0;
  const list = useApi<{ data: Payment[] }>(`payments?month=${month}`);
  const toast = useToast();
  const payments = useMemo(() => list.data?.data ?? [], [list.data]);
  const total = payments.reduce((a, p) => a + p.total, 0);
  const shownPayments = useMemo(
    () =>
      payments.filter((p) => {
        const c = p.installment?.contract;
        return matches(q, p.receipt_number, String(p.receipt_number).padStart(5, "0"), c?.property?.code, c?.property?.address, c?.tenant?.full_name, p.installment && periodo(p.installment.period), p.method.label);
      }),
    [payments, q],
  );
  const shownProofs = useMemo(() => (proofs.data?.data ?? []).filter((p) => matches(q, p.tenant?.name, p.installment.property_code, periodo(p.installment.period), p.status.label)), [proofs.data, q]);
  const byMethod = payments.reduce<Record<string, number>>(
    (acc, p) => ({
      ...acc,
      [p.method.label]: (acc[p.method.label] ?? 0) + p.total,
    }),
    {},
  );

  async function annul(p: Payment) {
    if (
      !window.confirm(
        `¿Anular el recibo N° ${p.receipt_number}? La cuota vuelve a quedar con saldo.`,
      )
    )
      return;
    try {
      await api(`payments/${p.id}`, { method: "DELETE" });
      toast(`Recibo ${p.receipt_number} anulado`);
      list.reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <>
      <PageHeader
        title={`Cobros de ${periodo(month).toLowerCase()}`}
        subtitle={
          list.data ? (
            <span className="num">
              {payments.length} pagos · {ars(total)}
            </span>
          ) : (
            "Cargando…"
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <a
              href={`/api/backend/exports/month?month=${month}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet px-2.5 text-[13px] font-semibold hover:border-ink"
            >
              <FileSpreadsheet className="size-4" aria-hidden /> Excel del mes
            </a>
            <Link2
              href={`/admin/reporte?mes=${month}`}
              target="_blank"
              className="mr-2 inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule-strong bg-sheet px-2.5 text-[13px] font-semibold hover:border-ink"
            >
              <FileDown className="size-4" aria-hidden /> Reporte PDF
            </Link2>
            <Button
              size="sm"
              className="w-8 px-0"
              onClick={() => setMonth((m) => shiftPeriod(m, -1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setMonth(currentPeriod())}
              disabled={month === currentPeriod()}
            >
              Este mes
            </Button>
            <Button
              size="sm"
              className="w-8 px-0"
              onClick={() => setMonth((m) => shiftPeriod(m, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Cobros">
        {[
          { key: "pagos", label: "Pagos registrados" },
          { key: "comprobantes", label: "Comprobantes de inquilinos" },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() =>
              router.replace(
                t.key === "pagos"
                  ? "/admin/cobros"
                  : "/admin/cobros?tab=comprobantes",
              )
            }
            className={cx(
              "h-8 rounded-sm border px-3 text-[13px] font-semibold",
              tab === t.key
                ? "border-ink bg-ink text-white"
                : "border-rule-strong bg-sheet text-ink-2 hover:border-ink",
            )}
          >
            {t.label}
            {t.key === "comprobantes" && pendingCount > 0 && (
              <span
                className={cx(
                  "num ml-1.5 rounded-sm px-1",
                  tab === t.key ? "bg-marker text-ink" : "bg-marker text-ink",
                )}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>
        <SearchBox value={q} onChange={setQ} placeholder={tab === "pagos" ? "Recibo, unidad o inquilino" : "Inquilino o unidad"} className="ml-auto sm:w-72" />
      </div>

      {tab === "comprobantes" && (
        <Panel>
          {proofs.error && (
            <div className="p-4">
              <ErrorState
                message={proofs.error.message}
                onRetry={proofs.reload}
              />
            </div>
          )}
          {!proofs.data && !proofs.error && <SkeletonRows rows={4} cols={5} />}
          {proofs.data && proofs.data.data.length === 0 && (
            <Empty title="Todavía nadie mandó comprobantes">
              Desde su portal, cada inquilino puede subir la captura de la
              transferencia. Te aparece acá para confirmarla con un clic.
            </Empty>
          )}
          {!!proofs.data?.data.length && shownProofs.length === 0 && <Empty title="Ningún comprobante coincide con la búsqueda" />}
          {shownProofs.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th>Unidad</Th>
                  <Th>Período</Th>
                  <Th align="right">Monto</Th>
                  <Th>Enviado</Th>
                  <Th>Estado</Th>
                  <Th className="w-0">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {shownProofs.map((p) => (
                  <tr key={p.id} className="hover:bg-paper/70">
                    <Td className="font-semibold whitespace-nowrap">
                      {p.tenant?.name}
                    </Td>
                    <Td className="font-bold">{p.installment.property_code}</Td>
                    <Td className="whitespace-nowrap text-ink-2">
                      {periodo(p.installment.period)}
                    </Td>
                    <Td align="right" className="num">
                      {ars(p.amount)}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">
                      {hace(p.created_at)}
                    </Td>
                    <Td>
                      {p.status.value === "aprobado" ? (
                        <span className="stamp text-[11px]">Confirmado</span>
                      ) : p.status.value === "rechazado" ? (
                        <span className="text-[13px] text-debt">Rechazado</span>
                      ) : (
                        <span className="marker text-[13px] font-semibold">
                          Para confirmar
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant={
                          p.status.value === "pendiente" ? "primary" : "ghost"
                        }
                        onClick={() => setReviewing(p)}
                      >
                        {p.status.value === "pendiente" ? "Revisar" : "Ver"}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      )}

      {reviewing && (
        <ProofReview
          key={reviewing.id}
          proof={reviewing}
          onClose={() => setReviewing(null)}
          onDone={(msg) => {
            setReviewing(null);
            toast(msg);
            proofs.reload();
            list.reload();
          }}
        />
      )}

      {tab === "pagos" && Object.keys(byMethod).length > 0 && (
        <dl className="mb-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {Object.entries(byMethod).map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="num font-semibold">{ars(v, { short: true })}</dd>
            </div>
          ))}
        </dl>
      )}
      {tab === "pagos" && (
        <Panel>
          {list.error && (
            <div className="p-4">
              <ErrorState message={list.error.message} onRetry={list.reload} />
            </div>
          )}
          {list.loading && !list.data && <SkeletonRows rows={10} cols={6} />}
          {list.data && payments.length === 0 && (
            <Empty title="No hubo cobros este mes">
              Los pagos se registran desde la Liquidación con “Cobrar”.
            </Empty>
          )}
          {payments.length > 0 && shownPayments.length === 0 && <Empty title="Ningún pago coincide con la búsqueda">Probá con el número de recibo, el código de la unidad o el inquilino.</Empty>}
          {shownPayments.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Recibo</Th>
                  <Th>Fecha</Th>
                  <Th>Unidad</Th>
                  <Th>Inquilino</Th>
                  <Th>Período</Th>
                  <Th>Medio</Th>
                  <Th align="right">Mora</Th>
                  <Th align="right">Total</Th>
                  <Th className="w-0">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {shownPayments.map((p) => {
                  const c = p.installment?.contract;
                  return (
                    <tr key={p.id} className="hover:bg-paper/70">
                      <Td className="num font-semibold">
                        N° {String(p.receipt_number).padStart(5, "0")}
                      </Td>
                      <Td className="num text-ink-2">{fecha(p.paid_on)}</Td>
                      <Td>
                        <Link
                          href={`/admin/propiedades/${c?.property_id}`}
                          className="font-bold hover:underline"
                        >
                          {c?.property?.code}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {c?.tenant?.full_name}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-2">
                        {p.installment && periodo(p.installment.period)}
                      </Td>
                      <Td className="text-ink-2">{p.method.label}</Td>
                      <Td align="right" className="num text-ink-2">
                        {p.late_fee ? ars(p.late_fee, { short: true }) : "—"}
                      </Td>
                      <Td align="right" className="num font-semibold">
                        {ars(p.total)}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/recibo/${p.id}`}
                            target="_blank"
                            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule-strong px-2.5 text-[13px] font-semibold hover:border-ink"
                          >
                            <Printer className="size-4" aria-hidden /> Recibo
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => annul(p)}
                          >
                            Anular
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      )}
    </>
  );
}
