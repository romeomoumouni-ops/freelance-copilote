import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* Inscription SANS friction : le serveur (clé service) crée le compte
   déjà confirmé, le client se connecte dans la foulée. Équivalent à
   désactiver la confirmation d'e-mail, mais sans dépendre du mailer
   Supabase (limité à quelques envois par heure). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name) return NextResponse.json({ error: "Dis-nous ton prénom (ou ton nom pro)." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Cette adresse e-mail ne semble pas valide." }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Ton mot de passe doit faire au moins 6 caractères." }, { status: 400 });

  const sb = getAdminClient();
  if (!sb)
    return NextResponse.json(
      { error: "Le service d'inscription n'est pas configuré sur ce serveur." },
      { status: 500 }
    );

  const { error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already") || m.includes("exists"))
      return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
