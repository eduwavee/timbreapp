"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight, Coins, FileWarning, RefreshCw } from "lucide-react";
import { Button, cx, Empty, ErrorState, PageHeader, Panel } from "@/components/ui";
import { currentPeriod, shiftPeriod, today } from "@/lib/format";
import type { AgendaEvent } from "@/lib/types";
import { useApi } from "@/lib/use-api";

const tone: Record<AgendaEvent["tone"], string> = {
  ok: "border-stamp/30 bg-stamp-soft text-stamp",
  debt: "border-debt/30 bg-debt-soft text-debt",
  ink: "border-rule-strong bg-sheet text-ink",
  stamp: "border-stamp/30 bg-sheet text-stamp",
};

const kindLabel: Record<AgendaEvent["kind"], string> = {
  vencimiento: "Vencimientos",
  fin_contrato: "Fin de contrato",
  ajuste: "Ajuste",
  documento: "Documento",
};

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const kindIcon = { vencimiento: Coins, ajuste: RefreshCw, fin_contrato: CalendarX2, documento: FileWarning };

/** Rótulo corto para la celda del calendario: un ícono por tipo y el código de la unidad, que es lo que se reconoce. */
function short(e: AgendaEvent) {
  if (e.kind === "vencimiento") return e.title.replace(" vencen", "").replace(" vence", "");
  return e.units[0];
}

export default function AgendaPage() {
  const [month, setMonth] = useState(currentPeriod());
  const agenda = useApi<{ month: string; label: string; events: AgendaEvent[] }>(`agenda?month=${month}`);
  const hoy = today();

  const { cells, byDay } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const days = new Date(y, m, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
    while (cells.length % 7) cells.push(null);
    const byDay = new Map<string, AgendaEvent[]>();
    (agenda.data?.events ?? []).forEach((e) => byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]));
    return { cells, byDay };
  }, [month, agenda.data]);

  // En el mes actual: primero lo vencido sin cobrar (la deuda primero), después lo que viene.
  const overdue = (agenda.data?.events ?? []).filter((e) => e.date < hoy && e.tone === "debt");
  const upcoming = [...overdue, ...(agenda.data?.events ?? []).filter((e) => e.date >= hoy)];

  return (
    <>
      <PageHeader
        title={`Agenda de ${agenda.data?.label.toLowerCase() ?? "…"}`}
        subtitle="Vencimientos de cuotas, ajustes, fines de contrato y documentos que vencen."
        actions={
          <div className="flex items-center gap-1">
            <Button size="sm" className="w-8 px-0" onClick={() => setMonth((p) => shiftPeriod(p, -1))} aria-label="Mes anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" onClick={() => setMonth(currentPeriod())} disabled={month === currentPeriod()}>
              Este mes
            </Button>
            <Button size="sm" className="w-8 px-0" onClick={() => setMonth((p) => shiftPeriod(p, 1))} aria-label="Mes siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />
      {agenda.error && <ErrorState message={agenda.error.message} onRetry={agenda.reload} />}

      <div className="mb-3 hidden flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-2 md:flex" aria-hidden>
        <span className="flex items-center gap-1.5"><Coins className="size-3.5" /> Vencimientos de cuotas</span>
        <span className="flex items-center gap-1.5"><RefreshCw className="size-3.5" /> Ajuste ICL/IPC</span>
        <span className="flex items-center gap-1.5"><CalendarX2 className="size-3.5" /> Fin de contrato</span>
        <span className="flex items-center gap-1.5"><FileWarning className="size-3.5" /> Documento que vence</span>
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Calendario: escritorio */}
        <Panel className="hidden overflow-hidden md:block">
          <div className="grid grid-cols-7 border-b border-rule-strong">
            {weekdays.map((d) => (
              <div key={d} className="label px-2.5 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              const events = date ? (byDay.get(date) ?? []) : [];
              const isToday = date === hoy;
              return (
                <div key={i} className={cx("min-h-[112px] border-r border-b border-rule p-1.5 [&:nth-child(7n)]:border-r-0", !date && "bg-paper", date && date < hoy && "bg-paper/60")}>
                  {date && (
                    <>
                      <p className={cx("num mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-[12.5px]", isToday ? "bg-ink font-bold text-white" : "text-ink-2")}>{Number(date.slice(8))}</p>
                      <ul className="flex flex-col gap-1">
                        {events.map((e, k) => (
                          <li key={k}>
                            <Link href={e.href} title={`${e.title} · ${e.detail}`} aria-label={`${e.title}. ${e.detail}`} className={cx("flex items-center gap-1 truncate rounded-sm border px-1.5 py-0.5 text-[11.5px] leading-snug font-semibold hover:brightness-95", tone[e.tone])}>
                              {(() => {
                                const Icon = kindIcon[e.kind];
                                return <Icon className="size-3 shrink-0" strokeWidth={2.2} aria-hidden />;
                              })()}
                              <span className="truncate">{short(e)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Lista: lo que viene (y la agenda completa en el celular). */}
        <section className="min-w-0">
          <h2 className="mb-2 text-[15px] font-bold">{month === currentPeriod() ? (overdue.length ? "Vencido y lo que viene" : "Lo que viene") : "Del mes"}</h2>
          <Panel>
            {agenda.data && (month === currentPeriod() ? upcoming : agenda.data.events).length === 0 && <Empty title="Nada agendado">Un mes sin vencimientos ni ajustes.</Empty>}
            {!agenda.data && <div className="skeleton m-4 h-40" />}
            <ul className="divide-y divide-rule">
              {(month === currentPeriod() ? upcoming : agenda.data?.events ?? []).map((e, i) => (
                <li key={i}>
                  <Link href={e.href} className="flex gap-3 px-4 py-3 hover:bg-paper">
                    <span className={cx("num flex w-11 shrink-0 flex-col items-center rounded-sm border py-1 leading-tight", e.date === hoy ? "border-ink bg-ink text-white" : "border-rule-strong")}>
                      <span className="text-[17px] font-bold">{Number(e.date.slice(8))}</span>
                      <span className="text-[10.5px] uppercase opacity-80">{new Date(`${e.date}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{e.title}</span>
                      <span className={cx("block text-[13px]", e.tone === "debt" ? "text-debt" : "text-ink-2")}>
                        {kindLabel[e.kind]} · {e.detail}
                      </span>
                      {e.kind === "vencimiento" && e.units.length > 0 && <span className="mt-0.5 block truncate text-[12px] text-ink-3">{e.units.join(" · ")}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>
    </>
  );
}
