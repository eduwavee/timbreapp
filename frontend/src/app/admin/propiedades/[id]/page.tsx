import { Suspense } from "react";
import { PropertyDetail } from "./property-detail";

export default function Page() {
  return (
    <Suspense>
      <PropertyDetail />
    </Suspense>
  );
}
