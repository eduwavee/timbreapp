import { Suspense } from "react";
import { PortalTickets } from "./portal-tickets";

export default function Page() {
  return (
    <Suspense>
      <PortalTickets />
    </Suspense>
  );
}
