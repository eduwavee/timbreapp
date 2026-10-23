import { API_URL } from "@/lib/api";

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

  try {
    const res = await fetch(`${API_URL}/site/listings/${encodeURIComponent(slug)}/inquiries`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
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
