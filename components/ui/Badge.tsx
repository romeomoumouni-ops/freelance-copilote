import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeTone = "violet" | "green" | "orange" | "red" | "gray" | "dark" | "blue";

const tones: Record<BadgeTone, string> = {
  violet: "bg-primary-200 text-[#6B4E00]",
  green: "bg-emerald-100 text-emerald-800",
  orange: "bg-amber-200 text-amber-900",
  red: "bg-red-200 text-red-800",
  gray: "bg-ink/10 text-ink-soft",
  dark: "bg-ink text-white",
  blue: "bg-sky-100 text-sky-800",
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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-[0.04em]",
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
