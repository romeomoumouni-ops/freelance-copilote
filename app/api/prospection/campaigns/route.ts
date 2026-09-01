import { NextRequest, NextResponse } from "next/server";
import { defaultSteps } from "@/lib/prospect/engine";
import { getCampaigns, getProspects, saveCampaigns, newId } from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";
import type { Campaign, CampaignStep } from "@/lib/prospect/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  return NextResponse.json({ campaigns: await getCampaigns(uid), defaults: defaultSteps() });
}

/* POST { name, prospectIds, steps?, signature? } */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const prospectIds: string[] = Array.isArray(body.prospectIds) ? body.prospectIds : [];
  if (!name) return NextResponse.json({ error: "Donne un nom à ta campagne." }, { status: 400 });
  if (!prospectIds.length)
    return NextResponse.json({ error: "Sélectionne au moins un prospect avec un e-mail." }, { status: 400 });

  const prospects = await getProspects(uid);
  const valid = prospectIds.filter((id) => {
    const p = prospects.find((x) => x.id === id);
    return p && p.email;
  });
  if (!valid.length)
    return NextResponse.json({ error: "Aucun des prospects sélectionnés n'a d'adresse e-mail." }, { status: 400 });

  const steps: CampaignStep[] =
    Array.isArray(body.steps) && body.steps.length
      ? body.steps.map((s: CampaignStep) => ({
          delayDays: Math.max(0, Number(s.delayDays) || 0),
          subject: String(s.subject || ""),
          body: String(s.body || ""),
        }))
      : defaultSteps();

  const campaign: Campaign = {
    id: newId(),
    name,
    createdAt: new Date().toISOString(),
    active: true,
    steps,
    signature: String(body.signature || ""),
    contacts: valid.map((prospectId) => ({ prospectId, stepDone: 0, status: "en_cours" })),
  };
  const list = await getCampaigns(uid);
  await saveCampaigns(uid, [campaign, ...list]);
  return NextResponse.json({ campaign });
}

/* PATCH { id, active? } : pause / reprise. DELETE ?id= : suppression. */
export async function PATCH(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const { id, active } = await req.json().catch(() => ({}));
  const list = await getCampaigns(uid);
  const c = list.find((x) => x.id === id);
  if (!c) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  if (typeof active === "boolean") c.active = active;
  await saveCampaigns(uid, list);
  return NextResponse.json({ campaign: c });
}

export async function DELETE(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  const list = await getCampaigns(uid);
  await saveCampaigns(uid, list.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
