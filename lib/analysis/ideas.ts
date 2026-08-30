/* Idées de services : dérivées de VRAIES statistiques de marché.
   Principe : on cherche les niches où la demande est forte mais où
   il reste de la place (opportunité élevée), et on les présente comme
   des pistes concrètes, chiffrées. Renouvelées quand le crawler tourne. */

import type { MarketStats } from "@/lib/marketplace/types";

export interface ServiceIdea {
  id: string;
  category: string;
  categorySlug: string;
  title: string;
  rationale: string; // pourquoi, chiffré
  demand: number;
  saturation: number;
  opportunity: number;
  suggestedPrice: number;
  angle: string; // comment se différencier
}

export function computeServiceIdeas(markets: MarketStats[], count = 3): ServiceIdea[] {
  const ranked = [...markets]
    .filter((m) => m.sampleSize > 0)
    .sort((a, b) => b.opportunity - a.opportunity);

  return ranked.slice(0, count).map((m) => {
    // prix conseillé : légèrement sous la médiane pour entrer, jamais bradé
    const suggestedPrice = Math.max(15, Math.round(m.price.median * 0.85));
    const leaderCountry = m.countries[0]?.code;
    const angle =
      m.saturation >= 70
        ? "Marché mûr : démarquez-vous par un délai plus court ou une option premium claire."
        : "Marché encore ouvert : publiez vite et visez les mots-clés des leaders pour prendre des positions.";
    return {
      id: `idea-${m.query}`,
      category: m.label,
      categorySlug: m.query,
      title: `Lancez un service « ${m.label} »`,
      rationale: `Demande ${m.demand}/100, saturation ${m.saturation}/100 (opportunité ${m.opportunity}/100). Prix médian ${m.price.median} €. Les meilleurs vendeurs cumulent jusqu'à ${m.reviews.max} avis : le marché achète vraiment.`,
      demand: m.demand,
      saturation: m.saturation,
      opportunity: m.opportunity,
      suggestedPrice,
      angle: leaderCountry
        ? `${angle} (Vendeurs dominants surtout : ${m.countries.map((c) => c.code).slice(0, 3).join(", ")}.)`
        : angle,
    };
  });
}
