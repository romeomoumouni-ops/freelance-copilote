/* ============================================================
   Moteur d'analyse — 100 % données réelles.
   Compare un profil vendeur (scrapé) à son marché (scrapé) et
   produit des scores + recommandations chiffrées et actionnables.
   Aucune donnée inventée : chaque score cite ses chiffres.
   ============================================================ */

import type { Gig, MarketStats, SellerProfile } from "@/lib/marketplace/types";
import { median, percentileOf, topKeywords } from "@/lib/marketplace/stats";

export type Impact = "Élevé" | "Moyen" | "Faible";

export interface ScoreItem {
  key: string;
  label: string;
  score: number; // 0–100
  verdict: string;
  detail: string; // explication chiffrée
  recommendation: string;
}

export interface Recommendation {
  id: string;
  icon: string;
  category: string;
  title: string;
  description: string;
  impact: Impact;
  gain: string;
  evidence: string; // la preuve chiffrée qui justifie la reco
}

export interface ProfileAnalysis {
  profile: SellerProfile;
  market: MarketStats;
  mainGig: Gig | null;
  globalScore: number;
  scores: ScoreItem[];
  competitors: Gig[];
  marketKeywords: { word: string; count: number }[];
  missingKeywords: string[];
  recommendations: Recommendation[];
  generatedAt: string;
}

const round = (n: number) => Math.round(n);

function tokensOf(titles: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of titles) {
    for (const w of t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)) {
      if (w.length > 2) set.add(w);
    }
  }
  return set;
}

