"use client";

import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button, ErrorState, TimbreMark } from "@/components/ui";
import { ars, fecha, periodo } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function Receipt() {
  const { id } = useParams<{ id: string }>();
  const r = useApi<{ data: Payment; issuer: { name: string; phone: string } }>(`payments/${id}`);

  if (r.error) return <div className="p-8"><ErrorState message={r.error.status === 403 ? "Ese recibo no es tuyo." : r.error.message} /></div>;
  if (!r.data) return <div className="mx-auto mt-10 max-w-2xl skeleton h-96" />;

  const p = r.data.data;
  const inst = p.installment!;
  const c = inst.contract!;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 print:p-0">
      <div className="no-print mb-4 flex justify-end">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir o guardar PDF
        </Button>
      </div>
      <article className="relative border border-ink bg-white p-8">
        <header className="flex items-start justify-between gap-6 border-b border-ink pb-5">
          <div className="flex items-center gap-3">
            <TimbreMark className="size-9 text-rail" />
            <div>
              <p className="text-lg font-bold">{r.data.issuer.name}</p>
              {r.data.issuer.phone && <p className="text-sm text-ink-2">{r.data.issuer.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-[15px] font-bold tracking-[-0.005em]">Recibo de alquiler</h1>
            <p className="num text-2xl font-bold">N° {String(p.receipt_number).padStart(5, "0")}</p>
            <p className="num text-sm text-ink-2">{fecha(p.paid_on)}</p>
          </div>
        </header>
        <dl className="grid grid-cols-[150px_1fr] gap-y-2.5 py-6 text-[15px]">
          <dt className="text-ink-3">Recibí de</dt>
          <dd className="font-semibold">
            {c.tenant?.full_name} <span className="num font-normal text-ink-2">({c.tenant?.document})</span>
          </dd>
          <dt className="text-ink-3">Por el alquiler de</dt>
          <dd>
            {c.property?.address}, {c.property?.city} <span className="text-ink-3">({c.property?.code})</span>
          </dd>
          <dt className="text-ink-3">Período</dt>
          <dd>{periodo(inst.period)}</dd>
          <dt className="text-ink-3">Medio de pago</dt>
          <dd>
            {p.method.label}
            {p.reference && <span className="text-ink-2"> · ref. {p.reference}</span>}
          </dd>
        </dl>
        <table className="w-full border-t border-ink text-[15px]">
          <tbody>
            <tr className="border-b border-rule">
              <td className="py-2">Alquiler{p.amount < inst.amount ? " (pago parcial)" : ""}</td>
              <td className="num py-2 text-right">{ars(p.amount)}</td>
            </tr>
            {p.late_fee > 0 && (
              <tr className="border-b border-rule">
                <td className="py-2">Intereses por mora</td>
                <td className="num py-2 text-right">{ars(p.late_fee)}</td>
              </tr>
            )}
            <tr>
              <td className="pt-3 text-lg font-bold">Total</td>
              <td className="num pt-3 text-right text-lg font-bold">{ars(p.total)}</td>
            </tr>
          </tbody>
        </table>
        {inst.balance > 0 && <p className="mt-3 text-sm text-ink-2">Saldo pendiente del período: <span className="num">{ars(inst.balance)}</span></p>}
        <div className="mt-10 flex items-end justify-between">
          <span className="stamp text-xl">Pagado</span>
          <div className="w-48 border-t border-ink pt-1 text-center text-[13px] text-ink-2">Firma</div>
        </div>
      </article>
    </div>
  );
}
