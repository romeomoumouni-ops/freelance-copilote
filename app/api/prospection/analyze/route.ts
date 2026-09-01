import { NextRequest, NextResponse } from "next/server";
import { auditSite, computeSignals, computeScore } from "@/lib/prospect/analyze";
import { getProspects, updateProspect } from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* POST { id } : analyse le VRAI site du prospect et calcule ses signaux. */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const p = (await getProspects(uid)).find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const audit = p.site ? await auditSite(p.site) : null;
  const signals = computeSignals(audit, !!p.site);
  const score = computeScore(signals, !!(p.email || audit?.emailFound));

  const patch: Record<string, unknown> = { signals, score };
  if (audit) patch.audit = audit;
  // bonus : si le site expose un e-mail et que le prospect n'en a pas, on le récupère
  if (!p.email && audit?.emailFound) patch.email = audit.emailFound.toLowerCase();

  const updated = await updateProspect(uid, id, patch);
  return NextResponse.json({ prospect: updated });
}
