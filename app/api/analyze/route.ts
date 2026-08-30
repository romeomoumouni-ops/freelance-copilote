import { NextResponse } from "next/server";
import { getSellerProfile } from "@/lib/marketplace/comeup";
import { getFiverrSeller, searchFiverrGigs, SourceUnconfiguredError } from "@/lib/marketplace/fiverr";
import { resolvePlatform, marketForProfile } from "@/lib/marketplace/resolve";
import { computeMarketStats } from "@/lib/marketplace/stats";
import { analyzeProfile } from "@/lib/analysis/engine";
import { cached, logAnalysis } from "@/lib/marketplace/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(url: string) {
  const platform = resolvePlatform(url);

  if (platform === "fiverr") {
    try {
      const listing = await getFiverrSeller(url);
      const profile = {
        platform: "fiverr" as const,
        username: listing.query,
        url,
        displayName: listing.gigs[0]?.seller ?? null,
        country: listing.gigs[0]?.sellerCountry ?? null,
        level: null,
        totalReviews: listing.gigs.reduce((s, g) => s + g.reviews, 0),
        gigs: listing.gigs,
        scrapedAt: listing.scrapedAt,
      };
      const mainTitle = listing.gigs[0]?.title ?? "services";
      const market = computeMarketStats(await searchFiverrGigs(mainTitle), "Fiverr");
      return { analysis: analyzeProfile(profile, market), status: "ok" as const };
    } catch (e) {
      if (e instanceof SourceUnconfiguredError) {
        return {
          analysis: null,
          status: "fiverr_unconfigured" as const,
          message:
            "Fiverr n'est pas encore connecté. Ajoutez une clé de scraping (FIVERR_APIFY_TOKEN) pour analyser les profils Fiverr. ComeUp fonctionne dès maintenant.",
        };
      }
      throw e;
    }
  }

  // ComeUp — données réelles en direct
  const profile = await getSellerProfile(url);
  if (!profile.gigs.length) {
    return {
      analysis: null,
      status: "empty" as const,
      message:
        "Aucun service public n'a pu être lu à cette adresse. Vérifiez qu'il s'agit bien d'un lien de profil ou de service ComeUp public.",
    };
  }
  const market = await marketForProfile(profile);
  const analysis = analyzeProfile(profile, market);
  // journal d'usage (Supabase si configuré, sinon no-op) — jamais bloquant
  void logAnalysis({
    url,
    username: profile.username,
    score: analysis.globalScore,
    marketLabel: market.label,
  });
  return { analysis, status: "ok" as const };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Lien manquant." }, { status: 400 });
    }
    const result = await cached(`analyze_${url}`, 30 * 60 * 1000, () => run(url.trim()));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "L'analyse a échoué : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
