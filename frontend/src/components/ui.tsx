"use client";

import Link from "next/link";
import { forwardRef, useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import { ArrowLeft, Loader2, MessageCircle, X } from "lucide-react";
import { ars } from "@/lib/format";
import type { Enum, InstallmentStatus, TicketStatus } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ───────────── Botones ───────────── */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp" | "stamp";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-[#33383f] active:bg-black border border-ink",
  secondary: "bg-sheet text-ink border border-rule-strong hover:border-ink hover:bg-paper",
  ghost: "text-ink-2 hover:text-ink hover:bg-sheet-2 border border-transparent",
  danger: "bg-sheet text-debt border border-debt/40 hover:bg-debt-soft hover:border-debt",
  whatsapp: "bg-whatsapp text-white border border-whatsapp hover:bg-[#136a39]",
  stamp: "bg-stamp text-white border border-stamp hover:bg-[#5038a3]",
};

const sizes = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-10 px-3.5 text-sm gap-2",
};

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "secondary", size = "md", className, children, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return (
    <Link
      href={href}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-sm font-semibold whitespace-nowrap transition-colors duration-150", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Abre WhatsApp con el mensaje armado; onSent registra el contacto. */
export function WhatsAppLink({ href, onSent, size = "sm", children = "WhatsApp", className, compact }: { href: string; onSent?: () => void; size?: keyof typeof sizes; children?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => onSent?.()}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-sm font-semibold whitespace-nowrap transition-colors duration-150", variants.whatsapp, sizes[size], compact && "w-8 px-0", className)}
      aria-label={compact ? "Avisar por WhatsApp" : undefined}
    >
      <MessageCircle className="size-4" aria-hidden />
      {!compact && children}
    </a>
  );
}

/* ───────────── Formularios ───────────── */

const control =
  "w-full rounded-sm border border-rule-strong bg-sheet px-3 text-[15px] text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-stamp focus:outline-none focus:ring-2 focus:ring-stamp/20 disabled:bg-sheet-2 aria-invalid:border-debt aria-invalid:ring-debt/15";

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: (id: string, describedBy?: string) => ReactNode; className?: string }) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
        {label}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-[13px] text-debt">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx(control, "h-10", className)} {...props} />;
});

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cx(className?.includes("w-auto") ? control.replace("w-full ", "") : control, "h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a5058' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(control, "min-h-24 py-2", className)} {...props} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm border border-debt/30 bg-debt-soft px-3 py-2 text-sm text-debt">
      {message}
    </p>
  );
}

/* ───────────── Datos ───────────── */

export function Money({ value, tone, short, className }: { value: number | null | undefined; tone?: "debt" | "muted" | "stamp"; short?: boolean; className?: string }) {
  const zero = !value;
  return (
    <span className={cx("num", tone === "debt" && !zero && "text-debt font-semibold", tone === "stamp" && "text-stamp", (tone === "muted" || zero) && "text-ink-3", className)}>
      {zero && tone ? "—" : ars(value, { short })}
    </span>
  );
}

const stageStyles: Record<InstallmentStatus, string> = {
  pendiente: "border-rule-strong text-ink-2 bg-sheet",
  parcial: "border-warn/40 text-warn bg-warn-soft",
  vencida: "border-debt bg-debt text-white",
  pagada: "border-stamp/40 text-stamp bg-stamp-soft",
};

export function StagePill({ stage }: { stage: Enum<InstallmentStatus> | null }) {
  if (!stage) return <span className="text-ink-3">—</span>;
  return <span className={cx("inline-flex h-6 items-center rounded-sm border px-2 text-[12px] font-semibold whitespace-nowrap", stageStyles[stage.value])}>{stage.label}</span>;
}

const ticketStyles: Record<TicketStatus, string> = {
  abierto: "bg-marker text-ink border-marker",
  derivado: "bg-stamp-soft text-stamp border-stamp/30",
  en_curso: "bg-sheet text-ink border-ink/40",
  resuelto: "bg-ok-soft text-ok border-ok/30",
};

export function TicketPill({ status }: { status: Enum<TicketStatus> }) {
  return <span className={cx("inline-flex h-6 items-center rounded-sm border px-2 text-[12px] font-semibold whitespace-nowrap", ticketStyles[status.value])}>{status.label}</span>;
}

export function PriorityMark({ priority }: { priority: Enum }) {
  const style =
    priority.value === "urgente"
      ? "text-white bg-debt border-debt"
      : priority.value === "alta"
        ? "text-debt border-debt/50 bg-sheet"
        : priority.value === "media"
          ? "text-ink-2 border-rule-strong bg-sheet"
          : "text-ink-3 border-rule bg-sheet";
  return <span className={cx("inline-flex h-6 items-center rounded-sm border px-2 text-[12px] font-semibold", style)}>{priority.label}</span>;
}

