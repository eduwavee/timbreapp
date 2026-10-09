"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Property } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet, Textarea } from "../ui";

const empty = { code: "", type: "departamento", status: "disponible", street: "", number: "", unit: "", city: "CABA", surface_m2: "", rooms: "", notes: "" };

export function PropertyForm({ open, property, onClose, onSaved }: { open: boolean; property?: Property | null; onClose: () => void; onSaved: (p: Property) => void }) {
  const [form, setForm] = useState(() =>
      property
        ? {
            code: property.code,
            type: property.type.value,
            status: property.status.value,
            street: property.street,
            number: property.number,
            unit: property.unit ?? "",
            city: property.city,
            surface_m2: property.surface_m2 ?? "",
            rooms: property.rooms?.toString() ?? "",
            notes: property.notes ?? "",
          }
        : empty,
  );
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, unit: form.unit || null, surface_m2: form.surface_m2 || null, rooms: form.rooms || null, notes: form.notes || null };
      const { data } = await api<{ data: Property }>(property ? `properties/${property.id}` : "properties", { method: property ? "PUT" : "POST", body });
      onSaved(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => error?.field(k);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={property ? `Editar ${property.code}` : "Nueva propiedad"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="property-form" variant="primary" loading={saving}>
            {property ? "Guardar cambios" : "Crear propiedad"}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        </div>
        <Field label="Tipo">
          {(id) => (
            <Select id={id} value={form.type} onChange={set("type")}>
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
              <option value="galpon">Galpón</option>
            </Select>
          )}
        </Field>
        <Field label="Código" error={err("code")} hint="Corto y único, ej. AZC-8.">
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("code")} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required maxLength={16} />}
        </Field>
        <Field label="Calle" error={err("street")} className="col-span-2">
          {(id) => <Input id={id} value={form.street} onChange={set("street")} required />}
        </Field>
        <Field label="Número" error={err("number")}>
          {(id) => <Input id={id} value={form.number} onChange={set("number")} required />}
        </Field>
        <Field label="Unidad / piso" hint="Vacío si es una casa o galpón.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.unit} onChange={set("unit")} />}
        </Field>
        <Field label="Localidad" error={err("city")}>
          {(id) => <Input id={id} value={form.city} onChange={set("city")} required />}
        </Field>
        <Field label="Estado">
          {(id) => (
            <Select id={id} value={form.status} onChange={set("status")}>
              <option value="disponible">Disponible</option>
              <option value="ocupada">Ocupada</option>
              <option value="mantenimiento">En mantenimiento</option>
            </Select>
          )}
        </Field>
        <Field label="Superficie (m²)" error={err("surface_m2")}>
          {(id) => <Input id={id} type="number" min="0" step="0.01" value={form.surface_m2} onChange={set("surface_m2")} className="num" />}
        </Field>
        <Field label="Ambientes" error={err("rooms")}>
          {(id) => <Input id={id} type="number" min="0" value={form.rooms} onChange={set("rooms")} className="num" />}
        </Field>
        <Field label="Notas" className="col-span-2">
          {(id) => <Textarea id={id} value={form.notes} onChange={set("notes")} rows={3} />}
        </Field>
      </form>
    </Sheet>
  );
}
