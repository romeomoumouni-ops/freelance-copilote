import Card from "@/components/ui/Card";
import Sparkline from "@/components/ui/Sparkline";
import { IconArrowUpRight, IconArrowDownRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  /** ex: "+12 %" — préfixé du bon signe */
  delta?: string;
  deltaPositive?: boolean;
  deltaLabel?: string;
  icon?: ReactNode;
  spark?: number[];
  sparkColor?: string;
};

export default function StatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  deltaLabel = "vs période précédente",
  icon,
  spark,
  sparkColor = "#F97316",
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                {icon}
              </span>
            )}
            <p className="text-[13px] font-medium leading-tight text-ink-mute">{label}</p>
          </div>
          <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-ink">{value}</p>
          {delta && (
            <p className="mt-2.5 flex items-center gap-1 text-xs font-medium text-ink-mute">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  deltaPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                )}
              >
                {deltaPositive ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}
                {delta}
              </span>
              <span className="hidden sm:inline">{deltaLabel}</span>
            </p>
          )}
        </div>
        {spark && <Sparkline data={spark} width={88} height={40} color={sparkColor} className="mt-1 shrink-0" />}
      </div>
    </Card>
  );
}
