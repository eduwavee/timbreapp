import { Suspense } from "react";
import { ContractsList } from "./contracts-list";

export default function Page() {
  return (
    <Suspense>
      <ContractsList />
    </Suspense>
  );
}
