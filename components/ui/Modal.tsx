"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IconX } from "@/components/icons";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizes = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export default function Modal({ open, onClose, title, subtitle, children, footer, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full animate-fade-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            {typeof title === "string" ? (
              <h3 className="text-base font-bold text-ink">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Fermer"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
