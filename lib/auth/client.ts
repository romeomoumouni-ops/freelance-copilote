"use client";

/* Client Supabase NAVIGATEUR : uniquement pour l'authentification
   (inscription, connexion, session). La clé anon n'accède à AUCUNE
   donnée (RLS deny-all partout) : les données passent par nos routes
   API, qui vérifient le jeton de session. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getAuthClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  return client;
}

/* Le jeton est gardé en mémoire : sans ça, chaque appel API attendait
   getSession(), qui peut aller jusqu'au réseau. */
let cached: { token: string; expiresAt: number } | null = null;

export function cacheAuthToken(token: string | null | undefined): void {
  if (!token) {
    cached = null;
    return;
  }
  let expiresAt = Date.now() + 60_000;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload?.exp) expiresAt = payload.exp * 1000;
  } catch {
    /* jeton illisible : on garde la marge minimale */
  }
  cached = { token, expiresAt };
}

/** Jeton d'accès de la session courante (null si déconnecté). */
export async function authToken(): Promise<string | null> {
  // 30 s de marge : on ne renvoie jamais un jeton sur le point d'expirer
  if (cached && cached.expiresAt - 30_000 > Date.now()) return cached.token;
  const sb = getAuthClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token ?? null;
  cacheAuthToken(token);
  return token;
}
