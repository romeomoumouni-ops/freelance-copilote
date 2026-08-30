"use client";

import { useState } from "react";

type LineChartProps = {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
};

/** Courbe SVG responsive avec aire dégradée, grille discrète et tooltip au survol. */
export default function LineChart({
  data,
  labels,
  color = "#F97316",
  height = 220,
  formatValue = (v) => String(v),
  className,
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * (W - padX * 2);
    const y = padTop + (1 - (v - min) / range) * (H - padTop - padBottom);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - padBottom} L${pts[0][0].toFixed(1)},${H - padBottom} Z`;
  const gid = `lc-${color.replace("#", "")}`;

  const step = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((x - padX) / (W - padX * 2)) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={W - padX}
            y1={padTop + t * (H - padTop - padBottom)}
            y2={padTop + t * (H - padTop - padBottom)}
            stroke="#EFEDE7"
            strokeDasharray="3 5"
          />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <line
            x1={pts[hover][0]}
            x2={pts[hover][0]}
            y1={padTop}
            y2={H - padBottom}
            stroke={color}
            strokeOpacity="0.25"
          />
        )}
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hover === i ? 5 : i === pts.length - 1 ? 4 : 0}
            fill="#fff"
            stroke={color}
            strokeWidth="2.5"
          />
        ))}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text
              key={i}
              x={pts[i][0]}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#8B8798"
              fontFamily="inherit"
            >
              {l}
            </text>
          ) : null
        )}
      </svg>
      <div className="mt-1 flex h-6 items-center justify-center">
        {hover !== null ? (
          <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">
            {labels[hover]} · {formatValue(data[hover])}
          </span>
        ) : (
          <span className="text-[11px] text-ink-mute">Survolez la courbe pour le détail</span>
        )}
      </div>
    </div>
  );
}
