export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/** "+12 %" / "−3 %" avec signe typographique correct */
export function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n)} %`;
}

/** Couleur de score : vert ≥ 80, violet ≥ 60, orange ≥ 40, rouge sinon */
export function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#CA8A04";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export function scoreTextClass(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-primary-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon, à optimiser";
  if (score >= 40) return "Insuffisant";
  return "Critique";
}
