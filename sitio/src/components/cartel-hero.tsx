"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import type { Meta, Op } from "@/lib/types";
import { SearchStrip } from "./search-strip";

const OpContext = createContext<{ op: Op; setOp: (op: Op) => void; swing: number; pending: boolean }>({ op: "venta", setOp: () => {}, swing: 0, pending: false });

/**
 * Guarda la operación elegida (venta o alquiler). El color cambia al instante
 * y la lista de abajo se vuelve a pedir al servidor sin mover el scroll.
 */
export function OpScope({ initial, children }: { initial: Op; children: ReactNode }) {
  const [op, setOpState] = useState<Op>(initial);
  const [swing, setSwing] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setOp(next: Op) {
    if (next === op) return;
    setOpState(next);
    setSwing((n) => n + 1);
    startTransition(() => router.replace(`/?op=${next}`, { scroll: false }));
  }

  return (
    <OpContext.Provider value={{ op, setOp, swing, pending }}>
      <div data-op={op} className="transition-colors">
        {children}
      </div>
    </OpContext.Provider>
  );
}

export function useOp() {
  return useContext(OpContext);
}

const VERBS: { op: Op; word: string }[] = [
  { op: "venta", word: "Vende" },
  { op: "alquiler", word: "Alquila" },
];

/** Alambre retorcido que ata la chapa a la baranda. */
function Wire({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 30 44" className={`absolute -top-[42px] h-[44px] w-[30px] ${side === "left" ? "left-3" : "right-3 -scale-x-100"}`} aria-hidden>
      <path d="M8 44 C 9 30, 18 22, 20 2" fill="none" stroke="#5b5e63" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 26 l6 -3 M13.6 20 l6 -3 M15.5 14 l5 -2.5" stroke="#5b5e63" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * El cartel que cuelga del balcón. El verbo es el selector de operación y,
 * donde iría el teléfono, está el buscador.
 */
export function CartelHero({ meta }: { meta: Meta }) {
  const { op, setOp, swing } = useOp();
  const cities = Array.from(new Set(meta.places.map((p) => p.city)));

  return (
    <section aria-labelledby="cartel-titulo" className="mx-auto max-w-[1440px] px-3 pt-[46px] sm:px-6">
      <div key={swing} className={`relative bg-op text-chapa transition-colors duration-300 ${swing ? "mecer" : ""}`} style={{ borderRadius: "var(--radius-chapa)" }}>
        <Wire side="left" />
        <Wire side="right" />
        <span className="remache top-3 left-3" />
        <span className="remache top-3 right-3" />
        <span className="remache bottom-3 left-3" />
        <span className="remache right-3 bottom-3" />

        <div className="flex flex-col gap-6 px-5 pt-8 pb-9 sm:px-10 sm:pt-9 sm:pb-7">
          <h1 id="cartel-titulo" className="sr-only">
            La Choza: casas, departamentos y galpones en venta y alquiler
          </h1>

          <div role="tablist" aria-label="Operación" className="-ml-1 flex flex-wrap items-end gap-x-[0.18em] text-[clamp(84px,13.4vw,212px)]">
            {VERBS.map((v, i) => {
              const active = op === v.op;
              return (
                <span key={v.op} className="flex items-end">
                  {i > 0 && (
                    <span aria-hidden className="cartel mr-[0.14em] text-chapa/45">
                      /
                    </span>
                  )}
                  <button
                    role="tab"
                    aria-selected={active}
                    aria-controls="recien-colgados"
                    onClick={() => setOp(v.op)}
                    className={`cartel cursor-pointer transition-[color,opacity] duration-200 ${active ? "text-chapa" : "text-transparent opacity-80 hover:opacity-100"}`}
                    style={active ? undefined : { WebkitTextStroke: "max(2px, 0.012em) var(--chapa)" }}
                  >
                    {v.word}
                  </button>
                </span>
              );
            })}
          </div>

          <p className="max-w-[44ch] text-[19px] leading-snug text-chapa sm:text-[21px]">
            {meta.counts[op]} propiedades {op === "venta" ? "en venta" : "en alquiler"}. Elegí una, tocá <strong className="font-extrabold">Me interesa</strong> y te escribimos por WhatsApp.
          </p>

          <SearchStrip key={op} op={op} meta={meta} />

          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-chapa/35 pt-4">
            <p className="rotulo text-[17px] tracking-[0.08em]">La Choza · casas, deptos y galpones</p>
            <p className="rotulo text-[15px] tracking-[0.08em] text-chapa/85">{cities.join(" · ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
