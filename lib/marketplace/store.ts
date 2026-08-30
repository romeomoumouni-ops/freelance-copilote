/* Persistance : cache des scrapes + snapshots d'historique.
   - Si Supabase est configuré (SUPABASE_SERVICE_ROLE_KEY) → tables
     `market_cache` et `market_snapshots` du projet « Freelance copilote ».
   - Sinon → repli fichiers JSON locaux (.data/), l'app marche sans rien.
   Même interface dans les deux cas. */

import { promises as fs } from "fs";
import path from "path";
import { getAdminClient } from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), ".data");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const SNAP_DIR = path.join(DATA_DIR, "snapshots");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

function safeKey(key: string): string {
  return key.replace(/[^a-z0-9_-]/gi, "_").slice(0, 200);
}

/* -------------------- cache -------------------- */

export async function cacheGet<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const sb = getAdminClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("market_cache")
        .select("value, updated_at")
        .eq("key", safeKey(key))
        .maybeSingle();
      if (!data) return null;
      if (Date.now() - new Date(data.updated_at).getTime() > maxAgeMs) return null;
      return data.value as T;
    } catch {
      return null;
    }
  }
  try {
    const file = path.join(CACHE_DIR, safeKey(key) + ".json");
    const raw = await fs.readFile(file, "utf8");
    const { at, value } = JSON.parse(raw) as { at: number; value: T };
    if (Date.now() - at > maxAgeMs) return null;
    return value;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const sb = getAdminClient();
  if (sb) {
    try {
      await sb
        .from("market_cache")
        .upsert({ key: safeKey(key), value, updated_at: new Date().toISOString() });
    } catch {
      /* non bloquant */
    }
    return;
  }
  try {
    await ensureDir(CACHE_DIR);
    const file = path.join(CACHE_DIR, safeKey(key) + ".json");
    await fs.writeFile(file, JSON.stringify({ at: Date.now(), value }), "utf8");
  } catch {
    /* FS lecture seule : cache inactif, pas bloquant */
  }
}

/** Helper : valeur cachée, sinon exécute `producer`, met en cache, renvoie. */
export async function cached<T>(key: string, maxAgeMs: number, producer: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key, maxAgeMs);
  if (hit !== null) return hit;
  const value = await producer();
  await cacheSet(key, value);
  return value;
}

/* -------------------- snapshots (historique réel) -------------------- */

export interface Snapshot {
  at: string; // ISO
  metrics: Record<string, number>;
}

export async function appendSnapshot(seriesKey: string, metrics: Record<string, number>): Promise<void> {
  const sb = getAdminClient();
  if (sb) {
    try {
      await sb.from("market_snapshots").insert({ series_key: safeKey(seriesKey), metrics });
    } catch {
      /* non bloquant */
    }
    return;
  }
  try {
    await ensureDir(SNAP_DIR);
    const file = path.join(SNAP_DIR, safeKey(seriesKey) + ".json");
    let arr: Snapshot[] = [];
    try {
      arr = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      /* première fois */
    }
    arr.push({ at: new Date().toISOString(), metrics });
    if (arr.length > 180) arr = arr.slice(arr.length - 180);
    await fs.writeFile(file, JSON.stringify(arr), "utf8");
  } catch {
    /* ignore */
  }
}

export async function getSnapshots(seriesKey: string): Promise<Snapshot[]> {
  const sb = getAdminClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("market_snapshots")
        .select("metrics, created_at")
        .eq("series_key", safeKey(seriesKey))
        .order("created_at", { ascending: true })
        .limit(180);
      return (data ?? []).map((r) => ({ at: r.created_at as string, metrics: r.metrics as Record<string, number> }));
    } catch {
      return [];
    }
  }
  try {
    const file = path.join(SNAP_DIR, safeKey(seriesKey) + ".json");
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return [];
  }
}

/* -------------------- journal des analyses -------------------- */

/** Trace une analyse de profil (best effort, jamais bloquant). */
export async function logAnalysis(entry: {
  url: string;
  username?: string | null;
  score?: number;
  marketLabel?: string;
}): Promise<void> {
  const sb = getAdminClient();
  if (!sb) return;
  try {
    await sb.from("analyses").insert({
      url: entry.url,
      username: entry.username ?? null,
      score: entry.score ?? null,
      market_label: entry.marketLabel ?? null,
    });
  } catch {
    /* non bloquant */
  }
}
