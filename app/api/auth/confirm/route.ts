import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TYPES = new Set(["signup", "magiclink", "recovery", "email", "invite", "email_change"]);

/* Notre PROPRE porte de confirmation : le mail pointe ici, on vérifie le
   jeton côté serveur (verifyOtp) et on redirige DIRECTEMENT vers
   l'espace membre avec la session dans le fragment d'URL. Aucune
   dépendance au Site URL ou à la liste d'URLs autorisées de Supabase :
   ça marche sur www, sans www et en local. */
export async function GET(req: NextRequest) {
  const tokenHash = req.nextUrl.searchParams.get("token_hash") || "";
  const type = req.nextUrl.searchParams.get("type") || "signup";
  const origin = req.nextUrl.origin;

  if (!tokenHash || !TYPES.has(type)) {
    return NextResponse.redirect(`${origin}/?confirmation=invalide`, 303);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.redirect(`${origin}/?confirmation=indisponible`, 303);

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "signup",
  });

  if (error || !data.session) {
    // lien expiré ou déjà utilisé
    return NextResponse.redirect(`${origin}/?confirmation=expiree`, 303);
  }

  const s = data.session;
  const fragment = new URLSearchParams({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: String(s.expires_in ?? 3600),
    token_type: "bearer",
    type,
  });
  return NextResponse.redirect(`${origin}/dashboard#${fragment.toString()}`, 303);
}
