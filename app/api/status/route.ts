import { NextResponse } from "next/server";
import { getFiverrStatus } from "@/lib/marketplace/fiverr";
import { hasAI } from "@/lib/ai/generate";
import type { SourceStatus } from "@/lib/marketplace/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const comeup: SourceStatus = {
    platform: "comeup",
    available: true,
    mode: "live",
    message: "ComeUp connecté — lecture des pages publiques en direct.",
  };
  return NextResponse.json({
    sources: [comeup, getFiverrStatus()],
    ai: hasAI(),
  });
}
