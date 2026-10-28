"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { ContractForm } from "@/components/forms/contract-form";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, LastChange, PageHeader, Panel, SearchBox, Select, SkeletonRows, Table, Td, Th } from "@/components/ui";
import { ars, fecha } from "@/lib/format";
import { matches, recentFirst } from "@/lib/search";
import type { Contract } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useUrlState } from "@/lib/use-url-state";

const tabs = [
  { key: "vigente", label: "Vigentes" },
  { key: "vencer", label: "Por vencer (90 días)" },
  { key: "finalizado", label: "Finalizados" },
  { key: "", label: "Todos" },
];

export function ContractsList() {
  const params = useSearchParams();
  const router = useRouter();
  const nuevo = params.get("nuevo");
  const [tab, setTab] = useUrlState("vista", "vigente");
  const [q, setQ] = useUrlState("q", "");
  const [order, setOrder] = useUrlState<"recientes" | "vencimiento">("orden", "recientes");
  const [creating, setCreating] = useState(nuevo !== null);
  const list = useApi<{ data: Contract[] }>("contracts");
  const toast = useToast();

  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  const rows = useMemo(() => {
    const shown = all.filter((c) => {
      if (!matches(q, c.property?.code, c.property?.address, c.tenant?.full_name, c.tenant?.document)) return false;
      if (tab === "vencer") return c.status.value === "vigente" && c.days_to_end <= 90;
      if (tab === "finalizado") return c.status.value !== "vigente";
      return !tab || c.status.value === tab;
    });
    return order === "recientes" ? recentFirst(shown) : shown;
  }, [all, tab, q, order]);

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle={list.data ? `${all.filter((c) => c.status.value === "vigente").length} vigentes` : "Cargando…"}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo contrato
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar contratos">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", tab === t.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
              {t.label}
            </button>
          ))}
        </div>
        <Select value={order} onChange={(e) => setOrder(e.target.value as typeof order)} aria-label="Orden" className="ml-auto h-8 w-auto text-sm">
          <option value="recientes">Últimos cambios primero</option>
          <option value="vencimiento">Por vencimiento</option>
        </Select>
        <SearchBox value={q} onChange={setQ} placeholder="Unidad, calle, inquilino o DNI" className="sm:w-72" />
        <ExportButton
          title="Contratos"
          rows={rows}
          columns={[
            { label: "Unidad", value: (c) => c.property?.code },
            { label: "Dirección", value: (c) => c.property?.address },
            { label: "Inquilino", value: (c) => c.tenant?.full_name },
            { label: "Alquiler", type: "money", value: (c) => c.rent_amount },
            { label: "Ajuste", value: (c) => `${c.adjustment_type.label} cada ${c.adjustment_every_months} meses` },
            { label: "Inicio", value: (c) => fecha(c.start_date) },
            { label: "Fin", value: (c) => fecha(c.end_date) },
            { label: "Estado", value: (c) => c.status.label },
          ]}
        />
      </div>
      <Panel>
        {list.error && (
          <div className="p-4">
            <ErrorState message={list.error.message} onRetry={list.reload} />
          </div>
        )}
        {list.loading && !list.data && <SkeletonRows rows={8} cols={6} />}
        {list.data && rows.length === 0 && (q ? <Empty title="Ningún contrato coincide con la búsqueda">{tab ? "Probá en «Todos», puede estar en otra pestaña." : "Probá con el código de la unidad o el DNI."}</Empty> : <Empty title="No hay contratos en esta vista" />)}
        {rows.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Unidad</Th>
                <Th>Inquilino</Th>
                <Th align="right">Alquiler</Th>
                <Th>Ajuste</Th>
                <Th>Vigencia</Th>
                <Th align="right">Quedan</Th>
                <Th>Último cambio</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-paper/70">
                  <Td>
                    <Link href={`/admin/contratos/${c.id}`} className="font-bold hover:underline">
                      {c.property?.code}
                    </Link>
                    <p className="text-[12.5px] text-ink-3">{c.property?.address}</p>
                  </Td>
                  <Td className="whitespace-nowrap">{c.tenant?.full_name}</Td>
                  <Td align="right" className="num">
                    {ars(c.rent_amount, { short: true })}
                  </Td>
                  <Td className="text-ink-2">
                    {c.adjustment_type.label} · {c.adjustment_every_months} m
                  </Td>
                  <Td className="num whitespace-nowrap text-ink-2">
                    {fecha(c.start_date)} al {fecha(c.end_date)}
                  </Td>
                  <Td align="right" className={cx("num whitespace-nowrap", c.status.value === "vigente" && c.days_to_end < 60 && "font-semibold text-debt")}>
                    {c.status.value !== "vigente" ? c.status.label : c.days_to_end < 0 ? "vencido" : `${c.days_to_end} días`}
                  </Td>
                  <Td>
                    <LastChange item={c} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      {creating && (
        <ContractForm
        open={creating}
        propertyId={nuevo ? Number(nuevo) : null}
        onClose={() => {
          setCreating(false);
          if (nuevo) router.replace("/admin/contratos");
        }}
        onSaved={(c) => {
          setCreating(false);
          toast("Contrato creado y cuotas generadas");
          router.push(`/admin/contratos/${c.id}`);
        }}
        />
      )}
    </>
  );
}
