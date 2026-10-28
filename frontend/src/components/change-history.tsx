"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Empty, Panel, SkeletonRows } from "@/components/ui";
import { hace } from "@/lib/format";
import type { ChangeEntry } from "@/lib/types";
import { useApi } from "@/lib/use-api";

const VISIBLE = 5;

/**
 * Historial de una ficha: el alta y cada edición, con el antes y el después.
 * `version` es el updated_at de la ficha: cuando cambia, el historial se vuelve a pedir.
 */
export function ChangeHistory({ type, id, version }: { type: "properties" | "tenants" | "contracts"; id: number; version: string }) {
  const list = useApi<{ data: ChangeEntry[] }>(`history/${type}/${id}?v=${encodeURIComponent(version)}`);
  const [all, setAll] = useState(false);
  const entries = list.data?.data ?? [];
  const shown = all ? entries : entries.slice(0, VISIBLE);

  return (
    <Panel>
      {!list.data && <SkeletonRows rows={3} cols={2} />}
      {list.data && entries.length === 0 && <Empty title="Sin cambios registrados">Desde ahora, cada alta y cada edición de esta ficha queda anotada acá, con lo que había antes.</Empty>}
      <ol className="divide-y divide-rule">
        {shown.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <p className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-semibold">{e.event === "alta" ? "Alta de la ficha" : `Editado${e.user ? ` por ${e.user}` : ""}`}</span>
              <time dateTime={e.at} className="shrink-0 text-[12px] text-ink-3" title={new Date(e.at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}>
                {hace(e.at)}
              </time>
            </p>
            {e.changes.length > 0 && (
              <dl className="mt-1.5 flex flex-col gap-1 text-[13px]">
                {e.changes.map((c, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,140px)_1fr] gap-3">
                    <dt className="text-ink-3">{c.label}</dt>
                    <dd className="min-w-0">
                      <span className="text-ink-3 line-through decoration-rule-strong">{c.from}</span> <ArrowRight className="inline size-3 text-ink-3" aria-label="pasó a" /> <span className="font-semibold">{c.to}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ol>
      {entries.length > VISIBLE && (
        <div className="border-t border-rule px-4 py-2">
          <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>
            {all ? "Ver menos" : `Ver los ${entries.length} cambios`}
          </Button>
        </div>
      )}
    </Panel>
  );
}
