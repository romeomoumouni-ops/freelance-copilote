import { NextRequest, NextResponse } from "next/server";
import { sendOne, unsubFooter } from "@/lib/prospect/mailer";
import {
  bumpSentToday,
  getMailbox,
  getProspects,
  getSentToday,
  getSuppression,
  logEvent,
  saveProspects,
} from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Envoi d'UN mail écrit (ou corrigé) à la main par le freelance.
   Complément indispensable des campagnes : ici on maîtrise chaque mot. */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });

  const { id, subject, body } = await req.json().catch(() => ({}));
  const objet = String(subject || "").trim();
  const texte = String(body || "").trim();
  if (!id) return NextResponse.json({ error: "Prospect manquant." }, { status: 400 });
  if (!objet) return NextResponse.json({ error: "Donne un objet à ton mail." }, { status: 400 });
  if (!texte) return NextResponse.json({ error: "Ton message est vide." }, { status: 400 });

  const mailbox = await getMailbox(uid);
  if (!mailbox?.appPassword)
    return NextResponse.json({ error: "Connecte d'abord ta boîte Gmail dans « Boîte mail »." }, { status: 400 });
  if (!mailbox.verifiedAt)
    return NextResponse.json(
      { error: "Ta boîte n'est pas encore vérifiée : termine la connexion dans « Boîte mail »." },
      { status: 400 }
    );

  const prospects = await getProspects(uid);
  const prospect = prospects.find((p) => p.id === id);
  if (!prospect) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  if (!prospect.email) return NextResponse.json({ error: "Ce prospect n'a pas d'adresse e-mail." }, { status: 400 });

  const suppression = await getSuppression(uid);
  if (suppression.includes(prospect.email))
    return NextResponse.json(
      { error: "Ce contact s'est désabonné : on ne peut plus lui écrire." },
      { status: 400 }
    );

  const sentToday = await getSentToday(uid);
  if (sentToday >= mailbox.dailyCap)
    return NextResponse.json(
      { error: `Plafond du jour atteint (${mailbox.dailyCap} mails). C'est ce qui protège ta boîte.` },
      { status: 400 }
    );

  const baseUrl = req.nextUrl.origin;
  try {
    await sendOne(mailbox, {
      to: prospect.email,
      subject: objet,
      text: texte + unsubFooter(uid, prospect.email, baseUrl),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Envoi refusé : " + (e instanceof Error ? e.message : String(e)) },
      { status: 502 }
    );
  }

  if (prospect.status === "nouveau") prospect.status = "contacte";
  prospect.accroche = { subject: objet, body: texte, source: prospect.accroche?.source ?? "template", at: new Date().toISOString() };
  await saveProspects(uid, prospects);
  await bumpSentToday(uid, 1);
  await logEvent(uid, "envoi", `${prospect.entreprise} (mail écrit à la main)`);

  return NextResponse.json({ ok: true, prospect });
}
