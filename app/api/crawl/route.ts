import { NextResponse } from "next/server";
import { categories } from "@/lib/marketplace/categories";
import { categoryGigs } from "@/lib/marketplace/comeup";
import { computeMarketStats } from "@/lib/marketplace/stats";
import { cacheSet, appendSnapshot } from "@/lib/marketplace/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Rafraîchit les statistiques de toutes les catégories couvertes et
   enregistre un snapshot (→ historique réel dans le temps).
   Cible d'un cron (Vercel Cron / GitHub Action). Protégé par CRAWL_SECRET. */
export async function POST(req: Request) {
  const secret = process.env.CRAWL_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const done: string[] = [];
  const failed: string[] = [];
  for (const c of categories) {
    try {
      const listing = await categoryGigs(c.slug, 1);
      const stats = computeMarketStats(listing, c.label);
      await cacheSet(`market_cat_${c.slug}`, stats);
      await appendSnapshot(`market_${c.slug}`, {
        priceMedian: stats.price.median,
        ratingAvg: stats.ratingAvg,
        demand: stats.demand,
        saturation: stats.saturation,
        opportunity: stats.opportunity,
        totalReviews: stats.reviews.total,
        sampleSize: stats.sampleSize,
      });
      done.push(c.slug);
    } catch {
      failed.push(c.slug);
    }
  }
  return NextResponse.json({ refreshed: done.length, failed, at: new Date().toISOString() });
}

export async function GET(req: Request) {
  return POST(req);
}
