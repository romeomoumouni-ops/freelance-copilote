"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck, IconSparkles, IconAlert } from "@/components/icons";
import type { ReactNode } from "react";

type ToastKind = "success" | "info" | "warning";
type ToastItem = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-pop"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
              {t.kind === "success" && <IconCheck size={12} />}
              {t.kind === "info" && <IconSparkles size={12} />}
              {t.kind === "warning" && <IconAlert size={12} />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
