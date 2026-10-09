"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, Building2, CalendarDays, ClipboardList, FileText, HandCoins, LogOut, Menu, ReceiptText, Search, Settings, TrendingUp, Users, Wrench, X } from "lucide-react";
import { CommandPalette } from "./command-palette";
import { api } from "@/lib/api";
import { ToastProvider } from "./toast";
import { cx, TimbreMark } from "./ui";

const nav = [
  { href: "/admin", label: "Liquidación", icon: ReceiptText, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/cobros", label: "Cobros", icon: HandCoins, badge: "proofs" as const },
  { href: "/admin/reclamos", label: "Reclamos", icon: ClipboardList, badge: "tickets" as const },
  { href: "/admin/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/admin/inquilinos", label: "Inquilinos", icon: Users },
  { href: "/admin/contratos", label: "Contratos", icon: FileText },
  { href: "/admin/gastos", label: "Gastos y rentabilidad", icon: TrendingUp },
  { href: "/admin/proveedores", label: "Proveedores", icon: Wrench },
  { href: "/admin/actividad", label: "Actividad", icon: Activity },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // El menú móvil queda abierto solo en la ruta donde se abrió: al navegar se cierra solo.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const setOpen = (v: boolean) => setMenuPath(v ? pathname : null);
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [pendingProofs, setPendingProofs] = useState<number | null>(null);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    api<{ data: unknown[] }>("tickets?status=abierto")
      .then((r) => setOpenTickets(r.data.length))
      .catch(() => null);
    api<{ data: unknown[] }>("proofs?status=pendiente")
      .then((r) => setPendingProofs(r.data.length))
      .catch(() => null);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const rail = (
    <nav aria-label="Principal" className="flex h-full flex-col bg-rail text-rail-ink">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <TimbreMark className="size-7 text-rail-ink" />
        <span className="text-[21px] font-extrabold tracking-[-0.02em]" style={{ fontStretch: "92%" }}>
          Timbre
        </span>
      </div>
      <div className="px-3 pb-2">
        <button
          onClick={() => setPalette(true)}
          className="flex h-9 w-full items-center gap-2.5 rounded-sm border border-white/15 bg-rail-2/50 px-3 text-[13.5px] text-rail-ink-2 transition-colors hover:border-white/30 hover:text-white"
        >
          <Search className="size-4" aria-hidden strokeWidth={1.8} />
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="rounded-sm border border-white/20 px-1.5 text-[11px]">Ctrl K</kbd>
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-1">
        {nav.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex h-10 items-center gap-3 rounded-sm px-3 text-[14.5px] transition-colors",
                  active ? "bg-rail-2 font-semibold text-white shadow-[inset_2px_0_0_#fff]" : "text-rail-ink-2 hover:bg-rail-2/60 hover:text-white",
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
                {item.badge === "proofs" && !!pendingProofs && (
                  <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-marker px-1.5 text-[11.5px] font-bold text-ink" aria-label={`${pendingProofs} comprobantes para confirmar`}>
                    {pendingProofs}
                  </span>
                )}
                {item.badge === "tickets" && !!openTickets && (
                  <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-marker px-1.5 text-[11.5px] font-bold text-ink" aria-label={`${openTickets} reclamos sin derivar`}>
                    {openTickets}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {process.env.NEXT_PUBLIC_DEMO === "1" && (
        <p className="mx-5 mb-3 rounded-sm border border-white/15 px-2.5 py-1.5 text-[12px] leading-snug text-rail-ink-2">
          Datos de demostración: personas y teléfonos ficticios.
        </p>
      )}
      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href="/admin/ajustes"
          aria-current={isActive("/admin/ajustes") ? "page" : undefined}
          className={cx("flex h-10 items-center gap-3 rounded-sm px-3 text-[14.5px]", isActive("/admin/ajustes") ? "bg-rail-2 text-white" : "text-rail-ink-2 hover:bg-rail-2/60 hover:text-white")}
        >
          <Settings className="size-[18px]" aria-hidden strokeWidth={1.8} />
          Ajustes y mensajes
        </Link>
        <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-sm px-3 text-[14.5px] text-rail-ink-2 hover:bg-rail-2/60 hover:text-white">
          <LogOut className="size-[18px]" aria-hidden strokeWidth={1.8} />
          Salir
        </button>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
        <aside className="no-print sticky top-0 hidden h-dvh lg:block">{rail}</aside>

        <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between bg-rail px-4 text-rail-ink lg:hidden">
          <div className="flex items-center gap-2">
            <TimbreMark className="size-6" />
            <span className="text-lg font-extrabold tracking-[-0.02em]">Timbre</span>
          </div>
          <button onClick={() => setPalette(true)} className="ml-auto flex size-10 items-center justify-center rounded-sm hover:bg-rail-2" aria-label="Buscar">
            <Search className="size-5" />
          </button>
          <button onClick={() => setOpen(true)} className="-mr-2 flex size-10 items-center justify-center rounded-sm hover:bg-rail-2" aria-label="Abrir menú" aria-expanded={open}>
            <Menu className="size-5" />
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fade-in absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
            <div className="sheet-in absolute inset-y-0 left-0 w-[264px]">
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-sm text-rail-ink hover:bg-rail-2" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
              {rail}
            </div>
          </div>
        )}

        <CommandPalette open={palette} onClose={() => setPalette(false)} />
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    </ToastProvider>
  );
}
