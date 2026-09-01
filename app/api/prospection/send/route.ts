import { NextRequest, NextResponse } from "next/server";
import { computeDue, fillVars } from "@/lib/prospect/engine";
import { sendOne, unsubFooter } from "@/lib/prospect/mailer";
import {
  bumpSentToday,
  getCampaigns,
  getMailbox,
  getProspects,
  getSentToday,
  getSuppression,
  getUsers,
  logEvent,
  saveCampaigns,
  saveProspects,
} from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 6; // envois max par appel (le client rappelle tant qu'il en reste)
const GAP_MS = 1800; // jamais en rafale : c'est ça qui protège la boîte

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function flush(uid: string, baseUrl: string) {
  const mailbox = await getMailbox(uid);
  if (!mailbox || !mailbox.appPassword) {
    return { error: "Connecte d'abord ta boîte Gmail dans « Boîte mail ».", sent: 0, remaining: 0 };
  }
  const [campaigns, prospects, suppression, sentToday] = await Promise.all([
    getCampaigns(uid),
    getProspects(uid),
    getSuppression(uid),
    getSentToday(uid),
  ]);
  const due = computeDue(campaigns, prospects, suppression);
  const capLeft = Math.max(0, mailbox.dailyCap - sentToday);
  if (!due.length) return { sent: 0, remaining: 0, capLeft };
  if (!capLeft) return { sent: 0, remaining: due.length, capLeft: 0, capped: true };

  const todo = due.slice(0, Math.min(BATCH, capLeft));
  let sent = 0;
  const errors: string[] = [];
  const started = Date.now();

  for (const d of todo) {
    if (Date.now() - started > 45000) break;
    const campaign = campaigns.find((c) => c.id === d.campaignId)!;
    const contact = campaign.contacts.find((ct) => ct.prospectId === d.prospectId)!;
    const prospect = prospects.find((p) => p.id === d.prospectId)!;
    const step = campaign.steps[d.stepIndex];

    const auditUrl = `${baseUrl}/audit/${uid}/${prospect.id}`;
    const extra = { fromName: mailbox.fromName, auditUrl };
    let subject = fillVars(step.subject, prospect, extra).trim();
    if (!subject) subject = "Re: " + (contact.firstSubject || `${prospect.entreprise}`);
    let text = fillVars(step.body, prospect, extra).trim();
    if (campaign.signature.trim()) text += "\n\n" + campaign.signature.trim();
    text += unsubFooter(uid, prospect.email!, baseUrl);

    try {
      const { messageId } = await sendOne(mailbox, {
        to: prospect.email!,
        subject,
        text,
        inReplyTo: d.stepIndex > 0 ? contact.messageId : undefined,
        references: d.stepIndex > 0 ? contact.messageId : undefined,
      });
      contact.stepDone += 1;
      contact.lastSentAt = new Date().toISOString();
      if (d.stepIndex === 0) {
        contact.messageId = messageId;
        contact.firstSubject = subject;
      }
      if (contact.stepDone >= campaign.steps.length) contact.status = "termine";
      if (prospect.status === "nouveau") prospect.status = "contacte";
      sent += 1;
      await bumpSentToday(uid, 1);
      await logEvent(uid, "envoi", `${prospect.entreprise} (étape ${d.stepIndex + 1}, ${campaign.name})`);
      await sleep(GAP_MS);
    } catch (e) {
      contact.status = "erreur";
      contact.error = e instanceof Error ? e.message : String(e);
      errors.push(`${prospect.entreprise} : ${contact.error}`);
      await logEvent(uid, "erreur", `${prospect.entreprise} : ${contact.error.slice(0, 80)}`);
    }
  }

  await saveCampaigns(uid, campaigns);
  await saveProspects(uid, prospects);
  const remaining = computeDue(campaigns, prospects, suppression).length;
  return { sent, remaining, capLeft: Math.max(0, mailbox.dailyCap - (await getSentToday(uid))), errors };
}

export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const baseUrl = req.nextUrl.origin;
  const result = await flush(uid, baseUrl);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

/* GET : appelé par le cron Vercel chaque matin. Passe sur TOUS les
   comptes qui ont une boîte connectée et envoie leur vague du jour. */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const users = await getUsers();
  const results: Record<string, { sent: number; remaining: number; error?: string }> = {};
  for (const uid of users) {
    const r = await flush(uid, baseUrl);
    results[uid.slice(0, 8)] = { sent: r.sent, remaining: r.remaining, error: r.error };
  }
  return NextResponse.json({ users: users.length, results });
}
