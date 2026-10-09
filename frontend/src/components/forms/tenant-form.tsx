"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Tenant } from "@/lib/types";
import { Button, Field, FormError, Input, Sheet, Textarea } from "../ui";

const empty = { first_name: "", last_name: "", document: "", phone: "", email: "", guarantor_name: "", guarantor_phone: "", notes: "", create_portal_access: false, portal_password: "" };

export function TenantForm({ open, tenant, onClose, onSaved }: { open: boolean; tenant?: Tenant | null; onClose: () => void; onSaved: (t: Tenant) => void }) {
  const [form, setForm] = useState(() =>
      tenant
        ? {
            first_name: tenant.first_name,
            last_name: tenant.last_name ?? "",
            document: tenant.document,
            phone: tenant.phone,
            email: tenant.email ?? "",
            guarantor_name: tenant.guarantor_name ?? "",
            guarantor_phone: tenant.guarantor_phone ?? "",
            notes: tenant.notes ?? "",
            create_portal_access: false,
            portal_password: "",
          }
        : empty,
  );
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => error?.field(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
      const { data } = await api<{ data: Tenant }>(tenant ? `tenants/${tenant.id}` : "tenants", { method: tenant ? "PUT" : "POST", body });
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
      title={tenant ? `Editar a ${tenant.full_name}` : "Nuevo inquilino"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="tenant-form" variant="primary" loading={saving}>
            {tenant ? "Guardar cambios" : "Crear inquilino"}
          </Button>
        </>
      }
    >
      <form id="tenant-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        </div>
        <Field label="Nombre o razón social" error={err("first_name")}>
          {(id) => <Input id={id} value={form.first_name} onChange={set("first_name")} required />}
        </Field>
        <Field label="Apellido" error={err("last_name")} hint="Vacío si es una empresa.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.last_name} onChange={set("last_name")} />}
        </Field>
        <Field label="DNI o CUIT" error={err("document")}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("document")} value={form.document} onChange={set("document")} required inputMode="numeric" />}
        </Field>
        <Field label="WhatsApp" error={err("phone")} hint="Con código de área: 11 5555-1234.">
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("phone")} type="tel" value={form.phone} onChange={set("phone")} required />}
        </Field>
        <Field label="Email" error={err("email")} className="col-span-2">
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("email")} type="email" value={form.email} onChange={set("email")} />}
        </Field>
        <Field label="Garante">
          {(id) => <Input id={id} value={form.guarantor_name} onChange={set("guarantor_name")} />}
        </Field>
        <Field label="Teléfono del garante">
          {(id) => <Input id={id} type="tel" value={form.guarantor_phone} onChange={set("guarantor_phone")} />}
        </Field>
        <Field label="Notas" className="col-span-2">
          {(id) => <Textarea id={id} value={form.notes} onChange={set("notes")} rows={2} className="min-h-16" />}
        </Field>

        <fieldset className="col-span-2 rounded-sm border border-rule bg-paper p-4">
          <legend className="px-1 text-[13px] font-semibold">Portal del inquilino</legend>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--stamp)]" checked={form.create_portal_access} onChange={(e) => setForm((f) => ({ ...f, create_portal_access: e.target.checked }))} />
            <span>
              {tenant?.has_portal_access ? "Cambiar la contraseña del portal" : "Darle acceso al portal"}
              <span className="block text-ink-3">Entra con su email para ver sus pagos y cargar reclamos.</span>
            </span>
          </label>
          {form.create_portal_access && (
            <Field label="Contraseña inicial" error={err("portal_password") ?? (!form.email ? "Hace falta el email para darle acceso." : undefined)} className="mt-3">
              {(id, d) => <Input id={id} aria-describedby={d} type="text" minLength={8} value={form.portal_password} onChange={set("portal_password")} required placeholder="Mínimo 8 caracteres" />}
            </Field>
          )}
        </fieldset>
      </form>
    </Sheet>
  );
}
