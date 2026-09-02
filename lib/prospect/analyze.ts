/* Analyseur de site : la matière première du produit.
   On lit le VRAI site du prospect (fetch + cheerio) et on en tire des
   signaux concrets et chiffrés : lenteur, pas de HTTPS, pas adapté
   mobile, description absente, site à l'abandon... Chaque signal porte
   une phrase prête à l'emploi pour le mail (vouvoiement). */

import * as cheerio from "cheerio";
import type { Signal, SiteAudit } from "@/lib/prospect/types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

export function domainOf(raw?: string): string {
  if (!raw) return "";
  try {
    return new URL(normalizeUrl(raw)).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

async function timedFetch(url: string, timeoutMs = 15000): Promise<{ html: string; ms: number; finalUrl: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    const html = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { html, ms: Date.now() - start, finalUrl: res.url || url };
  } finally {
    clearTimeout(t);
  }
}

export async function auditSite(rawUrl: string): Promise<SiteAudit> {
  const url = normalizeUrl(rawUrl);
  const base: SiteAudit = {
    url,
    ok: false,
    fetchedAt: new Date().toISOString(),
    https: url.startsWith("https://"),
    ms: 0,
    title: null,
    metaDesc: null,
    h1: null,
    viewport: false,
    ogImage: false,
    socials: [],
    emailFound: null,
    phoneFound: null,
    copyrightYear: null,
    tech: null,
    weightKb: 0,
  };

  let html = "";
  let ms = 0;
  let https = true;
  try {
    const r = await timedFetch(url);
    html = r.html;
    ms = r.ms;
    https = r.finalUrl.startsWith("https://");
  } catch {
    // repli http:// (vieux sites sans certificat)
    try {
      const r = await timedFetch(url.replace(/^https:\/\//, "http://"));
      html = r.html;
      ms = r.ms;
      https = false;
    } catch (e) {
      return { ...base, error: "Site inaccessible : " + String(e instanceof Error ? e.message : e) };
    }
  }

  const $ = cheerio.load(html);
  const text = $("body").text();

  const socials: string[] = [];
  for (const [k, re] of [
    ["Facebook", /facebook\.com/i],
    ["Instagram", /instagram\.com/i],
    ["LinkedIn", /linkedin\.com/i],
    ["WhatsApp", /wa\.me|api\.whatsapp/i],
  ] as const) {
    if ($("a[href]").toArray().some((a) => re.test($(a).attr("href") || ""))) socials.push(k);
  }

  const mailto = $("a[href^='mailto:']").first().attr("href");
  const tel = $("a[href^='tel:']").first().attr("href");
  const yearMatches = Array.from(text.matchAll(/(?:©|&copy;|copyright)\s*(20\d{2})/gi)).map((m) => parseInt(m[1], 10));

  let tech: string | null = null;
  if (/wp-content|wp-includes/i.test(html)) tech = "WordPress";
  else if (/cdn\.shopify/i.test(html)) tech = "Shopify";
  else if (/wixstatic|wix\.com/i.test(html)) tech = "Wix";
  else if (/squarespace/i.test(html)) tech = "Squarespace";

  return {
    ...base,
    ok: true,
    https,
    ms,
    title: ($("title").first().text().trim() || null) as string | null,
    metaDesc: ($("meta[name='description']").attr("content")?.trim() || null) as string | null,
    h1: ($("h1").first().text().trim() || null) as string | null,
    viewport: !!$("meta[name='viewport']").attr("content"),
    ogImage: !!$("meta[property='og:image']").attr("content"),
    socials,
    emailFound: mailto ? mailto.replace(/^mailto:/i, "").split("?")[0] : null,
    phoneFound: tel ? tel.replace(/^tel:/i, "") : null,
    copyrightYear: yearMatches.length ? Math.max(...yearMatches) : null,
    tech,
    weightKb: Math.round(html.length / 1024),
  };
}

/* -------------------- signaux -------------------- */

export function computeSignals(audit: SiteAudit | null, hasSite: boolean): Signal[] {
  const s: Signal[] = [];
  const year = new Date().getFullYear();

  /* Champ site laissé vide = on ne SAIT PAS si l'entreprise en a un.
     On n'invente donc aucun signal : affirmer « vous n'avez pas de site »
     à quelqu'un qui en a un ruinerait la crédibilité du freelance. */
  if (!hasSite) return s;
  if (!audit) return s;

  if (!audit.ok) {
    s.push({
      key: "down",
      label: "Site inaccessible",
      detail: audit.error || "Le site ne répond pas.",
      severity: 3,
      hook: "votre site ne s'ouvre pas au moment où j'écris ces lignes",
    });
    return s;
  }
  if (!audit.https) {
    s.push({
      key: "no-https",
      label: "Pas de HTTPS",
      detail: "Le site n'est pas sécurisé (pas de cadenas HTTPS) : les navigateurs affichent un avertissement.",
      severity: 3,
      hook: "votre site s'affiche comme « non sécurisé » dans Chrome, ce qui fait fuir une partie des visiteurs",
    });
  }
  if (audit.ms > 3000) {
    s.push({
      key: "slow",
      label: "Très lent",
      detail: `La page d'accueil a mis ${(audit.ms / 1000).toFixed(1)} s à répondre : au-delà de 3 s, la moitié des visiteurs mobiles abandonnent.`,
      severity: 3,
      hook: `votre page d'accueil a mis ${(audit.ms / 1000).toFixed(1)} seconde(s) à s'afficher lors de mon test`,
    });
  } else if (audit.ms > 1500) {
    s.push({
      key: "slowish",
      label: "Lent",
      detail: `La page d'accueil a répondu en ${(audit.ms / 1000).toFixed(1)} s : il y a une vraie marge d'amélioration.`,
      severity: 2,
      hook: `votre site a mis ${(audit.ms / 1000).toFixed(1)} s à répondre lors de mon test`,
    });
  }
  if (!audit.viewport) {
    s.push({
      key: "no-mobile",
      label: "Pas adapté mobile",
      detail: "Aucune configuration mobile détectée : le site s'affiche en version ordinateur sur téléphone.",
      severity: 3,
      hook: "votre site ne s'adapte pas aux téléphones, alors que la majorité des visites se font sur mobile",
    });
  }
  if (!audit.metaDesc) {
    s.push({
      key: "no-meta",
      label: "SEO incomplet",
      detail: "Pas de meta description : Google affiche un extrait aléatoire au lieu d'un texte qui donne envie de cliquer.",
      severity: 2,
      hook: "votre site n'a pas de description pour Google, donc votre résultat de recherche n'attire pas les clics",
    });
  }
  if (!audit.title || !audit.h1) {
    s.push({
      key: "no-title",
      label: "Titres manquants",
      detail: "Le titre principal de la page est absent ou vide : mauvais pour Google et pour le visiteur.",
      severity: 2,
      hook: "la structure de votre page d'accueil manque de titres, ce qui pénalise votre référencement",
    });
  }
  if (audit.copyrightYear && audit.copyrightYear <= year - 2) {
    s.push({
      key: "stale",
      label: "Site à l'abandon",
      detail: `Le pied de page indique ${audit.copyrightYear} : le site semble ne plus être mis à jour.`,
      severity: 2,
      hook: `votre site affiche encore « ${audit.copyrightYear} » en pied de page, ce qui donne une impression d'abandon`,
    });
  }
  if (!audit.ogImage) {
    s.push({
      key: "no-og",
      label: "Partage sans image",
      detail: "Pas d'image de partage : le lien du site s'affiche nu sur WhatsApp et les réseaux.",
      severity: 1,
      hook: "quand on partage votre site sur WhatsApp, aucune image ne s'affiche",
    });
  }
  if (audit.socials.length === 0) {
    s.push({
      key: "no-social",
      label: "Réseaux absents",
      detail: "Aucun lien vers des réseaux sociaux trouvé sur la page d'accueil.",
      severity: 1,
      hook: "je n'ai trouvé aucun lien vers vos réseaux sociaux depuis votre site",
    });
  }
  if (audit.weightKb > 2500) {
    s.push({
      key: "heavy",
      label: "Page très lourde",
      detail: `La page d'accueil pèse ${Math.round(audit.weightKb / 100) / 10} Mo de HTML : c'est énorme et ça ralentit tout.`,
      severity: 1,
      hook: "votre page d'accueil est anormalement lourde, ce qui la ralentit sur mobile",
    });
  }
  return s.sort((a, b) => b.severity - a.severity);
}

/** Score de priorité : plus il y a de problèmes graves (et un e-mail pour
    écrire), plus le prospect vaut la peine d'être contacté vite. */
export function computeScore(signals: Signal[], hasEmail: boolean): number {
  /* Priorité = ce qu'on a RÉELLEMENT constaté. Sans site analysé, aucun
     constat, donc pas de priorité : 0 signifie « non analysé », pas
     « mauvais prospect ». */
  if (!signals.length) return 0;
  const sev = signals.reduce((sum, s) => sum + s.severity, 0);
  return Math.min(100, 15 + sev * 9 + (hasEmail ? 12 : 0));
}
