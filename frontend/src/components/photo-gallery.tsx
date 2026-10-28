"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Photo } from "@/lib/types";
import { useToast } from "./toast";
import { Button, cx } from "./ui";

/**
 * Fotos de la unidad: la primera es la portada. Se suben varias a la vez y se ven en grande.
 */
export function PhotoGallery({ propertyId, photos, onChanged }: { propertyId: number; photos: Photo[]; onChanged: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [uploading, setUploading] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const toast = useToast();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const body = new FormData();
    Array.from(files).forEach((f) => body.append("photos[]", f));
    try {
      await api(`properties/${propertyId}/photos`, { method: "POST", body });
      toast(files.length === 1 ? "Foto agregada" : `${files.length} fotos agregadas`);
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function open(i: number) {
    setIndex(i);
    viewer.current?.showModal();
  }

  async function remove(photo: Photo) {
    if (!window.confirm("¿Borrar esta foto?")) return;
    await api(`property-photos/${photo.id}`, { method: "DELETE" });
    viewer.current?.close();
    onChanged();
  }

  async function makeCover(photo: Photo) {
    await api(`property-photos/${photo.id}`, { method: "PATCH", body: { cover: true } });
    toast("Portada actualizada");
    viewer.current?.close();
    onChanged();
  }

  const current = index !== null ? photos[index] : null;

  return (
    <>
      {photos.length === 0 ? (
        <button
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-rule-strong bg-sheet px-6 py-10 text-center transition-colors hover:border-ink"
        >
          <ImagePlus className="size-6 text-ink-3" aria-hidden />
          <span className="font-semibold">{uploading ? "Subiendo…" : "Agregar fotos de la unidad"}</span>
          <span className="max-w-sm text-[13px] text-ink-2">Fachada, ambientes y estado de entrega. Sirven para los reclamos y son las que se ven en Brunito si la publicás.</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => open(i)} className={cx("group relative overflow-hidden rounded-sm border border-rule bg-paper", i === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? `Foto ${i + 1}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              {i === 0 && <span className="absolute top-2 left-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">Portada</span>}
            </button>
          ))}
          <button onClick={() => input.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-rule-strong text-[13px] font-semibold text-ink-2 hover:border-ink hover:text-ink">
            <ImagePlus className="size-5" aria-hidden />
            {uploading ? "Subiendo…" : "Agregar"}
          </button>
        </div>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />

      <dialog ref={viewer} onClose={() => setIndex(null)} onClick={(e) => e.target === viewer.current && viewer.current?.close()} className="m-auto max-h-dvh max-w-[min(1100px,calc(100%-32px))] bg-transparent p-0 backdrop:bg-[#1b1e22]/85" aria-label="Foto ampliada">
        {current && index !== null && (
          <div className="fade-in relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.caption ?? "Foto de la unidad"} className="max-h-[80dvh] rounded-sm object-contain" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" className="w-8 px-0" onClick={() => setIndex((index - 1 + photos.length) % photos.length)} aria-label="Anterior" disabled={photos.length < 2}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="num text-[13px] text-white/80">
                {index + 1} de {photos.length}
              </span>
              <Button size="sm" variant="secondary" className="w-8 px-0" onClick={() => setIndex((index + 1) % photos.length)} aria-label="Siguiente" disabled={photos.length < 2}>
                <ChevronRight className="size-4" />
              </Button>
              <span className="flex-1" />
              {index !== 0 && (
                <Button size="sm" variant="secondary" onClick={() => makeCover(current)}>
                  <Star className="size-4" /> Usar de portada
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => remove(current)}>
                <Trash2 className="size-4" /> Borrar
              </Button>
              <Button size="sm" variant="secondary" className="w-8 px-0" onClick={() => viewer.current?.close()} aria-label="Cerrar">
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
