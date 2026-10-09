import { Suspense } from "react";
import { PaymentsView } from "./payments-view";

export default function Page() {
  return (
    <Suspense>
      <PaymentsView />
    </Suspense>
  );
}
