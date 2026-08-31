import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Demande d'abonnement envoyée depuis la landing.
   Enregistrée dans la table `leads` du projet Supabase. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      nom?: string;
      email?: string;
      whatsapp?: string;
      comeupUrl?: string;
      siteUrl?: string;
      message?: string;
    };
    const nom = (body.nom ?? "").trim();
    const email = (body.email ?? "").trim();
    if (!nom || !email) {
      return NextResponse.json({ error: "Ton nom et ton e-mail sont nécessaires." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Cet e-mail ne semble pas valide." }, { status: 400 });
    }

    const sb = getAdminClient();
    if (!sb) {
      // Sans Supabase configuré, on ne perd pas la demande : on la trace côté serveur.
      console.log("[abonnement]", { nom, email, whatsapp: body.whatsapp, comeupUrl: body.siteUrl ?? body.comeupUrl });
      return NextResponse.json({ ok: true, stored: false });
    }
    const { error } = await sb.from("leads").insert({
      nom,
      email,
      whatsapp: (body.whatsapp ?? "").trim() || null,
      comeup_url: (body.siteUrl ?? body.comeupUrl ?? "").trim() || null,
      message: (body.message ?? "").trim() || null,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Envoi impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
