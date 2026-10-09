import type { Metadata } from "next";
import { Suspense } from "react";
import { TimbreMark } from "@/components/ui";
import { Intercom } from "./intercom";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* El portero eléctrico: cada unidad, un timbre. Suena para los dos lados. */}
      <section className="relative overflow-hidden bg-rail text-rail-ink">
        <div className="flex h-full flex-col gap-8 px-6 pt-7 pb-8 sm:px-10 lg:justify-between lg:px-14 lg:py-12">
          <header className="flex items-end justify-between gap-6">
            <h1 className="flex items-center gap-3 lg:gap-5">
              <TimbreMark className="size-10 shrink-0 text-rail-ink lg:size-16" />
              <span className="text-[44px] leading-none font-extrabold tracking-[-0.035em] sm:text-[56px] lg:text-[88px]" style={{ fontStretch: "112%" }}>
                Timbre
              </span>
            </h1>
          </header>

          <Intercom />

          <p className="hidden max-w-md text-[17px] leading-snug text-rail-ink-2 lg:block">
            El inquilino toca timbre cuando algo se rompe. Vos tocás timbre cuando se atrasa. <span className="text-rail-ink">Todo pasa por acá.</span>
          </p>
        </div>
      </section>

      <section className="flex flex-col justify-center bg-paper px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-[380px]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
