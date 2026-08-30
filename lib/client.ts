/* Couche client : appels typés aux routes API réelles.
   Import de TYPES uniquement depuis les modules serveur (effacés au build). */

import type { Gig, MarketStats, SourceStatus, Review, ReviewInsights } from "@/lib/marketplace/types";
import type { ProfileAnalysis } from "@/lib/analysis/engine";
import type { ServiceIdea } from "@/lib/analysis/ideas";
import type { CategoryDef } from "@/lib/marketplace/categories";
import type { RevenueEstimate } from "@/lib/analysis/revenue";
import type { Roast } from "@/lib/analysis/roast";
import type { RentableService, Formation } from "@/lib/formations";

export type {
  Gig,
  MarketStats,
  ProfileAnalysis,
  ServiceIdea,
  CategoryDef,
  SourceStatus,
  Review,
  ReviewInsights,
  RevenueEstimate,
  Roast,
  RentableService,
  Formation,
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as T;
}

export type AnalyzeResult =
  | { analysis: ProfileAnalysis; status: "ok" }
  | { analysis: null; status: "fiverr_unconfigured" | "empty"; message: string };

export function analyzeProfile(url: string): Promise<AnalyzeResult> {
  return jsonFetch<AnalyzeResult>("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function getStatus(): Promise<{ sources: SourceStatus[]; ai: boolean }> {
  return jsonFetch("/api/status");
}

export function getCategories(): Promise<{ categories: CategoryDef[] }> {
  return jsonFetch("/api/market");
}

export function getMarket(opts: { category?: string; q?: string }): Promise<{ market: MarketStats }> {
  const p = new URLSearchParams();
  if (opts.category) p.set("category", opts.category);
  if (opts.q) p.set("q", opts.q);
  return jsonFetch(`/api/market?${p.toString()}`);
}

export function getIdeas(count = 3): Promise<{ ideas: ServiceIdea[] }> {
  return jsonFetch(`/api/ideas?count=${count}`);
}

export function getReviews(url: string): Promise<{ reviews: Review[]; insights: ReviewInsights }> {
  return jsonFetch(`/api/reviews?url=${encodeURIComponent(url)}`);
}

export type RevenueResult =
  | {
      ok: true;
      seller: string | null;
      username: string;
      url: string;
      services: number;
      totalReviewsShop: number;
      estimate: RevenueEstimate;
    }
  | { ok: false; message: string };

export function getRevenue(url: string): Promise<RevenueResult> {
  return jsonFetch(`/api/revenue?url=${encodeURIComponent(url)}`);
}

export type RoastResult =
  | { ok: true; seller: string | null; service: string | null; market: string; roast: Roast }
  | { ok: false; message: string };

export function getRoast(url: string): Promise<RoastResult> {
  return jsonFetch(`/api/roast?url=${encodeURIComponent(url)}`);
}

export type RentableIdea = { service: RentableService; formation: Formation; market: MarketStats | null };

export function getRentableIdeas(): Promise<{ ideas: RentableIdea[] }> {
  return jsonFetch(`/api/rentable-ideas`);
}

export function getCompetitors(opts: { category?: string; q?: string; url?: string }): Promise<{
  market: MarketStats;
  competitors: Gig[];
}> {
  const p = new URLSearchParams();
  if (opts.category) p.set("category", opts.category);
  if (opts.q) p.set("q", opts.q);
  if (opts.url) p.set("url", opts.url);
  return jsonFetch(`/api/competitors?${p.toString()}`);
}

export function generate(
  body:
    | { kind: "reply"; message: string; tone: string; context?: Record<string, unknown> }
    | { kind: "description"; url?: string; title?: string }
): Promise<{ text: string; source: "ia" | "template" }> {
  return jsonFetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
