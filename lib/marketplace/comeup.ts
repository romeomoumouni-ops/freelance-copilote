/* ============================================================
   Scraper ComeUp — lecture de données PUBLIQUES uniquement.
   ComeUp rend ses pages côté serveur : simple fetch + parsing,
   sans navigateur ni proxy. XOF est fixé à l'EUR (1 € = 655,957 XOF)
   donc les prix affichés en F CFA sont convertis exactement en EUR.
   ============================================================ */

import * as cheerio from "cheerio";
import { politeFetch, extractJsonLd } from "./http";
import type { Gig, GigListing, SellerProfile, Review } from "./types";

const BASE = "https://comeup.com";
const XOF_PER_EUR = 655.957;

/* -------------------- helpers -------------------- */

function abs(url: string): string {
  if (url.startsWith("http")) return url;
  return BASE + (url.startsWith("/") ? url : "/" + url);
}

function toNumber(s: string): number {
  return parseFloat(
    s
      .replace(/[  \s]/g, "")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(",", ".")
  );
}

/** Convertit un prix affiché (€ ou F CFA) en EUR. */
export function parsePriceToEUR(text: string): number | null {
  const cleaned = text.replace(/[  ]/g, " ");
  let m = cleaned.match(/([\d][\d\s.]*(?:,\d+)?)\s*€/);
  if (m) return Math.round(toNumber(m[1]) * 100) / 100;
  m = cleaned.match(/([\d][\d\s.]*(?:,\d+)?)\s*(?:F\s?CFA|FCFA|XOF)/i);
  if (m) return Math.round((toNumber(m[1]) / XOF_PER_EUR) * 100) / 100;
  return null;
}

