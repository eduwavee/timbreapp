"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { useToast } from "@/components/toast";
import { Button, Empty, ErrorState, Field, FormError, Input, LastChange, PageHeader, Panel, SearchBox, Sheet, SkeletonRows, Textarea, WhatsAppLink } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { matches, recentFirst } from "@/lib/search";
import type { Colleague } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useUrlState } from "@/lib/use-url-state";

function waLink(phone: string) {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("54")) d = d.slice(2).replace(/^9/, "");
  return `https://wa.me/549${d}`;
}

/** Vendedores y colegas: a ellos se les derivan las consultas de Brunito. */
export default function ColleaguesPage() {
  const list = useApi<{ data: Colleague[] }>("colleagues");
  const [editing, setEditing] = useState<Colleague | "new" | null>(null);
  const toast = useToast();
  const [q, setQ] = useUrlState("q", "");
  const colleagues = useMemo(() => list.data?.data ?? [], [list.data]);
  const shown = useMemo(
    () =>
      recentFirst(colleagues.filter((c) => matches(q, c.name, c.agency, c.zone, c.phone, c.notes)))
        // los inactivos siguen al final, como los manda la API
        .sort((a, b) => Number(b.active) - Number(a.active)),
    [colleagues, q],
  );

  return (
    <>
      <PageHeader
        back={{ href: "/admin/consultas", label: "Consultas" }}
        title="Colegas"
        subtitle="Vendedores e inmobiliarias amigas. Les pasás las consultas de Brunito con un clic."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Nuevo colega
          </Button>
        }
      />
      {colleagues.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Nombre, inmobiliaria o zona" className="ml-auto sm:w-72" />
          <ExportButton
            title="Colegas"
            rows={shown}
            columns={[
              { label: "Nombre", value: (c) => c.name },
              { label: "Inmobiliaria", value: (c) => c.agency },
              { label: "Zona", value: (c) => c.zone },
              { label: "WhatsApp", value: (c) => c.phone },
              { label: "Consultas en curso", type: "number", value: (c) => c.open_inquiries_count },
            ]}
          />
        </div>
      )}
      {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
      <Panel>
        {list.loading && !list.data && <SkeletonRows rows={5} cols={4} />}
        {list.data && colleagues.length === 0 && (
          <Empty title="Todavía no cargaste colegas" action={<Button onClick={() => setEditing("new")}>Cargar el primero</Button>}>
            Cargá a quien te ayuda a vender o alquilar, con su WhatsApp y la zona que trabaja, y vas a poder derivarle cada consulta.
          </Empty>
        )}
        {colleagues.length > 0 && shown.length === 0 && <Empty title="Ningún colega coincide con la búsqueda">Probá con la zona que trabaja, por ejemplo “Lanús”.</Empty>}
        <ul className="divide-y divide-rule">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {c.name}
                  {!c.active && <span className="ml-2 text-[12px] font-normal text-ink-3">(inactivo)</span>}
                </p>
                <p className="text-[13px] text-ink-2">
                  {[c.agency, c.zone].filter(Boolean).join(" · ")}
                  {(c.agency || c.zone) && " · "}
                  <span className="num">{c.phone}</span>
                </p>
                {c.notes && <p className="text-[12.5px] text-ink-3">{c.notes}</p>}
                {!!c.open_inquiries_count && <p className="mt-0.5 text-[12.5px] font-semibold text-stamp">{c.open_inquiries_count} consultas en curso</p>}
                <LastChange item={c} className="mt-0.5 block text-[12px]" />
              </div>
              <div className="flex shrink-0 gap-1.5">
                <WhatsAppLink href={waLink(c.phone)} compact />
                <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => setEditing(c)} aria-label={`Editar a ${c.name}`}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      {editing !== null && (
        <ColleagueForm
          key={editing === "new" ? "new" : editing.id}
          colleague={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast(msg);
            list.reload();
          }}
        />
      )}
    </>
  );
}

function ColleagueForm({ colleague, onClose, onSaved }: { colleague: Colleague | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState(() => ({
    name: colleague?.name ?? "",
    agency: colleague?.agency ?? "",
    phone: colleague?.phone ?? "",
    zone: colleague?.zone ?? "",
    notes: colleague?.notes ?? "",
    active: colleague?.active ?? true,
  }));
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: "name" | "agency" | "phone" | "zone" | "notes") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(colleague ? `colleagues/${colleague.id}` : "colleagues", {
        method: colleague ? "PUT" : "POST",
        body: { ...form, agency: form.agency || null, zone: form.zone || null, notes: form.notes || null },
      });
      onSaved(colleague ? "Colega actualizado" : "Colega cargado");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!colleague || !window.confirm(`¿Borrar a ${colleague.name}? Sus consultas quedan sin colega asignado.`)) return;
    await api(`colleagues/${colleague.id}`, { method: "DELETE" });
    onSaved("Colega borrado");
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={colleague ? `Editar a ${colleague.name}` : "Nuevo colega"}
      footer={
        <>
          {colleague && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              Borrar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="colleague-form" variant="primary" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="colleague-form" onSubmit={submit} className="flex flex-col gap-4">
        <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        <Field label="Nombre" error={error?.field("name")}>
          {(id) => <Input id={id} value={form.name} onChange={set("name")} required />}
        </Field>
        <Field label="Inmobiliaria o matrícula" error={error?.field("agency")}>
          {(id) => <Input id={id} value={form.agency} onChange={set("agency")} placeholder="Iglesias Propiedades (CUCICBA 6120)" />}
        </Field>
        <Field label="WhatsApp" error={error?.field("phone")} hint="Con código de área: 11 6123-4410.">
          {(id, d) => <Input id={id} aria-describedby={d} type="tel" value={form.phone} onChange={set("phone")} required />}
        </Field>
        <Field label="Zona que trabaja" hint="Para acordarte a quién le va cada consulta.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.zone} onChange={set("zone")} placeholder="Palermo y Colegiales" />}
        </Field>
        <Field label="Notas">
          {(id) => <Textarea id={id} value={form.notes} onChange={set("notes")} rows={2} className="min-h-16" />}
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--stamp)]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Activo (aparece para derivar consultas)
        </label>
      </form>
    </Sheet>
  );
}
