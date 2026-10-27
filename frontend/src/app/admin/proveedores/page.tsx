"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button, Empty, ErrorState, Field, FormError, Input, LastChange, PageHeader, Panel, SearchBox, Select, Sheet, SkeletonRows, Textarea, WhatsAppLink } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { matches, recentFirst } from "@/lib/search";
import { TRADES, type Provider } from "@/lib/types";
import { useApi } from "@/lib/use-api";

function waLink(phone: string) {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("54")) d = d.slice(2).replace(/^9/, "");
  return `https://wa.me/549${d}`;
}

export default function ProvidersPage() {
  const list = useApi<{ data: Provider[] }>("providers");
  const [editing, setEditing] = useState<Provider | "new" | null>(null);
  const [q, setQ] = useState("");
  const toast = useToast();

  const providers = list.data?.data ?? [];
  const groups = TRADES.map((t) => ({ trade: t, items: recentFirst(providers.filter((p) => p.trade.value === t.value && matches(q, p.name, p.phone, p.notes, t.label))) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle="Plomeros, electricistas, gasistas y demás. A ellos se derivan los reclamos."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Nuevo proveedor
          </Button>
        }
      />
      {providers.length > 0 && (
        <div className="mb-4 flex">
          <SearchBox value={q} onChange={setQ} placeholder="Nombre, rubro o teléfono" className="ml-auto sm:w-72" />
        </div>
      )}
      {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
      {providers.length > 0 && groups.length === 0 && (
        <Panel>
          <Empty title="Ningún proveedor coincide con la búsqueda">Probá con el rubro, por ejemplo “plomero” o “gas”.</Empty>
        </Panel>
      )}
      {list.loading && !list.data && (
        <Panel>
          <SkeletonRows rows={6} cols={4} />
        </Panel>
      )}
      {list.data && providers.length === 0 && (
        <Panel>
          <Empty title="Todavía no hay proveedores" action={<Button onClick={() => setEditing("new")}>Cargar el primero</Button>}>
            Cargá a tu plomero de confianza con su WhatsApp y vas a poder mandarle cada reclamo con un clic.
          </Empty>
        </Panel>
      )}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g.trade.value}>
            <h2 className="mb-2 text-[15px] font-bold">{g.trade.label}</h2>
            <Panel>
              <ul className="divide-y divide-rule">
                {g.items.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {p.name}
                        {!p.active && <span className="ml-2 text-[12px] font-normal text-ink-3">(inactivo)</span>}
                      </p>
                      <p className="num text-[13px] text-ink-2">{p.phone}</p>
                      {p.notes && <p className="text-[12.5px] text-ink-3">{p.notes}</p>}
                      {!!p.open_tickets_count && <p className="mt-0.5 text-[12.5px] font-semibold text-stamp">{p.open_tickets_count} trabajos abiertos</p>}
                      <LastChange item={p} className="mt-0.5 block text-[12px]" />
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <WhatsAppLink href={waLink(p.phone)} compact />
                      <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>
        ))}
      </div>
      {editing !== null && (
      <ProviderForm
        key={editing === "new" ? "new" : editing.id}
        provider={editing === "new" ? null : editing}
        open={editing !== null}
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

function ProviderForm({ open, provider, onClose, onSaved }: { open: boolean; provider: Provider | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState(() => (provider ? { name: provider.name, trade: provider.trade.value, phone: provider.phone, notes: provider.notes ?? "", active: provider.active } : { name: "", trade: "plomeria", phone: "", notes: "", active: true }));
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(provider ? `providers/${provider.id}` : "providers", { method: provider ? "PUT" : "POST", body: { ...form, notes: form.notes || null } });
      onSaved(provider ? "Proveedor actualizado" : "Proveedor creado");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!provider || !window.confirm(`¿Borrar a ${provider.name}?`)) return;
    await api(`providers/${provider.id}`, { method: "DELETE" });
    onSaved("Proveedor borrado");
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={provider ? `Editar a ${provider.name}` : "Nuevo proveedor"}
      footer={
        <>
          {provider && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              Borrar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="provider-form" variant="primary" loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="provider-form" onSubmit={submit} className="flex flex-col gap-4">
        <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />
        <Field label="Nombre" error={error?.field("name")}>
          {(id) => <Input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        </Field>
        <Field label="Rubro">
          {(id) => (
            <Select id={id} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })}>
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="WhatsApp" error={error?.field("phone")} hint="Con código de área: 11 6123-4410.">
          {(id, d) => <Input id={id} aria-describedby={d} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />}
        </Field>
        <Field label="Notas" hint="Horarios, matrícula, si cobra visita…">
          {(id, d) => <Textarea id={id} aria-describedby={d} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="min-h-16" />}
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--stamp)]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Activo (aparece para derivar reclamos)
        </label>
      </form>
    </Sheet>
  );
}
