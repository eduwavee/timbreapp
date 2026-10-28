"use client";

import { useMemo } from "react";
import { ActivityFeed } from "@/components/activity-feed";
import { cx, Empty, ErrorState, PageHeader, Panel, SearchBox, SkeletonRows } from "@/components/ui";
import { matches } from "@/lib/search";
import type { ActivityEvent } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useUrlState } from "@/lib/use-url-state";

const filters: { key: string; label: string; kinds: ActivityEvent["kind"][] }[] = [
  { key: "todo", label: "Todo", kinds: [] },
  { key: "plata", label: "Pagos y comprobantes", kinds: ["pago", "comprobante"] },
  { key: "avisos", label: "Avisos y derivaciones", kinds: ["aviso", "derivacion"] },
  { key: "reclamos", label: "Reclamos", kinds: ["reclamo", "resuelto"] },
  { key: "cambios", label: "Cambios en fichas", kinds: ["cambio"] },
];

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  const s = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ActivityPage() {
  const feed = useApi<{ data: ActivityEvent[] }>("activity?limit=100");
  const [filter, setFilter] = useUrlState("ver", "todo");
  const [q, setQ] = useUrlState("q", "");

  const days = useMemo(() => {
    const kinds = filters.find((f) => f.key === filter)!.kinds;
    const events = (feed.data?.data ?? []).filter((e) => (!kinds.length || kinds.includes(e.kind)) && matches(q, e.title, e.detail));
    const groups = new Map<string, ActivityEvent[]>();
    events.forEach((e) => {
      const k = dayLabel(e.at);
      groups.set(k, [...(groups.get(k) ?? []), e]);
    });
    return [...groups.entries()];
  }, [feed.data, filter, q]);

  return (
    <>
      <PageHeader title="Actividad" subtitle="Todo lo que pasó en Timbre, de lo más nuevo a lo más viejo." />
      <div className="mb-4 flex max-w-3xl flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar actividad">
          {filters.map((f) => (
            <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)} className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", filter === f.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
              {f.label}
            </button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Unidad, inquilino o detalle" className="ml-auto" />
      </div>
      {feed.error && <ErrorState message={feed.error.message} onRetry={feed.reload} />}
      {!feed.data && !feed.error && (
        <Panel>
          <SkeletonRows rows={8} cols={2} />
        </Panel>
      )}
      {feed.data && days.length === 0 && (
        <Panel>
          {q ? <Empty title="Nada coincide con la búsqueda">Se busca entre los últimos 100 movimientos.</Empty> : <Empty title="Nada por acá todavía">Cuando cobres, avises, edites una ficha o entre un reclamo, queda registrado.</Empty>}
        </Panel>
      )}
      <div className="flex max-w-3xl flex-col gap-6">
        {days.map(([day, events]) => (
          <section key={day}>
            <h2 className="mb-2 text-[15px] font-bold">{day}</h2>
            <Panel>
              <ActivityFeed events={events} />
            </Panel>
          </section>
        ))}
      </div>
    </>
  );
}
