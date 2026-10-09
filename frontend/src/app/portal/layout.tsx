import { Suspense } from "react";
import { PortalShell } from "@/components/portal-shell";

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <Suspense fallback={<div className="h-[94px] bg-rail" />}>
      <PortalShell>
        <Suspense fallback={<div className="skeleton h-72" aria-label="Cargando" />}>{children}</Suspense>
      </PortalShell>
    </Suspense>
  );
}
