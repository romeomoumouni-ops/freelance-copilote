import { NextResponse } from "next/server";
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

export async function GET() {
  const [prospects, campaigns, suppression, sentToday, series, events, mailbox] = await Promise.all([
    getProspects(),
    getCampaigns(),
    getSuppression(),
    getSentToday(),
    getSentSeries(14),
    getEvents(),
    getMailbox(),
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
    mailboxReady: !!mailbox?.appPassword,
    series,
    events: events.slice(0, 12),
  });
}
