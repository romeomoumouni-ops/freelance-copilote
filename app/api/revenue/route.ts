import { NextResponse } from "next/server";
import { getSellerProfile } from "@/lib/marketplace/comeup";
import { estimateRevenue } from "@/lib/analysis/revenue";
import { cached } from "@/lib/marketplace/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/revenue?url=<lien ComeUp (profil ou service)>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Paramètre url requis." }, { status: 400 });

  try {
    const data = await cached(`revenue_${url}`, 30 * 60 * 1000, async () => {
      const profile = await getSellerProfile(url.trim());
      if (!profile.gigs.length) {
        return { ok: false as const, message: "Aucun service public lisible à cette adresse." };
      }
      const estimate = estimateRevenue(profile.gigs, profile.displayName);
      return {
        ok: true as const,
        seller: profile.displayName,
        username: profile.username,
        url: profile.url,
        services: profile.gigs.length,
        totalReviewsShop: profile.totalReviews,
        estimate,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Estimation impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
