import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/server";
import { computeDue } from "@/lib/prospect/engine";
import {
  getCampaigns,
  getEvents,
  getMailbox,
  getProspects,
  getSentSeries,
  getSentToday,
  getSuppression,
} from "@/lib/prospect/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });
  const [prospects, campaigns, suppression, sentToday, series, events, mailbox] = await Promise.all([
    getProspects(uid),
    getCampaigns(uid),
    getSuppression(uid),
    getSentToday(uid),
    getSentSeries(uid, 14),
    getEvents(uid),
    getMailbox(uid),
  ]);
  const due = computeDue(campaigns, prospects, suppression);
  const count = (s: string) => prospects.filter((p) => p.status === s).length;
  return NextResponse.json({
    totals: {
      prospects: prospects.length,
      nouveaux: count("nouveau"),
      contactes: count("contacte"),
      repondus: count("repondu"),
      rdv: count("rdv"),
      signes: count("signe"),
    },
    sentToday,
    dailyCap: mailbox?.dailyCap ?? 40,
    dueCount: due.length,
    mailboxReady: !!mailbox?.appPassword && !!mailbox?.verifiedAt,
    series,
    events: events.slice(0, 12),
  });
}
