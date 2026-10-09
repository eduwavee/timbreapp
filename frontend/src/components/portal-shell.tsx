"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { ToastProvider } from "./toast";
import { cx, TimbreMark } from "./ui";

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const tabs = [
    { href: "/portal", label: "Mi alquiler" },
    { href: "/portal/reclamos", label: "Reclamos" },
  ];

  return (
    <ToastProvider>
      <header className="bg-rail text-rail-ink">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TimbreMark className="size-6" />
            <span className="text-lg font-extrabold tracking-[-0.02em]">Timbre</span>
          </div>
          <button onClick={logout} className="flex h-9 items-center gap-2 rounded-sm px-2.5 text-sm text-rail-ink-2 hover:bg-rail-2 hover:text-white">
            <LogOut className="size-4" aria-hidden /> Salir
          </button>
        </div>
        <nav aria-label="Portal" className="mx-auto flex max-w-4xl gap-1 px-4">
          {tabs.map((t) => {
            const active = t.href === "/portal" ? pathname === "/portal" : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={cx("border-b-2 px-3 pt-1 pb-2.5 text-[14.5px] font-semibold", active ? "border-white text-white" : "border-transparent text-rail-ink-2 hover:text-white")}>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </ToastProvider>
  );
}
