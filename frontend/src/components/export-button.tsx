"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button, cx } from "@/components/ui";

export type ExportColumn<T> = {
  label: string;
  type?: "text" | "money" | "number";
  value: (row: T) => string | number | null | undefined;
};

/** "Excel de esta vista": baja exactamente las filas que se ven, con la búsqueda y los filtros aplicados. */
export function ExportButton<T>({ title, columns, rows, className }: { title: string; columns: ExportColumn<T>[]; rows: T[]; className?: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/backend/exports/table", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title,
          columns: columns.map(({ label, type }) => ({ label, type: type ?? "text" })),
          rows: rows.map((row) => columns.map((c) => c.value(row) ?? null)),
        }),
      });
      if (!res.ok) throw new Error("No se pudo armar el Excel. Probá de nuevo en un momento.");
      const name = /filename="?([^";]+)"?/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "timbre.xlsx";
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" onClick={download} loading={busy} disabled={rows.length === 0} className={cx("no-print", className)} title={`Bajar las ${rows.length} filas que se ven`}>
      <FileSpreadsheet className="size-4" aria-hidden /> Excel de esta vista
    </Button>
  );
}
