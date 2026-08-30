"use client";

import { cn } from "@/lib/utils";
import { IconChevronDown } from "@/components/icons";

type Option = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("relative inline-block", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-sm font-medium text-ink outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute"
      />
    </div>
  );
}
