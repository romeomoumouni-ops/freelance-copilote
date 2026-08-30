/* ============================================================
   Couche IA — Claude en option, repli sur templates sinon.
   Objectif : les fonctionnalités marchent SANS clé (génération par
   templates nourris de VRAIES données), et deviennent meilleures
   AVEC une clé ANTHROPIC_API_KEY (rédaction par Claude, contexte réel).
   ============================================================ */

import type { Gig, MarketStats } from "@/lib/marketplace/types";

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function hasAI(): boolean {
  return !!API_KEY;
}

/** Appel bas niveau à l'API Messages de Claude. Lève si pas de clé. */
export async function claudeComplete(system: string, user: string, maxTokens = 900): Promise<string> {
  if (!API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content?.[0]?.text ?? "").trim();
}

const SYSTEM =
  "Tu es un consultant expert des marketplaces freelance (ComeUp, Fiverr). Tu écris en français, de façon concrète, orientée conversion et vente. Pas de bla-bla, pas d'astérisques markdown superflus.";

/* -------------------- descriptions / titres -------------------- */

export async function generateDescription(input: {
  gig: Gig;
  market: MarketStats;
  keywords: string[];
}): Promise<{ text: string; source: "ia" | "template" }> {
  const { gig, market, keywords } = input;
  if (hasAI()) {
    const prompt = `Réécris la description du service ci-dessous pour vendre plus, en t'appuyant sur les meilleurs vendeurs du marché.
Service: "${gig.title}" — prix ${gig.price} €, note ${gig.rating ?? "?"} (${gig.reviews} avis).
Marché "${market.label}": prix médian ${market.price.median} €, note moyenne ${market.ratingAvg}/5.
Mots-clés qui dominent le marché: ${keywords.join(", ")}.
Structure: accroche (problème → solution) ; ce qui est inclus (liste) ; pourquoi moi (preuves) ; appel à l'action. 180 mots max.`;
    try {
      return { text: await claudeComplete(SYSTEM, prompt), source: "ia" };
    } catch {
      /* repli template */
    }
  }
  const kw = keywords.slice(0, 5).join(", ");
  const text = `${gig.title}.

Vous cherchez un résultat professionnel, sans mauvaise surprise ? Je m'en occupe de A à Z.

Ce qui est inclus :
• Un travail sur mesure, adapté à votre besoin (${kw})
• Un rendu moderne et optimisé
• ${gig.deliveryDays ? `Livraison en ${gig.deliveryDays} jours` : "Livraison rapide"}, révisions incluses
• Un accompagnement clair, même si vous débutez

Pourquoi me faire confiance : ${gig.reviews > 0 ? `${gig.reviews} avis clients` : "des clients satisfaits"}${gig.rating ? ` et une note de ${gig.rating}/5` : ""}. Le marché facture en moyenne ${market.price.median} € pour ce type de prestation — vous savez donc que vous investissez au juste prix.

Commandez maintenant, ou écrivez-moi votre projet : je vous réponds rapidement.`;
  return { text, source: "template" };
}

/* -------------------- réponses clients -------------------- */

export type ReplyTone =
  | "Professionnelle"
  | "Courte"
  | "Persuasive"
  | "Premium"
  | "Relance"
  | "Gérer une objection"
  | "Annoncer un prix"
  | "Refuser poliment";

export async function generateReply(
  message: string,
  tone: ReplyTone,
  context?: { seller?: string; price?: number; deliveryDays?: number | null }
): Promise<{ text: string; source: "ia" | "template" }> {
  if (hasAI() && message.trim()) {
    const prompt = `Un client a écrit ceci sur une marketplace freelance :\n"""${message}"""\nRédige une réponse au ton "${tone}".${
      context?.price ? ` Tarif de base indicatif : ${context.price} €.` : ""
    }${context?.deliveryDays ? ` Délai : ${context.deliveryDays} jours.` : ""} Signe "${context?.seller ?? "moi"}". 120 mots max.`;
    try {
      return { text: await claudeComplete(SYSTEM, prompt), source: "ia" };
    } catch {
      /* repli */
    }
  }
  return { text: templateReply(tone, context), source: "template" };
}

function templateReply(tone: ReplyTone, ctx?: { seller?: string; price?: number; deliveryDays?: number | null }): string {
  const sig = ctx?.seller ?? "";
  const delay = ctx?.deliveryDays ?? 7;
  const price = ctx?.price;
  switch (tone) {
    case "Courte":
      return `Bonjour ! Oui, c'est tout à fait possible. Je vous livre un travail professionnel en ${delay} jours, révisions incluses. Je vous envoie le détail ?`;
    case "Persuasive":
      return `Bonjour,\n\nExcellent projet. Ce que mes clients apprécient : un rendu prêt en ${delay} jours, un accompagnement clair et un résultat qui inspire confiance. Je n'ai que quelques créneaux cette semaine — je vous en réserve un ?\n\n${sig}`;
    case "Premium":
      return `Bonjour,\n\nPour un résultat à la hauteur de votre image, je vous recommande ma formule complète : travail sur mesure, optimisation et suivi après livraison. C'est le choix de la majorité de mes clients pros. Je vous prépare la proposition ?\n\nBien à vous,\n${sig}`;
    case "Relance":
      return `Bonjour,\n\nJe reviens vers vous concernant votre projet. Je vois précisément comment le réaliser et je peux démarrer rapidement. Souhaitez-vous que je vous réserve un créneau cette semaine ?\n\n${sig}`;
    case "Gérer une objection":
      return `Bonjour,\n\nJe comprends votre hésitation. Pour vous rassurer : vous validez une première version avant d'aller plus loin, et les révisions sont incluses. On peut aussi échanger 5 minutes sur votre besoin, sans engagement. Qu'en dites-vous ?\n\n${sig}`;
    case "Annoncer un prix":
      return `Bonjour,\n\nMerci pour votre message. Pour votre besoin${price ? `, ma formule démarre à ${price} €` : ""} : travail sur mesure, livré en ${delay} jours, révisions incluses. Quelle formule vous conviendrait le mieux ?\n\nBien cordialement,\n${sig}`;
    case "Refuser poliment":
      return `Bonjour,\n\nMerci pour votre message. Après lecture, votre demande sort du périmètre de mon service et je préfère être transparent plutôt que de vous décevoir. Je reste disponible si vous avez un autre projet correspondant à mon expertise.\n\nBonne continuation,\n${sig}`;
    default:
      return `Bonjour,\n\nMerci pour votre intérêt. Votre projet est tout à fait réalisable : je vous propose un travail sur mesure, livré en ${delay} jours, avec révisions incluses.${
        price ? ` Ma formule démarre à ${price} €.` : ""
      } Souhaitez-vous que je vous prépare une proposition détaillée ?\n\nBien cordialement,\n${sig}`;
  }
}
