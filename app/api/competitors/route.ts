import { NextResponse } from "next/server";
import { marketStatsForCategory, marketStatsForQuery, pickCategoryForTitle } from "@/lib/marketplace/resolve";
import { getSellerProfile } from "@/lib/marketplace/comeup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET ?category=slug  |  ?q=motclé  |  ?url=profil (→ concurrents du service phare)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const url = searchParams.get("url");

  try {
    let market;
    if (category) market = await marketStatsForCategory(category);
    else if (q) market = await marketStatsForQuery(q);
    else if (url) {
      const profile = await getSellerProfile(url);
      const main = [...profile.gigs].sort((a, b) => b.reviews - a.reviews)[0];
      const cat = main ? pickCategoryForTitle(main.title) : null;
      market = cat
        ? await marketStatsForCategory(cat.slug)
        : await marketStatsForQuery((main?.title ?? "").split(/\s+/).slice(0, 3).join(" "));
    } else {
      return NextResponse.json({ error: "Paramètre requis : category, q ou url." }, { status: 400 });
    }
    return NextResponse.json({ market, competitors: market.topGigs });
  } catch (e) {
    return NextResponse.json(
      { error: "Lecture des concurrents impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
