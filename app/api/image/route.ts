import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Proxy de génération d'images IA (pollinations.ai — gratuit, sans clé).
   Servi depuis notre origine → utilisable dans un <canvas> (miniatures)
   et téléchargeable sans souci de CORS. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");
  const width = Math.min(1280, Math.max(256, parseInt(searchParams.get("w") || "768", 10)));
  const height = Math.min(1280, Math.max(256, parseInt(searchParams.get("h") || "768", 10)));
  const seed = searchParams.get("seed") || "1";
  if (!prompt) return NextResponse.json({ error: "prompt requis" }, { status: 400 });

  const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(seed)}&nologo=true&model=flux`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    const res = await fetch(upstream, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      return NextResponse.json({ error: `Génération indisponible (${res.status})` }, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Génération d'image indisponible — réessaie." }, { status: 502 });
  }
}
