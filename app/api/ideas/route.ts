import { NextResponse } from "next/server";
import { categories } from "@/lib/marketplace/categories";
import { marketStatsForCategory } from "@/lib/marketplace/resolve";
import { computeServiceIdeas } from "@/lib/analysis/ideas";
import { cached } from "@/lib/marketplace/store";
import type { MarketStats } from "@/lib/marketplace/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// On échantillonne un sous-ensemble de catégories (rotation) pour rester rapide
// et respectueux. Les stats sont mises en cache 6 h par marketStatsForCategory.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(6, Math.max(1, parseInt(searchParams.get("count") || "3", 10)));

  try {
    const ideas = await cached("ideas_v1", 3 * 60 * 60 * 1000, async () => {
      const pool = categories.slice(0, 8); // niches principales
      const stats: MarketStats[] = [];
      for (const c of pool) {
        try {
          stats.push(await marketStatsForCategory(c.slug));
        } catch {
          /* on continue si une catégorie échoue */
        }
      }
      return computeServiceIdeas(stats, 6);
    });
    return NextResponse.json({ ideas: ideas.slice(0, count) });
  } catch (e) {
    return NextResponse.json(
      { error: "Génération des idées impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
