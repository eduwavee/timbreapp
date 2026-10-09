import { Suspense } from "react";
import { TicketsBoard } from "./tickets-board";

export default function Page() {
  return (
    <Suspense>
      <TicketsBoard />
    </Suspense>
  );
}
