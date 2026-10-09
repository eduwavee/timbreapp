import { cookies } from "next/headers";
import { API_URL, ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session";

export async function POST() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (token) {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => null);
  }
  store.delete(TOKEN_COOKIE);
  store.delete(ROLE_COOKIE);

  return Response.json({ ok: true });
}
