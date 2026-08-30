# Freelance Copilot — Contrat de données RÉELLES (V2)

Le SaaS n'utilise plus de fausses données. Toute la donnée vient d'un vrai scraping ComeUp
(pages publiques lues en direct) + un moteur d'analyse. **Interdiction absolue d'importer `@/lib/data`**
(ancien module de démo) dans les pages. Utilisez `useProfile()` et `@/lib/client`.

## Le profil analysé — `useProfile()` (contexte global)

```ts
import { useProfile } from "@/components/ProfileProvider";
const { analysis, hydrated, loading, error, analyze, clear } = useProfile();
```

- `hydrated` : false tant que le localStorage n'est pas relu (afficher un skeleton bref si `!hydrated`).
- `analysis` : `ProfileAnalysis | null`. **Si `null` (et `hydrated`), afficher `<EmptyProfile />`**
  (`import EmptyProfile from "@/components/EmptyProfile"`) — jamais un écran vide, jamais de fausses données.
- `analyze(url)` : lance une vraie analyse (utilisé surtout par l'onboarding).
- `clear()` : oublie le profil.

### Forme de `ProfileAnalysis` (analysis)

```ts
analysis = {
  profile: { platform, username, url, displayName: string|null, country: string|null,
             gigs: Gig[], scrapedAt },
  market: MarketStats,
  mainGig: Gig | null,               // service phare (celui collé / le plus en vue)
  globalScore: number,               // 0–100
  scores: ScoreItem[],               // 5 sous-scores détaillés
  competitors: Gig[],                // vrais concurrents (top du marché par avis)
  marketKeywords: {word,count}[],    // mots-clés qui dominent le marché
  missingKeywords: string[],         // mots-clés du marché absents des titres du user
  recommendations: Recommendation[],
  generatedAt: string,
}

Gig = { platform:"comeup"|"fiverr", id, url, title, seller, sellerCountry:string|null,
        price:number /*EUR*/, priceMax:number|null, currency, priceDisplay:string|null,
        rating:number|null, reviews:number, deliveryDays:number|null, responseTime:string|null,
        description:string|null, category:string|null, categorySlug:string|null,
        sponsored:boolean, image:string|null, scrapedAt }

MarketStats = { platform, query, label, sampleSize,
                price:{avg,median,min,max}, ratingAvg,
                reviews:{avg,median,max,total},
                saturation, demand, opportunity,   // 0–100, ESTIMATIONS (dire "estimé")
                topGigs: Gig[], countries:[{code,share}], scrapedAt }

ScoreItem = { key, label, score:0-100, verdict:string, detail:string, recommendation:string }
Recommendation = { id, icon, category, title, description,
                   impact:"Élevé"|"Moyen"|"Faible", gain:string, evidence:string }
```

Types importables : `import type { ProfileAnalysis, Gig, MarketStats } from "@/lib/client"`.

## Appels API — `@/lib/client`

```ts
import { getStatus, getCategories, getMarket, getIdeas, getCompetitors, generate } from "@/lib/client";

getStatus()                       // → { sources: SourceStatus[], ai: boolean }
getCategories()                   // → { categories: CategoryDef[] }  CategoryDef={slug,label,group,icon}
getMarket({category})             // → { market: MarketStats }   (ou {q:"motclé"})
getIdeas(count)                   // → { ideas: ServiceIdea[] }
getCompetitors({category|q|url})  // → { market: MarketStats, competitors: Gig[] }
generate({kind:"reply", message, tone, context})       // → { text, source:"ia"|"template" }
generate({kind:"description", url?|title?})            // → { text, source }
```

`ServiceIdea = { id, category, categorySlug, title, rationale, demand, saturation, opportunity, suggestedPrice, angle }`
`SourceStatus = { platform, available, mode, message }`

Ces appels **scrapent en direct** (quelques secondes la 1re fois, puis cache 6 h). Toujours prévoir
un état de chargement (spinner + message) et un `try/catch` affichant un message d'erreur propre.

## Règles

- `"use client"` en 1re ligne. Pages dans `app/(app)/<route>/page.tsx`.
- Design system inchangé : voir `CONTEXT.md` (Card, Button, Badge, ScoreRing, Progress, LineChart, BarChart,
  Modal, Tabs, Toggle, Select, PageHeader, useToast). Icônes via `@/components/icons` (SVG, jamais d'emoji).
  `iconMap` pour les icônes pilotées par données (ex: `iconMap[cat.icon]`).
- Palette : fond canvas, cartes blanches arrondies, violet `primary`, CTA noirs, vert=progression,
  orange=opportunité, rouge=alerte. Beaucoup d'espace blanc. Responsive 375px→desktop obligatoire.
- **Toute valeur affichée doit venir de la vraie donnée.** Aucune invention. Les indices demande/
  saturation/opportunité sont des estimations → le préciser discrètement (« estimé »).
- Les boutons produisent des interactions réelles (toast via `useToast`, modale, appel API, copie presse-papiers).
- Liens externes vers les vrais services : `<a href={gig.url} target="_blank" rel="noreferrer">`.
- Prix déjà en EUR (nombre) → afficher `${g.price} €` ou via `formatEuro` de `@/lib/utils`.
- Utilitaires `@/lib/utils` : `cn, formatEuro, formatNumber, scoreColor, scoreTextClass, scoreLabel`.
```
