"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ChangeHistory } from "@/components/change-history";
import { PropertyForm } from "@/components/forms/property-form";
import { ListingPanel } from "@/components/listing-panel";
import { PhotoGallery } from "@/components/photo-gallery";
import { useToast } from "@/components/toast";
import { Button, ButtonLink, Empty, ErrorState, Money, PageHeader, Panel, PriorityMark, Section, StatusTag, Table, Td, Th, TicketPill } from "@/components/ui";
import { api } from "@/lib/api";
import { ars, fecha, hace } from "@/lib/format";
import type { Enum, Photo, Property, Ticket } from "@/lib/types";
import { useApi } from "@/lib/use-api";

type Detail = {
  data: Property;
  contracts: { id: number; tenant: string; start_date: string; end_date: string; rent_amount: number; status: Enum }[];
  tickets: { data: Ticket[] } | Ticket[];
  photos: Photo[];
  year: { year: number; income: number; expenses: number; net: number };
};

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const detail = useApi<Detail>(`properties/${id}`);
  const [editing, setEditing] = useState(false);

  if (detail.error) return <ErrorState message={detail.error.status === 404 ? "Esa propiedad no existe." : detail.error.message} onRetry={detail.reload} />;
  if (!detail.data) return <div className="skeleton h-64" />;

  const p = detail.data.data;
  const c = p.active_contract;
  const tickets = Array.isArray(detail.data.tickets) ? detail.data.tickets : detail.data.tickets.data;

  async function remove() {
    if (!window.confirm(`¿Borrar ${p.code}? No se puede deshacer.`)) return;
    try {
      await api(`properties/${p.id}`, { method: "DELETE" });
      toast(`${p.code} borrada`);
      router.push("/admin/propiedades");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <>
      <PageHeader
        back={{ href: "/admin/propiedades", label: "Propiedades" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.code} <StatusTag status={p.status} />
          </span>
        }
        subtitle={`${p.address}, ${p.city} · ${p.type.label}${p.surface_m2 ? ` · ${Number(p.surface_m2)} m²` : ""}${p.rooms ? ` · ${p.rooms} amb.` : ""}`}
        actions={
          <>
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            {!c && (
              <ButtonLink href={`/admin/contratos?nuevo=${p.id}`} variant="primary">
                <Plus className="size-4" /> Nuevo contrato
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-8">
          <Section title="Fotos">
            <PhotoGallery propertyId={p.id} photos={detail.data.photos} onChanged={detail.reload} />
          </Section>
          <Section title="Contrato vigente">
            <Panel>
              {c ? (
                <dl className="grid grid-cols-2 sm:grid-cols-4">
                  {[
                    ["Inquilino", <Link key="t" href={`/admin/inquilinos/${c.tenant_id}`} className="font-semibold hover:underline">{c.tenant?.full_name}</Link>],
                    ["Alquiler", <span key="a" className="num font-semibold">{ars(c.rent_amount)}</span>],
                    ["Vence el día", <span key="v" className="num">{c.due_day} de cada mes</span>],
                    ["Ajuste", `${c.adjustment_type.label} cada ${c.adjustment_every_months} meses`],
                    ["Inicio", fecha(c.start_date)],
                    ["Fin", <span key="f" className={c.days_to_end < 60 ? "font-semibold text-debt" : ""}>{fecha(c.end_date)}</span>],
                    ["Depósito", <span key="d" className="num">{ars(c.deposit)}</span>],
                    ["Deuda vencida", <Money key="m" value={p.balance} tone="debt" />],
                  ].map(([label, value], i) => (
                    <div key={i} className="border-b border-rule px-4 py-3 [&:nth-last-child(-n+4)]:sm:border-b-0">
                      <dt className="label">{label}</dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <Empty title="Sin contrato vigente" action={<ButtonLink href={`/admin/contratos?nuevo=${p.id}`}>Crear contrato</ButtonLink>}>
                  La unidad figura como {p.status.label.toLowerCase()}.
                </Empty>
              )}
              {c && (
                <div className="border-t border-rule px-4 py-2.5">
                  <Link href={`/admin/contratos/${c.id}`} className="text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
                    Ver cuotas y pagos del contrato
                  </Link>
                </div>
              )}
            </Panel>
          </Section>

          <Section title="Historial de contratos">
            <Panel>
              {detail.data.contracts.length === 0 ? (
                <Empty title="Sin contratos todavía" />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Inquilino</Th>
                      <Th>Desde</Th>
                      <Th>Hasta</Th>
                      <Th align="right">Alquiler</Th>
                      <Th>Estado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.data.contracts.map((k) => (
                      <tr key={k.id}>
                        <Td>
                          <Link href={`/admin/contratos/${k.id}`} className="hover:underline">
                            {k.tenant}
                          </Link>
                        </Td>
                        <Td className="num">{fecha(k.start_date)}</Td>
                        <Td className="num">{fecha(k.end_date)}</Td>
                        <Td align="right" className="num">
                          {ars(k.rent_amount, { short: true })}
                        </Td>
                        <Td className="text-ink-2">{k.status.label}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Panel>
          </Section>
          {p.notes && (
            <Section title="Notas">
              <Panel className="px-4 py-3 text-ink-2">{p.notes}</Panel>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-8">
        <ListingPanel property={p} photoCount={detail.data.photos.length} />
        <Section title={`Resultado ${detail.data.year.year}`} actions={<Link href="/admin/gastos?tab=rentabilidad" className="text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">Rentabilidad</Link>}>
          <Panel>
            <dl className="divide-y divide-rule text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-ink-2">Cobrado</dt>
                <dd className="num text-stamp">{ars(detail.data.year.income, { short: true })}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-ink-2">Gastos</dt>
                <dd className="num">− {ars(detail.data.year.expenses, { short: true })}</dd>
              </div>
              <div className="flex justify-between border-t-[3px] border-double border-t-ink px-4 py-2.5 font-semibold">
                <dt>Te quedó</dt>
                <dd className={`num ${detail.data.year.net < 0 ? "text-debt" : ""}`}>{ars(detail.data.year.net, { short: true })}</dd>
              </div>
            </dl>
          </Panel>
        </Section>
        <Section title="Reclamos" actions={<ButtonLink href={`/admin/reclamos?nuevo=${p.id}`} size="sm">Cargar reclamo</ButtonLink>}>
          <Panel>
            {tickets.length === 0 && <Empty title="Nunca tuvo reclamos" />}
            <ul className="divide-y divide-rule">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/reclamos/${t.id}`} className="block px-4 py-3 hover:bg-paper">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{t.title}</span>
                      <TicketPill status={t.status} />
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-[12.5px] text-ink-3">
                      {t.category.label} · {hace(t.created_at)}
                      {t.provider && <> · {t.provider.name}</>}
                      {t.priority.value === "urgente" && <PriorityMark priority={t.priority} />}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Section>
        </div>
      </div>

      <Section title="Historial de cambios" className="mt-8 max-w-3xl">
        <ChangeHistory type="properties" id={p.id} version={p.updated_at} />
      </Section>

      <div className="mt-10 border-t border-rule pt-4">
        <Button variant="danger" size="sm" onClick={remove}>
          Borrar propiedad
        </Button>
      </div>

      {editing && (
        <PropertyForm
        open={editing}
        property={p}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          toast("Cambios guardados");
          detail.reload();
        }}
        />
      )}
    </>
  );
}
