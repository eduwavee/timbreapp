/** La choza: techo de paja a dos aguas sobre la puerta. Dibujada a mano en 24×24. */
export function ChozaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2.5 1.8 12.2h3.1V21.5h14.2v-9.3h3.1Z" fill="currentColor" />
      <path d="M7.4 9.2 9.6 7M10.1 10.3l3.4-3.3M13.6 10.6l2.2-2.1" stroke="var(--chapa, #fff)" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="10" y="14.6" width="4" height="6.9" fill="var(--chapa, #fff)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <ChozaMark className="size-[1.15em] -translate-y-[0.06em]" />
      <span className="cartel text-[1em] leading-none tracking-[0.01em] [word-spacing:0.14em]">La Choza</span>
    </span>
  );
}
