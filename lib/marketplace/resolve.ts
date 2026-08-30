/* Résolution : quelle plateforme, quel marché pour un profil donné. */

import type { MarketStats, SellerProfile } from "./types";
import type { Platform } from "./types";
import { categories, categoryBySlug, type CategoryDef } from "./categories";
import { categoryGigs, searchGigs } from "./comeup";
import { computeMarketStats } from "./stats";
import { cached } from "./store";

export function resolvePlatform(url: string): Platform {
  return /fiverr\.com/i.test(url) ? "fiverr" : "comeup";
}

const HINTS: [RegExp, string][] = [
  // termes spécifiques d'abord ; "e-commerce"/"boutique" seuls ne suffisent pas
  // (ils apparaissent dans des titres de sites vitrines génériques)
  [/\b(shopify|woocommerce|dropshipping|prestashop)\b/i, "shopify"],
  [/\bwordpress\b/i, "wordpress"],
  [/\b(bug|erreur|corrig|réparer|reparer|debug)\b/i, "correction-de-bugs"],
  [/\b(site|web|vitrine|internet|landing|elementor|divi|e-?commerce)\b/i, "site-developpement"],
  [/\blogo\b/i, "logos"],
  [/\b(miniature|banniere|bannière|thumbnail)\b/i, "miniatures-et-bannieres"],
  [/\b(design|graphisme|flyer|affiche|maquette|figma|carte de visite)\b/i, "design-graphisme"],
  [/\b(voix.?off|voiceover)\b/i, "voix-off"],
  [/\bugc\b/i, "videos-et-photos-ugc"],
  [/\b(montage|vidéo|video|youtube|reels?)\b/i, "montage-video"],
  [/\b(seo|backlink|référencement|referencement)\b/i, "creation-de-backlinks"],
  [/\b(mailing|email|e-mail|newsletter|klaviyo)\b/i, "e-mailing"],
  [/\b(pub|publicit|ads)\b/i, "campagnes-publicitaires"],
  [/\b(réseaux|reseaux|instagram|tiktok|community)\b/i, "reseaux-sociaux"],
  [/\b(marketing|tunnel|funnel|systeme)\b/i, "marketing-digital"],
];

export function pickCategoryForTitle(title: string): CategoryDef | null {
  for (const [re, slug] of HINTS) {
    if (re.test(title)) return categoryBySlug(slug) ?? null;
  }
  return null;
}

/** Statistiques de marché d'une catégorie (cachées 6 h). */
export async function marketStatsForCategory(slug: string): Promise<MarketStats> {
  const def = categoryBySlug(slug);
  const label = def?.label ?? slug;
  return cached(`market_cat_${slug}`, 6 * 60 * 60 * 1000, async () => {
    const listing = await categoryGigs(slug, 1);
    return computeMarketStats(listing, label);
  });
}

/** Statistiques de marché pour un mot-clé libre (cachées 6 h). */
export async function marketStatsForQuery(query: string): Promise<MarketStats> {
  return cached(`market_q_${query}`, 6 * 60 * 60 * 1000, async () => {
    const listing = await searchGigs(query, 1);
    return computeMarketStats(listing, query);
  });
}

/** Le marché le plus pertinent pour un profil.
    On s'ancre sur le service principal (gigs[0] = le service collé si un lien
    de service précis a été fourni ; sinon le service en tête du profil). */
export async function marketForProfile(profile: SellerProfile): Promise<MarketStats> {
  const main = profile.gigs[0] ?? [...profile.gigs].sort((a, b) => b.reviews - a.reviews)[0];
  const title = main?.title ?? "";
  const cat = pickCategoryForTitle(title);
  if (cat) return marketStatsForCategory(cat.slug);
  // repli : recherche par les 3 premiers mots significatifs du titre
  const q =
    title
      .toLowerCase()
      .replace(/[^a-zàâäéèêëïîôöùûüç0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join(" ") || "création site web";
  return marketStatsForQuery(q);
}

export { categories };
