"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cx } from "./ui";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "fade-in pointer-events-auto max-w-sm rounded-sm border px-4 py-2.5 text-sm font-medium shadow-[0_8px_24px_-8px_rgba(27,30,34,0.35)]",
              t.tone === "ok" ? "border-ink bg-ink text-white" : "border-debt bg-debt text-white",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
