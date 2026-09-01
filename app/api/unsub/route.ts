import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, getProspects, logEvent, saveCampaigns, saveProspects, suppress } from "@/lib/prospect/store";

export const dynamic = "force-dynamic";

/* Lien de désabonnement présent dans chaque mail envoyé (obligatoire).
   GET ?e=<base64url(email)> : ajoute à la liste de suppression globale
   et stoppe toutes les séquences de ce contact. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("e") || "";
  let uid = "";
  let email = "";
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const sep = raw.indexOf("|");
    uid = raw.slice(0, sep).trim();
    email = raw.slice(sep + 1).trim().toLowerCase();
  } catch {
    /* token invalide */
  }
  if (!uid || !email || !/@/.test(email)) {
    return new NextResponse("Lien invalide.", { status: 400 });
  }
  await suppress(uid, email);
  const prospects = await getProspects(uid);
  const campaigns = await getCampaigns(uid);
  for (const p of prospects) {
    if (p.email === email) {
      for (const c of campaigns) {
        const ct = c.contacts.find((x) => x.prospectId === p.id);
        if (ct && ct.status === "en_cours") ct.status = "desabonne";
      }
    }
  }
  await saveProspects(uid, prospects);
  await saveCampaigns(uid, campaigns);
  await logEvent(uid, "desabo", email);

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Désabonnement confirmé</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#F7F6F3;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">
<div style="max-width:420px;background:#fff;border:2px solid #17161C;border-radius:24px;padding:32px;text-align:center;box-shadow:8px 8px 0 0 #FFEE66">
<h1 style="font-size:20px;margin:0 0 12px;color:#17161C">C&rsquo;est noté.</h1>
<p style="font-size:14px;line-height:1.6;color:#4B4856;margin:0">Vous ne recevrez plus aucun message de cet exp&eacute;diteur. D&eacute;sol&eacute; pour le d&eacute;rangement, et bonne continuation.</p>
</div></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
