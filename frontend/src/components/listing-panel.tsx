"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ars } from "@/lib/format";
import type { Enum, Listing, Property } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useToast } from "./toast";
import { Button, cx, Empty, ErrorState, Field, FormError, Input, Panel, Section, Sheet, Textarea } from "./ui";

type ListingResponse = { data: Listing | null; amenities: Enum[] };

const usd = (v: number) => `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(v)}`;

/**
 * La publicación de la unidad en Brunito, la web de propiedades.
 * Las fotos son las mismas de la ficha: la portada es la primera.
 */
export function ListingPanel({ property, photoCount }: { property: Property; photoCount: number }) {
  const listing = useApi<ListingResponse>(`properties/${property.id}/listing`);
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  const l = listing.data?.data;

  return (
    <Section title="Publicación en Brunito" actions={l?.published && <a href={l.public_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">Ver en la web <ExternalLink className="size-3" aria-hidden /></a>}>
      <Panel>
        {listing.error && (
          <div className="p-4">
            <ErrorState message={listing.error.message} onRetry={listing.reload} />
          </div>
        )}
        {!listing.data && !listing.error && <div className="skeleton m-4 h-20" />}
        {listing.data && !l && (
          <Empty title="No está publicada" action={<Button onClick={() => setEditing(true)}><Megaphone className="size-4" aria-hidden /> Publicar en la web</Button>}>
            Ponela en venta o en alquiler en Brunito. Quien toque &ldquo;Me interesa&rdquo; te aparece en Consultas para atenderlo vos o pasárselo a un colega.
          </Empty>
        )}
        {l && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{l.headline}</p>
                <p className="mt-0.5 text-[13px] text-ink-2">{l.neighborhood ?? property.city}</p>
              </div>
              <span className={cx("inline-flex h-6 shrink-0 items-center rounded-sm border px-2 text-[12px] font-semibold", l.published ? "border-ok/40 bg-ok-soft text-ok" : "border-rule-strong text-ink-2")}>
                {l.published ? (l.reserved ? "Publicada · reservada" : "Publicada") : "Borrador"}
              </span>
            </div>
            <dl className="divide-y divide-rule text-sm">
              {l.for_sale && (
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-ink-2">Venta</dt>
                  <dd className="num font-semibold">{l.sale_price ? usd(l.sale_price) : "Consultar"}</dd>
                </div>
              )}
              {l.for_rent && (
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-ink-2">Alquiler</dt>
                  <dd className="num font-semibold">{l.rent_price ? `${ars(l.rent_price, { short: true })} / mes` : "Consultar"}</dd>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-ink-2">Fotos en la web</dt>
                <dd className={cx("num", photoCount === 0 && "font-semibold text-debt")}>{photoCount === 0 ? "Sin fotos" : photoCount}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-ink-2">Consultas en curso</dt>
                <dd>
                  {l.open_inquiries_count ? (
                    <Link href="/admin/consultas" className="num font-semibold underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                      {l.open_inquiries_count}
                    </Link>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="border-t border-rule px-4 py-2.5">
              <Button size="sm" onClick={() => setEditing(true)}>
                Editar publicación
              </Button>
            </div>
          </>
        )}
      </Panel>
      {editing && listing.data && (
        <ListingForm
          property={property}
          listing={l ?? null}
          amenities={listing.data.amenities}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setEditing(false);
            toast(saved.published ? "Publicación guardada y visible en la web" : "Publicación guardada como borrador");
            listing.reload();
          }}
        />
      )}
    </Section>
  );
}

function ListingForm({ property, listing, amenities, onClose, onSaved }: { property: Property; listing: Listing | null; amenities: Enum[]; onClose: () => void; onSaved: (l: Listing) => void }) {
  const [form, setForm] = useState(() => ({
    headline: listing?.headline ?? "",
    description: listing?.description ?? "",
    neighborhood: listing?.neighborhood ?? "",
    for_sale: listing?.for_sale ?? false,
    sale_price: listing?.sale_price?.toString() ?? "",
    for_rent: listing?.for_rent ?? property.status.value === "disponible",
    rent_price: listing?.rent_price?.toString() ?? "",
    expenses: listing?.expenses?.toString() ?? "",
    bathrooms: listing?.bathrooms?.toString() ?? "1",
    garage: listing?.garage ?? false,
    age_years: listing?.age_years?.toString() ?? "",
    amenities: listing?.amenities ?? [],
    published: listing?.published ?? true,
    reserved: listing?.reserved ?? false,
  }));
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const text = (k: "headline" | "description" | "neighborhood" | "sale_price" | "rent_price" | "expenses" | "bathrooms" | "age_years") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleAmenity = (v: string) => setForm((f) => ({ ...f, amenities: f.amenities.includes(v) ? f.amenities.filter((a) => a !== v) : [...f.amenities, v] }));
  const num = (v: string) => (v === "" ? null : Number(v));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await api<{ data: Listing }>(`properties/${property.id}/listing`, {
        method: "PUT",
        body: {
          ...form,
          description: form.description || null,
          neighborhood: form.neighborhood || null,
          sale_price: num(form.sale_price),
          rent_price: num(form.rent_price),
          expenses: num(form.expenses),
          bathrooms: num(form.bathrooms),
          age_years: num(form.age_years),
        },
      });
      onSaved(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => error?.field(k);
  const occupied = property.status.value === "ocupada" && form.for_rent;

  return (
    <Sheet
      open
      onClose={onClose}
      title={listing ? `Publicación de ${property.code}` : `Publicar ${property.code}`}
      description="Lo que se ve en Brunito. Las fotos son las de la ficha."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="listing-form" variant="primary" loading={saving}>
            {form.published ? "Guardar y publicar" : "Guardar borrador"}
          </Button>
        </>
      }
    >
      <form id="listing-form" onSubmit={submit} className="flex flex-col gap-5">
        <FormError message={error && !Object.keys(error.errors).length ? error.message : null} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Operación</legend>
          <div className="grid grid-cols-2 gap-3">
            <div className={cx("flex flex-col gap-2 rounded-sm border p-3", form.for_sale ? "border-ink" : "border-rule")}>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" className="size-4 accent-[var(--ink)]" checked={form.for_sale} onChange={(e) => setForm({ ...form, for_sale: e.target.checked })} />
                Se vende
              </label>
              <Input aria-label="Precio de venta en dólares" type="number" inputMode="numeric" min={0} placeholder="USD" value={form.sale_price} onChange={text("sale_price")} disabled={!form.for_sale} aria-invalid={!!err("sale_price")} />
              <span className="num text-[12px] text-ink-3">{form.sale_price ? usd(Number(form.sale_price)) : "En dólares. Vacío = consultar"}</span>
            </div>
            <div className={cx("flex flex-col gap-2 rounded-sm border p-3", form.for_rent ? "border-ink" : "border-rule")}>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" className="size-4 accent-[var(--ink)]" checked={form.for_rent} onChange={(e) => setForm({ ...form, for_rent: e.target.checked })} />
                Se alquila
              </label>
              <Input aria-label="Alquiler mensual en pesos" type="number" inputMode="numeric" min={0} placeholder="$ por mes" value={form.rent_price} onChange={text("rent_price")} disabled={!form.for_rent} aria-invalid={!!err("rent_price")} />
              <span className="num text-[12px] text-ink-3">{form.rent_price ? `${ars(Number(form.rent_price), { short: true })} por mes` : "En pesos. Vacío = consultar"}</span>
            </div>
          </div>
          {err("for_sale") && <p className="text-[13px] text-debt">{err("for_sale")}</p>}
          {occupied && <p className="rounded-sm border border-warn/40 bg-warn-soft px-3 py-2 text-[13px] text-warn">La unidad tiene contrato vigente. Aclará en la descripción desde cuándo está disponible.</p>}
        </fieldset>

        <Field label="Título" error={err("headline")} hint="Lo primero que se lee en la web.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.headline} onChange={text("headline")} required maxLength={120} placeholder="Dos ambientes con balcón a la calle" />}
        </Field>
        <Field label="Descripción" error={err("description")}>
          {(id) => <Textarea id={id} value={form.description} onChange={text("description")} rows={5} placeholder="Cómo es, qué tiene cerca, desde cuándo está disponible…" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Barrio" error={err("neighborhood")} hint={`Si lo dejás vacío dice ${property.city}.`}>
            {(id, d) => <Input id={id} aria-describedby={d} value={form.neighborhood} onChange={text("neighborhood")} placeholder="Villa Crespo" />}
          </Field>
          <Field label="Expensas" error={err("expenses")} hint={form.expenses ? `${ars(Number(form.expenses), { short: true })} por mes` : "En pesos."}>
            {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="numeric" min={0} value={form.expenses} onChange={text("expenses")} />}
          </Field>
          <Field label="Baños" error={err("bathrooms")}>
            {(id) => <Input id={id} type="number" inputMode="numeric" min={0} max={20} value={form.bathrooms} onChange={text("bathrooms")} />}
          </Field>
          <Field label="Antigüedad (años)" error={err("age_years")}>
            {(id) => <Input id={id} type="number" inputMode="numeric" min={0} value={form.age_years} onChange={text("age_years")} placeholder="0 = a estrenar" />}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Características</legend>
          <div className="flex flex-wrap gap-1.5">
            <label className={cx("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-[13px]", form.garage ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
              <input type="checkbox" className="sr-only" checked={form.garage} onChange={(e) => setForm({ ...form, garage: e.target.checked })} />
              Cochera
            </label>
            {amenities.map((a) => {
              const on = form.amenities.includes(a.value);
              return (
                <label key={a.value} className={cx("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-[13px]", on ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleAmenity(a.value)} />
                  {a.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 border-t border-rule pt-4">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--ok)]" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <span>
              <span className="font-semibold">Visible en la web</span>
              <span className="block text-[13px] text-ink-2">Destildalo para guardarla como borrador.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--ink)]" checked={form.reserved} onChange={(e) => setForm({ ...form, reserved: e.target.checked })} />
            <span>
              <span className="font-semibold">Reservada</span>
              <span className="block text-[13px] text-ink-2">Sigue en la web con la faja de reservada y no se puede consultar.</span>
            </span>
          </label>
        </fieldset>
      </form>
    </Sheet>
  );
}
