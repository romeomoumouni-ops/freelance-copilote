import { NextRequest, NextResponse } from "next/server";
import { generateAccroche, generateReplies, generateCallScript } from "@/lib/prospect/engine";
import { getMailbox, getProspects, updateProspect } from "@/lib/prospect/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* POST { id, mode: "accroche" | "reply" | "call", theirMessage? } */
export async function POST(req: NextRequest) {
  const { id, mode, theirMessage } = await req.json().catch(() => ({}));
  const p = (await getProspects()).find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  const fromName = (await getMailbox())?.fromName || "";

  if (mode === "reply") {
    const r = await generateReplies(p, fromName, theirMessage);
    return NextResponse.json(r);
  }
  if (mode === "call") {
    return NextResponse.json({ script: generateCallScript(p, fromName) });
  }
  const a = await generateAccroche(p, fromName);
  await updateProspect(id, { accroche: { ...a, at: new Date().toISOString() } });
  return NextResponse.json({ accroche: a });
}
