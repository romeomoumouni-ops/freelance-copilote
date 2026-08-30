import { NextResponse } from "next/server";
import { categories } from "@/lib/marketplace/categories";
import { marketStatsForCategory, marketStatsForQuery } from "@/lib/marketplace/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  try {
    if (category) {
      return NextResponse.json({ market: await marketStatsForCategory(category) });
    }
    if (q) {
      return NextResponse.json({ market: await marketStatsForQuery(q) });
    }
    // sans paramètre : liste des catégories couvertes
    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json(
      { error: "Lecture du marché impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
