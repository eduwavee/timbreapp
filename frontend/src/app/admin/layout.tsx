import { Suspense } from "react";
import { AdminShell } from "@/components/admin-shell";

function Loading() {
  return <div className="skeleton h-72" aria-label="Cargando" />;
}

/** Marco estático mientras llega la sesión: el rail y el papel, sin datos. */
function ShellFallback() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <div className="hidden bg-rail lg:block" />
      <div className="h-14 bg-rail lg:hidden" />
      <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <Loading />
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Todo el panel depende de la sesión, la ruta y la fecha de hoy: se arma en cada visita.
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminShell>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </AdminShell>
    </Suspense>
  );
}
