/* Moteur de prospection : accroches, relances, réponses, script d'appel.
   Tout marche SANS clé IA (templates nourris des vrais signaux du
   prospect) et devient meilleur AVEC ANTHROPIC_API_KEY (Claude).
   Règle : le freelance est tutoyé dans l'app, le prospect est vouvoyé
   dans les mails. */

import { claudeComplete, hasAI } from "@/lib/ai/generate";
import { domainOf } from "@/lib/prospect/analyze";
import type { Campaign, CampaignStep, DueSend, Prospect } from "@/lib/prospect/types";

const SYSTEM =
  "Tu es un expert de la prospection par e-mail pour freelances francophones. Tu écris des mails courts, humains, sans jargon marketing, fondés uniquement sur les faits fournis. Vouvoiement. Jamais de tiret cadratin, jamais d'astérisques.";

/* -------------------- variables -------------------- */

export function fillVars(
  text: string,
  p: Prospect,
  extra: { fromName?: string; auditUrl?: string } = {}
): string {
  const signal = p.signals[0]?.hook || "j'ai repéré quelques points améliorables sur votre présence en ligne";
  return text
    .replace(/\{\{entreprise\}\}/g, p.entreprise)
    .replace(/\{\{activite\}\}/g, p.activite || "votre activité")
    .replace(/\{\{service\}\}/g, p.service || "mon accompagnement")
    .replace(/\{\{contact\}\}/g, p.contact || "")
    .replace(/\{\{site\}\}/g, domainOf(p.site) || "votre site")
    .replace(/\{\{signal\}\}/g, signal)
    .replace(/\{\{audit\}\}/g, extra.auditUrl || "")
    .replace(/\{\{moi\}\}/g, extra.fromName || "")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

/* -------------------- accroche (1er mail) -------------------- */

export async function generateAccroche(
  p: Prospect,
  fromName: string
): Promise<{ subject: string; body: string; source: "ia" | "template" }> {
  const sig1 = p.signals[0];
  const sig2 = p.signals[1];

  if (hasAI() && (sig1 || p.activite || p.service)) {
    try {
      const prompt = `Écris un mail de prospection à froid (objet + corps) pour ce prospect.
Entreprise : ${p.entreprise}${p.activite ? `, activité : ${p.activite}` : ""}${p.contact ? `, contact : ${p.contact}` : ""}.
${p.service ? `Ce que l'expéditeur veut lui proposer : ${p.service}.` : ""}
${
  p.signals.length
    ? `Constats réels faits sur leur site (${p.site}) : ${p.signals
        .slice(0, 3)
        .map((s) => s.detail)
        .join(" | ")}.`
    : "Aucun site n'a été analysé : n'affirme RIEN sur leur site web, ne dis pas qu'ils n'en ont pas."
}
Expéditeur : ${fromName}, freelance.
Règles : 90 mots max${p.signals.length ? ", un seul constat mis en avant" : ""}, aucune promesse chiffrée inventée, aucun fait inventé, pas de lien, se termine par le prénom de l'expéditeur.
Réponds au format exact :
OBJET: ...
CORPS:
...`;
      const out = await claudeComplete(SYSTEM, prompt, 500);
      const m = out.match(/OBJET:\s*(.+)\n+CORPS:\s*\n?([\s\S]+)/);
      if (m) return { subject: m[1].trim(), body: m[2].trim(), source: "ia" };
    } catch {
      /* repli template */
    }
  }

  const dom = domainOf(p.site);
  const activite = p.activite?.trim();
  const service = p.service?.trim();
  const hello = p.contact ? `Bonjour ${p.contact},` : "Bonjour,";

  const subject = dom
    ? `${p.entreprise} : une remarque sur ${dom}`
    : service
      ? `${p.entreprise} : une idée pour vous`
      : `Une idée pour ${p.entreprise}`;

  /* Sans site analysé, on n'affirme RIEN sur leur présence en ligne :
     on s'appuie sur leur activité et sur ce que le freelance propose. */
  const ouverture = dom
    ? `En préparant ma journée, je suis passé sur le site de ${p.entreprise} (${dom}).`
    : activite
      ? `Je suis tombé sur ${p.entreprise} en cherchant des professionnels de votre secteur (${activite.toLowerCase()}).`
      : `Je me permets de vous écrire au sujet de ${p.entreprise}.`;

  const proposition = service
    ? `Je suis freelance, et voici ce que je peux faire pour vous : ${service}.`
    : "C'est exactement le genre de choses que je corrige pour mes clients, en général en quelques jours.";

  const conclusion = dom
    ? "J'ai préparé un mini-audit gratuit de votre site, avec les points constatés et ce que ça change. Si vous voulez le recevoir, répondez simplement à ce mail."
    : "Si le sujet vous intéresse, répondez simplement à ce mail et je vous montre concrètement ce que ça donnerait chez vous.";

  const lines = [
    hello,
    "",
    ouverture,
    sig1 ? `Un point m'a arrêté : ${sig1.hook}.` : "",
    sig2 ? `Et en regardant de plus près, ${sig2.hook}.` : "",
    "",
    proposition,
    conclusion,
    "",
    "Bonne journée,",
    fromName || "{{moi}}",
  ].filter((l) => l !== null && l !== undefined);
  return { subject, body: lines.join("\n").replace(/\n{3,}/g, "\n\n"), source: "template" };
}

/* -------------------- relances par défaut -------------------- */

export function defaultSteps(): CampaignStep[] {
  return [
    {
      delayDays: 0,
      subject: "{{entreprise}} : une remarque sur {{site}}",
      body: `Bonjour {{contact}},

En préparant ma journée, je me suis intéressé à {{entreprise}}. Un point m'a arrêté : {{signal}}.

C'est exactement le genre de choses que je corrige pour mes clients, en général en quelques jours.

J'ai préparé un mini-audit gratuit de votre site, avec les points constatés et ce que ça change pour vous. Si vous voulez le recevoir, répondez simplement à ce mail.

Bonne journée,
{{moi}}`,
    },
    {
      delayDays: 3,
      subject: "",
      body: `Bonjour {{contact}},

Je me permets de revenir vers vous : mon mini-audit de {{site}} est toujours prêt, il tient sur une page et il est gratuit.

Le point principal que j'y détaille : {{signal}}.

Un simple « oui » en réponse et je vous l'envoie.

Bonne journée,
{{moi}}`,
    },
    {
      delayDays: 4,
      subject: "",
      body: `Bonjour {{contact}},

Dernier message de ma part, promis. Je ne veux pas encombrer votre boîte mail.

Si améliorer votre présence en ligne est un sujet pour {{entreprise}} un jour, vous avez mon adresse. Je garde votre mini-audit sous le coude.

Excellente continuation,
{{moi}}`,
    },
  ];
}

/* -------------------- suggestions de réponse -------------------- */

export interface ReplySuggestion {
  label: string;
  text: string;
}

export async function generateReplies(p: Prospect, fromName: string, theirMessage?: string): Promise<{ suggestions: ReplySuggestion[]; source: "ia" | "template" }> {
  if (hasAI() && theirMessage) {
    try {
      const prompt = `Un prospect (${p.entreprise}) répond ceci à mon mail de prospection : "${theirMessage}".
Contexte réel : ${p.activite ? `activité : ${p.activite}. ` : ""}${p.service ? `ce que je lui propose : ${p.service}. ` : ""}${
        p.signals.length ? p.signals.slice(0, 2).map((s) => s.detail).join(" | ") : "aucun constat technique."
      }
Propose 3 réponses possibles (une chaleureuse orientée rendez-vous, une qui répond à une objection de prix, une pour un « pas maintenant » qui garde la porte ouverte). 60 mots max chacune, vouvoiement, signées ${fromName}.
Format exact :
1: ...
2: ...
3: ...`;
      const out = await claudeComplete(SYSTEM, prompt, 700);
      const parts = out.split(/\n(?=\d:)/).map((s) => s.replace(/^\d:\s*/, "").trim()).filter(Boolean);
      if (parts.length >= 3) {
        return {
          suggestions: [
            { label: "Caler un rendez-vous", text: parts[0] },
            { label: "Répondre sur le prix", text: parts[1] },
            { label: "Pas maintenant", text: parts[2] },
          ],
          source: "ia",
        };
      }
    } catch {
      /* repli */
    }
  }
  const dom = domainOf(p.site) || "votre site";
  const me = fromName || "";
  return {
    source: "template",
    suggestions: [
      {
        label: "Caler un rendez-vous",
        text: `Merci pour votre retour ! Le plus simple est un rapide échange téléphonique de 15 minutes : je vous montre les points constatés sur ${dom} et ce que je propose. Quelles sont vos disponibilités cette semaine ?\n\n${me}`,
      },
      {
        label: "Répondre sur le prix",
        text: `Bonne question. Le tarif dépend de ce qu'on corrige : je préfère être précis plutôt que de vous donner une fourchette au hasard. Dites-moi ce qui compte le plus pour vous et je vous envoie une proposition claire, sans engagement.\n\n${me}`,
      },
      {
        label: "Pas maintenant",
        text: `Je comprends tout à fait, ce n'est pas le bon moment. Je vous laisse le mini-audit de ${dom} : il restera valable. Je reviendrai vers vous dans quelques mois, et d'ici là vous avez mon adresse.\n\nBonne continuation,\n${me}`,
      },
    ],
  };
}

/* -------------------- script d'appel -------------------- */

export interface CallScript {
  ouverture: string;
  constat: string;
  questions: string[];
  objections: { objection: string; reponse: string }[];
  conclusion: string;
}

export function generateCallScript(p: Prospect, fromName: string): CallScript {
  const sig = p.signals[0];
  const dom = domainOf(p.site) || "votre présence en ligne";
  return {
    ouverture: `Bonjour, ${fromName || "..."} à l'appareil. Je vous appelle au sujet de ${dom} : je vous ai envoyé un mail il y a quelques jours, je vous dérange deux minutes ?`,
    constat: sig
      ? `Je vous appelle parce que ${sig.hook}. Concrètement : ${sig.detail}`
      : p.service
        ? `Je vous appelle parce que je peux vous aider sur un point précis : ${p.service}.`
        : p.activite
          ? `Je vous appelle parce que dans votre secteur (${p.activite.toLowerCase()}), il y a souvent des choses simples à améliorer pour attirer plus de clients.`
          : `Je vous appelle parce que j'ai quelques idées pour vous amener plus de clients.`,
    questions: [
      "Est-ce que votre site vous amène des clients aujourd'hui, ou pas vraiment ?",
      "Qui s'occupe de votre site actuellement ?",
      "Si on corrigeait ce point, qu'est-ce que ça changerait pour vous ?",
    ],
    objections: [
      {
        objection: "C'est combien ?",
        reponse: "Ça dépend de ce qu'on corrige. Je préfère vous faire une proposition précise après 15 minutes d'échange plutôt qu'un chiffre au hasard. Le mini-audit, lui, est gratuit.",
      },
      {
        objection: "On a déjà quelqu'un",
        reponse: "Parfait, gardez-le. Mon mini-audit vous servira de deuxième avis : s'il confirme que tout va bien, vous êtes tranquille. S'il révèle un souci, vous saurez quoi demander.",
      },
      {
        objection: "Pas le temps",
        reponse: "Je comprends. Je vous envoie le mini-audit par mail, il se lit en deux minutes. Et je vous rappelle la semaine prochaine si ça vous va.",
      },
    ],
    conclusion: "On se cale 15 minutes cette semaine ? Je vous montre tout, et vous décidez ensuite. Quel jour vous arrange ?",
  };
}

/* -------------------- calcul des envois dus -------------------- */

export function computeDue(campaigns: Campaign[], prospects: Prospect[], suppression: string[]): DueSend[] {
  const due: DueSend[] = [];
  const byId = new Map(prospects.map((p) => [p.id, p]));
  const now = Date.now();
  for (const c of campaigns) {
    if (!c.active) continue;
    for (const ct of c.contacts) {
      if (ct.status !== "en_cours") continue;
      if (ct.stepDone >= c.steps.length) continue;
      const p = byId.get(ct.prospectId);
      if (!p || !p.email) continue;
      if (suppression.includes(p.email.trim().toLowerCase())) continue;
      if (p.status === "repondu" || p.status === "rdv" || p.status === "signe") continue;
      const step = c.steps[ct.stepDone];
      const ready =
        ct.stepDone === 0
          ? true
          : !!ct.lastSentAt && now - new Date(ct.lastSentAt).getTime() >= step.delayDays * 86400000;
      if (ready) due.push({ campaignId: c.id, campaignName: c.name, prospectId: p.id, stepIndex: ct.stepDone });
    }
  }
  return due;
}
