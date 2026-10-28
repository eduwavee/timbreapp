import { API_URL, DEMO_MODE, PROXY_HEADERS } from "@/lib/api";
import { demoListing } from "@/lib/demo";

/** En modo demo la consulta se valida como en Laravel, pero no se guarda: no hay Timbre detrás. */
function demoInquiry(slug: string, body: Record<string, unknown>) {
  if (!demoListing(slug)) {
    return Response.json({ message: "Esa propiedad ya no está publicada." }, { status: 404 });
  }
  const errors: Record<string, string[]> = {};
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  if (!text("name")) errors.name = ["Completá nombre."];
  if (!text("phone")) errors.phone = ["Completá WhatsApp."];
  else if (text("phone").replace(/\D/g, "").length < 8) errors.phone = ["Revisá WhatsApp: el formato no es válido."];
  if (text("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text("email"))) errors.email = ["Revisá email: no parece un email válido."];
  if (text("website")) return Response.json({ message: "No se pudo enviar la consulta." }, { status: 422 });
  if (Object.keys(errors).length) return Response.json({ message: Object.values(errors)[0][0], errors }, { status: 422 });
  return Response.json({ data: {} }, { status: 201 });
}

/**
 * Reenvía el "Me interesa" a Laravel desde el servidor: la URL de la API no queda
 * expuesta y la consulta cae directo en la bandeja de Timbre.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/consultas/[slug]">) {
  const { slug } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "No se pudo leer la consulta." }, { status: 400 });
  }
  if (DEMO_MODE) {
    return demoInquiry(slug, (body ?? {}) as Record<string, unknown>);
  }

  try {
    const res = await fetch(`${API_URL}/site/listings/${encodeURIComponent(slug)}/inquiries`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
        ...PROXY_HEADERS,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      return Response.json({ message: "Mandaste varias consultas seguidas. Esperá un minuto y probá de nuevo." }, { status: 429 });
    }
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ message: "No pudimos enviar la consulta. Probá de nuevo en un momento." }, { status: 502 });
  }
}
