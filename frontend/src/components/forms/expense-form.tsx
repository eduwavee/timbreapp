"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ars, today } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense, type Property } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet } from "../ui";

export function ExpenseForm({ expense, propertyId, onClose, onSaved }: { expense?: Expense | null; propertyId?: number | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState({
    property_id: String(expense?.property.id ?? propertyId ?? ""),
    category: expense?.category.value ?? "arreglo",
    description: expense?.description ?? "",
    amount: expense ? String(expense.amount) : "",
    spent_on: expense?.spent_on ?? today(),
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data: Property[] }>("properties").then((r) => setProperties(r.data));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => error?.field(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(expense ? `expenses/${expense.id}` : "expenses", { method: expense ? "PUT" : "POST", body: { ...form, amount: Number(form.amount) } });
      onSaved(expense ? "Gasto actualizado" : "Gasto registrado");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!expense || !window.confirm("¿Borrar este gasto?")) return;
    await api(`expenses/${expense.id}`, { method: "DELETE" });
    onSaved("Gasto borrado");
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={expense ? "Editar gasto" : "Registrar gasto"}
      description={expense?.ticket_id ? `Viene del reclamo #${expense.ticket_id}: el monto se edita desde el reclamo.` : "ABL, expensas, arreglos, seguros: todo lo que sale por cada unidad."}
      footer={
        <>
          {expense && !expense.ticket_id && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              Borrar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="expense-form" variant="primary" loading={saving} disabled={!!expense?.ticket_id}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        </div>
        <Field label="Unidad" error={err("property_id")} className="col-span-2">
          {(id) => (
            <Select id={id} value={form.property_id} onChange={set("property_id")} required>
              <option value="">Elegí la unidad</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.address}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Rubro">
          {(id) => (
            <Select id={id} value={form.category} onChange={set("category")}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Fecha" error={err("spent_on")}>
          {(id) => <Input id={id} type="date" max={today()} value={form.spent_on} onChange={set("spent_on")} required />}
        </Field>
        <Field label="Detalle" error={err("description")} className="col-span-2" hint="Ej.: “ABL 5° bimestre” o “Cambio de flexible del lavatorio”.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.description} onChange={set("description")} required maxLength={200} />}
        </Field>
        <Field label="Monto" error={err("amount")} hint={form.amount ? ars(Number(form.amount)) : undefined} className="col-span-2">
          {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} required className="num" />}
        </Field>
      </form>
    </Sheet>
  );
}
