"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { TicketForm } from "@/components/forms/ticket-form";
import { TicketThread } from "@/components/ticket-thread";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, Panel, SkeletonRows, TicketPill } from "@/components/ui";
import { fecha, hace } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { useApi } from "@/lib/use-api";

const explain: Record<string, string> = {
  abierto: "Lo recibimos. En breve lo derivamos a un técnico.",
  derivado: "Ya se lo pasamos al técnico; te va a contactar para coordinar.",
  en_curso: "El arreglo está en marcha.",
  resuelto: "Quedó resuelto. Si vuelve a pasar, cargá un reclamo nuevo.",
};

export function PortalTickets() {
  const params = useSearchParams();
  const router = useRouter();
  const [creating, setCreating] = useState(params.get("nuevo") !== null);
  const [open, setOpen] = useState<number | null>(null);
  const list = useApi<{ data: Ticket[] }>("portal/tickets");
  const toast = useToast();
  const tickets = list.data?.data ?? [];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.015em]">Reclamos</h1>
          <p className="mt-1 text-ink-2">Fallas o problemas en tu unidad. Seguí cada uno desde acá.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nuevo reclamo
        </Button>
      </div>
      {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
      <Panel>
        {list.loading && !list.data && <SkeletonRows rows={3} cols={3} />}
        {list.data && tickets.length === 0 && (
          <Empty title="No cargaste reclamos" action={<Button onClick={() => setCreating(true)}>Cargar el primero</Button>}>
            Si se rompe algo (una canilla, la luz, una cerradura), avisá desde acá con fotos.
          </Empty>
        )}
        <ul className="divide-y divide-rule">
          {tickets.map((t) => {
            const expanded = open === t.id;
            return (
              <li key={t.id}>
                <button onClick={() => setOpen(expanded ? null : t.id)} aria-expanded={expanded} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-paper">
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.title}</span>
                    <span className="block text-[13px] text-ink-3">
                      {t.category.label} · {fecha(t.created_at)} · {explain[t.status.value]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <TicketPill status={t.status} />
                    <ChevronDown className={cx("size-4 text-ink-3 transition-transform", expanded && "rotate-180")} aria-hidden />
                  </span>
                </button>
                {expanded && (
                  <div className="fade-in border-t border-rule bg-sheet">
                    <p className="px-4 pt-3 text-sm whitespace-pre-line text-ink-2">{t.description}</p>
                    {t.provider && <p className="px-4 pt-2 text-sm">Técnico asignado: <strong>{t.provider.name}</strong> ({t.provider.trade.label}) · {hace(t.derived_at)}</p>}
                    <TicketThread
                      ticketId={t.id}
                      comments={t.comments ?? []}
                      viewerIsAdmin={false}
                      onAdded={(c) => list.setData((d) => (d ? { data: d.data.map((x) => (x.id === t.id ? { ...x, comments: [...(x.comments ?? []), c] } : x)) } : d))}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
      {creating && (
        <TicketForm
        open={creating}
        endpoint="portal/tickets"
        withProperty={false}
        onClose={() => {
          setCreating(false);
          router.replace("/portal/reclamos");
        }}
        onSaved={(t) => {
          setCreating(false);
          router.replace("/portal/reclamos");
          toast("Reclamo enviado. Te avisamos cuando lo derivemos.");
          list.reload();
          setOpen(t.id);
        }}
        />
      )}
    </>
  );
}
