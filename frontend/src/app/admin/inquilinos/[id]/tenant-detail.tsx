"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { ChangeHistory } from "@/components/change-history";
import { TenantForm } from "@/components/forms/tenant-form";
import { InstallmentTable } from "@/components/installment-table";
import { useToast } from "@/components/toast";
import { Button, Empty, ErrorState, PageHeader, Panel, Section, TicketPill, WhatsAppLink } from "@/components/ui";
import { ars, fecha, hace } from "@/lib/format";
import type { Contract, Tenant, Ticket } from "@/lib/types";
import { useApi } from "@/lib/use-api";

type Detail = {
  data: Tenant;
  contracts: { data: Contract[] } | Contract[];
  tickets: { data: Ticket[] } | Ticket[];
  contacts: { id: number; kind: string; message: string; created_at: string }[];
};

const list = <T,>(v: { data: T[] } | T[]) => (Array.isArray(v) ? v : v.data);

export function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useApi<Detail>(`tenants/${id}`);
  const [editing, setEditing] = useState(false);
  const toast = useToast();

  if (detail.error) return <ErrorState message={detail.error.status === 404 ? "Ese inquilino no existe." : detail.error.message} onRetry={detail.reload} />;
  if (!detail.data) return <div className="skeleton h-64" />;

  const t = detail.data.data;
  const contracts = list(detail.data.contracts);
  const tickets = list(detail.data.tickets);
  const unpaid = contracts.flatMap((c) => c.installments ?? []).filter((i) => i.balance > 0 && i.days_late > 0);
  const debt = unpaid.reduce((a, i) => a + i.balance, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/inquilinos", label: "Inquilinos" }}
        title={t.full_name}
        subtitle={
          <span className="num">
            {t.document.includes("-") ? "CUIT" : "DNI"} {t.document} · {t.phone}
            {t.email && ` · ${t.email}`}
          </span>
        }
        actions={
          <>
            <WhatsAppLink href={t.whatsapp_url} size="md">
              Escribirle
            </WhatsAppLink>
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
          </>
        }
      />

      {debt > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-debt/30 bg-debt-soft px-4 py-3">
          <span className="font-semibold text-debt">
            Debe <span className="num">{ars(debt)}</span> en {unpaid.length} {unpaid.length === 1 ? "cuota vencida" : "cuotas vencidas"}
          </span>
          <span className="text-sm text-ink-2">La más vieja venció hace {Math.max(...unpaid.map((i) => i.days_late))} días.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-8">
          {contracts.length === 0 && (
            <Panel>
              <Empty title="Sin contratos">Asignale una propiedad desde Contratos.</Empty>
            </Panel>
          )}
          {contracts.map((c) => (
            <Section
              key={c.id}
              title={
                <span>
                  <Link href={`/admin/propiedades/${c.property_id}`} className="hover:underline">
                    {c.property?.code}
                  </Link>{" "}
                  <span className="font-normal text-ink-2">
                    · {c.property?.address} · {c.status.label}, {fecha(c.start_date)} a {fecha(c.end_date)}
                  </span>
                </span>
              }
              actions={<Link href={`/admin/contratos/${c.id}`} className="text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">Contrato</Link>}
            >
              <Panel>
                <InstallmentTable installments={[...(c.installments ?? [])].reverse()} onChanged={detail.reload} limit={8} />
              </Panel>
            </Section>
          ))}
        </div>

        <div className="flex flex-col gap-8">
          <Section title="Datos">
            <Panel>
              <dl className="divide-y divide-rule text-sm">
                {[
                  ["Garante", t.guarantor_name ? `${t.guarantor_name}${t.guarantor_phone ? ` · ${t.guarantor_phone}` : ""}` : "—"],
                  ["Portal", t.has_portal_access ? "Con acceso" : "Sin acceso"],
                  ["Notas", t.notes || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[88px_1fr] gap-3 px-4 py-2.5">
                    <dt className="text-ink-3">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </Section>
          <Section title="Avisos enviados">
            <Panel>
              {detail.data.contacts.length === 0 && <Empty title="Nunca se le escribió desde Timbre" />}
              <ul className="divide-y divide-rule">
                {detail.data.contacts.map((l) => (
                  <li key={l.id} className="px-4 py-2.5 text-sm">
                    <p className="flex justify-between gap-2">
                      <span className="font-semibold">{l.kind}</span>
                      <span className="text-ink-3">{hace(l.created_at)}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-ink-2">{l.message}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
          <Section title="Reclamos">
            <Panel>
              {tickets.length === 0 && <Empty title="Sin reclamos" />}
              <ul className="divide-y divide-rule">
                {tickets.map((tk) => (
                  <li key={tk.id}>
                    <Link href={`/admin/reclamos/${tk.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-paper">
                      <span className="truncate text-sm font-semibold">{tk.title}</span>
                      <TicketPill status={tk.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
        </div>
      </div>

      <Section title="Historial de cambios" className="mt-8 max-w-3xl">
        <ChangeHistory type="tenants" id={t.id} version={t.updated_at} />
      </Section>

      {editing && (
        <TenantForm
        open={editing}
        tenant={t}
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
