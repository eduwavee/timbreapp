import { Suspense } from "react";
import { TenantDetail } from "./tenant-detail";

export default function Page() {
  return (
    <Suspense>
      <TenantDetail />
    </Suspense>
  );
}