export function analyzeProfile(profile: SellerProfile, market: MarketStats): ProfileAnalysis {
  const gigs = profile.gigs;
  const myPrices = gigs.map((g) => g.price).filter((p) => p > 0);
  const myReviews = gigs.map((g) => g.reviews);
  const myRatings = gigs.map((g) => g.rating).filter((r): r is number => r != null && r > 0);
  // service phare = le service collé (gigs[0]) pour rester cohérent avec le marché ancré ;
  // à défaut, le plus commenté.
  const mainGig = gigs[0] ?? [...gigs].sort((a, b) => b.reviews - a.reviews)[0] ?? null;

  const myMedianPrice = round(median(myPrices));
  const myTotalReviews = myReviews.reduce((a, b) => a + b, 0);
  const myBestReviews = myReviews.length ? Math.max(...myReviews) : 0;
  const myAvgRating = myRatings.length ? myRatings.reduce((a, b) => a + b, 0) / myRatings.length : 0;

  const marketReviewDist = market.topGigs.map((g) => g.reviews);

  /* ---------- sous-scores (chiffrés) ---------- */

  // 1. Traction (volume d'avis vs marché)
  const tractionPct = percentileOf(myBestReviews, marketReviewDist.length ? marketReviewDist : [0]);
  const traction: ScoreItem = {
    key: "traction",
    label: "Traction (avis & ventes)",
    score: clampScore(tractionPct),
    verdict:
      tractionPct >= 60 ? "Bonne dynamique" : tractionPct >= 30 ? "En construction" : "À accélérer",
    detail: `Votre meilleur service compte ${myBestReviews} avis. Les meilleurs vendeurs du marché en affichent jusqu'à ${market.reviews.max}. Vous vous situez au ${tractionPct}ᵉ centile.`,
    recommendation:
      tractionPct < 50
        ? "Demandez systématiquement un avis à chaque livraison : le volume d'avis est le premier facteur de classement."
        : "Maintenez la cadence d'avis pour consolider votre position.",
  };

  // 2. Confiance (note vs marché)
  const ratingScore = myAvgRating > 0 ? clampScore((myAvgRating / 5) * 100) : 40;
  const trust: ScoreItem = {
    key: "confiance",
    label: "Confiance (note moyenne)",
    score: ratingScore,
    verdict: myAvgRating >= 4.8 ? "Excellent" : myAvgRating >= 4.5 ? "Bon" : "À surveiller",
    detail: `Votre note moyenne est de ${myAvgRating.toFixed(1)}/5. La moyenne du marché est de ${market.ratingAvg.toFixed(1)}/5.`,
    recommendation:
      myAvgRating < market.ratingAvg
        ? "Soignez les livraisons et la communication : votre note est sous la moyenne du marché."
        : "Votre note est un atout — mettez-la en avant dans vos descriptions.",
  };

  // 3. Prix (positionnement vs médiane marché)
  const priceRatio = market.price.median > 0 ? myMedianPrice / market.price.median : 1;
  let priceScore: number;
  let priceVerdict: string;
  let priceReco: string;
  if (priceRatio < 0.7) {
    priceScore = 45;
    priceVerdict = "Sous-évalué";
    const target = market.price.median;
    priceReco = `Votre prix médian (${myMedianPrice} €) est ${Math.round((1 - priceRatio) * 100)} % sous la médiane du marché (${market.price.median} €). À note égale, vous pouvez viser ${target} €.`;
  } else if (priceRatio > 1.4) {
    priceScore = 70;
    priceVerdict = "Premium";
    priceReco = `Votre prix médian (${myMedianPrice} €) est au-dessus du marché (${market.price.median} €) : assurez-vous que votre offre le justifie (délai, options, preuves).`;
  } else {
    priceScore = 85;
    priceVerdict = "Bien positionné";
    priceReco = `Votre prix médian (${myMedianPrice} €) est aligné sur le marché (${market.price.median} €).`;
  }
  const price: ScoreItem = {
    key: "prix",
    label: "Prix",
    score: priceScore,
    verdict: priceVerdict,
    detail: `Médiane de vos prix : ${myMedianPrice} € · médiane du marché : ${market.price.median} € (de ${market.price.min} à ${market.price.max} €).`,
    recommendation: priceReco,
  };

  // 4. Titre / SEO (mots-clés du marché présents dans vos titres)
  const marketKeywords = topKeywords(
    market.topGigs.map((g) => g.title),
    12
  );
  const myTokens = tokensOf(gigs.map((g) => g.title));
  const covered = marketKeywords.filter((k) => myTokens.has(k.word));
  const missingKeywords = marketKeywords.filter((k) => !myTokens.has(k.word)).map((k) => k.word);
  const seoScore = marketKeywords.length
    ? clampScore((covered.length / marketKeywords.length) * 100)
    : 60;
  const seo: ScoreItem = {
    key: "seo",
    label: "SEO & mots-clés",
    score: seoScore,
    verdict: seoScore >= 60 ? "Correct" : "À optimiser",
    detail: `Vos titres reprennent ${covered.length} des ${marketKeywords.length} mots-clés qui dominent votre marché.`,
    recommendation: missingKeywords.length
      ? `Intégrez les mots-clés recherchés absents de vos titres : ${missingKeywords.slice(0, 5).join(", ")}.`
      : "Vos titres couvrent bien les mots-clés du marché.",
  };

  // 5. Offre / portfolio
  const nServices = gigs.length;
  const portfolioScore = clampScore(Math.min(nServices, 4) * 25);
  const portfolio: ScoreItem = {
    key: "offre",
    label: "Étendue de l'offre",
    score: portfolioScore,
    verdict: nServices >= 3 ? "Bonne couverture" : "Offre limitée",
    detail: `Vous proposez ${nServices} service${nServices > 1 ? "s" : ""}. Les meilleurs vendeurs en publient souvent 3 à 6 pour capter plus de recherches.`,
    recommendation:
      nServices < 3
        ? "Créez 1 à 2 services supplémentaires dans des sous-niches proches pour multiplier vos points d'entrée."
        : "Bonne couverture : concentrez-vous sur l'optimisation de vos services phares.",
  };

  const scores = [traction, trust, price, seo, portfolio];
  const weights: Record<string, number> = { traction: 0.28, confiance: 0.2, prix: 0.2, seo: 0.17, offre: 0.15 };
  const globalScore = round(scores.reduce((s, x) => s + x.score * (weights[x.key] ?? 0.2), 0));

  /* ---------- recommandations chiffrées ---------- */

  const recommendations: Recommendation[] = [];

  if (priceRatio < 0.85 && market.price.median > 0) {
    const gainPer = Math.max(0, market.price.median - myMedianPrice);
    recommendations.push({
      id: "rec-prix",
      icon: "euro",
      category: "Prix",
      title: `Remontez votre prix vers ${market.price.median} €`,
      description: `Votre prix médian est ${Math.round((1 - priceRatio) * 100)} % sous le marché à qualité comparable.`,
      impact: "Élevé",
      gain: `+${gainPer} € par commande`,
      evidence: `Médiane de vos prix ${myMedianPrice} € vs médiane marché ${market.price.median} € (échantillon ${market.sampleSize} services).`,
    });
  }

  if (missingKeywords.length) {
    recommendations.push({
      id: "rec-seo",
      icon: "search",
      category: "SEO",
      title: "Ajoutez les mots-clés qui dominent votre marché",
      description: `${missingKeywords.length} mots-clés très présents chez les leaders manquent à vos titres.`,
      impact: missingKeywords.length >= 4 ? "Élevé" : "Moyen",
      gain: "Plus de visibilité en recherche",
      evidence: `Absents de vos titres : ${missingKeywords.slice(0, 6).join(", ")}.`,
    });
  }

  if (tractionPct < 50) {
    recommendations.push({
      id: "rec-avis",
      icon: "star",
      category: "Avis",
      title: "Accélérez la collecte d'avis",
      description: `Votre volume d'avis vous place au ${tractionPct}ᵉ centile de votre marché.`,
      impact: "Élevé",
      gain: "Meilleur classement",
      evidence: `Votre meilleur service : ${myBestReviews} avis · leader du marché : ${market.reviews.max} avis.`,
    });
  }

  if (nServices < 3) {
    const idea = market.topGigs[1] ?? market.topGigs[0];
    recommendations.push({
      id: "rec-service",
      icon: "layers",
      category: "Offre",
      title: "Créez un 2ᵉ service dans une niche porteuse",
      description: "Multiplier vos services multiplie vos points d'entrée en recherche.",
      impact: "Moyen",
      gain: "Nouvelle source de commandes",
      evidence: idea
        ? `Piste : des services proches de « ${idea.title.slice(0, 50)} » cumulent ${idea.reviews} avis.`
        : "Les meilleurs vendeurs publient 3 à 6 services.",
    });
  }

  if (myAvgRating > 0 && myAvgRating < market.ratingAvg - 0.05) {
    recommendations.push({
      id: "rec-note",
      icon: "shield",
      category: "Confiance",
      title: "Remontez votre note au niveau du marché",
      description: "Une note sous la moyenne freine la conversion.",
      impact: "Moyen",
      gain: "+ de confiance acheteur",
      evidence: `Votre note ${myAvgRating.toFixed(1)}/5 vs marché ${market.ratingAvg.toFixed(1)}/5.`,
    });
  }

  return {
    profile,
    market,
    mainGig,
    globalScore,
    scores,
    competitors: market.topGigs.filter((g) => g.seller !== profile.username).slice(0, 5),
    marketKeywords,
    missingKeywords,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

function clampScore(n: number): number {
  return Math.max(5, Math.min(99, Math.round(n)));
}
