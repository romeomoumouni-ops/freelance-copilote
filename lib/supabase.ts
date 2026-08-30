/* Client Supabase — CÔTÉ SERVEUR UNIQUEMENT (service_role).
   Projet : « Freelance copilote » (ref cdlcokutlsrvrbkvojfb, eu-west-1).
   RLS deny-all sur toutes les tables : la clé anon n'accède à rien,
   seul le serveur écrit/lit via la clé service_role (.env.local).
   Sans clé configurée → getAdminClient() renvoie null et l'app
   retombe sur le stockage fichier local (lib/marketplace/store.ts). */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getAdminClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return client;
}
