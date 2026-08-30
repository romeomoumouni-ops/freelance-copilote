import { cn, scoreColor } from "@/lib/utils";

export default function Progress({
  value,
  color,
  className,
  height = 6,
}: {
  value: number; // 0–100
  color?: string;
  className?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-ink/[0.06]", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${clamped}%`, background: color ?? scoreColor(clamped) }}
      />
    </div>
  );
}
