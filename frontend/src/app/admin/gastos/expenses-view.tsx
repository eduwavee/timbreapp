"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { ExpenseForm } from "@/components/forms/expense-form";
import { useToast } from "@/components/toast";
import { Button, cx, Empty, ErrorState, Money, PageHeader, Panel, SearchBox, Section, Select, SkeletonRows, Table, Td, Th } from "@/components/ui";
import { ars, currentPeriod, fecha, periodo, shiftPeriod } from "@/lib/format";
import { matches } from "@/lib/search";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { useUrlState } from "@/lib/use-url-state";

type Profit = {
  year: number;
  totals: { income: number; expenses: number; net: number };
  properties: { property: { id: number; code: string; address: string; type: string }; income: number; expenses: number; net: number; margin: number | null }[];
  months: { month: string; income: number; expenses: number; net: number }[];
};

export function ExpensesView() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const tab = params.get("tab") === "rentabilidad" ? "rentabilidad" : "gastos";
  const [month, setMonth] = useState(currentPeriod());
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useUrlState("rubro", "");
  const [q, setQ] = useUrlState("q", "");
  const [editing, setEditing] = useState<Expense | "new" | null>(params.get("nuevo") ? "new" : null);
  const list = useApi<{ data: Expense[] }>(tab === "gastos" ? `expenses?month=${month}` : null);
  const profit = useApi<Profit>(tab === "rentabilidad" ? `profitability?year=${year}` : null);

  const expenses = useMemo(() => (list.data?.data ?? []).filter((e) => (!category || e.category.value === category) && matches(q, e.property.code, e.description, e.category.label, e.ticket_id && `#${e.ticket_id}`)), [list.data, category, q]);
  const units = useMemo(() => (profit.data?.properties ?? []).filter((r) => matches(q, r.property.code, r.property.address, r.property.type)), [profit.data, q]);
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    (list.data?.data ?? []).forEach((e) => m.set(e.category.label, (m.get(e.category.label) ?? 0) + e.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [list.data]);

  const setTab = (t: string) => router.replace(t === "gastos" ? "/admin/gastos" : "/admin/gastos?tab=rentabilidad");
  const currentMonth = new Date().getMonth() + 1;

  return (
    <>
      <PageHeader
        title="Gastos y rentabilidad"
        subtitle="Lo que sale por cada unidad y cuánto te deja cada una."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Registrar gasto
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist" aria-label="Vista">
          {[
            { key: "gastos", label: "Gastos" },
            { key: "rentabilidad", label: "Rentabilidad" },
          ].map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cx("h-8 rounded-sm border px-3 text-[13px] font-semibold", tab === t.key ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet text-ink-2 hover:border-ink")}>
              {t.label}
            </button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} placeholder={tab === "gastos" ? "Unidad o detalle del gasto" : "Unidad o calle"} className="ml-auto" />
        {tab === "gastos" ? (
          <ExportButton
            title={`Gastos ${month}`}
            rows={expenses}
            columns={[
              { label: "Fecha", value: (e) => fecha(e.spent_on) },
              { label: "Unidad", value: (e) => e.property.code },
              { label: "Rubro", value: (e) => e.category.label },
              { label: "Detalle", value: (e) => e.description },
              { label: "Monto", type: "money", value: (e) => e.amount },
            ]}
          />
        ) : (
          <ExportButton
            title={`Rentabilidad ${year}`}
            rows={units}
            columns={[
              { label: "Unidad", value: (r) => r.property.code },
              { label: "Dirección", value: (r) => r.property.address },
              { label: "Tipo", value: (r) => r.property.type },
              { label: "Cobrado", type: "money", value: (r) => r.income },
              { label: "Gastos", type: "money", value: (r) => r.expenses },
              { label: "Neto", type: "money", value: (r) => r.net },
              { label: "Margen %", type: "number", value: (r) => r.margin },
            ]}
          />
        )}
        <div className="flex items-center gap-1">
          <Button size="sm" className="w-8 px-0" onClick={() => (tab === "gastos" ? setMonth((m) => shiftPeriod(m, -1)) : setYear((y) => y - 1))} aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="num min-w-32 text-center text-[14px] font-semibold">{tab === "gastos" ? periodo(month) : year}</span>
          <Button size="sm" className="w-8 px-0" onClick={() => (tab === "gastos" ? setMonth((m) => shiftPeriod(m, 1)) : setYear((y) => y + 1))} aria-label="Siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {tab === "gastos" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Rubro" className="h-8 w-auto text-sm">
                <option value="">Todos los rubros</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <span className="num text-[14px]">
                {expenses.length} gastos · <strong>{ars(total, { short: true })}</strong>
              </span>
            </div>
            {list.error && (
              <div className="p-4">
                <ErrorState message={list.error.message} onRetry={list.reload} />
              </div>
            )}
            {list.loading && !list.data && <SkeletonRows rows={8} cols={5} />}
            {list.data && expenses.length === 0 && (q || category) && list.data.data.length > 0 && <Empty title="Ningún gasto coincide con el filtro">Probá con el código de la unidad o parte del detalle.</Empty>}
            {list.data && list.data.data.length === 0 && <Empty title="Sin gastos este mes" action={<Button onClick={() => setEditing("new")}>Registrar un gasto</Button>}>Cargá ABL, expensas, seguros y arreglos para saber cuánto te deja cada unidad. El costo que ponés en un reclamo se carga solo.</Empty>}
            {expenses.length > 0 && (
              <Table>
                <thead>
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Unidad</Th>
                    <Th>Rubro</Th>
                    <Th>Detalle</Th>
                    <Th align="right">Monto</Th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} onClick={() => setEditing(e)} className="cursor-pointer hover:bg-paper/70">
                      <Td className="num whitespace-nowrap text-ink-2">{fecha(e.spent_on)}</Td>
                      <Td>
                        <Link href={`/admin/propiedades/${e.property.id}`} onClick={(ev) => ev.stopPropagation()} className="font-bold hover:underline">
                          {e.property.code}
                        </Link>
                      </Td>
                      <Td className="text-ink-2">{e.category.label}</Td>
                      <Td>
                        <button className="text-left hover:underline">{e.description}</button>
                        {e.ticket_id && <span className="ml-2 text-[12px] text-ink-3">del reclamo #{e.ticket_id}</span>}
                      </Td>
                      <Td align="right" className="num">
                        {ars(e.amount, { short: true })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold [&>td]:border-t-[3px] [&>td]:border-double [&>td]:border-t-ink">
                    <Td colSpan={4}>Total {q ? "de la búsqueda" : category ? EXPENSE_CATEGORIES.find((c) => c.value === category)?.label.toLowerCase() : "del mes"}</Td>
                    <Td align="right" className="num">
                      {ars(total, { short: true })}
                    </Td>
                  </tr>
                </tfoot>
              </Table>
            )}
          </Panel>
          <Section title="Por rubro">
            <Panel>
              {byCategory.length === 0 && <p className="px-4 py-3 text-sm text-ink-3">—</p>}
              <dl className="divide-y divide-rule">
                {byCategory.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                    <dt>{label}</dt>
                    <dd className="num font-semibold">{ars(value, { short: true })}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </Section>
        </div>
      )}

      {tab === "rentabilidad" && (
        <>
          {profit.error && <ErrorState message={profit.error.message} onRetry={profit.reload} />}
          <dl className="mb-6 grid grid-cols-1 rounded-sm border border-rule bg-sheet sm:grid-cols-3">
            {[
              ["Cobrado en el año", profit.data?.totals.income, "text-stamp"],
              ["Gastos del año", profit.data?.totals.expenses, ""],
              ["Te quedó", profit.data?.totals.net, ""],
            ].map(([label, value, tone], i) => (
              <div key={label as string} className={cx("px-4 py-3", i < 2 && "border-b border-rule sm:border-r sm:border-b-0")}>
                <dt className="label">{label}</dt>
                <dd className={cx("num mt-1 text-[19px] font-semibold sm:text-[22px]", tone as string)}>{profit.data ? ars(value as number, { short: true }) : <span className="skeleton inline-block h-6 w-28" />}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1fr)_460px]">
            <Section title="Por unidad, de la que más deja a la que menos">
              <Panel>
                {!profit.data && <SkeletonRows rows={10} cols={5} />}
                {profit.data && units.length > 0 && (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Unidad</Th>
                        <Th>Tipo</Th>
                        <Th align="right">Cobrado</Th>
                        <Th align="right">Gastos</Th>
                        <Th align="right">Neto</Th>
                        <Th align="right">Margen</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((r) => (
                        <tr key={r.property.id} className="hover:bg-paper/70">
                          <Td>
                            <Link href={`/admin/propiedades/${r.property.id}`} className="font-bold hover:underline">
                              {r.property.code}
                            </Link>
                            <p className="text-[12.5px] text-ink-3">{r.property.address}</p>
                          </Td>
                          <Td className="text-ink-2">{r.property.type}</Td>
                          <Td align="right">
                            <Money value={r.income} tone="stamp" short />
                          </Td>
                          <Td align="right">
                            <Money value={r.expenses} short />
                          </Td>
                          <Td align="right" className={cx("num font-semibold", r.net < 0 && "text-debt")}>
                            {ars(r.net, { short: true })}
                          </Td>
                          <Td align="right" className={cx("num", r.margin !== null && r.margin < 50 ? "font-semibold text-ink" : "text-ink-2")}>
                            {r.margin === null ? "—" : `${r.margin.toLocaleString("es-AR")} %`}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                {profit.data && units.length === 0 && <Empty title="Ninguna unidad coincide con la búsqueda" />}
              </Panel>
              <p className="mt-2 text-[13px] text-ink-3">Cobrado incluye intereses por mora. Las unidades vacías o en arreglo aparecen con neto negativo.</p>
            </Section>
            <Section title="Mes a mes">
              <Panel>
                {profit.data && (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Mes</Th>
                        <Th align="right">Cobrado</Th>
                        <Th align="right">Gastos</Th>
                        <Th align="right">Neto</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {profit.data.months
                        .filter((m) => year < new Date().getFullYear() || Number(m.month.slice(5)) <= currentMonth)
                        .map((m) => (
                          <tr key={m.month}>
                            <Td className="whitespace-nowrap">{periodo(m.month).split(" ")[0]}</Td>
                            <Td align="right">
                              <Money value={m.income} tone="stamp" short />
                            </Td>
                            <Td align="right">
                              <Money value={m.expenses} short />
                            </Td>
                            <Td align="right" className="num font-semibold">
                              {ars(m.net, { short: true })}
                            </Td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                )}
              </Panel>
            </Section>
          </div>
        </>
      )}

      {editing && (
        <ExpenseForm
          key={editing === "new" ? "new" : editing.id}
          expense={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            if (params.get("nuevo")) router.replace("/admin/gastos");
          }}
          onSaved={(msg) => {
            setEditing(null);
            toast(msg);
            list.reload();
            profit.reload();
          }}
        />
      )}
    </>
  );
}
