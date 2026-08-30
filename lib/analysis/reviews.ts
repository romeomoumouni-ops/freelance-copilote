/* Review mining — à partir de VRAIS avis clients scrapés.
   On détecte les thèmes récurrents (points forts, points faibles) par
   dictionnaires de mots-clés. Sur ComeUp les avis sont surtout positifs :
   les points forts révèlent ce que les clients valorisent (donc ce qu'il
   faut mettre en avant), les points faibles (plus rares) sont des ouvertures. */

import type { Review, ReviewInsights } from "@/lib/marketplace/types";

const PRAISE: { theme: string; re: RegExp }[] = [
  { theme: "Réactivité & rapidité", re: /r[ée]activ|rapid|\bvite\b|disponib|ponctuel|d[ée]lai.{0,14}(respect|tenu)|dans les temps/i },
  { theme: "Écoute & communication", re: /[ée]coute|communicat|[ée]chang|compr[ée]h|patient|p[ée]dagog|accompagn|conseil/i },
  { theme: "Qualité du travail", re: /qualit|professionnel|s[ée]rieux|soign|\bpropre\b|impeccable|excellent|parfait|\btop\b|nickel/i },
  { theme: "Satisfaction & recommandation", re: /satisfait|content|ravi|recommand|je reviendr|[àa] nouveau|encore une fois|fid[èe]le|\bsuper\b|g[ée]nial|merci/i },
  { theme: "Rapport qualité-prix", re: /rapport qualit|bon prix|abordable|tarif.{0,10}(correct|juste)|prix.{0,10}(correct|juste)/i },
];

// Signaux NÉGATIFS non ambigus uniquement (on évite "aucun problème", "sans erreur"…)
const COMPLAINT: { theme: string; re: RegExp }[] = [
  { theme: "Délais / lenteur", re: /en retard|du retard|trop long|trop lent|d[ée]lai.{0,14}(non|pas).{0,8}respect|jamais re[çc]u/i },
  { theme: "Communication difficile", re: /pas de r[ée]ponse|aucune r[ée]ponse|injoignable|aucune nouvelle|ne r[ée]pond (pas|plus)/i },
  { theme: "Qualité décevante", re: /d[ée][çc]u|d[ée]cevant|b[âa]cl|pas conforme|mal fait|d[ûu] (tout )?refaire|ne correspond pas/i },
  { theme: "Prix élevé", re: /trop cher|un peu cher|cher pour ce/i },
];

function countThemes(texts: string[], dict: { theme: string; re: RegExp }[]) {
  return dict
    .map(({ theme, re }) => ({ theme, count: texts.filter((t) => re.test(t)).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function mineReviews(reviews: Review[]): ReviewInsights {
  const clientReviews = reviews.filter((r) => !r.isSellerReply && r.text.length > 3);
  const texts = clientReviews.map((r) => r.text);
  const praises = countThemes(texts, PRAISE);
  const complaints = countThemes(texts, COMPLAINT);
  // avis représentatifs : les plus détaillés
  const samples = [...clientReviews].sort((a, b) => b.text.length - a.text.length).slice(0, 4);
  return { count: clientReviews.length, praises, complaints, samples };
}
