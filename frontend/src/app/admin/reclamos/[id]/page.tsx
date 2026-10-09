import { Suspense } from "react";
import { TicketDetail } from "./ticket-detail";

export default function Page() {
  return (
    <Suspense>
      <TicketDetail />
    </Suspense>
  );
}
