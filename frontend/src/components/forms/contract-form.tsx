"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ars } from "@/lib/format";
import type { Contract, Property, Tenant } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet, Textarea } from "../ui";

function addYears(date: string, years: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setFullYear(d.getFullYear() + years);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function ContractForm({ open, propertyId, onClose, onSaved }: { open: boolean; propertyId?: number | null; onClose: () => void; onSaved: (c: Contract) => void }) {
  const firstOfMonth = new Date().toISOString().slice(0, 8) + "01";
  const [form, setForm] = useState({ property_id: propertyId ? String(propertyId) : "", tenant_id: "", start_date: firstOfMonth, end_date: addYears(firstOfMonth, 2), rent_amount: "", due_day: "10", adjustment_type: "icl", adjustment_every_months: "6", deposit: "", late_fee_daily_pct: "0.1", notes: "" });
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<{ data: Property[] }>("properties").then((r) => setProperties(r.data));
    api<{ data: Tenant[] }>("tenants").then((r) => setTenants(r.data));
  }, [open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => error?.field(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await api<{ data: Contract }>("contracts", { method: "POST", body: { ...form, deposit: form.deposit || 0, notes: form.notes || null } });
      onSaved(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const free = properties.filter((p) => !p.active_contract);
  const withoutContract = tenants.filter((t) => !t.active_contract);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nuevo contrato"
      description="Al guardarlo se generan las cuotas desde el inicio hasta este mes."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="contract-form" variant="primary" loading={saving}>
            Crear contrato
          </Button>
        </>
      }
    >
      <form id="contract-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        </div>
        <Field label="Propiedad" error={err("property_id")} className="col-span-2">
          {(id) => (
            <Select id={id} value={form.property_id} onChange={set("property_id")} required>
              <option value="">Elegí una unidad libre</option>
              {free.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.address} ({p.type.label})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Inquilino" error={err("tenant_id")} hint="Si no está, crealo primero en Inquilinos." className="col-span-2">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={form.tenant_id} onChange={set("tenant_id")} required>
              <option value="">Elegí un inquilino</option>
              {withoutContract.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} · {t.document}
                </option>
              ))}
              {withoutContract.length < tenants.length && (
                <optgroup label="Con contrato vigente">
                  {tenants
                    .filter((t) => t.active_contract)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} · {t.active_contract?.property?.code}
                      </option>
                    ))}
                </optgroup>
              )}
            </Select>
          )}
        </Field>
        <Field label="Inicio" error={err("start_date")}>
          {(id) => <Input id={id} type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value, end_date: addYears(e.target.value, 2) }))} required />}
        </Field>
        <Field label="Fin" error={err("end_date")}>
          {(id) => <Input id={id} type="date" value={form.end_date} onChange={set("end_date")} required />}
        </Field>
        <Field label="Alquiler mensual" error={err("rent_amount")} hint={form.rent_amount ? ars(Number(form.rent_amount)) : undefined}>
          {(id, d) => <Input id={id} aria-describedby={d} type="number" min="1" step="0.01" value={form.rent_amount} onChange={set("rent_amount")} required className="num" />}
        </Field>
        <Field label="Día de vencimiento" error={err("due_day")}>
          {(id) => <Input id={id} type="number" min="1" max="28" value={form.due_day} onChange={set("due_day")} required className="num" />}
        </Field>
        <Field label="Ajuste">
          {(id) => (
            <Select id={id} value={form.adjustment_type} onChange={set("adjustment_type")}>
              <option value="icl">ICL</option>
              <option value="ipc">IPC</option>
              <option value="fijo">Monto fijo</option>
            </Select>
          )}
        </Field>
        <Field label="Cada (meses)" error={err("adjustment_every_months")}>
          {(id) => <Input id={id} type="number" min="1" max="24" value={form.adjustment_every_months} onChange={set("adjustment_every_months")} className="num" />}
        </Field>
        <Field label="Depósito" error={err("deposit")}>
          {(id) => <Input id={id} type="number" min="0" step="0.01" value={form.deposit} onChange={set("deposit")} className="num" />}
        </Field>
        <Field label="Mora diaria (%)" error={err("late_fee_daily_pct")} hint="Sobre el saldo vencido.">
          {(id, d) => <Input id={id} aria-describedby={d} type="number" min="0" max="5" step="0.01" value={form.late_fee_daily_pct} onChange={set("late_fee_daily_pct")} className="num" />}
        </Field>
        <Field label="Notas" className="col-span-2">
          {(id) => <Textarea id={id} value={form.notes} onChange={set("notes")} rows={2} className="min-h-16" />}
        </Field>
      </form>
    </Sheet>
  );
}
