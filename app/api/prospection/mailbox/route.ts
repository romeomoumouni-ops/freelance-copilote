import { NextRequest, NextResponse } from "next/server";
import { verifyMailbox } from "@/lib/prospect/mailer";
import { getMailbox, saveMailbox } from "@/lib/prospect/store";
import { DEFAULT_MAILBOX, type MailboxSettings } from "@/lib/prospect/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const m = await getMailbox();
  if (!m) return NextResponse.json({ mailbox: null });
  // jamais le mot de passe vers le client
  return NextResponse.json({
    mailbox: {
      email: m.email,
      fromName: m.fromName,
      dailyCap: m.dailyCap,
      verifiedAt: m.verifiedAt || null,
      hasPassword: !!m.appPassword,
    },
  });
}

/* POST { email, fromName, appPassword?, dailyCap?, action?: "test" } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prev = await getMailbox();
  const email = String(body.email || prev?.email || "").trim().toLowerCase();
  const fromName = String(body.fromName || prev?.fromName || "").trim();
  const appPassword = String(body.appPassword || "").replace(/\s+/g, "") || prev?.appPassword || "";
  const dailyCap = Math.min(80, Math.max(5, Number(body.dailyCap) || prev?.dailyCap || 40));

  if (!email || !/@/.test(email)) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  if (!fromName) return NextResponse.json({ error: "Indique ton nom d'expéditeur." }, { status: 400 });
  if (!appPassword)
    return NextResponse.json({ error: "Il manque le mot de passe d'application Gmail." }, { status: 400 });

  const mailbox: MailboxSettings = { ...DEFAULT_MAILBOX, ...prev, email, fromName, appPassword, dailyCap };

  if (body.action === "test") {
    let verified = false;
    let verifyError = "";
    try {
      await verifyMailbox(mailbox);
      verified = true;
      mailbox.verifiedAt = new Date().toISOString();
    } catch (e) {
      verifyError = e instanceof Error ? e.message : String(e);
    }
    // Sauvegarde STRICTE + relecture : on ne dit jamais « c'est prêt »
    // si rien n'a été écrit (ex. variables Supabase absentes sur Vercel).
    try {
      await saveMailbox(mailbox);
      const back = await getMailbox();
      if (!back || back.email !== mailbox.email || (verified && !back.verifiedAt)) {
        throw new Error(
          "La sauvegarde n'a pas été relue : la base de données n'est pas branchée sur ce serveur. Sur Vercel, ajoute NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY puis redéploie."
        );
      }
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
    if (!verified) {
      return NextResponse.json({ error: "Connexion refusée : " + verifyError }, { status: 502 });
    }
    return NextResponse.json({ ok: true, verified: true });
  }

  try {
    await saveMailbox(mailbox);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
