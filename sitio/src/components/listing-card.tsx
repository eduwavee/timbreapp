import Link from "next/link";
import { facts, OP_LABEL, operationFor, price } from "@/lib/format";
import type { ListingSummary, Op } from "@/lib/types";

/**
 * Una propiedad: la foto grande y, abajo, barrio y operación en mono,
 * el precio, el título y los datos. Sin marcos ni sombras.
 */
export function ListingCard({ listing, op, priority }: { listing: ListingSummary; op: Op; priority?: boolean }) {
  const operation = operationFor(listing, op);
  const other = listing.operations.find((o) => o.value !== operation.value);

  return (
    <Link href={`/propiedades/${listing.slug}?op=${operation.value}`} className="group flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-hueso-2">
        {listing.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.cover.url} alt={listing.cover.caption ?? listing.headline} loading={priority ? "eager" : "lazy"} className="foto size-full object-cover" />
        ) : (
          <div className="dato flex size-full items-center justify-center text-tinta-3">Sin fotos todavía</div>
        )}
        {listing.reserved && <span className="dato absolute top-3 left-3 bg-tinta px-2.5 py-1.5 text-hueso">Reservada</span>}
        {listing.photo_count > 1 && <span className="dato absolute right-3 bottom-3 bg-hueso px-2 py-1 text-[12px]">{listing.photo_count} fotos</span>}
      </div>
      <div className="flex flex-1 flex-col border-b border-filete pt-4 pb-5">
        <div className="dato flex items-baseline justify-between gap-3 text-tinta-2">
          <span>
            {listing.place} · {OP_LABEL[operation.value]}
          </span>
          <span className="shrink-0">{listing.type.label}</span>
        </div>
        <p className="titulo mt-3 text-[28px] tracking-[-0.03em]">{price(operation)}</p>
        <h3 className="mt-2 text-[17px] leading-snug font-medium text-balance">{listing.headline}</h3>
        <p className="dato mt-3 text-tinta-2">
          {facts(listing).join(" · ")}
          {other && <span className="block pt-1">También en {other.value}: {price(other)}</span>}
        </p>
      </div>
    </Link>
  );
}
