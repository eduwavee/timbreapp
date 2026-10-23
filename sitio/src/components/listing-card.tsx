import Link from "next/link";
import { facts, operationFor, price } from "@/lib/format";
import type { ListingSummary, Op } from "@/lib/types";

/**
 * Una propiedad como chapita: la foto arriba y, abajo, la franja del cartel
 * con el verbo y el precio en el color de la operación.
 */
export function ListingCard({ listing, op, priority }: { listing: ListingSummary; op: Op; priority?: boolean }) {
  const operation = operationFor(listing, op);
  const both = listing.operations.length > 1;

  return (
    <Link
      href={`/propiedades/${listing.slug}?op=${operation.value}`}
      data-op={operation.value}
      className="group relative flex flex-col border-2 border-tinta bg-chapa transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-tinta bg-chapa-2">
        {listing.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover.url}
            alt={listing.cover.caption ?? listing.headline}
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-tinta-3">
            <span className="rotulo">Sin fotos todavía</span>
          </div>
        )}
        {listing.reserved && (
          <span className="faja absolute top-1/2 left-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] py-1.5 text-[34px]">Reservado</span>
        )}
        {listing.photo_count > 1 && <span className="rotulo absolute right-2 bottom-2 bg-tinta px-2 py-1 text-[12px] text-chapa">{listing.photo_count} fotos</span>}
      </div>
      <div className="flex items-baseline justify-between gap-3 bg-op px-4 pt-2.5 pb-2 text-chapa">
        <span className="cartel text-[34px]">{operation.verb}</span>
        <span className="cartel text-right text-[34px]">{price(operation)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3 pb-4">
        <h3 className="text-[17px] leading-snug font-bold text-balance">{listing.headline}</h3>
        <p className="text-[14.5px] text-tinta-2">{facts(listing).join(" · ")}</p>
        <p className="mt-auto pt-1 text-[14px] text-tinta-3">
          <span className="font-semibold text-tinta">{listing.place}</span> · {listing.address_hint}
        </p>
        {both && <p className="rotulo pt-1 text-[12.5px] text-tinta-2">También en {operation.value === "venta" ? "alquiler" : "venta"}</p>}
      </div>
    </Link>
  );
}
