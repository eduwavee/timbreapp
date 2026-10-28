"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Un filtro que vive en la URL (?q=azc&orden=codigo): al entrar a una ficha y volver, la vista queda como estaba.
 * El valor por defecto no se escribe, así las direcciones quedan limpias.
 */
export function useUrlState<T extends string = string>(key: string, fallback: NoInfer<T>): [T, (value: T) => void] {
  const params = useSearchParams();
  const [value, setValue] = useState<T>(() => (params.get(key) as T | null) ?? fallback);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, next);
      window.history.replaceState(null, "", url.pathname + url.search);
    },
    [key, fallback],
  );

  return [value, set];
}
