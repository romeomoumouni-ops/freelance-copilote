/* ============================================================
   Modèle de données normalisé — commun à ComeUp et Fiverr.
   TOUT le SaaS raisonne sur ces types, jamais sur du HTML brut.
   ============================================================ */

export type Platform = "comeup" | "fiverr";

/** Un service (gig) tel que lu publiquement sur une plateforme. */
export interface Gig {
  platform: Platform;
  id: string; // identifiant plateforme (ex: "1044")
  url: string; // URL publique absolue
  title: string;
  seller: string; // pseudo / nom du vendeur
  sellerCountry: string | null; // code pays ISO si disponible (ex: "BJ")
  price: number; // prix canonique en EUR (min si plusieurs offres)
  priceMax: number | null; // prix max si fourchette
  currency: string; // "EUR"
  priceDisplay: string | null; // tel qu'affiché ("À partir de 350 €")
  rating: number | null; // note moyenne 0–5
  reviews: number; // nombre d'avis (proxy de volume de ventes)
  deliveryDays: number | null; // délai de livraison
  responseTime: string | null; // ex: "3 heures"
  description: string | null;
  category: string | null;
  categorySlug: string | null;
  sponsored: boolean;
  image: string | null;
  packs: { name: string; price: number | null }[]; // paliers d'offre (Pack 1, Pack 2…)
  scrapedAt: string; // ISO
}

/** Un avis client public tel que lu sur une fiche. */
export interface Review {
  author: string;
  text: string;
  date: string | null;
  isSellerReply: boolean;
}

/** Profil public d'un vendeur + tous ses services lisibles. */
export interface SellerProfile {
  platform: Platform;
  username: string;
  url: string;
  displayName: string | null;
  country: string | null;
  level: string | null; // niveau/badge vendeur si disponible
  totalReviews: number; // total d'avis affiché sur la boutique
  gigs: Gig[];
  scrapedAt: string;
}

/** Synthèse des avis (review mining) d'un service. */
export interface ReviewInsights {
  count: number; // avis clients analysés (hors réponses vendeur)
  praises: { theme: string; count: number }[]; // ce que les clients apprécient
  complaints: { theme: string; count: number }[]; // points faibles récurrents
  samples: Review[]; // quelques avis représentatifs
}

/** Statistiques d'un marché (une catégorie / un mot-clé sur une plateforme). */
export interface MarketStats {
  platform: Platform;
  query: string; // catégorie ou mot-clé analysé
  label: string; // libellé lisible
  sampleSize: number;
  price: { avg: number; median: number; min: number; max: number };
  ratingAvg: number;
  reviews: { avg: number; median: number; max: number; total: number };
  /** Saturation heuristique 0–100 (offre abondante + avis concentrés = saturé). */
  saturation: number;
  /** Demande heuristique 0–100 (volume d'avis cumulés = preuve d'achats). */
  demand: number;
  /** Opportunité 0–100 = demande forte / saturation faible. */
  opportunity: number;
  topGigs: Gig[]; // meilleurs services (par avis)
  countries: { code: string; share: number }[]; // répartition pays des vendeurs
  scrapedAt: string;
}

/** Résultat d'une recherche/catégorie paginée. */
export interface GigListing {
  platform: Platform;
  query: string;
  gigs: Gig[];
  scrapedAt: string;
}

/** Statut d'une source de données (pour l'UI : réel / non configuré / erreur). */
export interface SourceStatus {
  platform: Platform;
  available: boolean;
  mode: "live" | "provider" | "unconfigured" | "error";
  message: string;
}
