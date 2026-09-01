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

/** Jeton d'accès de la session courante (null si déconnecté). */
export async function authToken(): Promise<string | null> {
  const sb = getAuthClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}
