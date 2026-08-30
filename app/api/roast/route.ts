import { NextResponse } from "next/server";
import { getSellerProfile } from "@/lib/marketplace/comeup";
import { marketForProfile } from "@/lib/marketplace/resolve";
import { analyzeProfile } from "@/lib/analysis/engine";
import { generateRoast } from "@/lib/analysis/roast";
import { cached } from "@/lib/marketplace/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/roast?url=<lien de service/profil ComeUp>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Paramètre url requis." }, { status: 400 });

  try {
    const data = await cached(`roast_${url}`, 30 * 60 * 1000, async () => {
      const profile = await getSellerProfile(url.trim());
      if (!profile.gigs.length) {
        return { ok: false as const, message: "Aucun service public lisible à cette adresse." };
      }
      const market = await marketForProfile(profile);
      const analysis = analyzeProfile(profile, market);
      return {
        ok: true as const,
        seller: profile.displayName,
        service: analysis.mainGig?.title ?? null,
        market: market.label,
        roast: generateRoast(analysis),
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Analyse impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
