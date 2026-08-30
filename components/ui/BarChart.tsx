"use client";

import { useState } from "react";

type BarChartProps = {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
};

/** Barres arrondies SVG, tooltip au survol. */
export default function BarChart({
  data,
  labels,
  color = "#F97316",
  height = 200,
  formatValue = (v) => String(v),
  className,
}: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data) || 1;

  return (
    <div className={className}>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((v, i) => (
          <div
            key={i}
            className="group relative flex-1 cursor-default"
            style={{ height: "100%" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="absolute inset-x-0 bottom-0 rounded-lg bg-ink/[0.04]" style={{ height: "100%" }} />
            <div
              className="absolute inset-x-0 bottom-0 rounded-lg transition-all duration-500"
              style={{
                height: `${Math.max(4, (v / max) * 100)}%`,
                background: hover === i ? color : `${color}CC`,
              }}
            />
            {hover === i && (
              <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
                {formatValue(v)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 truncate text-center text-[10px] font-medium text-ink-mute">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
