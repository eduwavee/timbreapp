"use client";

import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button, ErrorState, Table, Td, Th, TimbreMark } from "@/components/ui";
import { ars, currentPeriod, fecha, periodo, today } from "@/lib/format";
import type { Expense, Ledger, Payment } from "@/lib/types";
import { useApi } from "@/lib/use-api";

/**
 * Reporte del mes para el contador: se imprime o se guarda como PDF desde el navegador.
 */
export function MonthReport() {
  const month = useSearchParams().get("mes") ?? currentPeriod();
  const ledger = useApi<Ledger>(`ledger?period=${month}`);
  const payments = useApi<{ data: Payment[] }>(`payments?month=${month}`);
  const expenses = useApi<{ data: Expense[] }>(`expenses?month=${month}`);
  const settings = useApi<{ owner_name: string }>("settings");

  const error = ledger.error ?? payments.error ?? expenses.error;
  if (error) return <ErrorState message={error.message} />;
  if (!ledger.data || !payments.data || !expenses.data) return <div className="skeleton h-96" />;

  const cash = payments.data.data.reduce((a, p) => a + p.total, 0);
  const spent = expenses.data.data.reduce((a, e) => a + e.amount, 0);
  const t = ledger.data.totals;

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="no-print mb-4 flex justify-end">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir o guardar PDF
        </Button>
      </div>
      <article className="border border-ink bg-white p-8 text-[13px] print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b-[3px] border-double border-ink pb-4">
          <div className="flex items-center gap-3">
            <TimbreMark className="size-9 text-rail" />
            <div>
              <p className="text-lg font-bold">{settings.data?.owner_name ?? "Timbre"}</p>
              <p className="text-ink-2">Reporte mensual de alquileres</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold">{periodo(month)}</h1>
            <p className="text-ink-2">Emitido el {fecha(today())}</p>
          </div>
        </header>

        <section className="grid grid-cols-5 border-b border-rule py-4">
          {[
            ["Esperado", t.expected, ""],
            ["Cobrado del período", t.collected, "text-stamp"],
            ["Adeudado vencido", t.owed, "text-debt"],
            ["Ingresó a caja", cash, ""],
            ["Gastos", spent, ""],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="px-2 first:pl-0">
              <p className="label">{label}</p>
              <p className={`num mt-1 text-[16px] font-semibold ${tone}`}>{ars(value as number, { short: true })}</p>
            </div>
          ))}
        </section>
        <p className="py-3 text-[14px]">
          Resultado del mes (caja menos gastos): <strong className="num">{ars(cash - spent)}</strong>
        </p>

        <h2 className="mt-4 mb-1 text-[14px] font-bold">Liquidación por unidad</h2>
        <Table>
          <thead>
            <tr>
              <Th>Unidad</Th>
              <Th>Inquilino</Th>
              <Th align="right">Saldo ant.</Th>
              <Th align="right">Cuota</Th>
              <Th align="right">Pagado</Th>
              <Th align="right">Intereses</Th>
              <Th align="right">Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {ledger.data.rows.map((r) => (
              <tr key={r.contract_id} className="break-inside-avoid">
                <Td className="py-1.5 font-semibold">{r.property.code}</Td>
                <Td className="py-1.5">{r.tenant.name}</Td>
                <Td align="right" className="num py-1.5">{r.previous_balance ? ars(r.previous_balance, { short: true }) : "—"}</Td>
                <Td align="right" className="num py-1.5">{ars(r.month_amount, { short: true })}</Td>
                <Td align="right" className="num py-1.5">{r.month_paid ? ars(r.month_paid, { short: true }) : "—"}</Td>
                <Td align="right" className="num py-1.5">{r.late_fees ? ars(r.late_fees, { short: true }) : "—"}</Td>
                <Td align="right" className={`num py-1.5 font-semibold ${r.days_late > 0 ? "text-debt" : ""}`}>{r.total_due ? ars(r.total_due, { short: true }) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2 className="mt-6 mb-1 text-[14px] font-bold">Cobros del mes</h2>
        <Table>
          <thead>
            <tr>
              <Th>Recibo</Th>
              <Th>Fecha</Th>
              <Th>Unidad</Th>
              <Th>Inquilino</Th>
              <Th>Medio</Th>
              <Th align="right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {payments.data.data.map((p) => (
              <tr key={p.id} className="break-inside-avoid">
                <Td className="num py-1.5">{String(p.receipt_number).padStart(5, "0")}</Td>
                <Td className="num py-1.5">{fecha(p.paid_on)}</Td>
                <Td className="py-1.5 font-semibold">{p.installment?.contract?.property?.code}</Td>
                <Td className="py-1.5">{p.installment?.contract?.tenant?.full_name}</Td>
                <Td className="py-1.5">{p.method.label}</Td>
                <Td align="right" className="num py-1.5">{ars(p.total)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2 className="mt-6 mb-1 text-[14px] font-bold">Gastos del mes</h2>
        {expenses.data.data.length === 0 ? (
          <p className="text-ink-2">Sin gastos cargados.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Unidad</Th>
                <Th>Rubro</Th>
                <Th>Detalle</Th>
                <Th align="right">Monto</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.data.data.map((e) => (
                <tr key={e.id} className="break-inside-avoid">
                  <Td className="num py-1.5">{fecha(e.spent_on)}</Td>
                  <Td className="py-1.5 font-semibold">{e.property.code}</Td>
                  <Td className="py-1.5">{e.category.label}</Td>
                  <Td className="py-1.5">{e.description}</Td>
                  <Td align="right" className="num py-1.5">{ars(e.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </article>
    </div>
  );
}
