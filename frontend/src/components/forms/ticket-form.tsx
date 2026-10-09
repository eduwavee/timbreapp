"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PRIORITIES, TRADES, type Property, type Ticket } from "@/lib/types";
import { Button, Field, FormError, Input, Select, Sheet, Textarea } from "../ui";

/**
 * Alta de reclamo. En el portal no se elige propiedad: es la del contrato del inquilino.
 */
export function TicketForm({ open, onClose, onSaved, propertyId, endpoint = "tickets", withProperty = true }: { open: boolean; onClose: () => void; onSaved: (t: Ticket) => void; propertyId?: number | null; endpoint?: string; withProperty?: boolean }) {
  const [form, setForm] = useState({ property_id: propertyId ? String(propertyId) : "", title: "", description: "", category: "plomeria", priority: "media" });
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (withProperty) api<{ data: Property[] }>("properties").then((r) => setProperties(r.data));
  }, [open, withProperty]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => error?.field(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => (k !== "property_id" || withProperty) && body.append(k, v));
    Array.from(photos ?? []).forEach((f) => body.append("photos[]", f));
    try {
      const { data } = await api<{ data: Ticket }>(endpoint, { method: "POST", body });
      onSaved(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={withProperty ? "Nuevo reclamo" : "Contanos qué pasa"}
      description={withProperty ? undefined : "Lo recibe la administración al instante. Si es urgente (gas, agua que no corta), marcalo así."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="ticket-form" variant="primary" loading={saving}>
            {withProperty ? "Crear reclamo" : "Enviar reclamo"}
          </Button>
        </>
      }
    >
      <form id="ticket-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormError message={error && (!Object.keys(error.errors).length || error.field("title")?.startsWith("No tenés")) ? (error.field("title") ?? error.message) : null} />
        </div>
        {withProperty && (
          <Field label="Propiedad" error={err("property_id")} className="col-span-2">
            {(id) => (
              <Select id={id} value={form.property_id} onChange={set("property_id")} required>
                <option value="">Elegí la unidad</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.address}
                    {p.active_contract?.tenant ? ` (${p.active_contract.tenant.full_name})` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="¿Qué pasa?" error={err("title")} className="col-span-2" hint="En pocas palabras: “Pierde la llave de paso”.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.title} onChange={set("title")} required maxLength={120} />}
        </Field>
        <Field label="Detalle" error={err("description")} className="col-span-2">
          {(id) => <Textarea id={id} value={form.description} onChange={set("description")} required placeholder="Desde cuándo, dónde exactamente, si empeora…" />}
        </Field>
        <Field label="Rubro">
          {(id) => (
            <Select id={id} value={form.category} onChange={set("category")}>
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Prioridad">
          {(id) => (
            <Select id={id} value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Fotos" error={err("photos") ?? err("photos.0")} hint="Hasta 4 fotos. Ayudan a que el técnico venga con lo necesario." className="col-span-2">
          {(id, d) => <input id={id} aria-describedby={d} type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} className="text-sm file:mr-3 file:h-9 file:rounded-sm file:border file:border-rule-strong file:bg-sheet file:px-3 file:text-sm file:font-semibold file:text-ink hover:file:border-ink" />}
        </Field>
      </form>
    </Sheet>
  );
}
