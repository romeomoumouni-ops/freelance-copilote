import { NextRequest, NextResponse } from "next/server";
import { fetchRecentSenders } from "@/lib/prospect/imap";
import {
  getCampaigns,
  getMailbox,
  getProspects,
  logEvent,
  saveCampaigns,
  saveMailbox,
  saveProspects,
} from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* POST : relève la boîte (IMAP) et croise avec les prospects contactés.
   Toute réponse détectée stoppe la séquence du prospect. */
export async function POST(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const mailbox = await getMailbox(uid);
  if (!mailbox || !mailbox.appPassword) {
    return NextResponse.json({ error: "Connecte d'abord ta boîte Gmail dans « Boîte mail »." }, { status: 400 });
  }
  const since = mailbox.lastReplyCheck
    ? new Date(new Date(mailbox.lastReplyCheck).getTime() - 3600000)
    : new Date(Date.now() - 7 * 86400000);

  let inbound;
  try {
    inbound = await fetchRecentSenders(mailbox, since);
  } catch (e) {
    return NextResponse.json(
      { error: "Relève IMAP impossible : " + (e instanceof Error ? e.message : String(e)) },
      { status: 502 }
    );
  }

  const [prospects, campaigns] = await Promise.all([getProspects(uid), getCampaigns(uid)]);
  const contacted = prospects.filter((p) => p.email && p.status !== "nouveau");
  let found = 0;
  for (const mail of inbound) {
    const p = contacted.find((x) => x.email === mail.from);
    if (!p || p.status === "repondu" || p.status === "rdv" || p.status === "signe") continue;
    p.status = "repondu";
    p.reply = { subject: mail.subject, at: mail.at, from: mail.from };
    for (const c of campaigns) {
      const ct = c.contacts.find((x) => x.prospectId === p.id);
      if (ct && ct.status === "en_cours") ct.status = "repondu";
    }
    found += 1;
    await logEvent(uid, "reponse", `${p.entreprise} a répondu`);
  }
  await saveProspects(uid, prospects);
  await saveCampaigns(uid, campaigns);
  await saveMailbox(uid, { ...mailbox, lastReplyCheck: new Date().toISOString() });
  return NextResponse.json({ checked: inbound.length, found });
}
