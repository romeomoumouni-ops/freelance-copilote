import { NextResponse } from "next/server";
import { hasAI, claudeComplete } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Conseils — l'expert ComeUp.
   Avec ANTHROPIC_API_KEY : réponse rédigée par Claude, ancrée sur le contexte réel.
   Sans clé : réponses d'expert par règles, nourries du même contexte réel. */

const SYSTEM = `Tu es un expert de la marketplace ComeUp (ex-5euros.com), consultant pour vendeurs freelances.
Tu réponds en français, tutoiement, concret et actionnable, 150 mots max.
Tu t'appuies UNIQUEMENT sur le contexte chiffré fourni (profil + marché du vendeur) quand il existe — jamais de chiffres inventés.
Termine toujours par UNE action à faire aujourd'hui.`;

interface Ctx {
  seller?: string | null;
  score?: number;
  marketLabel?: string;
  priceMedian?: number;
  myMedianPrice?: number;
  reviewsMax?: number;
  myReviews?: number;
  missingKeywords?: string[];
  topRecos?: string[];
}

function ruleAnswer(q: string, c: Ctx): string {
  const lq = q.toLowerCase();
  const action = (s: string) => `\n\n👉 À faire aujourd'hui : ${s}`;

  if (/prix|tarif|cher/.test(lq)) {
    if (c.priceMedian && c.myMedianPrice) {
      const under = c.myMedianPrice < c.priceMedian;
      return `Sur ton marché « ${c.marketLabel} », le prix médian est de ${c.priceMedian} € et ton prix médian à toi est de ${c.myMedianPrice} €. ${
        under
          ? `Tu es en dessous du marché : à qualité et note égales, un prix trop bas fait douter les acheteurs plutôt que les attirer. Monte progressivement (palier de 10-15 %), et compense par une offre claire en 3 packs.`
          : `Tu es au niveau (ou au-dessus) du marché : assure-toi que ta page de vente justifie ce positionnement (preuves, portfolio, délais).`
      }${action(under ? `remonte ton prix de base vers ${c.priceMedian} €.` : "ajoute une preuve forte (avis, réalisation) en haut de ta description.")}`;
    }
    return `Le bon prix sur ComeUp se cale sur la médiane de ta niche, pas sur ton intuition. Analyse d'abord ton profil (onglet Analyse) pour que je te donne tes chiffres exacts.${action("lance ton analyse pour connaître le prix médian de ta niche.")}`;
  }
  if (/avis|note|étoile|etoile/.test(lq)) {
    return `Sur ComeUp, le volume d'avis est le premier facteur de classement — c'est ta preuve de ventes.${
      c.myReviews != null && c.reviewsMax ? ` Ton service phare compte ${c.myReviews} avis, le leader de ta niche en a ${c.reviewsMax}.` : ""
    } La méthode : livrer vite et propre, puis demander l'avis À CHAQUE livraison avec un message personnalisé (« Si le résultat te plaît, un avis m'aiderait énormément 🙏 »).${action("prépare ton message type de demande d'avis et envoie-le à tes 3 derniers clients.")}`;
  }
  if (/commande|vendre|vente|client|démarrer|demarrer|lancer/.test(lq)) {
    return `Les premières commandes ComeUp viennent de 3 leviers : un titre avec les mots-clés que les acheteurs tapent vraiment${
      c.missingKeywords?.length ? ` (il te manque : ${c.missingKeywords.slice(0, 3).join(", ")})` : ""
    }, une miniature pro qui donne envie de cliquer, et un prix d'entrée légèrement sous la médiane pour tes 10 premières ventes — puis tu remontes.${action("va dans « Créer mon profil » et génère ta miniature + ta page de vente.")}`;
  }
  if (/titre|mot[- ]?cl|seo|visib|classement/.test(lq)) {
    return `Ton titre est ton SEO sur ComeUp : les acheteurs cherchent par mots-clés, et l'algorithme classe par pertinence + ventes.${
      c.missingKeywords?.length ? ` Sur ta niche, il manque à tes titres : ${c.missingKeywords.slice(0, 4).join(", ")}.` : ""
    } Structure gagnante : « Je vais + résultat + mot-clé fort + délai ».${action("réécris le titre de ton service phare avec 2 mots-clés du marché.")}`;
  }
  if (/photo|profil|bio|présentation|presentation/.test(lq)) {
    return `Ton profil = ta vitrine de confiance : photo pro (visage net, fond propre), bio courte orientée résultats (« j'aide X à obtenir Y »), et 2-3 services complémentaires plutôt qu'un seul. Les profils vérifiés avec photo pro convertissent nettement mieux.${action("génère ta photo de profil dans « Créer mon profil » et mets à jour ta bio.")}`;
  }
  if (/miniature|image|visuel/.test(lq)) {
    return `La miniature fait le taux de clic : titre lisible en 5-6 mots, contraste fort, une seule idée visuelle. Les captures d'écran brutes performent 2× moins que les visuels composés.${action("génère une miniature 1280×720 dans « Créer mon profil » et remplace celle de ton service phare.")}`;
  }
  const recos = c.topRecos?.length ? ` D'après ton analyse, tes priorités sont : ${c.topRecos.slice(0, 2).join(" · ")}.` : "";
  return `Bonne question. La règle d'or ComeUp : visibilité (titre + mots-clés) × conversion (miniature + page de vente + avis) × récurrence (livrer vite, demander l'avis, relancer).${recos}${action(c.topRecos?.length ? "traite ta première priorité dans l'onglet Analyse." : "lance ton analyse pour obtenir tes priorités chiffrées.")}`;
}

export async function POST(req: Request) {
  try {
    const { question, context } = (await req.json()) as { question: string; context?: Ctx };
    if (!question?.trim()) return NextResponse.json({ error: "Question vide." }, { status: 400 });

    if (hasAI()) {
      try {
        const ctxStr = context ? `\n\nContexte réel du vendeur (à utiliser) : ${JSON.stringify(context)}` : "";
        const text = await claudeComplete(SYSTEM, `${question.trim()}${ctxStr}`, 500);
        return NextResponse.json({ text, source: "ia" });
      } catch {
        /* repli règles */
      }
    }
    return NextResponse.json({ text: ruleAnswer(question, context ?? {}), source: "expert" });
  } catch (e) {
    return NextResponse.json({ error: "Réponse impossible : " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
