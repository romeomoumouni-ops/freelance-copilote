import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeTone = "violet" | "green" | "orange" | "red" | "gray" | "dark" | "blue";

const tones: Record<BadgeTone, string> = {
  violet: "bg-primary-50 text-primary-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  gray: "bg-ink/5 text-ink-soft",
  dark: "bg-ink text-white",
  blue: "bg-sky-50 text-sky-700",
};

export default function Badge({
  tone = "gray",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Badge d'impact prêt à l'emploi */
export function ImpactBadge({ impact }: { impact: "Élevé" | "Moyen" | "Faible" }) {
  const tone: BadgeTone = impact === "Élevé" ? "orange" : impact === "Moyen" ? "violet" : "gray";
  return <Badge tone={tone}>Impact {impact.toLowerCase()}</Badge>;
}
