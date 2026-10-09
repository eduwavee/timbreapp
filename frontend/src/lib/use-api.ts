"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

type Result<T> = { key: string; data: T | null; error: ApiError | null };

/**
 * Carga un endpoint y lo vuelve a pedir al cambiar la ruta o al llamar reload().
 */
export function useApi<T>(path: string | null) {
  const [result, setResult] = useState<Result<T>>({ key: "", data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const key = `${path}#${nonce}`;

  useEffect(() => {
    if (path === null) return;
    let alive = true;
    api<T>(path)
      .then((data) => alive && setResult({ key, data, error: null }))
      .catch((e) => alive && setResult((r) => ({ key, data: r.data, error: e instanceof ApiError ? e : new ApiError(0, "No hay conexión con el servidor.") })));
    return () => {
      alive = false;
    };
  }, [path, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((fn: (d: T | null) => T | null) => setResult((r) => ({ ...r, data: fn(r.data) })), []);

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: path !== null && result.key !== key,
    reload,
    setData,
  };
}
