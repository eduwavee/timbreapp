const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyShort = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

/** $ 1.234.567,89 */
export function ars(value: number | null | undefined, opts: { short?: boolean } = {}): string {
  const v = value ?? 0;
  return (opts.short ? moneyShort : money).format(v).replace(/ /g, " ");
}

export function arsCompact(value: number): string {
  return `$ ${compact.format(value)}`;
}

function parse(date: string): Date {
  return new Date(date.length === 10 ? `${date}T12:00:00` : date);
}

/** 09/10/2026 */
export function fecha(date: string | null | undefined): string {
  if (!date) return "—";
  return parse(date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** 9 oct */
export function fechaCorta(date: string | null | undefined): string {
  if (!date) return "—";
  return parse(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "");
}

/** Octubre 2026 */
export function periodo(date: string): string {
  const s = parse(date.length === 7 ? `${date}-01` : date).toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(" de ", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** hace 3 días */
export function hace(date: string | null | undefined): string {
  if (!date) return "—";
  const diff = Date.now() - parse(date).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return fecha(date);
}

/** true si pasó hace menos de 24 h. */
export function esReciente(date: string): boolean {
  return Date.now() - parse(date).getTime() < 86_400_000;
}

/** "Agregado hace 5 min" o "Editado ayer". */
export function ultimoCambio(item: { created_at: string; updated_at: string }): string {
  const edited = parse(item.updated_at).getTime() - parse(item.created_at).getTime() > 60_000;
  return `${edited ? "Editado" : "Agregado"} ${hace(item.updated_at)}`;
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriod(p: string, months: number): string {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
