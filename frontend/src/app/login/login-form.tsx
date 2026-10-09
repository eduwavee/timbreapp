"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Field, FormError, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [admitted, setAdmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.errors?.email?.[0] ?? data?.message ?? "No pudimos iniciar sesión.");
        setLoading(false);
        return;
      }
      const home = data.user.role === "inquilino" ? "/portal" : "/admin";
      const next = params.get("next");
      // El sello cae y recién después se abre la puerta.
      setAdmitted(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => router.replace(next && next.startsWith(home) ? next : home), reduced ? 0 : 650);
    } catch {
      setError("No hay conexión con el servidor. Revisá que la API esté encendida.");
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <header className="mb-7 border-b-[3px] border-double border-ink pb-4">
        <h2 className="text-[30px] leading-tight font-bold tracking-[-0.02em]">Tocá timbre</h2>
        <p className="mt-1 text-ink-2">Administración e inquilinos entran por la misma puerta.</p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={loading}>
        <FormError message={error} />
        <Field label="Email">
          {(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus disabled={admitted} />}
        </Field>
        <Field label="Contraseña">
          {(id) => <Input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={admitted} />}
        </Field>
        <Button type="submit" variant="primary" loading={loading && !admitted} disabled={admitted} className="group mt-2 h-12 w-full justify-between px-4 text-[15px]">
          <span>Ingresar</span>
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Button>
      </form>

      {admitted && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
          <span className="stamp stamp-land bg-paper/70 px-4 py-1 text-[34px]">Adelante</span>
        </div>
      )}

      <p className="mt-8 border-t border-rule pt-4 text-[13px] text-ink-3">
        Demo: <span className="font-semibold text-ink-2">admin@timbre.test</span> o <span className="font-semibold text-ink-2">juan@timbre.test</span>, contraseña <span className="font-semibold text-ink-2">timbre2026</span>.
      </p>
    </div>
  );
}
