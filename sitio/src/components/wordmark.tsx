/** La marca: "brunito" en minúscula y negrita, con un techo a dos aguas sobre la br. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-baseline whitespace-nowrap ${className ?? ""}`}>
      <span className="titulo text-[1em] leading-none tracking-[-0.045em]">
        <span className="relative">
          <svg viewBox="0 0 20 7" className="absolute -top-[0.36em] left-[0.02em] h-[0.3em] w-[0.98em]" aria-hidden>
            <path d="M1 6.2 10 1l9 5.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" />
          </svg>
          br
        </span>
        unito
      </span>
    </span>
  );
}
