export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** Primer error de un campo, para mostrarlo debajo del input. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      // Recarga completa a propósito: descarta el estado de una sesión vencida.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, "Tu sesión terminó. Volvé a ingresar.");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data?.message && !String(data.message).startsWith("SQLSTATE")
        ? data.message
        : res.status >= 500
          ? "Algo falló del lado del servidor. Probá de nuevo en un momento."
          : "No se pudo completar la operación.";
    throw new ApiError(res.status, message, data?.errors ?? {});
  }

  return data as T;
}
