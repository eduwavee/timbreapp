/** Flecha fina, del mismo trazo que el texto mono. */
export function Arrow({ className, direction = "right" }: { className?: string; direction?: "right" | "left" | "up" | "down" | "up-right" }) {
  const rotate = { right: 0, down: 90, left: 180, up: 270, "up-right": -45 }[direction];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}>
      <path d="M3 12h17M14 5.5 20.5 12 14 18.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}
