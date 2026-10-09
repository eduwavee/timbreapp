import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { API_URL, ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session";

/**
 * Reenvía cada llamada del navegador a Laravel con el token de la cookie httpOnly,
 * así el token nunca queda expuesto al JavaScript del cliente.
 */
async function forward(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: "Tu sesión terminó. Volvé a ingresar." }, { status: 401 });
  }

  const url = `${API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  const hasBody = !["GET", "HEAD"].includes(request.method);

  const res = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  if (res.status === 401) {
    store.delete(TOKEN_COOKIE);
    store.delete(ROLE_COOKIE);
  }

  const out = new Headers({ "Content-Type": res.headers.get("content-type") ?? "application/json" });
  const disposition = res.headers.get("content-disposition");
  if (disposition) {
    out.set("Content-Disposition", disposition);
  }
  // Los archivos privados (DNI, comprobantes) no quedan en caché del navegador.
  out.set("Cache-Control", "private, no-store");

  return new Response(res.body, { status: res.status, headers: out });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
