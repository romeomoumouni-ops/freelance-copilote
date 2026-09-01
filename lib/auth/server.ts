/* Côté serveur : résout l'utilisateur depuis le jeton envoyé par le
   client (en-tête Authorization). Chaque route de prospection exige un
   utilisateur : les données sont cloisonnées par compte. */

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export async function getUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
