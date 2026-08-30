import { scoreColor } from "@/lib/utils";

type ScoreRingProps = {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  /** Texte sous le chiffre (ex: "/100") */
  suffix?: string;
  color?: string;
  className?: string;
};

export default function ScoreRing({
  value,
  size = 72,
  stroke = 7,
  suffix,
  color,
  className,
}: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  const col = color ?? scoreColor(clamped);

  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#EFEDE7"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none text-ink"
          style={{ fontSize: size / 3.4 }}
        >
          {clamped}
        </span>
        {suffix && (
          <span className="text-ink-mute font-medium" style={{ fontSize: size / 7.5 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
