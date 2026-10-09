"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ars, periodo, today } from "@/lib/format";
import { PAYMENT_METHODS, type Installment } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet, Textarea } from "../ui";

/** El inquilino informa un pago con la captura o el PDF de la transferencia. */
export function ProofForm({ installments, waitingIds = [], onClose, onSaved }: { installments: Installment[]; waitingIds?: number[]; onClose: () => void; onSaved: () => void }) {
  // Las cuotas con un comprobante esperando confirmación no se pueden volver a informar.
  const unpaid = installments.filter((i) => i.balance > 0 && !waitingIds.includes(i.id)).sort((a, b) => a.period.localeCompare(b.period));
  const [installmentId, setInstallmentId] = useState(String(unpaid[0]?.id ?? ""));
  const selected = unpaid.find((i) => String(i.id) === installmentId);
  const [amount, setAmount] = useState(selected ? String(selected.balance + (selected.late_fee ?? 0)) : "");
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState("transferencia");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  function pick(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);
    const body = new FormData();
    body.append("installment_id", installmentId);
    body.append("amount", amount);
    body.append("paid_on", paidOn);
    body.append("method", method);
    if (note) body.append("note", note);
    body.append("file", file);
    try {
      await api("portal/proofs", { method: "POST", body });
      onSaved();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Informar un pago"
      description="Subí la captura de la transferencia. Cuando la administración la confirma, te queda el recibo acá."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="proof-form" variant="primary" loading={saving} disabled={!file || !installmentId}>
            Enviar comprobante
          </Button>
        </>
      }
    >
      {unpaid.length === 0 ? (
        <p className="text-ink-2">{waitingIds.length ? "Ya informaste el pago de tus cuotas pendientes. Te avisamos cuando lo confirmemos." : "No tenés cuotas con saldo. ¡Estás al día!"}</p>
      ) : (
        <form id="proof-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormError message={error ? (error.field("installment_id") ?? error.field("file") ?? (Object.keys(error.errors).length ? null : error.message)) : null} />
          </div>
          <Field label="¿Qué cuota pagaste?" className="col-span-2">
            {(id) => (
              <Select
                id={id}
                value={installmentId}
                onChange={(e) => {
                  setInstallmentId(e.target.value);
                  const i = unpaid.find((x) => String(x.id) === e.target.value);
                  if (i) setAmount(String(i.balance + (i.late_fee ?? 0)));
                }}
              >
                {unpaid.map((i) => (
                  <option key={i.id} value={i.id}>
                    {periodo(i.period)} · {ars(i.balance)}
                    {i.days_late > 0 ? " · vencida" : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Monto que pagaste" error={error?.field("amount")} hint={ars(Number(amount || 0))}>
            {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="num" />}
          </Field>
          <Field label="Fecha" error={error?.field("paid_on")}>
            {(id) => <Input id={id} type="date" max={today()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} required />}
          </Field>
          <Field label="Medio" className="col-span-2">
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
          <Field label="Comprobante" error={error?.field("file")} hint="Foto, captura o PDF, hasta 10 MB." className="col-span-2">
            {(id, d) => <input id={id} aria-describedby={d} type="file" accept="image/*,.pdf" required onChange={(e) => pick(e.target.files?.[0] ?? null)} className="text-sm file:mr-3 file:h-9 file:rounded-sm file:border file:border-rule-strong file:bg-sheet file:px-3 file:text-sm file:font-semibold hover:file:border-ink" />}
          </Field>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa del comprobante" className="col-span-2 max-h-56 rounded-sm border border-rule object-contain" />
          )}
          <Field label="Mensaje (opcional)" className="col-span-2">
            {(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="min-h-16" placeholder="Ej.: transferí desde la cuenta de mi pareja" />}
          </Field>
        </form>
      )}
    </Sheet>
  );
}
