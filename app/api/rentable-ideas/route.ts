import { NextResponse } from "next/server";
import { rentableServices, formationForService } from "@/lib/formations";
import { marketStatsForCategory, marketStatsForQuery } from "@/lib/marketplace/resolve";
import { cached } from "@/lib/marketplace/store";
import type { MarketStats } from "@/lib/marketplace/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Idées de services RENTABLES : chaque service + son marché réel + sa formation.
export async function GET() {
  try {
    const ideas = await cached("rentable_ideas_v1", 3 * 60 * 60 * 1000, async () => {
      const out = [];
      for (const service of rentableServices) {
        let market: MarketStats | null = null;
        try {
          market =
            service.market.kind === "category"
              ? await marketStatsForCategory(service.market.value)
              : await marketStatsForQuery(service.market.value);
        } catch {
          market = null;
        }
        out.push({ service, formation: formationForService(service.key) ?? null, market });
      }
      return out;
    });
    return NextResponse.json({ ideas });
  } catch (e) {
    return NextResponse.json(
      { error: "Chargement impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
