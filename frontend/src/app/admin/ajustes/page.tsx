"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button, ErrorState, Field, FormError, Input, PageHeader, Panel, Section, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";

type Settings = { owner_name: string; owner_phone: string; bank_alias: string; reminder_template: string; derivation_template: string; site_name: string; inquiry_reply_template: string; inquiry_derivation_template: string };

const reminderVars = ["nombre", "administracion", "propiedad", "saldo", "periodo", "dias", "alias"];
const replyVars = ["nombre", "administracion", "sitio", "titulo", "direccion", "operacion", "precio", "codigo", "mensaje"];
const inquiryDerivationVars = ["colega", "nombre", "telefono", "email", "sitio", "titulo", "direccion", "operacion", "precio", "codigo", "mensaje"];
const derivationVars = ["proveedor", "administracion", "rubro", "direccion", "inquilino", "telefono_inquilino", "titulo", "descripcion", "prioridad", "ticket"];

const sample: Record<string, string> = {
  nombre: "Juan",
  administracion: "Administración Timbre",
  propiedad: "Azcuénaga 1250, depto 8",
  saldo: "$ 1.359.430,00",
  periodo: "Septiembre 2026",
  dias: "29",
  alias: "TIMBRE.ALQUILER.MP",
  proveedor: "Rubén Ocampo",
  rubro: "plomería",
  direccion: "Azcuénaga 1250, depto 8 (AZC-8)",
  inquilino: "Juan Pereyra",
  telefono_inquilino: "11 2774-1898",
  titulo: "Pierde la llave de paso",
  descripcion: "La llave de paso de la cocina gotea desde ayer.",
  prioridad: "alta",
  ticket: "1",
};

/** Ejemplo para las consultas que llegan desde Brunito. */
const inquirySample: Record<string, string> = {
  nombre: "Florencia",
  administracion: "Administración Timbre",
  sitio: "Brunito",
  titulo: "Tres ambientes en piso alto con vista abierta",
  direccion: "Juncal 2410, depto 9A, Recoleta",
  operacion: "venta",
  precio: "USD 235.000",
  codigo: "JUN-9A",
  mensaje: "¿Acepta crédito hipotecario?",
  colega: "Marta Iglesias",
  telefono: "11 0000-9201",
  email: ", mail flor.arias@example.com",
};

const fill = (tpl: string, values: Record<string, string> = sample) => tpl.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);

export default function SettingsPage() {
  const remote = useApi<Settings>("settings");
  if (remote.error) return <ErrorState message={remote.error.message} onRetry={remote.reload} />;
  if (!remote.data) return <div className="skeleton h-64" />;
  return <SettingsForm initial={remote.data} />;
}

function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("settings", { method: "PUT", body: form });
      toast("Ajustes guardados");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const template = (key: "reminder_template" | "derivation_template" | "inquiry_reply_template" | "inquiry_derivation_template", title: string, vars: string[], values?: Record<string, string>) => (
    <Section title={title}>
      <Panel className="grid gap-4 p-4 lg:grid-cols-2">
        <Field label="Mensaje" error={error?.field(key)} hint={`Variables: ${vars.map((v) => `{${v}}`).join(" ")}`}>
          {(id, d) => <Textarea id={id} aria-describedby={d} value={form[key]} onChange={set(key)} rows={7} />}
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Así le llega por WhatsApp</p>
          <div className="rounded-sm border border-whatsapp-bubble-rule bg-whatsapp-bubble p-3 text-[14px] leading-relaxed whitespace-pre-line">{fill(form[key], values)}</div>
        </div>
      </Panel>
    </Section>
  );

  return (
    <form onSubmit={submit}>
      <PageHeader
        title="Ajustes y mensajes"
        subtitle="Tus datos y los textos que salen por WhatsApp."
        actions={
          <Button type="submit" variant="primary" loading={saving}>
            Guardar
          </Button>
        }
      />
      <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
      <div className="flex flex-col gap-8">
        <Section title="Administración">
          <Panel className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Nombre" error={error?.field("owner_name")} hint="Firma los avisos y los recibos.">
              {(id, d) => <Input id={id} aria-describedby={d} value={form.owner_name} onChange={set("owner_name")} required />}
            </Field>
            <Field label="Tu WhatsApp" hint="Para que los inquilinos te escriban desde el portal.">
              {(id, d) => <Input id={id} aria-describedby={d} type="tel" value={form.owner_phone} onChange={set("owner_phone")} />}
            </Field>
            <Field label="Alias o CBU" hint="Se incluye en el aviso de deuda.">
              {(id, d) => <Input id={id} aria-describedby={d} value={form.bank_alias} onChange={set("bank_alias")} />}
            </Field>
          </Panel>
        </Section>
        {template("reminder_template", "Aviso de deuda al inquilino", reminderVars)}
        {template("derivation_template", "Derivación de reclamo al proveedor", derivationVars)}
        <Section title="Brunito (web de propiedades)">
          <Panel className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Nombre de la web" error={error?.field("site_name")} hint="Aparece en los mensajes como {sitio}.">
              {(id, d) => <Input id={id} aria-describedby={d} value={form.site_name} onChange={set("site_name")} required />}
            </Field>
          </Panel>
        </Section>
        {template("inquiry_reply_template", "Respuesta a quien consultó en la web", replyVars, inquirySample)}
        {template("inquiry_derivation_template", "Derivación de una consulta a un colega", inquiryDerivationVars, inquirySample)}
      </div>
    </form>
  );
}
