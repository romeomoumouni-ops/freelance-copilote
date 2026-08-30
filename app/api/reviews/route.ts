import { NextResponse } from "next/server";
import { getGigReviews } from "@/lib/marketplace/comeup";
import { mineReviews } from "@/lib/analysis/reviews";
import { cached } from "@/lib/marketplace/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/reviews?url=<lien de service ComeUp>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Paramètre url requis." }, { status: 400 });

  try {
    const data = await cached(`reviews_${url}`, 6 * 60 * 60 * 1000, async () => {
      const reviews = await getGigReviews(url, 30);
      return { reviews, insights: mineReviews(reviews) };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Lecture des avis impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
