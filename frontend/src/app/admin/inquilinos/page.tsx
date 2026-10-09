"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { TenantForm } from "@/components/forms/tenant-form";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, Input, Money, PageHeader, Panel, SkeletonRows, Table, Td, Th, WhatsAppLink } from "@/components/ui";
import type { Tenant } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export default function TenantsPage() {
  const list = useApi<{ data: Tenant[] }>("tenants");
  const [q, setQ] = useState("");
  const [onlyDebt, setOnlyDebt] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((t) => (!onlyDebt || (t.balance ?? 0) > 0) && (!term || `${t.full_name} ${t.document} ${t.phone} ${t.active_contract?.property?.code ?? ""}`.toLowerCase().includes(term)));
  }, [all, q, onlyDebt]);

  return (
    <>
      <PageHeader
        title="Inquilinos"
        subtitle={list.data ? `${all.length} inquilinos · ${all.filter((t) => (t.balance ?? 0) > 0).length} con deuda vencida` : "Cargando…"}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo inquilino
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOnlyDebt((v) => !v)}
          aria-pressed={onlyDebt}
          className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", onlyDebt ? "border-debt bg-debt text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}
        >
          Solo con deuda
        </button>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, DNI, teléfono o unidad" aria-label="Buscar" className="h-8 pl-9 text-sm" />
        </div>
      </div>
      <Panel>
        {list.error && (
          <div className="p-4">
            <ErrorState message={list.error.message} onRetry={list.reload} />
          </div>
        )}
        {list.loading && !list.data && <SkeletonRows rows={10} cols={5} />}
        {list.data && rows.length === 0 && <Empty title={all.length ? "Nadie coincide con la búsqueda" : "Todavía no hay inquilinos"}>{all.length ? "Probá con el DNI o el código de la unidad." : "Cargalos con su WhatsApp para poder avisarles con un clic."}</Empty>}
        {rows.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Inquilino</Th>
                <Th>DNI / CUIT</Th>
                <Th>Unidad</Th>
                <Th>WhatsApp</Th>
                <Th align="right">Deuda vencida</Th>
                <Th>Portal</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-paper/70">
                  <Td>
                    <Link href={`/admin/inquilinos/${t.id}`} className="font-semibold whitespace-nowrap hover:underline">
                      {t.full_name}
                    </Link>
                  </Td>
                  <Td className="num text-ink-2">{t.document}</Td>
                  <Td>{t.active_contract?.property ? <Link href={`/admin/propiedades/${t.active_contract.property.id}`} className="font-semibold hover:underline">{t.active_contract.property.code}</Link> : <span className="text-ink-3">Sin contrato</span>}</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <span className="num text-ink-2">{t.phone}</span>
                      <WhatsAppLink href={t.whatsapp_url} compact />
                    </span>
                  </Td>
                  <Td align="right">
                    <Money value={t.balance} tone="debt" />
                  </Td>
                  <Td className="text-[13px]">{t.has_portal_access ? <span className="text-stamp">Activo</span> : <span className="text-ink-3">—</span>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      {creating && (
        <TenantForm
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(t) => {
          setCreating(false);
          toast(`${t.full_name} creado`);
          list.reload();
        }}
        />
      )}
    </>
  );
}
