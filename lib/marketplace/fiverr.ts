/* ============================================================
   Adaptateur Fiverr.
   Fiverr n'a pas d'API publique ET protège ses pages (Cloudflare +
   PerimeterX) → un simple fetch ne suffit pas. On passe par un
   fournisseur de scraping (Apify / Bright Data) via une clé.
   Tant que la clé n'est pas configurée, l'app reste honnête :
   elle indique "Fiverr non connecté" au lieu d'inventer des données.
   ============================================================ */

import type { Gig, GigListing, SourceStatus } from "./types";
import { cached } from "./store";

export class SourceUnconfiguredError extends Error {
  constructor(public platform: "fiverr") {
    super("Source non configurée : " + platform);
  }
}

const TOKEN = process.env.FIVERR_APIFY_TOKEN || "";
// Actor Apify de scraping Fiverr (configurable). Voir apify.com (ex: "botflowtech/fiverr-gig-seller-scraper").
const ACTOR = process.env.FIVERR_APIFY_ACTOR || "botflowtech~fiverr-gig-seller-scraper";

export function getFiverrStatus(): SourceStatus {
  if (!TOKEN) {
    return {
      platform: "fiverr",
      available: false,
      mode: "unconfigured",
      message:
        "Fiverr nécessite une clé de scraping (Apify ou Bright Data). Ajoutez FIVERR_APIFY_TOKEN pour activer les données Fiverr.",
    };
  }
  return {
    platform: "fiverr",
    available: true,
    mode: "provider",
    message: "Fiverr connecté via fournisseur de scraping.",
  };
}

/** Convertit un item renvoyé par l'actor Apify en Gig normalisé.
    Les noms de champs varient selon l'actor → mapping défensif. */
function mapItem(x: any): Gig | null {
  if (!x) return null;
  const url = x.url || x.gigUrl || x.link || "";
  const priceRaw = x.price ?? x.packages?.[0]?.price ?? x.startingPrice ?? 0;
  const price = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw).replace(/[^\d.]/g, "")) || 0;
  return {
    platform: "fiverr",
    id: String(x.id ?? x.gigId ?? url),
    url,
    title: x.title ?? x.gigTitle ?? "",
    seller: x.seller ?? x.sellerName ?? x.username ?? "",
    sellerCountry: x.sellerCountry ?? x.country ?? null,
    price, // souvent déjà en USD ; conversion possible côté affichage
    priceMax: x.maxPrice ?? null,
    currency: x.currency ?? "USD",
    priceDisplay: x.priceText ?? null,
    rating: x.rating != null ? Number(x.rating) : null,
    reviews: Number(x.reviews ?? x.reviewsCount ?? x.ratingCount ?? 0),
    deliveryDays: x.deliveryDays ?? null,
    responseTime: x.responseTime ?? null,
    description: x.description ?? null,
    category: x.category ?? null,
    categorySlug: null,
    sponsored: Boolean(x.promoted ?? x.sponsored ?? false),
    image: x.image ?? x.thumbnail ?? null,
    packs: [],
    scrapedAt: new Date().toISOString(),
  };
}

async function runActor(input: Record<string, unknown>): Promise<Gig[]> {
  const endpoint = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}`);
  const items = (await res.json()) as any[];
  return items.map(mapItem).filter((g): g is Gig => !!g && !!g.title);
}

/** Recherche Fiverr par mot-clé (via fournisseur). */
export async function searchFiverrGigs(query: string, limit = 24): Promise<GigListing> {
  if (!TOKEN) throw new SourceUnconfiguredError("fiverr");
  const gigs = await cached(`fiverr_search_${query}_${limit}`, 12 * 60 * 60 * 1000, () =>
    runActor({ search: query, maxItems: limit })
  );
  return { platform: "fiverr", query, gigs, scrapedAt: new Date().toISOString() };
}

/** Profil vendeur Fiverr (via fournisseur). */
export async function getFiverrSeller(usernameOrUrl: string): Promise<GigListing> {
  if (!TOKEN) throw new SourceUnconfiguredError("fiverr");
  const gigs = await cached(`fiverr_seller_${usernameOrUrl}`, 12 * 60 * 60 * 1000, () =>
    runActor({ seller: usernameOrUrl, maxItems: 24 })
  );
  return { platform: "fiverr", query: usernameOrUrl, gigs, scrapedAt: new Date().toISOString() };
}
