/* Appels client typés vers les routes de prospection. */

import type { Campaign, CampaignStep, EventLog, Prospect, ProspectStatus } from "@/lib/prospect/types";
import type { CallScript, ReplySuggestion } from "@/lib/prospect/engine";

export type { Campaign, CampaignStep, EventLog, Prospect, ProspectStatus, CallScript, ReplySuggestion };

async function jf<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Erreur serveur (${res.status}). Réessaie, et préviens-nous si ça continue.`);
  }
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export interface Stats {
  totals: { prospects: number; nouveaux: number; contactes: number; repondus: number; rdv: number; signes: number };
  sentToday: number;
  dailyCap: number;
  dueCount: number;
  mailboxReady: boolean;
  series: { date: string; sent: number }[];
  events: EventLog[];
}

export const api = {
  stats: () => jf<Stats>("/api/prospection/stats"),
  prospects: () => jf<{ prospects: Prospect[] }>("/api/prospection/prospects"),
  addProspects: (rows: Partial<Prospect>[]) =>
    jf<{ added: number; prospects: Prospect[] }>("/api/prospection/prospects", json({ rows })),
  patchProspect: (patch: { id: string } & Partial<Pick<Prospect, "status" | "notes" | "contact" | "email">>) =>
    jf<{ prospect: Prospect }>("/api/prospection/prospects", { ...json(patch), method: "PATCH" }),
  deleteProspect: (id: string) => jf<{ ok: true }>(`/api/prospection/prospects?id=${id}`, { method: "DELETE" }),
  analyze: (id: string) => jf<{ prospect: Prospect }>("/api/prospection/analyze", json({ id })),
  accroche: (id: string) =>
    jf<{ accroche: { subject: string; body: string; source: string } }>("/api/prospection/generate", json({ id, mode: "accroche" })),
  replies: (id: string, theirMessage?: string) =>
    jf<{ suggestions: ReplySuggestion[]; source: string }>("/api/prospection/generate", json({ id, mode: "reply", theirMessage })),
  callScript: (id: string) => jf<{ script: CallScript }>("/api/prospection/generate", json({ id, mode: "call" })),
  campaigns: () => jf<{ campaigns: Campaign[]; defaults: CampaignStep[] }>("/api/prospection/campaigns"),
  createCampaign: (input: { name: string; prospectIds: string[]; steps: CampaignStep[]; signature: string }) =>
    jf<{ campaign: Campaign }>("/api/prospection/campaigns", json(input)),
  patchCampaign: (id: string, active: boolean) =>
    jf<{ campaign: Campaign }>("/api/prospection/campaigns", { ...json({ id, active }), method: "PATCH" }),
  deleteCampaign: (id: string) => jf<{ ok: true }>(`/api/prospection/campaigns?id=${id}`, { method: "DELETE" }),
  send: () =>
    jf<{ sent: number; remaining: number; capLeft?: number; capped?: boolean; errors?: string[] }>(
      "/api/prospection/send",
      { method: "POST" }
    ),
  checkReplies: () => jf<{ checked: number; found: number }>("/api/prospection/replies", { method: "POST" }),
  mailbox: () =>
    jf<{ mailbox: { email: string; fromName: string; dailyCap: number; verifiedAt: string | null; hasPassword: boolean } | null }>(
      "/api/prospection/mailbox"
    ),
  saveMailbox: (input: { email: string; fromName: string; appPassword?: string; dailyCap?: number; action?: "test" }) =>
    jf<{ ok: true; verified?: boolean }>("/api/prospection/mailbox", json(input)),
};
