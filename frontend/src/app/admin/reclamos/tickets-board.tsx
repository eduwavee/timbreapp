"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { TicketForm } from "@/components/forms/ticket-form";
import { useToast } from "@/components/toast";
import { Button, cx, ErrorState, PageHeader, PriorityMark, SearchBox, Select } from "@/components/ui";
import { hace } from "@/lib/format";
import { matches } from "@/lib/search";
import { TRADES, type Ticket, type TicketStatus } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useUrlState } from "@/lib/use-url-state";

const columns: { key: TicketStatus; label: string; hint: string }[] = [
  { key: "abierto", label: "Abiertos", hint: "Esperan que los derives" },
  { key: "derivado", label: "Derivados", hint: "El proveedor ya tiene el mensaje" },
  { key: "en_curso", label: "En curso", hint: "Trabajo en marcha" },
  { key: "resuelto", label: "Resueltos", hint: "Últimos cerrados" },
];

const head: Record<TicketStatus, string> = {
  abierto: "bg-marker text-ink",
  derivado: "bg-stamp text-white",
  en_curso: "bg-ink text-white",
  resuelto: "bg-ok text-white",
};

export function TicketsBoard() {
  const params = useSearchParams();
  const router = useRouter();
  const nuevo = params.get("nuevo");
  const [category, setCategory] = useUrlState("rubro", "");
  const [q, setQ] = useUrlState("q", "");
  const [creating, setCreating] = useState(nuevo !== null);
  const list = useApi<{ data: Ticket[] }>("tickets");
  const toast = useToast();

  const tickets = useMemo(
    () => (list.data?.data ?? []).filter((t) => (!category || t.category.value === category) && matches(q, t.title, `#${t.id}`, t.property?.code, t.property?.address, t.tenant?.full_name, t.provider?.name, t.category.label)),
    [list.data, category, q],
  );

  return (
    <>
      <PageHeader
        title="Reclamos"
        subtitle="Lo que tocan timbre los inquilinos. Derivá cada falla al proveedor con un clic."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nuevo reclamo
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Rubro" className="h-8 w-auto text-sm">
          <option value="">Todos los rubros</option>
          {TRADES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <SearchBox value={q} onChange={setQ} placeholder="Falla, unidad, inquilino o proveedor" className="ml-auto sm:w-72" />
        <ExportButton
          title="Reclamos"
          rows={tickets}
          columns={[
            { label: "N°", type: "number", value: (t) => t.id },
            { label: "Falla", value: (t) => t.title },
            { label: "Unidad", value: (t) => t.property?.code },
            { label: "Inquilino", value: (t) => t.tenant?.full_name },
            { label: "Rubro", value: (t) => t.category.label },
            { label: "Prioridad", value: (t) => t.priority.label },
            { label: "Estado", value: (t) => t.status.label },
            { label: "Proveedor", value: (t) => t.provider?.name },
            { label: "Costo", type: "money", value: (t) => t.cost },
          ]}
        />
      </div>
      {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const items = tickets.filter((t) => t.status.value === col.key).slice(0, col.key === "resuelto" && !q ? 8 : undefined);
          return (
            <section key={col.key} aria-label={col.label} className="flex min-w-0 flex-col">
              <div className={cx("flex items-center justify-between rounded-t-sm px-3 py-2", head[col.key])}>
                <h2 className="text-[14px] font-bold">{col.label}</h2>
                <span className="num text-[13px] font-semibold">{list.data ? tickets.filter((t) => t.status.value === col.key).length : "…"}</span>
              </div>
              <p className="border-x border-rule bg-sheet px-3 pt-2 text-[12.5px] text-ink-3">{col.hint}</p>
              <ul className="flex flex-1 flex-col gap-2 rounded-b-sm border-x border-b border-rule bg-sheet p-2 pt-2">
                {!list.data && Array.from({ length: 2 }).map((_, i) => <li key={i} className="skeleton h-20" />)}
                {list.data && items.length === 0 && <li className="px-1 py-4 text-[13px] text-ink-3">Nada por acá.</li>}
                {items.map((t) => (
                  <li key={t.id}>
                    <Link href={`/admin/reclamos/${t.id}`} className="block rounded-sm border border-rule bg-sheet p-3 transition-colors hover:border-ink hover:bg-paper">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold leading-snug">{t.title}</span>
                        {(t.priority.value === "urgente" || t.priority.value === "alta") && <PriorityMark priority={t.priority} />}
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-ink-2">
                        <span className="font-bold text-ink">{t.property?.code}</span> · {t.tenant?.full_name ?? "Sin inquilino"}
                      </p>
                      <p className="mt-0.5 flex justify-between gap-2 text-[12px] text-ink-3">
                        <span>{t.category.label}{t.provider ? ` · ${t.provider.name}` : ""}</span>
                        <span className="shrink-0">{hace(t.created_at)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {creating && (
        <TicketForm
        open={creating}
        propertyId={nuevo ? Number(nuevo) : null}
        onClose={() => {
          setCreating(false);
          if (nuevo) router.replace("/admin/reclamos");
        }}
        onSaved={(t) => {
          setCreating(false);
          toast("Reclamo creado");
          router.push(`/admin/reclamos/${t.id}`);
        }}
        />
      )}
    </>
  );
}
