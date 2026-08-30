/* Calcul de statistiques de marché à partir de services réels.
   Tout est déterministe et calculé sur de la vraie donnée scrapée.
   Les indices (saturation / demande / opportunité) sont des ESTIMATIONS
   heuristiques, présentées comme telles dans l'UI. */

import type { Gig, GigListing, MarketStats } from "./types";

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Échelle log normalisée : maps 0→0 et `full`→100. */
function logScale(value: number, full: number): number {
  if (value <= 0) return 0;
  return clamp((Math.log10(value + 1) / Math.log10(full + 1)) * 100);
}

export function computeMarketStats(listing: GigListing, label: string): MarketStats {
  const gigs = listing.gigs;
  const priced = gigs.map((g) => g.price).filter((p) => p > 0);
  const rated = gigs.map((g) => g.rating).filter((r): r is number => r != null && r > 0);
  const reviews = gigs.map((g) => g.reviews);
  const totalReviews = reviews.reduce((a, b) => a + b, 0);

  // demande : volume d'avis cumulés = preuve d'achats réels
  const demand = Math.round(logScale(totalReviews, 40000));
  // saturation : les vendeurs médians sont-ils déjà bien établis ? (dur à déloger)
  const saturation = Math.round(clamp(logScale(median(reviews), 300) * 0.7 + (gigs.length / 50) * 30));
  // opportunité : forte demande + encore de la place
  const opportunity = Math.round(clamp(demand * 0.6 + (100 - saturation) * 0.4));

  // répartition pays des vendeurs
  const countByCode: Record<string, number> = {};
  let known = 0;
  for (const g of gigs) {
    if (g.sellerCountry) {
      countByCode[g.sellerCountry] = (countByCode[g.sellerCountry] || 0) + 1;
      known++;
    }
  }
  const countries = Object.entries(countByCode)
    .map(([code, n]) => ({ code, share: Math.round((n / (known || 1)) * 100) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 6);

  const topGigs = [...gigs].sort((a, b) => b.reviews - a.reviews).slice(0, 8);

  return {
    platform: listing.platform,
    query: listing.query,
    label,
    sampleSize: gigs.length,
    price: {
      avg: Math.round(avg(priced)),
      median: Math.round(median(priced)),
      min: priced.length ? Math.round(Math.min(...priced)) : 0,
      max: priced.length ? Math.round(Math.max(...priced)) : 0,
    },
    ratingAvg: Math.round(avg(rated) * 10) / 10,
    reviews: {
      avg: Math.round(avg(reviews)),
      median: Math.round(median(reviews)),
      max: reviews.length ? Math.max(...reviews) : 0,
      total: totalReviews,
    },
    saturation,
    demand,
    opportunity,
    topGigs,
    countries,
    scrapedAt: listing.scrapedAt,
  };
}

/** Percentile (0–100) d'une valeur dans une distribution. */
export function percentileOf(value: number, dist: number[]): number {
  if (!dist.length) return 50;
  const below = dist.filter((d) => d < value).length;
  return Math.round((below / dist.length) * 100);
}

/** Mots-clés les plus fréquents dans une liste de titres (pour l'analyse SEO). */
const STOPWORDS = new Set([
  "je","vais","votre","vos","un","une","des","de","du","le","la","les","et","ou","à","au","aux",
  "pour","avec","sur","en","par","vous","votre","dans","site","créer","faire","réaliser","sera",
  "your","will","for","with","the","and","a","to","of","i",
]);

export function topKeywords(titles: string[], limit = 12): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const t of titles) {
    const words = t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const uniq = Array.from(new Set(words));
    for (const w of uniq) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
