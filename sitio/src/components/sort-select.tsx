"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23141414' stroke-width='2.4'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2">
      <span className="rotulo text-[14px] text-tinta-2">Ordenar</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          router.replace(`${pathname}?${next}`, { scroll: false });
        }}
        className="h-10 appearance-none border-2 border-tinta bg-chapa pr-9 pl-3 text-[15px] font-semibold"
        style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "16px" }}
      >
        <option value="recientes">Más nuevas</option>
        <option value="precio_asc">Más baratas</option>
        <option value="precio_desc">Más caras</option>
      </select>
    </label>
  );
}