function idFromUrl(url: string): string {
  const m = url.match(/\/service\/(\d+)\//);
  return m ? m[1] : url;
}

function deliveryFromText(text: string): number | null {
  const m =
    text.match(/[Ll]ivraison[^.]*?(\d+)\s*jours?/) || text.match(/(\d+)\s*jours?/);
  return m ? parseInt(m[1], 10) : null;
}

function responseFromText(text: string): string | null {
  const m = text.match(/[Rr][ée]ponse\s+sous\s+([^.<\n]+?)(?:\.|<|$)/);
  return m ? m[1].trim() : null;
}

/* -------------------- fiches détaillées -------------------- */

/** Lit une fiche service complète via le JSON-LD Product. */
export async function getGig(url: string): Promise<Gig> {
  const html = await politeFetch(abs(url));
  const blocks = extractJsonLd(html);
  const product = blocks.find((b) => b && b["@type"] === "Product");

  const $ = cheerio.load(html);
  const bodyText = $("body").text();

  let price = 0;
  let priceMax: number | null = null;
  let currency = "EUR";
  if (product?.offers) {
    const o = product.offers;
    const low = parseFloat(o.lowPrice ?? o.price ?? "0");
    const high = parseFloat(o.highPrice ?? o.lowPrice ?? o.price ?? "0");
    currency = o.priceCurrency ?? "EUR";
    price = currency === "EUR" ? low : Math.round((low / XOF_PER_EUR) * 100) / 100;
    priceMax =
      high && high !== low
        ? currency === "EUR"
          ? high
          : Math.round((high / XOF_PER_EUR) * 100) / 100
        : null;
    currency = "EUR";
  } else {
    const p = $('meta[property="product:price:amount"]').attr("content");
    price = p ? parseFloat(p) : parsePriceToEUR(bodyText) ?? 0;
  }

  const rating = product?.aggregateRating
    ? parseFloat(product.aggregateRating.ratingValue)
    : null;
  const reviews = product?.aggregateRating
    ? parseInt(product.aggregateRating.ratingCount ?? product.aggregateRating.reviewCount ?? "0", 10)
    : 0;

  // catégorie depuis le fil d'ariane
  const breadcrumb = blocks.find((b) => b && b["@type"] === "BreadcrumbList");
  let category: string | null = null;
  let categorySlug: string | null = null;
  if (breadcrumb?.itemListElement?.length) {
    const items = breadcrumb.itemListElement;
    const cat = items[items.length - 2] ?? items[items.length - 1];
    category = cat?.name ?? cat?.item?.name ?? null;
    const href = cat?.item?.["@id"] ?? cat?.item;
    if (typeof href === "string") {
      const sm = href.match(/\/category\/([^/]+)\//);
      categorySlug = sm ? sm[1] : null;
    }
  }

  const title =
    $('meta[property="og:title"]').attr("content")?.replace(/\s+par\s+\S+$/, "") ??
    product?.name ??
    $("h1").first().text().trim();

  // paliers d'offre (Pack 1, Pack 2…)
  const packs: { name: string; price: number | null }[] = [];
  for (const m of Array.from(html.matchAll(/Pack\s*\d\s*:\s*([^<(]{2,50}?)\s*(?:\(|<)/g))) {
    const name = m[1].trim().replace(/\s+/g, " ");
    if (name && !packs.some((p) => p.name === name)) packs.push({ name, price: null });
  }

  return {
    platform: "comeup",
    id: idFromUrl(abs(url)),
    url: abs(url),
    title: (title || "").trim(),
    seller: product?.brand?.name ?? "",
    sellerCountry: null,
    price,
    priceMax,
    currency,
    priceDisplay: price ? `À partir de ${Math.round(price)} €` : null,
    rating,
    reviews,
    deliveryDays: deliveryFromText(product?.description ?? bodyText),
    responseTime: responseFromText(product?.description ?? bodyText),
    description: product?.description ?? null,
    category,
    categorySlug,
    sponsored: false,
    image: Array.isArray(product?.image) ? product.image[0] : product?.image ?? null,
    packs,
    scrapedAt: new Date().toISOString(),
  };
}

/* -------------------- avis (review mining) -------------------- */

/** Extrait les avis clients publics d'une fiche service. */
export async function getGigReviews(url: string, max = 30): Promise<Review[]> {
  const html = await politeFetch(abs(url));
  return parseReviews(html, max);
}

export function parseReviews(html: string, max = 30): Review[] {
  const $ = cheerio.load(html);
  const out: Review[] = [];
  $(".review").each((_, el) => {
    if (out.length >= max) return;
    const raw = $(el).text().replace(/\s+/g, " ").trim();
    if (!raw) return;
    const isReply = /^Réponse de\s/i.test(raw);
    // date en fin de chaîne (ex "28 janv. 2026 à 06:59")
    const dateMatch = raw.match(/\d{1,2}\s+\w+\.?\s+\d{4}(?:\s+à\s+\d{1,2}:\d{2})?/);
    const date = dateMatch ? dateMatch[0] : null;
    let body = date ? raw.slice(0, raw.indexOf(date)).trim() : raw;
    // premier mot = pseudo auteur
    let author = "";
    if (isReply) {
      author = body.replace(/^Réponse de\s+/i, "").split(" ")[0] ?? "";
      body = body.replace(/^Réponse de\s+\S+\s*/i, "").trim();
    } else {
      const parts = body.split(" ");
      author = parts[0] ?? "";
      body = parts.slice(1).join(" ").trim();
    }
    if (body.length < 3) return;
    out.push({ author, text: body, date, isSellerReply: isReply });
  });
  return out;
}

/* -------------------- listings (recherche / catégorie) -------------------- */

/** Parse une page de listing en cartes de service (données rapides, sans fetch détaillé). */
export function parseListing(html: string): Gig[] {
  const $ = cheerio.load(html);
  const now = new Date().toISOString();
  const gigs: Gig[] = [];
  const seen = new Set<string>();

  $('a[data-ci="card-service-title"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href");
    if (!href) return;
    const url = abs(href);
    const id = idFromUrl(url);
    if (seen.has(id)) return;
    seen.add(id);

    const card = a.closest("li, article");
    const cardText = card.text().replace(/\s+/g, " ").trim();
    // le pays est porté par un ancêtre <li sellercountry="BJ"> (nom d'attribut mis en minuscules par le parseur)
    const country =
      a.closest("[sellercountry]").attr("sellercountry") ??
      card.find("[sellercountry]").attr("sellercountry") ??
      null;

    // note + avis affichés sur la carte, ex "4,9 (127)"
    let rating: number | null = null;
    let reviews = 0;
    const rm = cardText.match(/\b([0-5](?:[.,]\d)?)\s*\((\d[\d\s.]*)\)/);
    if (rm) {
      rating = parseFloat(rm[1].replace(",", "."));
      reviews = parseInt(rm[2].replace(/[\s.]/g, ""), 10);
    }

    gigs.push({
      platform: "comeup",
      id,
      url,
      title: a.text().replace(/\s+/g, " ").trim().replace(/^Je vais\s+/i, ""),
      seller: "",
      sellerCountry: country,
      price: parsePriceToEUR(cardText) ?? 0,
      priceMax: null,
      currency: "EUR",
      priceDisplay: (cardText.match(/À partir de[^•|]*(?:€|F\s?CFA)/) ?? [null])[0],
      rating,
      reviews,
      deliveryDays: null,
      responseTime: null,
      description: null,
      category: null,
      categorySlug: null,
      sponsored: /Sponsoris/i.test(cardText),
      image: card.find("img").first().attr("src") ?? null,
      packs: [],
      scrapedAt: now,
    });
  });

  return gigs;
}

async function fetchListing(path: string, pages: number): Promise<Gig[]> {
  const all: Gig[] = [];
  const seen = new Set<string>();
  for (let p = 1; p <= pages; p++) {
    const sep = path.includes("?") ? "&" : "?";
    const html = await politeFetch(`${BASE}${path}${sep}page=${p}`);
    const gigs = parseListing(html);
    if (gigs.length === 0) break;
    for (const g of gigs) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        all.push(g);
      }
    }
  }
  return all;
}

/** Recherche par mot-clé. */
export async function searchGigs(query: string, pages = 1): Promise<GigListing> {
  const gigs = await fetchListing(
    `/fr/search/services?search=${encodeURIComponent(query)}`,
    pages
  );
  return { platform: "comeup", query, gigs, scrapedAt: new Date().toISOString() };
}

/** Services d'une catégorie (slug ComeUp, ex "site-developpement"). */
export async function categoryGigs(slug: string, pages = 1): Promise<GigListing> {
  const gigs = await fetchListing(`/fr/category/${slug}/services`, pages);
  return { platform: "comeup", query: slug, gigs, scrapedAt: new Date().toISOString() };
}

/** Complète les notes/avis manquants en lisant les fiches détaillées (top N). */
export async function enrichGigs(gigs: Gig[], limit = 20): Promise<Gig[]> {
  const out = [...gigs];
  let done = 0;
  for (let i = 0; i < out.length && done < limit; i++) {
    if (out[i].reviews === 0 && out[i].rating === null) {
      try {
        const full = await getGig(out[i].url);
        out[i] = { ...out[i], ...full, sellerCountry: out[i].sellerCountry ?? full.sellerCountry };
        done++;
      } catch {
        /* on garde la carte telle quelle */
      }
    }
  }
  return out;
}

/* -------------------- profil vendeur -------------------- */

/** Extrait le pseudo d'une URL de profil ou de service ComeUp. */
export function usernameFromUrl(url: string): string | null {
  const at = url.match(/@([\w.-]+)/);
  if (at) return at[1];
  const u = url.match(/\/user\/([\w.-]+)/);
  if (u) return u[1];
  return null;
}

/** Lit la boutique publique d'un vendeur (/fr/@pseudo) : tous ses services + méta. */
async function readStorefront(username: string): Promise<{
  url: string;
  gigs: Gig[];
  displayName: string;
  totalReviews: number;
  level: string | null;
}> {
  const url = `${BASE}/fr/@${username}`;
  const html = await politeFetch(url);
  const $ = cheerio.load(html);
  const gigs = parseListing(html);
  const rawTitle = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
  const displayName = rawTitle.split("|")[0].trim() || username;
  const rm = rawTitle.match(/(\d[\d\s.]*)\s*avis/i);
  const totalReviews = rm
    ? parseInt(rm[1].replace(/[\s.]/g, ""), 10)
    : gigs.reduce((s, g) => s + g.reviews, 0);
  const lvl = html.match(/[Nn]iveau\s*\d|[Vv]endeur\s*[Pp]ro|[Tt]op\s*[Vv]endeur/);
  return { url, gigs, displayName, totalReviews, level: lvl ? lvl[0] : null };
}

/**
 * Lit un profil public : accepte une URL de boutique (@pseudo) OU de service.
 * On s'appuie sur la vraie page boutique /fr/@pseudo pour lister tous les services.
 */
export async function getSellerProfile(inputUrl: string): Promise<SellerProfile> {
  const url = abs(inputUrl.trim());
  const now = new Date().toISOString();

  // Cas 1 : URL de service → fiche complète (riche) + boutique du vendeur
  if (/\/service\/\d+\//.test(url)) {
    const gig = await getGig(url);
    const username = gig.seller || usernameFromUrl(url) || "";
    let gigs: Gig[] = [gig];
    let displayName = gig.seller || null;
    let totalReviews = gig.reviews;
    let level: string | null = null;
    let profileUrl = username ? `${BASE}/fr/@${username}` : url;
    if (username) {
      try {
        const shop = await readStorefront(username);
        gigs = [gig, ...shop.gigs.filter((g) => g.id !== gig.id)];
        displayName = shop.displayName;
        totalReviews = shop.totalReviews;
        level = shop.level;
        profileUrl = shop.url;
      } catch {
        /* on garde au moins la fiche lue */
      }
    }
    return {
      platform: "comeup",
      username,
      url: profileUrl,
      displayName,
      country: gig.sellerCountry,
      level,
      totalReviews,
      gigs,
      scrapedAt: now,
    };
  }

  // Cas 2 : URL de boutique (@pseudo) → lecture directe de la boutique
  const username = usernameFromUrl(url);
  if (username) {
    const shop = await readStorefront(username);
    // service phare en tête (le plus commenté) pour ancrer l'analyse/roast
    let gigs = [...shop.gigs].sort((a, b) => b.reviews - a.reviews);
    // enrichir le service en tête (fiche complète) pour l'analyse détaillée
    if (gigs[0]) {
      try {
        const full = await getGig(gigs[0].url);
        gigs = [full, ...gigs.slice(1)];
      } catch {
        /* garde la carte */
      }
    }
    return {
      platform: "comeup",
      username,
      url: shop.url,
      displayName: shop.displayName,
      country: gigs[0]?.sellerCountry ?? null,
      level: shop.level,
      totalReviews: shop.totalReviews,
      gigs,
      scrapedAt: now,
    };
  }

  // Repli : page inconnue → on parse ce qu'on peut
  const html = await politeFetch(url);
  const gigs = parseListing(html);
  return {
    platform: "comeup",
    username: "",
    url,
    displayName: usernameFromUrl(url),
    country: gigs[0]?.sellerCountry ?? null,
    level: null,
    totalReviews: gigs.reduce((s, g) => s + g.reviews, 0),
    gigs,
    scrapedAt: now,
  };
}
