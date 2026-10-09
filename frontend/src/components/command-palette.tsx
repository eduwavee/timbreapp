"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ClipboardList, CornerDownLeft, FileText, Search, User } from "lucide-react";
import { api } from "@/lib/api";
import { cx } from "./ui";

type Hit = { id: number; title: string; subtitle: string };
type Results = { properties: Hit[]; tenants: Hit[]; tickets: Hit[] };
type Item = { key: string; group: string; title: string; subtitle?: string; href: string; icon: typeof Search };

const pages: Item[] = [
  { key: "p-liq", group: "Ir a", title: "Liquidación", href: "/admin", icon: FileText },
  { key: "p-agenda", group: "Ir a", title: "Agenda del mes", href: "/admin/agenda", icon: FileText },
  { key: "p-cobros", group: "Ir a", title: "Cobros y comprobantes", href: "/admin/cobros", icon: FileText },
  { key: "p-reclamos", group: "Ir a", title: "Reclamos", href: "/admin/reclamos", icon: ClipboardList },
  { key: "p-gastos", group: "Ir a", title: "Gastos y rentabilidad", href: "/admin/gastos", icon: FileText },
  { key: "p-actividad", group: "Ir a", title: "Actividad reciente", href: "/admin/actividad", icon: FileText },
  { key: "p-nuevo-reclamo", group: "Hacer", title: "Cargar un reclamo", href: "/admin/reclamos?nuevo=", icon: ClipboardList },
  { key: "p-nuevo-gasto", group: "Hacer", title: "Registrar un gasto", href: "/admin/gastos?nuevo=1", icon: FileText },
  { key: "p-nuevo-contrato", group: "Hacer", title: "Nuevo contrato", href: "/admin/contratos?nuevo=", icon: FileText },
];

/**
 * Buscador global: Ctrl/⌘+K desde cualquier pantalla del panel.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; data: Results } | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const id = setTimeout(() => {
      api<Results>(`search?q=${encodeURIComponent(term)}`)
        .then((data) => setResults({ q: term, data }))
        .catch(() => null);
    }, 140);
    return () => clearTimeout(id);
  }, [term]);

  const items: Item[] = useMemo(() => {
    if (term.length < 2) return pages;
    const data = results?.q === term ? results.data : null;
    if (!data) return [];
    return [
      ...data.properties.map((h) => ({ key: `u${h.id}`, group: "Unidades", title: h.title, subtitle: h.subtitle, href: `/admin/propiedades/${h.id}`, icon: Building2 })),
      ...data.tenants.map((h) => ({ key: `t${h.id}`, group: "Inquilinos", title: h.title, subtitle: h.subtitle, href: `/admin/inquilinos/${h.id}`, icon: User })),
      ...data.tickets.map((h) => ({ key: `r${h.id}`, group: "Reclamos", title: h.title, subtitle: h.subtitle, href: `/admin/reclamos/${h.id}`, icon: ClipboardList })),
    ];
  }, [term, results]);

  const searching = term.length >= 2 && results?.q !== term;
  const current = Math.min(active, Math.max(items.length - 1, 0));

  function go(item: Item | undefined) {
    if (!item) return;
    onClose();
    setQ("");
    router.push(item.href);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[current]);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Buscar en Timbre"
      className="mx-auto mt-[12vh] w-[calc(100%-32px)] max-w-[600px] bg-transparent p-0 backdrop:bg-[#1b1e22]/40"
    >
      {open && (
        <div className="fade-in overflow-hidden rounded-sm border border-rule-strong bg-sheet shadow-[0_24px_60px_-20px_rgba(27,30,34,0.45)]" onKeyDown={onKey}>
          <div className="flex items-center gap-3 border-b border-rule px-4">
            <Search className="size-5 shrink-0 text-ink-3" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder="Buscá una unidad (AZC-8), un inquilino o un reclamo"
              aria-label="Buscar"
              role="combobox"
              aria-expanded
              aria-controls="palette-results"
              aria-activedescendant={items[current] ? `palette-${items[current].key}` : undefined}
              className="palette-input h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-3"
            />
            <kbd className="hidden rounded-sm border border-rule-strong px-1.5 py-0.5 text-[11px] text-ink-3 sm:block">Esc</kbd>
          </div>
          <ul id="palette-results" role="listbox" className="max-h-[52vh] overflow-y-auto py-1.5">
            {searching && <li className="px-4 py-3 text-sm text-ink-3">Buscando…</li>}
            {!searching && term.length >= 2 && items.length === 0 && <li className="px-4 py-6 text-sm text-ink-2">No hay nada con “{term}”. Probá con el código de la unidad, el apellido o una palabra del reclamo.</li>}
            {items.map((item, i) => {
              const header = i === 0 || items[i - 1].group !== item.group;
              const Icon = item.icon;
              return (
                <li key={item.key} role="presentation">
                  {header && <p className="label px-4 pt-2.5 pb-1">{item.group}</p>}
                  <button
                    id={`palette-${item.key}`}
                    role="option"
                    aria-selected={i === current}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cx("flex w-full items-center gap-3 px-4 py-2 text-left", i === current && "bg-paper")}
                  >
                    <Icon className="size-4 shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.title}</span>
                      {item.subtitle && <span className="block truncate text-[12.5px] text-ink-3">{item.subtitle}</span>}
                    </span>
                    {i === current && <CornerDownLeft className="size-4 text-ink-3" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-4 border-t border-rule bg-paper px-4 py-2 text-[12px] text-ink-3">
            <span>↑ ↓ para moverte</span>
            <span>Enter para abrir</span>
          </div>
        </div>
      )}
    </dialog>
  );
}
