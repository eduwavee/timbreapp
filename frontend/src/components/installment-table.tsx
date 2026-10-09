"use client";

import Link from "next/link";
import { useState } from "react";
import { ars, fecha, periodo } from "@/lib/format";
import type { Installment } from "@/lib/types";
import { PaymentSheet } from "./payment-sheet";
import { useToast } from "./toast";
import { Button, cx, Empty, Money, StageStrip, Table, Td, Th } from "./ui";

/** Cuotas de un contrato, con su tira de etapas, recibos y cobro. */
export function InstallmentTable({ installments, onChanged, limit }: { installments: Installment[]; onChanged: () => void; limit?: number }) {
  const [paying, setPaying] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const [stamped, setStamped] = useState<number | null>(null);
  const toast = useToast();
  const shown = limit && !all ? installments.slice(0, limit) : installments;

  if (installments.length === 0) return <Empty title="Todavía no hay cuotas generadas" />;

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Período</Th>
            <Th>Etapa</Th>
            <Th align="right">Cuota</Th>
            <Th align="right">Pagado</Th>
            <Th align="right">Saldo</Th>
            <Th className="w-0">
              <span className="sr-only">Acciones</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((i) => {
            const late = i.days_late > 0 && i.balance > 0;
            return (
              <tr key={i.id}>
                <Td>
                  <span className={cx("font-semibold whitespace-nowrap", late && "marker")}>{periodo(i.period)}</span>
                  <p className="text-[12.5px] text-ink-3">vence {fecha(i.due_date)}</p>
                </Td>
                <Td>
                  {stamped === i.id ? <span className="stamp stamp-land text-[11px]">Cobrado</span> : <StageStrip status={late ? "vencida" : i.status.value} dueDate={i.due_date} compact />}
                  {late && <p className="mt-0.5 text-[12px] text-debt">{i.days_late} días de atraso{i.late_fee ? ` · mora ${ars(i.late_fee, { short: true })}` : ""}</p>}
                </Td>
                <Td align="right">
                  <Money value={i.amount} short />
                </Td>
                <Td align="right">
                  <Money value={i.paid_amount} tone="stamp" short />
                  {!!i.payments?.length && (
                    <span className="mt-0.5 flex flex-wrap justify-end gap-x-2">
                      {i.payments.map((p) => (
                        <Link key={p.id} href={`/recibo/${p.id}`} target="_blank" className="num text-[12px] text-stamp underline decoration-stamp/30 underline-offset-2 hover:decoration-stamp">
                          Recibo {String(p.receipt_number).padStart(5, "0")}
                        </Link>
                      ))}
                    </span>
                  )}
                </Td>
                <Td align="right">
                  <Money value={i.balance} tone={late ? "debt" : "muted"} short />
                </Td>
                <Td>
                  {i.balance > 0 && (
                    <Button size="sm" variant={late ? "primary" : "secondary"} onClick={() => setPaying(i.id)}>
                      Cobrar
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {limit && installments.length > limit && (
        <div className="border-t border-rule px-4 py-2">
          <button className="text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink" onClick={() => setAll((v) => !v)}>
            {all ? "Ver menos" : `Ver las ${installments.length} cuotas`}
          </button>
        </div>
      )}
      {paying !== null && (
        <PaymentSheet
          key={paying}
        installmentId={paying}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setStamped(paying);
          setPaying(null);
          toast("Cobro registrado");
          onChanged();
        }}
        />
      )}
    </>
  );
}
