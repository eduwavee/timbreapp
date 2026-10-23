import { Suspense } from "react";
import { InquiriesBoard } from "./inquiries-board";

export default function Page() {
  return (
    <Suspense>
      <InquiriesBoard />
    </Suspense>
  );
}
