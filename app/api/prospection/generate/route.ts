import { NextRequest, NextResponse } from "next/server";
import { generateAccroche, generateReplies, generateCallScript } from "@/lib/prospect/engine";
import { getMailbox, getProspects, updateProspect } from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* POST { id, mode: "accroche" | "reply" | "call", theirMessage? } */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const { id, mode, theirMessage } = await req.json().catch(() => ({}));
  const p = (await getProspects(uid)).find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  const fromName = (await getMailbox(uid))?.fromName || "";

  if (mode === "reply") {
    const r = await generateReplies(p, fromName, theirMessage);
    return NextResponse.json(r);
  }
  if (mode === "call") {
    return NextResponse.json({ script: generateCallScript(p, fromName) });
  }
  const a = await generateAccroche(p, fromName);
  await updateProspect(uid, id, { accroche: { ...a, at: new Date().toISOString() } });
  return NextResponse.json({ accroche: a });
}
