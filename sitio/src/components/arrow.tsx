/** Flecha de cartel: trazo grueso y punta recta. */
export function Arrow({ className, direction = "right" }: { className?: string; direction?: "right" | "left" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M3 12h16M13 5.5 19.5 12 13 18.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
