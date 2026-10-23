"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { Arrow } from "./arrow";

/** Foto grande, tira de miniaturas y visor a pantalla completa con flechas del teclado. */
export function Gallery({ photos, title, reserved }: { photos: Photo[]; title: string; reserved: boolean }) {
  const [index, setIndex] = useState(0);
  const viewer = useRef<HTMLDialogElement>(null);
  const count = photos.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    const d = viewer.current;
    if (!d) return;
    function onKey(e: KeyboardEvent) {
      if (!d?.open) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center border-2 border-tinta bg-chapa-2">
        <p className="rotulo text-tinta-3">Todavía no hay fotos de esta propiedad</p>
      </div>
    );
  }

  const current = photos[index];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden border-2 border-tinta bg-tinta">
        <button type="button" onClick={() => viewer.current?.showModal()} className="block w-full cursor-zoom-in" aria-label="Ver foto en grande">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.caption ?? `${title}, foto ${index + 1}`} className="aspect-[16/10] w-full object-cover" />
        </button>
        {reserved && <span className="faja pointer-events-none absolute top-1/2 left-1/2 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] py-2 text-[clamp(40px,6vw,76px)]">Reservado</span>}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 flex size-12 -translate-y-1/2 items-center justify-center border-2 border-tinta bg-chapa text-tinta transition-colors hover:bg-faja" aria-label="Foto anterior">
              <Arrow className="size-6" direction="left" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 flex size-12 -translate-y-1/2 items-center justify-center border-2 border-tinta bg-chapa text-tinta transition-colors hover:bg-faja" aria-label="Foto siguiente">
              <Arrow className="size-6" />
            </button>
            <span className="rotulo absolute bottom-3 left-3 bg-tinta px-2 py-1 text-[13px] text-chapa">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Miniaturas">
          {photos.map((p, i) => (
            <li key={p.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                aria-label={`Foto ${i + 1}`}
                className={`block size-20 overflow-hidden border-2 sm:h-20 sm:w-28 ${i === index ? "border-op" : "border-tinta/30 hover:border-tinta"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={viewer} onClick={(e) => e.target === viewer.current && viewer.current?.close()} className="m-auto max-h-dvh max-w-[min(1400px,calc(100%-24px))] bg-transparent p-0 backdrop:bg-tinta/90" aria-label="Fotos en grande">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption ?? title} className="max-h-[84dvh] w-auto object-contain" />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} className="flex size-11 items-center justify-center border-2 border-chapa text-chapa hover:bg-chapa hover:text-tinta" aria-label="Foto anterior">
            <Arrow className="size-5" direction="left" />
          </button>
          <span className="rotulo text-[15px] text-chapa">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => go(1)} className="flex size-11 items-center justify-center border-2 border-chapa text-chapa hover:bg-chapa hover:text-tinta" aria-label="Foto siguiente">
            <Arrow className="size-5" />
          </button>
          <button type="button" onClick={() => viewer.current?.close()} className="rotulo ml-auto h-11 border-2 border-chapa px-4 text-[15px] text-chapa hover:bg-chapa hover:text-tinta">
            Cerrar
          </button>
        </div>
      </dialog>
    </div>
  );
}
