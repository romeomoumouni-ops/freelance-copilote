/* "Coup de gueule du copilote" — un audit cash mais juste, basé sur les
   VRAIES données du profil. Franc, avec du caractère, mais chaque pique
   se termine par une action concrète. Aucun chiffre inventé. */

import type { ProfileAnalysis } from "@/lib/analysis/engine";

export interface RoastLine {
  burn: string; // la pique (vraie, chiffrée)
  fix: string; // la solution concrète
}

export interface Roast {
  headline: string;
  lines: RoastLine[];
  score: number;
  verdict: string; // punchline finale
}

export function generateRoast(a: ProfileAnalysis): Roast {
  const { market, scores, missingKeywords, mainGig, globalScore } = a;
  const lines: RoastLine[] = [];

  const priceScore = scores.find((s) => s.key === "prix");
  const myPrice = mainGig?.price ?? 0;
  if (myPrice > 0 && market.price.median > 0 && myPrice < market.price.median * 0.85) {
    const gap = Math.round((1 - myPrice / market.price.median) * 100);
    lines.push({
      burn: `Ton prix : ${myPrice} €. Le marché : ${market.price.median} €. Tu bosses ${gap} % moins cher pour le même boulot, et tu appelles ça de l'humilité.`,
      fix: `Monte à ${market.price.median} €. À note égale, personne ne te trouvera "trop cher".`,
    });
  }

  if (missingKeywords.length >= 2) {
    lines.push({
      burn: `Tes acheteurs tapent « ${missingKeywords.slice(0, 3).join(" », « ")} »… et ton titre les ignore royalement. Forcément que tu es invisible.`,
      fix: `Mets ces mots dans ton titre et ta description. C'est gratuit et ça change tout.`,
    });
  }

  const traction = scores.find((s) => s.key === "traction");
  const myReviews = mainGig?.reviews ?? 0;
  if (market.reviews.max > 0 && myReviews < market.reviews.max * 0.5) {
    lines.push({
      burn: `${myReviews} avis. Le leader : ${market.reviews.max}. Tu comptes rattraper ça en croisant les doigts ?`,
      fix: `Demande un avis à CHAQUE livraison. Le volume d'avis, c'est ton classement.`,
    });
  }

  const packs = mainGig?.packs?.length ?? 0;
  if (packs < 3) {
    lines.push({
      burn: `${packs} palier${packs > 1 ? "s" : ""} d'offre. Sans formule Premium, même le client prêt à payer plus ne peut pas. Tu refuses son argent.`,
      fix: `Ajoute un pack haut de gamme. Ton panier moyen te dira merci.`,
    });
  }

  const seo = scores.find((s) => s.key === "seo");
  if (seo && seo.score < 55 && lines.length < 2) {
    lines.push({
      burn: `Côté SEO, c'est le désert. Tu attends que les clients devinent que tu existes ?`,
      fix: seo.recommendation,
    });
  }

  // filet de sécurité : toujours au moins 2 lignes
  if (lines.length < 2) {
    const weakest = [...scores].sort((x, y) => x.score - y.score)[0];
    if (weakest) {
      lines.push({
        burn: `Ton point faible, c'est « ${weakest.label} » (${weakest.score}/100). Et tu fais comme si de rien n'était.`,
        fix: weakest.recommendation,
      });
    }
  }

  let headline: string;
  let verdict: string;
  if (globalScore < 50) {
    headline = "Aïe. Là, faut vraiment qu'on parle.";
    verdict = "Le potentiel est là, mais pour l'instant tu laisses filer des commandes tous les jours. On corrige ça ?";
  } else if (globalScore < 70) {
    headline = "C'est pas mauvais… mais tu te sabotes tout seul.";
    verdict = "Deux ou trois corrections et tu changes de division. Le plus dur est déjà fait.";
  } else if (globalScore < 85) {
    headline = "Solide. Mais tu laisses de l'argent sur la table.";
    verdict = "Tu es bon. Applique ces points et tu deviens redoutable.";
  } else {
    headline = "Respect. Franchement, peu de profils sont à ce niveau.";
    verdict = "Un dernier coup de polish et tu domines ta catégorie.";
  }

  return { headline, lines: lines.slice(0, 4), score: globalScore, verdict };
}
