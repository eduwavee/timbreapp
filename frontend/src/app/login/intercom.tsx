"use client";

import { useEffect, useState } from "react";

/**
 * La botonera del portero. Cada tanto suena un timbre y aparece qué pasó, para un lado o para el otro.
 * Unidades y eventos ilustrativos (datos de demostración).
 */
const units = ["AZC-3", "AZC-5", "AZC-8", "BIL-2B", "BIL-4A", "HUM-1", "HUM-2", "HUM-3", "JUN-9A", "MAL-1", "MAL-2", "PIN-1290", "BOY-640", "CHA-7B", "PAR-5D"];

const rings = [
  { unit: "AZC-8", who: "Inquilino", text: "Pierde la llave de paso de la cocina" },
  { unit: "PIN-1290", who: "Vos", text: "65 días de atraso · aviso por WhatsApp" },
  { unit: "BOY-640", who: "Inquilino", text: "Mandó el comprobante de septiembre" },
  { unit: "HUM-2", who: "Vos", text: "Cuota de octubre cobrada · recibo 00412" },
] as const;

export function Intercom() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % rings.length), 3600);
    return () => clearInterval(id);
  }, []);

  const ring = rings[step];

  return (
    <div className="w-full max-w-[560px]">
      <div className="rounded-sm border border-white/15 bg-rail-2/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
        {/* Rejilla del parlante */}
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="grid flex-1 grid-cols-1 gap-[5px]" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="h-[3px] rounded-full bg-rail" style={{ marginInline: `${i % 2 ? 6 : 0}px` }} />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-[0.12em] text-rail-ink-2 uppercase" style={{ fontStretch: "82%" }}>
            Portero
          </span>
        </div>

        <ul className="grid grid-cols-3 gap-2 sm:gap-2.5" aria-hidden>
          {units.map((u, i) => {
            const active = u === ring.unit;
            return (
              <li key={u} className={`${i >= 9 ? "hidden sm:flex" : "flex"} items-center justify-between gap-2 rounded-sm border px-2.5 py-2 transition-colors duration-300 ${active ? "border-white/40 bg-rail" : "border-white/10 bg-rail/40"}`}>
                <span className={`num text-[12.5px] font-semibold tracking-wide transition-colors ${active ? "text-white" : "text-rail-ink-2"}`} style={{ fontStretch: "85%" }}>
                  {u}
                </span>
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  {active && (
                    <>
                      <span key={`a${step}`} className="ring-wave absolute inset-0 rounded-full border border-marker" />
                      <span key={`b${step}`} className="ring-wave absolute inset-0 rounded-full border border-marker [animation-delay:420ms]" />
                    </>
                  )}
                  <span className={`size-3.5 rounded-full border transition-all duration-300 ${active ? "border-marker bg-marker shadow-[0_0_0_3px_rgba(241,223,74,0.22)]" : "border-white/25 bg-rail"}`} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Lo que dijo el timbre */}
      <div className="mt-4 min-h-[64px]" aria-live="polite">
        <p key={step} className="ring-note flex items-start gap-3">
          <span className={`mt-1 inline-flex shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] uppercase ${ring.who === "Vos" ? "bg-rail-ink text-rail" : "bg-marker text-ink"}`} style={{ fontStretch: "88%" }}>
            {ring.who === "Vos" ? "Tocaste" : "Tocó"}
          </span>
          <span>
            <span className="num block text-[15px] font-bold text-white">{ring.unit}</span>
            <span className="block text-[15px] text-rail-ink-2">{ring.text}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
