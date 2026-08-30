/* Estimation de revenu : le cœur du "Revenu X-Ray".
   Principe honnête : le nombre d'avis est un proxy des commandes livrées.
   Toutes les commandes ne laissent pas d'avis (≈ 60 % le font sur les
   marketplaces), donc commandes estimées ≈ avis / 0,6. Revenu ≈ commandes
   × prix. C'est une ESTIMATION (comme estimer les gains d'un YouTubeur
   à partir des vues publiques) : toujours présentée comme telle. */

import type { Gig } from "@/lib/marketplace/types";

const REVIEW_RATE = 0.6; // part des acheteurs qui laissent un avis (hypothèse)

export interface GigRevenue {
  title: string;
  url: string;
  reviews: number;
  price: number;
  estimatedOrders: number;
  revenue: number;
}

export interface RevenueEstimate {
  seller: string | null;
  totalReviews: number;
  avgPrice: number;
  estimatedOrders: number;
  totalRevenue: number; // EUR
  topGig: GigRevenue | null;
  perGig: GigRevenue[];
  reviewRate: number;
  note: string;
}

export function estimateRevenue(gigs: Gig[], seller: string | null = null): RevenueEstimate {
  const perGig: GigRevenue[] = gigs
    .map((g) => {
      const price = g.price > 0 ? g.price : 0;
      const orders = Math.round(g.reviews / REVIEW_RATE);
      return {
        title: g.title,
        url: g.url,
        reviews: g.reviews,
        price,
        estimatedOrders: orders,
        revenue: Math.round(orders * price),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalReviews = gigs.reduce((s, g) => s + g.reviews, 0);
  const priced = gigs.map((g) => g.price).filter((p) => p > 0);
  const avgPrice = priced.length ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length) : 0;
  const estimatedOrders = Math.round(totalReviews / REVIEW_RATE);
  const totalRevenue = perGig.reduce((s, g) => s + g.revenue, 0);

  return {
    seller,
    totalReviews,
    avgPrice,
    estimatedOrders,
    totalRevenue,
    topGig: perGig[0] ?? null,
    perGig,
    reviewRate: REVIEW_RATE,
    note: "Estimation basée sur les avis publics (proxy des commandes) et les prix affichés. Toutes les commandes ne laissent pas d'avis : le chiffre réel peut différer.",
  };
}

/** Formate un montant en euros de façon lisible (ex: "≈ 14 200 €", "≈ 32 k€"). */
export function formatRevenue(n: number): string {
  if (n >= 100000) return `≈ ${Math.round(n / 1000)} k€`;
  return `≈ ${new Intl.NumberFormat("fr-FR").format(Math.round(n / 10) * 10)} €`;
}
