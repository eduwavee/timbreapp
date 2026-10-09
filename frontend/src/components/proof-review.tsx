"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ars, fecha, hace, periodo } from "@/lib/format";
import type { Proof } from "@/lib/types";
import { Button, Field, FormError, Input, Sheet, Textarea } from "./ui";

/**
 * Revisar un comprobante: ver el archivo, confirmar (se registra el pago y sale el recibo) o rechazar con un motivo.
 */
export function ProofReview({ proof, onClose, onDone }: { proof: Proof; onClose: () => void; onDone: (message: string) => void }) {
  const [amount, setAmount] = useState(String(Math.min(proof.amount, proof.installment.balance)));
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const pending = proof.status.value === "pendiente";

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await api(`proofs/${proof.id}/approve`, { method: "POST", body: { amount: Number(amount) } });
      onDone(`Pago de ${proof.tenant?.name} confirmado. Recibo generado.`);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  async function reject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`proofs/${proof.id}/reject`, { method: "POST", body: { reason } });
      onDone("Comprobante rechazado. El inquilino ve el motivo en su portal.");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Comprobante de pago"
      description={`${proof.installment.property_code} · ${proof.tenant?.name} · ${periodo(proof.installment.period)}`}
      footer={
        pending &&
        (rejecting ? (
          <>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Volver
            </Button>
            <Button type="submit" form="reject-form" variant="danger" loading={busy} disabled={!reason.trim()}>
              Rechazar comprobante
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" onClick={() => setRejecting(true)} className="mr-auto">
              Rechazar
            </Button>
            <Button variant="stamp" onClick={approve} loading={busy} disabled={Number(amount) <= 0}>
              Confirmar y emitir recibo
            </Button>
          </>
        ))
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error ? (error.field("amount") ?? error.field("proof") ?? error.message) : null} />
        <a href={proof.file_url} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-sm border border-rule bg-paper">
          {proof.is_pdf ? (
            <span className="flex h-40 items-center justify-center gap-2 text-sm font-semibold">
              <ExternalLink className="size-4" /> Abrir el PDF del comprobante
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proof.file_url} alt="Comprobante subido por el inquilino" className="max-h-[42vh] w-full object-contain" />
          )}
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-sm bg-ink/80 px-2 py-1 text-[12px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ExternalLink className="size-3.5" /> Ver en grande
          </span>
        </a>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-3">Informó</dt>
          <dd className="num font-semibold">{ars(proof.amount)}</dd>
          <dt className="text-ink-3">Pagado el</dt>
          <dd className="num">{fecha(proof.paid_on)}</dd>
          <dt className="text-ink-3">Medio</dt>
          <dd>{proof.method.label}</dd>
          <dt className="text-ink-3">Saldo de la cuota</dt>
          <dd className="num">{ars(proof.installment.balance)}</dd>
          <dt className="text-ink-3">Lo mandó</dt>
          <dd>{hace(proof.created_at)}</dd>
        </dl>
        {proof.note && <p className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm">“{proof.note}”</p>}

        {!pending && (
          <p className="text-sm">
            {proof.status.value === "aprobado" ? (
              <span className="stamp text-[12px]">Confirmado</span>
            ) : (
              <span className="text-debt">Rechazado: {proof.rejection_reason}</span>
            )}
            {proof.receipt_number && <span className="ml-3 text-ink-2">Recibo N° {String(proof.receipt_number).padStart(5, "0")}</span>}
          </p>
        )}

        {pending && !rejecting && (
          <Field
            label="Monto de la cuota a registrar"
            hint={
              proof.amount > Number(amount || 0)
                ? `${ars(Number(amount || 0))} de cuota + ${ars(proof.amount - Number(amount || 0))} de intereses por mora.`
                : `${ars(Number(amount || 0))}. Si transfirió de menos, queda como pago parcial.`
            }
          >
            {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="decimal" min="0.01" max={proof.installment.balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />}
          </Field>
        )}
        {pending && rejecting && (
          <form id="reject-form" onSubmit={reject}>
            <Field label="Motivo" hint="Lo ve el inquilino en su portal. Ej.: “No se ve el número de operación”.">
              {(id, d) => <Textarea id={id} aria-describedby={d} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus rows={3} />}
            </Field>
          </form>
        )}
      </div>
    </Sheet>
  );
}
