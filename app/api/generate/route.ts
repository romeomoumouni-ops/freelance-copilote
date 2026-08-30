import { NextResponse } from "next/server";
import { generateDescription, generateReply, type ReplyTone } from "@/lib/ai/generate";
import { getGig } from "@/lib/marketplace/comeup";
import { marketStatsForCategory, marketStatsForQuery, pickCategoryForTitle } from "@/lib/marketplace/resolve";
import { topKeywords } from "@/lib/marketplace/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = body.kind as "description" | "reply";

    if (kind === "reply") {
      const { message, tone, context } = body as {
        message: string;
        tone: ReplyTone;
        context?: { seller?: string; price?: number; deliveryDays?: number | null };
      };
      const result = await generateReply(message ?? "", tone ?? "Professionnelle", context);
      return NextResponse.json(result);
    }

    if (kind === "description") {
      // On peut fournir soit une URL de service, soit un titre + contexte
      const { url, title } = body as { url?: string; title?: string };
      const gig = url
        ? await getGig(url)
        : {
            platform: "comeup" as const,
            id: "",
            url: "",
            title: title ?? "votre service",
            seller: "",
            sellerCountry: null,
            price: 0,
            priceMax: null,
            currency: "EUR",
            priceDisplay: null,
            rating: null,
            reviews: 0,
            deliveryDays: null,
            responseTime: null,
            description: null,
            category: null,
            categorySlug: null,
            sponsored: false,
            image: null,
            packs: [],
            scrapedAt: new Date().toISOString(),
          };
      const cat = pickCategoryForTitle(gig.title);
      const market = cat
        ? await marketStatsForCategory(cat.slug)
        : await marketStatsForQuery(gig.title.split(/\s+/).slice(0, 3).join(" "));
      const keywords = topKeywords(market.topGigs.map((g) => g.title), 10).map((k) => k.word);
      const result = await generateDescription({ gig, market, keywords });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Type de génération inconnu." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: "Génération impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
