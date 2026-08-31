import { NextRequest, NextResponse } from "next/server";
import { auditSite, computeSignals, computeScore } from "@/lib/prospect/analyze";
import { getProspects, updateProspect } from "@/lib/prospect/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* POST { id } : analyse le VRAI site du prospect et calcule ses signaux. */
export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const p = (await getProspects()).find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const audit = p.site ? await auditSite(p.site) : null;
  const signals = computeSignals(audit, !!p.site);
  const score = computeScore(signals, !!(p.email || audit?.emailFound));

  const patch: Record<string, unknown> = { signals, score };
  if (audit) patch.audit = audit;
  // bonus : si le site expose un e-mail et que le prospect n'en a pas, on le récupère
  if (!p.email && audit?.emailFound) patch.email = audit.emailFound.toLowerCase();

  const updated = await updateProspect(id, patch);
  return NextResponse.json({ prospect: updated });
}
