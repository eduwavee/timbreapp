"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ars, periodo, today } from "@/lib/format";
import { PAYMENT_METHODS, type Installment, type Payment } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet, StageStrip, Textarea } from "./ui";

/**
 * Registrar un cobro total o parcial de una cuota. Propone el saldo y el interés por mora calculado.
 */
export function PaymentSheet({ installmentId, onClose, onPaid }: { installmentId: number | null; onClose: () => void; onPaid: (payment: Payment) => void }) {
  const [inst, setInst] = useState<Installment | null>(null);
  const [amount, setAmount] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState("transferencia");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (installmentId === null) return;
    api<{ data: Installment }>(`installments/${installmentId}`)
      .then(({ data }) => {
        setInst(data);
        setAmount(String(data.balance));
        setLateFee(String(data.late_fee ?? 0));
      })
      .catch((e) => setError(e));
  }, [installmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!inst) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await api<{ data: Payment }>(`installments/${inst.id}/payments`, {
        method: "POST",
        body: { amount: Number(amount), late_fee: Number(lateFee || 0), paid_on: paidOn, method, reference: reference || null, notes: notes || null },
      });
      onPaid(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const total = Number(amount || 0) + Number(lateFee || 0);
  const tenant = inst?.contract?.tenant;
  const property = inst?.contract?.property;

  return (
    <Sheet
      open={installmentId !== null}
      onClose={onClose}
      title="Registrar cobro"
      description={inst ? `${property?.code} · ${tenant?.full_name} · ${periodo(inst.period)}` : "Cargando cuota…"}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="payment-form" variant="stamp" loading={saving} disabled={!inst}>
            Cobrar {ars(total)}
          </Button>
        </>
      }
    >
      {!inst && !error && <div className="skeleton h-40 w-full" />}
      {inst && (
        <form id="payment-form" onSubmit={submit} className="flex flex-col gap-4">
          <dl className="grid grid-cols-3 border border-rule text-[13px]">
            <div className="border-r border-rule p-3">
              <dt className="label">Cuota</dt>
              <dd className="num mt-1 text-[15px] font-semibold">{ars(inst.amount)}</dd>
            </div>
            <div className="border-r border-rule p-3">
              <dt className="label">Ya pagado</dt>
              <dd className="num mt-1 text-[15px] font-semibold">{ars(inst.paid_amount)}</dd>
            </div>
            <div className="p-3">
              <dt className="label">Saldo</dt>
              <dd className={`num mt-1 text-[15px] font-semibold ${inst.days_late > 0 ? "text-debt" : ""}`}>{ars(inst.balance)}</dd>
            </div>
          </dl>
          <StageStrip status={inst.status.value} dueDate={inst.due_date} />
          {inst.days_late > 0 && (
            <p className="text-sm text-ink-2">
              Venció hace <strong className="text-debt">{inst.days_late} días</strong>. El interés por mora del contrato ({inst.contract?.late_fee_daily_pct}% diario) suma {ars(inst.late_fee)}; podés cobrarlo, bajarlo o perdonarlo.
            </p>
          )}

          <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto de la cuota" error={error?.field("amount")} hint={ars(Number(amount || 0))}>
              {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!error?.field("amount")} type="number" inputMode="decimal" step="0.01" min="0.01" max={inst.balance} value={amount} onChange={(e) => setAmount(e.target.value)} required className="num" />}
            </Field>
            <Field label="Interés por mora" error={error?.field("late_fee")} hint={ars(Number(lateFee || 0))}>
              {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="decimal" step="0.01" min="0" value={lateFee} onChange={(e) => setLateFee(e.target.value)} className="num" />}
            </Field>
            <Field label="Fecha de pago" error={error?.field("paid_on")}>
              {(id, d) => <Input id={id} aria-describedby={d} type="date" max={today()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} required />}
            </Field>
            <Field label="Medio">
              {(id) => (
                <Select id={id} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <Field label="Referencia" hint="Número de operación o comprobante (opcional).">
            {(id, d) => <Input id={id} aria-describedby={d} value={reference} onChange={(e) => setReference(e.target.value)} />}
          </Field>
          <Field label="Nota">
            {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="min-h-16" />}
          </Field>
          {Number(amount) < inst.balance && Number(amount) > 0 && (
            <p className="rounded-sm border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
              Es un pago parcial: quedan {ars(inst.balance - Number(amount))} pendientes de esta cuota.
            </p>
          )}
        </form>
      )}
      {error && !inst && <FormError message={error.message} />}
    </Sheet>
  );
}
