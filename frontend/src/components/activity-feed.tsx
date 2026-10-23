import Link from "next/link";
import { BellRing, CheckCheck, ClipboardList, FileCheck2, HandCoins, Megaphone, Send } from "lucide-react";
import { hace } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";
import { cx } from "./ui";

const kinds: Record<ActivityEvent["kind"], { icon: typeof HandCoins; tone: string; label: string }> = {
  pago: { icon: HandCoins, tone: "text-stamp", label: "Pago" },
  comprobante: { icon: FileCheck2, tone: "text-ink", label: "Comprobante" },
  aviso: { icon: BellRing, tone: "text-debt", label: "Aviso de deuda" },
  derivacion: { icon: Send, tone: "text-ink", label: "Derivación" },
  reclamo: { icon: ClipboardList, tone: "text-ink", label: "Reclamo" },
  resuelto: { icon: CheckCheck, tone: "text-ok", label: "Resuelto" },
  consulta: { icon: Megaphone, tone: "text-ink", label: "Consulta en La Choza" },
};

/** Línea de tiempo con un filete vertical: cada evento cuelga de la misma columna. */
export function ActivityFeed({ events, compact }: { events: ActivityEvent[]; compact?: boolean }) {
  return (
    <ol className="relative">
      <span aria-hidden className="absolute top-3 bottom-3 left-[27px] w-px bg-rule" />
      {events.map((e, i) => {
        const k = kinds[e.kind];
        const Icon = k.icon;
        const body = (
          <>
            <span className={cx("relative z-10 mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-sm border border-rule bg-sheet", k.tone)}>
              <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className={cx("font-semibold", compact && "truncate")}>{e.title}</span>
                <time dateTime={e.at} className="shrink-0 text-[12px] text-ink-3">
                  {hace(e.at)}
                </time>
              </span>
              <span className={cx("block text-[13px] text-ink-2", compact && "truncate")}>
                <span className="sr-only">{k.label}: </span>
                {e.detail}
              </span>
            </span>
          </>
        );
        return (
          <li key={`${e.kind}-${e.at}-${i}`}>
            {e.href ? (
              <Link href={e.href} className="flex gap-3 px-3.5 py-2.5 hover:bg-paper" target={e.href.startsWith("/recibo") ? "_blank" : undefined}>
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 px-3.5 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
