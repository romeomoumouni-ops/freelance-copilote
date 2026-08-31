/* Persistance prospection : réutilise le kv hybride (Supabase market_cache
   si la clé service est là, sinon fichiers .data/). Un seul espace de
   travail : l'app est mono-utilisateur, comme le reste du copilote. */

import { promises as fs } from "fs";
import path from "path";
import { cacheGet } from "@/lib/marketplace/store";
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

const K = {
  prospects: "prospection_prospects",
  campaigns: "prospection_campaigns",
  mailbox: "prospection_mailbox",
  suppression: "prospection_suppression",
  events: "prospection_events",
  sent: (day: string) => `prospection_sent_${day}`,
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const v = await cacheGet<T>(key, FOREVER);
  return v === null ? fallback : v;
}

/* -------------------- prospects -------------------- */

export function getProspects(): Promise<Prospect[]> {
  return get<Prospect[]>(K.prospects, []);
}

export async function saveProspects(list: Prospect[]): Promise<void> {
  await setStrict(K.prospects, list);
}

export async function updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect | null> {
  const list = await getProspects();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await saveProspects(list);
  return list[idx];
}

/* -------------------- campagnes -------------------- */

export function getCampaigns(): Promise<Campaign[]> {
  return get<Campaign[]>(K.campaigns, []);
}

export async function saveCampaigns(list: Campaign[]): Promise<void> {
  await setStrict(K.campaigns, list);
}

/* -------------------- boîte mail -------------------- */

export function getMailbox(): Promise<MailboxSettings | null> {
  return cacheGet<MailboxSettings>(K.mailbox, FOREVER);
}

export async function saveMailbox(m: MailboxSettings): Promise<void> {
  await setStrict(K.mailbox, m);
}

/* -------------------- liste de suppression (désabonnés) -------------------- */

export function getSuppression(): Promise<string[]> {
  return get<string[]>(K.suppression, []);
}

export async function suppress(email: string): Promise<void> {
  const list = await getSuppression();
  const e = email.trim().toLowerCase();
  if (!list.includes(e)) {
    list.push(e);
    await setStrict(K.suppression, list);
  }
}

/* -------------------- compteur d'envois du jour -------------------- */

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSentToday(): Promise<number> {
  return get<number>(K.sent(today()), 0);
}

export async function bumpSentToday(n = 1): Promise<number> {
  const v = (await getSentToday()) + n;
  await setStrict(K.sent(today()), v);
  return v;
}

export async function getSentSeries(days = 14): Promise<{ date: string; sent: number }[]> {
  const out: { date: string; sent: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ date: d, sent: await get<number>(K.sent(d), 0) });
  }
  return out;
}

/* -------------------- journal d'événements -------------------- */

export async function logEvent(type: EventLog["type"], label: string): Promise<void> {
  try {
    const list = await get<EventLog[]>(K.events, []);
    list.unshift({ at: new Date().toISOString(), type, label });
    await setStrict(K.events, list.slice(0, 60));
  } catch {
    /* journal best effort : ne bloque jamais un envoi */
  }
}

export function getEvents(): Promise<EventLog[]> {
  return get<EventLog[]>(K.events, []);
}

/* -------------------- util -------------------- */

export function newId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}
