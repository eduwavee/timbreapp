import { Suspense } from "react";
import { ExpensesView } from "./expenses-view";

export default function Page() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}
