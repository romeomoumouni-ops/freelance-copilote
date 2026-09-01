import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { confirmEmailHtml, mailReady, sendAppMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/* Renvoi du lien de confirmation. Lien magique : un clic confirme
   l'adresse ET connecte. Réponse volontairement identique que le compte
   existe ou non (pas d'énumération d'adresses). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Cette adresse e-mail ne semble pas valide." }, { status: 400 });

  const sb = getAdminClient();
  if (!sb || !mailReady()) return NextResponse.json({ ok: true });

  const redirectTo = `${req.nextUrl.origin}/dashboard`;
  const { data, error } = await sb.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } });
  if (!error && data.properties?.action_link) {
    const name = (data.user?.user_metadata?.name as string) || "";
    await sendAppMail({
      to: email,
      subject: "Ton lien de confirmation Freelance Copilote",
      html: confirmEmailHtml({ name, link: data.properties.action_link }),
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
