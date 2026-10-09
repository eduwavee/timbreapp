import { cookies } from "next/headers";
import { API_URL, ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return Response.json(data, { status: res.status });
  }

  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 30;
  store.set(TOKEN_COOKIE, data.token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
  store.set(ROLE_COOKIE, data.user.role, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });

  return Response.json({ user: data.user });
}
