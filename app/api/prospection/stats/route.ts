import { NextRequest, NextResponse } from "next/server";
import { computeDue } from "@/lib/prospect/engine";
import { getOverview } from "@/lib/prospect/store";
import { getUserId } from "@/lib/auth/server";
import type { ProspectStatus } from "@/lib/prospect/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getUserId(req);
  if (!uid) return NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 });

  // une seule requête à la base : c'est ce qui rend l'écran immédiat
  const { prospects, campaigns, mailbox, suppression, events, sentToday } = await getOverview(uid);
  const due = computeDue(campaigns, prospects, suppression);
  const count = (s: ProspectStatus) => prospects.filter((p) => p.status === s).length;

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
    events: events.slice(0, 12),
    prospects, // évite un second aller-retour côté client
  });
}
