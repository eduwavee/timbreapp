import { Suspense } from "react";
import { ContractDetail } from "./contract-detail";

export default function Page() {
  return (
    <Suspense>
      <ContractDetail />
    </Suspense>
  );
}