const propertyStatus: Record<string, string> = {
  ocupada: "text-ink-2 border-rule-strong",
  disponible: "text-ok border-ok/40 bg-ok-soft",
  mantenimiento: "text-warn border-warn/40 bg-warn-soft",
};

export function StatusTag({ status }: { status: Enum }) {
  return <span className={cx("inline-flex h-6 items-center rounded-sm border px-2 text-[12px] font-semibold whitespace-nowrap", propertyStatus[status.value] ?? "text-ink-2 border-rule-strong")}>{status.label}</span>;
}

/** Tira de etapas de la cuota: emitida → vence → vencida → pagada. */
export function StageStrip({ status, dueDate, compact }: { status: InstallmentStatus; dueDate: string; compact?: boolean }) {
  const steps = [
    { key: "emitida", label: "Emitida" },
    { key: "vence", label: `Vence ${dueDate.slice(8, 10)}/${dueDate.slice(5, 7)}` },
    { key: "vencida", label: "Vencida" },
    { key: "pagada", label: "Pagada" },
  ];
  const reached = status === "pagada" ? ["emitida", "vence", "pagada"] : status === "vencida" ? ["emitida", "vence", "vencida"] : ["emitida"];
  const current = status === "pagada" ? "pagada" : status === "vencida" ? "vencida" : "vence";
  return (
    <ol className="flex items-center gap-1" aria-label="Etapa de la cuota">
      {steps.map((s, i) => {
        const on = reached.includes(s.key);
        const isCurrent = s.key === current;
        const tone = s.key === "vencida" ? "bg-debt" : s.key === "pagada" ? "bg-stamp" : "bg-ink";
        return (
          <li key={s.key} className="flex items-center gap-1">
            {i > 0 && <span className={cx("h-px w-3", on ? "bg-ink-3" : "bg-rule")} aria-hidden />}
            <span className={cx("flex items-center gap-1 text-[11.5px] whitespace-nowrap", isCurrent ? "font-semibold text-ink" : on ? "text-ink-2" : "text-ink-3/70")} aria-current={isCurrent ? "step" : undefined}>
              <span className={cx("size-1.5 rounded-full", on ? tone : "bg-rule-strong")} aria-hidden />
              {compact && !isCurrent ? <span className="sr-only">{s.label}</span> : s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────── Estructura ───────────── */

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule pb-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
            <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.015em] text-balance">{title}</h1>
        {subtitle && <div className="mt-1 text-[14px] text-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Enlace secundario: tinta subrayada (el violeta queda para lo cobrado). */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cx("text-[13px] font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink", className)} {...props} />;
}

export function Section({ title, actions, children, className }: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("min-w-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-sm border border-rule bg-sheet", className)}>{children}</div>;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 py-8">
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-prose text-sm text-ink-2">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-debt/30 bg-debt-soft px-4 py-3 text-sm text-debt">
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-rule" aria-busy aria-label="Cargando">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-3.5" style={{ width: c === 0 ? "18%" : `${10 + ((r + c) % 3) * 4}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Tabla con encabezados condensados y cifras alineadas a la derecha. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("relative overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-[14px]">{children}</table>
    </div>
  );
}

export function Th({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" | "center" }) {
  return <th className={cx("label h-9 border-b border-rule-strong px-3 font-semibold whitespace-nowrap first:pl-4 last:pr-4", align === "right" && "text-right", align === "center" && "text-center", className)}>{children}</th>;
}

export function Td({ children, className, align, colSpan }: { children?: ReactNode; className?: string; align?: "right" | "center"; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cx("border-b border-rule px-3 py-2.5 align-middle first:pl-4 last:pr-4", align === "right" && "text-right", align === "center" && "text-center", className)}>
      {children}
    </td>
  );
}

/* ───────────── Hoja lateral ───────────── */

export function Sheet({ open, onClose, title, description, children, footer }: { open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[480px] bg-transparent p-0 backdrop:bg-[#1b1e22]/35 backdrop:backdrop-blur-[1px]"
    >
      {open && (
        <div className="sheet-in flex h-full flex-col border-l border-rule-strong bg-sheet shadow-[-12px_0_32px_-12px_rgba(27,30,34,0.25)]">
          <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {description && <div className="mt-0.5 text-sm text-ink-2">{description}</div>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar" className="w-8 px-0">
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-rule bg-paper px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/* ───────────── Marca ───────────── */

/** El botón de portero: una placa con el pulsador. */
export function TimbreMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="4" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7.5" y="5.5" width="9" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
      <circle cx="12" cy="14.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="14.5" r="1.5" fill="var(--marker)" />
    </svg>
  );
}
