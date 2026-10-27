import type { ListingSummary, Op, Operation } from "./types";

const int = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** USD 128.000 · $ 650.000 */
export function price(op: Pick<Operation, "currency" | "price">): string {
  if (op.price === null) return "Consultar";
  return op.currency === "USD" ? `USD ${int.format(op.price)}` : `$ ${int.format(op.price)}`;
}

export function pesos(value: number): string {
  return `$ ${int.format(value)}`;
}

export function number(value: number): string {
  return int.format(value);
}

export function operationFor(listing: ListingSummary, op: Op): Operation {
  return listing.operations.find((o) => o.value === op) ?? listing.operations[0];
}

/** "2 amb. · 48 m² · 1 baño" */
export function facts(l: ListingSummary): string[] {
  const out: string[] = [];
  if (l.rooms) out.push(l.rooms === 1 ? "Monoambiente" : `${l.rooms} amb.`);
  if (l.surface_m2) out.push(`${number(l.surface_m2)} m²`);
  if (l.bathrooms) out.push(l.bathrooms === 1 ? "1 baño" : `${l.bathrooms} baños`);
  if (l.garage) out.push("Cochera");
  return out;
}




export const VERB: Record<Op, string> = { venta: "Vende", alquiler: "Alquila" };
export const OP_LABEL: Record<Op, string> = { venta: "Venta", alquiler: "Alquiler" };

export function isOp(v: unknown): v is Op {
  return v === "venta" || v === "alquiler";
}

/** wa.me para un teléfono argentino: 549 + área + número. */
export function waLink(phone: string, text: string): string {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("54")) d = d.slice(2).replace(/^9/, "");
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === "15") {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  return `https://wa.me/549${d}?text=${encodeURIComponent(text)}`;
}
