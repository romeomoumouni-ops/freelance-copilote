"use client";

import { cn } from "@/lib/utils";

export type Tab = { key: string; label: string; count?: number };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: "pill" | "segment";
  className?: string;
};

export default function Tabs({ tabs, active, onChange, variant = "pill", className }: TabsProps) {
  if (variant === "segment") {
    return (
      <div className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1", className)}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all",
              active === t.key ? "bg-ink text-white shadow-sm" : "text-ink-mute hover:text-ink"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  active === t.key ? "bg-white/20 text-white" : "bg-ink/5 text-ink-mute"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-full items-center gap-1 overflow-x-auto", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
            active === t.key
              ? "bg-primary-300 text-ink shadow-[0_6px_16px_-6px_rgba(202,138,4,0.4)]"
              : "text-ink-mute hover:bg-ink/5 hover:text-ink"
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                active === t.key ? "bg-white/25 text-white" : "bg-ink/5 text-ink-mute"
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
