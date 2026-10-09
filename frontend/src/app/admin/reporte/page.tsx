import { Suspense } from "react";
import { MonthReport } from "./month-report";

export default function Page() {
  return (
    <Suspense>
      <MonthReport />
    </Suspense>
  );
}
