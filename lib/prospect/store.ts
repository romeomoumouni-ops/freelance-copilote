/* Persistance prospection : réutilise le kv hybride (Supabase market_cache
   si la clé service est là, sinon fichiers .data/). Un seul espace de
   travail : l'app est mono-utilisateur, comme le reste du copilote. */

import { promises as fs } from "fs";
import path from "path";
import { cacheGet, cacheGetMany } from "@/lib/marketplace/store";
import { getAdminClient } from "@/lib/supabase";
import type { Campaign, EventLog, MailboxSettings, Prospect } from "@/lib/prospect/types";

const FOREVER = 1000 * 60 * 60 * 24 * 365 * 10;

/* Écriture STRICTE : contrairement au cache marché (best effort), les
   données de prospection ne doivent JAMAIS se perdre en silence. Si la
   sauvegarde échoue (Supabase en erreur, ou pas de base branchée sur un
   serveur au disque en lecture seule type Vercel), on lève une erreur
   claire que les routes remontent à l'utilisateur. */
async function setStrict<T>(key: string, value: T): Promise<void> {
  const sb = getAdminClient();
  if (sb) {
    const { error } = await sb
      .from("market_cache")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw new Error("Sauvegarde impossible (Supabase) : " + error.message);
    return;
  }
  try {
    const dir = path.join(process.cwd(), ".data", "cache");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, key + ".json"), JSON.stringify({ at: Date.now(), value }), "utf8");
  } catch {
    throw new Error(
      "Sauvegarde impossible : la base de données n'est pas branchée sur ce serveur. Sur Vercel, ajoute les variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY puis redéploie."
    );
  }
}

/* Données CLOISONNÉES PAR UTILISATEUR : chaque clé est préfixée par
   l'identifiant du compte (Supabase Auth). */
const K = {
  prospects: (uid: string) => `prospection_${uid}_prospects`,
  campaigns: (uid: string) => `prospection_${uid}_campaigns`,
  mailbox: (uid: string) => `prospection_${uid}_mailbox`,
  suppression: (uid: string) => `prospection_${uid}_suppression`,
  events: (uid: string) => `prospection_${uid}_events`,
  sent: (uid: string, day: string) => `prospection_${uid}_sent_${day}`,
  users: "prospection_users",
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const v = await cacheGet<T>(key, FOREVER);
  return v === null ? fallback : v;
}

/* -------------------- prospects -------------------- */

export function getProspects(uid: string): Promise<Prospect[]> {
  return get<Prospect[]>(K.prospects(uid), []);
}

export async function saveProspects(uid: string, list: Prospect[]): Promise<void> {
  await setStrict(K.prospects(uid), list);
}

export async function updateProspect(uid: string, id: string, patch: Partial<Prospect>): Promise<Prospect | null> {
  const list = await getProspects(uid);
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await saveProspects(uid, list);
  return list[idx];
}

/* -------------------- campagnes -------------------- */

export function getCampaigns(uid: string): Promise<Campaign[]> {
  return get<Campaign[]>(K.campaigns(uid), []);
}

export async function saveCampaigns(uid: string, list: Campaign[]): Promise<void> {
  await setStrict(K.campaigns(uid), list);
}

/* -------------------- boîte mail -------------------- */

export function getMailbox(uid: string): Promise<MailboxSettings | null> {
  return cacheGet<MailboxSettings>(K.mailbox(uid), FOREVER);
}

export async function saveMailbox(uid: string, m: MailboxSettings): Promise<void> {
  await setStrict(K.mailbox(uid), m);
  await registerUser(uid);
}

/* -------------------- registre des comptes (pour le cron d'envoi) -------------------- */

export function getUsers(): Promise<string[]> {
  return get<string[]>(K.users, []);
}

export async function registerUser(uid: string): Promise<void> {
  const list = await getUsers();
  if (!list.includes(uid)) {
    list.push(uid);
    await setStrict(K.users, list);
  }
}

/* -------------------- liste de suppression (désabonnés) -------------------- */

export function getSuppression(uid: string): Promise<string[]> {
  return get<string[]>(K.suppression(uid), []);
}

export async function suppress(uid: string, email: string): Promise<void> {
  const list = await getSuppression(uid);
  const e = email.trim().toLowerCase();
  if (!list.includes(e)) {
    list.push(e);
    await setStrict(K.suppression(uid), list);
  }
}

/* -------------------- compteur d'envois du jour -------------------- */

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSentToday(uid: string): Promise<number> {
  return get<number>(K.sent(uid, today()), 0);
}

export async function bumpSentToday(uid: string, n = 1): Promise<number> {
  const v = (await getSentToday(uid)) + n;
  await setStrict(K.sent(uid, today()), v);
  return v;
}

/* -------------------- journal d'événements -------------------- */

export async function logEvent(uid: string, type: EventLog["type"], label: string): Promise<void> {
  try {
    const list = await get<EventLog[]>(K.events(uid), []);
    list.unshift({ at: new Date().toISOString(), type, label });
    await setStrict(K.events(uid), list.slice(0, 60));
  } catch {
    /* journal best effort : ne bloque jamais un envoi */
  }
}

export function getEvents(uid: string): Promise<EventLog[]> {
  return get<EventLog[]>(K.events(uid), []);
}

/* -------------------- vue d'ensemble (1 seule requête) -------------------- */

export interface Overview {
  prospects: Prospect[];
  campaigns: Campaign[];
  mailbox: MailboxSettings | null;
  suppression: string[];
  events: EventLog[];
  sentToday: number;
}

/** Tout l'écran d'accueil en UN aller-retour : avant, chaque bloc faisait
    sa propre requête et l'utilisateur attendait plusieurs secondes. */
export async function getOverview(uid: string): Promise<Overview> {
  const keys = [
    K.prospects(uid),
    K.campaigns(uid),
    K.mailbox(uid),
    K.suppression(uid),
    K.events(uid),
    K.sent(uid, today()),
  ];
  const raw = await cacheGetMany<unknown>(keys, FOREVER);
  return {
    prospects: (raw[K.prospects(uid)] as Prospect[]) ?? [],
    campaigns: (raw[K.campaigns(uid)] as Campaign[]) ?? [],
    mailbox: (raw[K.mailbox(uid)] as MailboxSettings) ?? null,
    suppression: (raw[K.suppression(uid)] as string[]) ?? [],
    events: (raw[K.events(uid)] as EventLog[]) ?? [],
    sentToday: (raw[K.sent(uid, today())] as number) ?? 0,
  };
}

/* -------------------- util -------------------- */

export function newId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}
