"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ContractForm } from "@/components/forms/contract-form";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, PageHeader, Panel, SkeletonRows, Table, Td, Th } from "@/components/ui";
import { ars, fecha } from "@/lib/format";
import type { Contract } from "@/lib/types";
import { useApi } from "@/lib/use-api";

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
  const [tab, setTab] = useState("vigente");
  const [creating, setCreating] = useState(nuevo !== null);
  const list = useApi<{ data: Contract[] }>("contracts");
  const toast = useToast();

  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  const rows = useMemo(
    () =>
      all.filter((c) => {
        if (tab === "vencer") return c.status.value === "vigente" && c.days_to_end <= 90;
        if (tab === "finalizado") return c.status.value !== "vigente";
        return !tab || c.status.value === tab;
      }),
    [all, tab],
  );

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
      <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Filtrar contratos">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", tab === t.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <Panel>
        {list.error && (
          <div className="p-4">
            <ErrorState message={list.error.message} onRetry={list.reload} />
          </div>
        )}
        {list.loading && !list.data && <SkeletonRows rows={8} cols={6} />}
        {list.data && rows.length === 0 && <Empty title="No hay contratos en esta vista" />}
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
