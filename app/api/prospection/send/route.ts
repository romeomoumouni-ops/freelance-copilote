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
  logEvent,
  saveCampaigns,
  saveProspects,
} from "@/lib/prospect/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 6; // envois max par appel (le client rappelle tant qu'il en reste)
const GAP_MS = 1800; // jamais en rafale : c'est ça qui protège la boîte

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function flush(baseUrl: string) {
  const mailbox = await getMailbox();
  if (!mailbox || !mailbox.appPassword) {
    return { error: "Connecte d'abord ta boîte Gmail dans « Boîte mail ».", sent: 0, remaining: 0 };
  }
  const [campaigns, prospects, suppression, sentToday] = await Promise.all([
    getCampaigns(),
    getProspects(),
    getSuppression(),
    getSentToday(),
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

    const auditUrl = `${baseUrl}/audit/${prospect.id}`;
    const extra = { fromName: mailbox.fromName, auditUrl };
    let subject = fillVars(step.subject, prospect, extra).trim();
    if (!subject) subject = "Re: " + (contact.firstSubject || `${prospect.entreprise}`);
    let text = fillVars(step.body, prospect, extra).trim();
    if (campaign.signature.trim()) text += "\n\n" + campaign.signature.trim();
    text += unsubFooter(prospect.email!, baseUrl);

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
      await bumpSentToday(1);
      await logEvent("envoi", `${prospect.entreprise} (étape ${d.stepIndex + 1}, ${campaign.name})`);
      await sleep(GAP_MS);
    } catch (e) {
      contact.status = "erreur";
      contact.error = e instanceof Error ? e.message : String(e);
      errors.push(`${prospect.entreprise} : ${contact.error}`);
      await logEvent("erreur", `${prospect.entreprise} : ${contact.error.slice(0, 80)}`);
    }
  }

  await saveCampaigns(campaigns);
  await saveProspects(prospects);
  const remaining = computeDue(campaigns, prospects, suppression).length;
  return { sent, remaining, capLeft: Math.max(0, mailbox.dailyCap - (await getSentToday())), errors };
}

export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const result = await flush(baseUrl);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

/* GET : appelé par le cron Vercel chaque matin (vague automatique). */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const result = await flush(baseUrl);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
