"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { InquiryPill, InquirySheet, OperationTag } from "@/components/inquiry-sheet";
import { ButtonLink, cx, Empty, ErrorState, Input, PageHeader, Panel, SkeletonRows, Table, Td, Th } from "@/components/ui";
import { hace } from "@/lib/format";
import { INQUIRY_STATUSES, type Inquiry, type InquiryStatus } from "@/lib/types";
import { useApi } from "@/lib/use-api";

/**
 * Bandeja de las consultas que llegan desde La Choza, ordenada como la planilla:
 * lo nuevo primero, con el marcador amarillo sobre lo que pide acción.
 */
export function InquiriesBoard() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const list = useApi<{ data: Inquiry[] }>("inquiries");
  const [tab, setTab] = useState<InquiryStatus | "todas">("nueva");
  const [q, setQ] = useState("");
  const openId = params.get("id") ? Number(params.get("id")) : null;

  const all = useMemo(() => list.data?.data ?? [], [list.data]);
  const count = (s: InquiryStatus) => all.filter((i) => i.status.value === s).length;
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter(
      (i) =>
        (tab === "todas" || i.status.value === tab) &&
        (!term || `${i.name} ${i.phone} ${i.property?.code} ${i.property?.address} ${i.listing?.headline}`.toLowerCase().includes(term)),
    );
  }, [all, tab, q]);

  function open(id: number | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("id", String(id));
    else next.delete("id");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <>
      <PageHeader
        title="Consultas"
        subtitle={list.data ? `${count("nueva")} nuevas desde La Choza · ${all.length} en total` : "Cargando…"}
        actions={
          <ButtonLink href="/admin/colegas">
            <Users className="size-4" aria-hidden /> Colegas
          </ButtonLink>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Estado">
          {[...INQUIRY_STATUSES, { value: "todas" as const, label: "Todas" }].map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", tab === t.value ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}
            >
              {t.label} <span className="num ml-1 opacity-70">{t.value === "todas" ? all.length : count(t.value)}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, teléfono o código" aria-label="Buscar" className="h-8 pl-9 text-sm" />
        </div>
      </div>

      <Panel>
        {list.error && (
          <div className="p-4">
            <ErrorState message={list.error.message} onRetry={list.reload} />
          </div>
        )}
        {list.loading && !list.data && <SkeletonRows rows={8} cols={5} />}
        {list.data && rows.length === 0 && (
          <Empty title={all.length ? (tab === "nueva" ? "No hay consultas nuevas" : "Nada en esta pestaña") : "Todavía no llegaron consultas"}>
            {all.length
              ? "Cuando alguien toque “Me interesa” en La Choza, aparece acá primero."
              : "Publicá una propiedad desde su ficha y las consultas de la web caen en esta bandeja."}
          </Empty>
        )}
        {rows.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Quién</Th>
                <Th>Propiedad</Th>
                <Th>Operación</Th>
                <Th>Mensaje</Th>
                <Th>Estado</Th>
                <Th align="right">Llegó</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="cursor-pointer hover:bg-paper/70" onClick={() => open(i.id)}>
                  <Td>
                    <button onClick={() => open(i.id)} className={cx("text-left font-semibold whitespace-nowrap hover:underline", i.status.value === "nueva" && "marker")}>
                      {i.name}
                    </button>
                    <span className="num block text-[12.5px] text-ink-3">{i.phone}</span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      {i.property?.cover_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.property.cover_url} alt="" className="size-9 shrink-0 rounded-sm border border-rule object-cover" />
                      )}
                      <span className="min-w-0">
                        <Link href={`/admin/propiedades/${i.property?.id}`} onClick={(e) => e.stopPropagation()} className="font-bold hover:underline">
                          {i.property?.code}
                        </Link>
                        <span className="block max-w-[220px] truncate text-[12.5px] text-ink-3">{i.listing?.place}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <OperationTag operation={i.operation} />
                    <span className="num ml-2 text-[13px] text-ink-2">{i.listing?.price_label}</span>
                  </Td>
                  <Td className="max-w-[320px] text-ink-2">
                    <span className="line-clamp-2 text-[13.5px]">{i.message ?? "—"}</span>
                  </Td>
                  <Td>
                    <InquiryPill inquiry={i} />
                    {i.status.value === "derivada" && i.colleague && <span className="mt-0.5 block text-[12px] text-ink-3">a {i.colleague.name}</span>}
                  </Td>
                  <Td align="right" className="text-[13px] whitespace-nowrap text-ink-2">
                    {hace(i.created_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <InquirySheet key={openId ?? "none"} id={openId} onClose={() => open(null)} onChanged={list.reload} />
    </>
  );
}
