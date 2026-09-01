import { NextRequest, NextResponse } from "next/server";
import { getProspects, saveProspects, updateProspect, newId } from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";
import type { Prospect, ProspectStatus } from "@/lib/prospect/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const prospects = await getProspects(uid);
  return NextResponse.json({ prospects });
}

/* POST : ajout (un ou plusieurs). Body: { rows: [{entreprise, site?, email?, contact?, ville?}] } */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const rows: Partial<Prospect>[] = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) return NextResponse.json({ error: "Aucun prospect fourni." }, { status: 400 });

  const list = await getProspects(uid);
  const existingKeys = new Set(list.map((p) => (p.email || p.site || p.entreprise).toLowerCase()));
  const added: Prospect[] = [];
  for (const r of rows.slice(0, 200)) {
    const entreprise = String(r.entreprise || "").trim();
    if (!entreprise) continue;
    const key = String(r.email || r.site || entreprise).toLowerCase();
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    added.push({
      id: newId(),
      createdAt: new Date().toISOString(),
      entreprise,
      contact: String(r.contact || "").trim() || undefined,
      email: String(r.email || "").trim().toLowerCase() || undefined,
      site: String(r.site || "").trim() || undefined,
      ville: String(r.ville || "").trim() || undefined,
      status: "nouveau",
      score: 0,
      signals: [],
    });
  }
  try {
    await saveProspects(uid, [...added, ...list]);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ added: added.length, prospects: added });
}

/* PATCH : mise à jour d'un prospect (statut, notes...) */
export async function PATCH(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { id, status, notes, contact, email } = body as {
    id?: string;
    status?: ProspectStatus;
    notes?: string;
    contact?: string;
    email?: string;
  };
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const patch: Partial<Prospect> = {};
  if (status) patch.status = status;
  if (notes !== undefined) patch.notes = notes;
  if (contact !== undefined) patch.contact = contact;
  if (email !== undefined) patch.email = email.trim().toLowerCase() || undefined;
  const p = await updateProspect(uid, id, patch);
  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  return NextResponse.json({ prospect: p });
}

export async function DELETE(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const list = await getProspects(uid);
  await saveProspects(uid, list.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
