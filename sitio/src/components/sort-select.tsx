"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111110' stroke-width='1.6'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-3">
      <span className="dato text-tinta-3">Ordenar</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          router.replace(`${pathname}?${next}`, { scroll: false });
        }}
        className="dato h-9 appearance-none rounded-none border-0 border-b border-tinta bg-transparent pr-6 text-[13px] text-tinta outline-none"
        style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center", backgroundSize: "14px" }}
      >
        <option value="recientes">Más nuevas</option>
        <option value="precio_asc">Más baratas</option>
        <option value="precio_desc">Más caras</option>
      </select>
    </label>
  );
}
