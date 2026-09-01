import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { confirmEmailHtml, mailReady, sendAppMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/* Vraie inscription : le compte est créé NON confirmé et un e-mail de
   confirmation part via Resend. Tant que le lien n'est pas cliqué, la
   connexion est refusée (« Email not confirmed »). Repli assumé : si
   Resend n'est pas configuré sur le serveur, on crée le compte déjà
   confirmé plutôt que de casser les inscriptions. */
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
    return NextResponse.json({ error: "Le service d'inscription n'est pas configuré sur ce serveur." }, { status: 500 });

  if (!mailReady()) {
    const { error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (error) return signupError(error.message);
    return NextResponse.json({ ok: true, needsConfirm: false });
  }

  const redirectTo = `${req.nextUrl.origin}/dashboard`;
  const { data, error } = await sb.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { name }, redirectTo },
  });
  if (error) return signupError(error.message);

  const link = data.properties?.action_link;
  if (!link) return NextResponse.json({ error: "Création du lien de confirmation impossible. Réessaie." }, { status: 500 });

  try {
    await sendAppMail({
      to: email,
      subject: "Confirme ton adresse pour ouvrir ton espace",
      html: confirmEmailHtml({ name, link }),
    });
  } catch (e) {
    // pas de compte fantôme injoignable : on annule la création
    if (data.user?.id) await sb.auth.admin.deleteUser(data.user.id).catch(() => {});
    return NextResponse.json(
      { error: "L'e-mail de confirmation n'a pas pu partir. Réessaie dans un instant. (" + (e instanceof Error ? e.message.slice(0, 120) : "") + ")" },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, needsConfirm: true });
}

function signupError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("exists"))
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet e-mail. Connecte-toi, ou utilise « Renvoyer l'e-mail » si tu n'as jamais confirmé." },
      { status: 409 }
    );
  return NextResponse.json({ error: message }, { status: 500 });
}
