"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { Arrow } from "./arrow";

const boton = "flex size-11 items-center justify-center border border-tinta transition-colors hover:bg-tinta hover:text-hueso";
const pad = (n: number) => String(n).padStart(2, "0");

/** Foto grande a todo el ancho, tira de miniaturas y visor a pantalla completa con flechas del teclado. */
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
      <div className="dato flex aspect-[16/9] items-center justify-center bg-hueso-2 text-tinta-3">Todavía no hay fotos de esta propiedad</div>
    );
  }

  const current = photos[index];

  return (
    <div>
      <div className="relative overflow-hidden bg-hueso-2">
        <button type="button" onClick={() => viewer.current?.showModal()} className="block w-full cursor-zoom-in" aria-label="Ver foto en grande">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.caption ?? `${title}, foto ${index + 1}`} className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]" />
        </button>
        {reserved && <span className="dato pointer-events-none absolute top-4 left-4 bg-tinta px-3 py-2 text-hueso">Reservada</span>}
      </div>
      {count > 1 && (
        <div className="mt-3 flex items-center gap-4">
          <ul className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label="Miniaturas">
            {photos.map((p, i) => (
              <li key={p.url} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index}
                  aria-label={`Foto ${i + 1}`}
                  className={`block h-14 w-20 overflow-hidden transition-opacity sm:h-16 sm:w-24 ${i === index ? "outline outline-1 outline-offset-2 outline-tinta" : "opacity-55 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <span className="dato hidden text-tinta-2 sm:inline">
            {pad(index + 1)} / {pad(count)}
          </span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => go(-1)} className={boton} aria-label="Foto anterior">
              <Arrow className="size-4" direction="left" />
            </button>
            <button type="button" onClick={() => go(1)} className={boton} aria-label="Foto siguiente">
              <Arrow className="size-4" />
            </button>
          </div>
        </div>
      )}

      <dialog ref={viewer} onClick={(e) => e.target === viewer.current && viewer.current?.close()} className="m-auto max-h-dvh max-w-[min(1400px,calc(100%-24px))] bg-transparent p-0 backdrop:bg-[#111110]/95" aria-label="Fotos en grande">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption ?? title} className="max-h-[84dvh] w-auto object-contain" />
        <div className="dato mt-3 flex items-center gap-2 text-hueso">
          <button type="button" onClick={() => go(-1)} className="flex size-11 items-center justify-center border border-hueso hover:bg-hueso hover:text-tinta" aria-label="Foto anterior">
            <Arrow className="size-4" direction="left" />
          </button>
          <button type="button" onClick={() => go(1)} className="flex size-11 items-center justify-center border border-hueso hover:bg-hueso hover:text-tinta" aria-label="Foto siguiente">
            <Arrow className="size-4" />
          </button>
          <span className="px-3">
            {pad(index + 1)} / {pad(count)}
          </span>
          <button type="button" onClick={() => viewer.current?.close()} className="link-dato ml-auto py-2">
            Cerrar
          </button>
        </div>
      </dialog>
    </div>
  );
}
