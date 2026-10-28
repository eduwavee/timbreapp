"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { ars, periodo } from "@/lib/format";
import type { AdjustmentSuggestion } from "@/lib/types";

function when(days: number) {
  if (days < 0) return `venció hace ${-days} ${days === -1 ? "día" : "días"}`;
  if (days === 0) return "toca hoy";
  return `toca en ${days} ${days === 1 ? "día" : "días"}`;
}

/** Un ajuste ICL o IPC ya calculado, listo para aplicar con un clic. */
export function AdjustmentCard({ suggestion: s, onApplied, showContract }: { suggestion: AdjustmentSuggestion; onApplied: () => void; showContract?: boolean }) {
  const [applying, setApplying] = useState(false);
  const toast = useToast();
  const pct = s.percentage?.toLocaleString("es-AR", { maximumFractionDigits: 2 });

  async function apply() {
    setApplying(true);
    try {
      await api(`contracts/${s.contract_id}/adjust`, { method: "POST", body: { new_amount: s.new_amount, from_period: s.from_period, basis: s.basis } });
      toast(`${s.property.code}: alquiler ajustado a ${ars(s.new_amount, { short: true })} desde ${periodo(s.from_period).toLowerCase()}`);
      onApplied();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {showContract && (
        <p className="text-sm">
          <Link href={`/admin/contratos/${s.contract_id}`} className="font-bold hover:underline">
            {s.property.code}
          </Link>{" "}
          <span className="text-ink-2">· {s.tenant.name}</span>
        </p>
      )}
      <p className={cx("text-[13px]", s.days < 0 ? "font-semibold text-debt" : "text-ink-2")}>
        Ajuste {s.index} cada {s.every_months} meses · {when(s.days)} · desde {periodo(s.from_period).toLowerCase()}
      </p>
      {s.ready ? (
        <>
          <p className="num text-[15px]">
            {ars(s.previous_amount, { short: true })} <ArrowRight className="inline size-3.5" aria-label="pasa a" /> <strong>{ars(s.new_amount, { short: true })}</strong> <span className="text-ink-2">(+{pct} %)</span>
          </p>
          <p className="text-[12.5px] text-ink-3">
            {s.basis}
            {s.provisional && " · Provisorio: todavía no salió el índice de esa fecha y se usó el último publicado."}
          </p>
          <div>
            <Button size="sm" variant="primary" loading={applying} onClick={apply}>
              Aplicar +{pct} %
            </Button>
          </div>
        </>
      ) : (
        <p className="text-[13px] text-ink-3">Faltan los valores del {s.index} para calcularlo. Timbre los trae solo todos los días a las 05:30.</p>
      )}
    </div>
  );
}
