"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PropertyForm } from "@/components/forms/property-form";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, Input, Money, PageHeader, Panel, Select, SkeletonRows, StatusTag, Table, Td, Th } from "@/components/ui";
import { ars } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useApi } from "@/lib/use-api";

const types = [
  { value: "", label: "Todas" },
  { value: "departamento", label: "Departamentos" },
  { value: "casa", label: "Casas" },
  { value: "galpon", label: "Galpones" },
];

export default function PropertiesPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const list = useApi<{ data: Property[] }>("properties");
  const toast = useToast();

  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (!type || p.type.value === type) &&
        (!status || p.status.value === status) &&
        (!term || `${p.code} ${p.address} ${p.city} ${p.active_contract?.tenant?.full_name ?? ""}`.toLowerCase().includes(term)),
    );
  }, [all, type, status, q]);

  const count = (t: string) => (t ? all.filter((p) => p.type.value === t).length : all.length);

  return (
    <>
      <PageHeader
        title="Propiedades"
        subtitle={list.data ? `${all.length} unidades · ${all.filter((p) => p.status.value === "ocupada").length} alquiladas` : "Cargando…"}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nueva propiedad
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Tipo de propiedad">
          {types.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={type === t.value}
              onClick={() => setType(t.value)}
              className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", type === t.value ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}
            >
              {t.label} <span className="num ml-1 opacity-70">{count(t.value)}</span>
            </button>
          ))}
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Estado" className="h-8 w-auto text-sm">
          <option value="">Cualquier estado</option>
          <option value="ocupada">Ocupadas</option>
          <option value="disponible">Disponibles</option>
          <option value="mantenimiento">En mantenimiento</option>
        </Select>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, calle o inquilino" aria-label="Buscar" className="h-8 pl-9 text-sm" />
        </div>
      </div>

      <Panel>
        {list.error && (
          <div className="p-4">
            <ErrorState message={list.error.message} onRetry={list.reload} />
          </div>
        )}
        {list.loading && !list.data && <SkeletonRows rows={10} cols={6} />}
        {list.data && rows.length === 0 && (
          <Empty title={all.length ? "Ninguna propiedad coincide" : "Todavía no cargaste propiedades"} action={!all.length && <Button onClick={() => setCreating(true)}>Cargar la primera</Button>}>
            {all.length ? "Probá con otro filtro o búsqueda." : "Empezá por la unidad, su tipo y la dirección; después le asignás un contrato."}
          </Empty>
        )}
        {rows.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Dirección</Th>
                <Th>Tipo</Th>
                <Th>Inquilino</Th>
                <Th align="right">Alquiler</Th>
                <Th align="right">Deuda vencida</Th>
                <Th>Estado</Th>
                <Th align="center">Reclamos</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-paper/70">
                  <Td>
                    <span className="flex items-center gap-3">
                      {p.cover_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_url} alt="" className="size-9 shrink-0 rounded-sm border border-rule object-cover" />
                      )}
                      <Link href={`/admin/propiedades/${p.id}`} className={cx("font-bold whitespace-nowrap hover:underline", (p.balance ?? 0) > 0 && "marker")}>
                        {p.code}
                      </Link>
                    </span>
                  </Td>
                  <Td>
                    <span className="whitespace-nowrap">{p.address}</span>
                    <span className="ml-1.5 text-[12.5px] text-ink-3">{p.city}</span>
                  </Td>
                  <Td className="text-ink-2">
                    {p.type.label}
                    {p.surface_m2 && <span className="num ml-1.5 text-[12.5px] text-ink-3">{Number(p.surface_m2)} m²</span>}
                  </Td>
                  <Td>{p.active_contract?.tenant ? <Link href={`/admin/inquilinos/${p.active_contract.tenant.id}`} className="whitespace-nowrap hover:underline">{p.active_contract.tenant.full_name}</Link> : <span className="text-ink-3">—</span>}</Td>
                  <Td align="right">{p.active_contract ? <span className="num">{ars(p.active_contract.rent_amount, { short: true })}</span> : <span className="text-ink-3">—</span>}</Td>
                  <Td align="right">
                    <Money value={p.balance} tone="debt" short />
                  </Td>
                  <Td>
                    <StatusTag status={p.status} />
                  </Td>
                  <Td align="center">{p.open_tickets_count ? <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-marker px-1.5 text-[12px] font-bold">{p.open_tickets_count}</span> : <span className="text-ink-3">—</span>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {creating && (
        <PropertyForm
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(p) => {
          setCreating(false);
          toast(`${p.code} creada`);
          list.reload();
        }}
        />
      )}
    </>
  );
}
