# Freelance Copilote

Le copilote IA qui aide vraiment les freelances à vendre plus sur les marketplaces (ComeUp, Fiverr).
**Aucune donnée simulée** : le SaaS lit réellement les pages publiques, mesure votre marché et vous dit
quoi améliorer, avec des chiffres à l'appui.

## Ce que ça fait, pour de vrai

- **Analyse de profil réelle** : collez le lien public de votre profil / d'un service ComeUp → le copilote
  lit tous vos services (titres, prix, notes, avis), calcule vos scores et vos priorités.
- **Comparaison marché en direct** : votre profil est comparé aux vrais services de votre niche
  (prix médian, note moyenne, demande, saturation, opportunité, répartition pays des vendeurs).
- **Vrais concurrents** : les services les mieux notés de votre marché, avec ce qui les distingue.
- **Explorer le marché** : les statistiques réelles de chaque niche ComeUp.
- **Idées de services** : les niches à forte demande et faible concurrence, chiffrées.
- **Réponses clients & descriptions** : générées à partir de ce qui marche réellement dans votre marché.

## Lancer le projet

Node 20+.

```bash
npm install
npm run dev
```

→ **http://localhost:3005**

ComeUp fonctionne **sans aucune clé**. Pour activer Fiverr et la rédaction par IA, copiez
`.env.example` en `.env.local` et renseignez les variables (toutes optionnelles).

## Comment ça marche (architecture)

- **Scraping ComeUp** (`lib/marketplace/comeup.ts`) : lecture des pages publiques rendues côté serveur
  (fetch + parsing, JSON-LD `Product`), sans navigateur ni proxy. Prix F CFA convertis en EUR (XOF fixé à l'euro).
  Client HTTP poli avec rythme + cache (`lib/marketplace/http.ts`, `store.ts`).
- **Fiverr** (`lib/marketplace/fiverr.ts`) : via un fournisseur de scraping (Apify / Bright Data), activé par clé.
- **Moteur d'analyse** (`lib/analysis/*`) : scores et recommandations chiffrés, comparaison au marché, idées de services.
- **IA** (`lib/ai/generate.ts`) : Claude si `ANTHROPIC_API_KEY`, sinon templates nourris de vraies données.
- **API** (`app/api/*`) : `analyze`, `market`, `competitors`, `ideas`, `generate`, `status`, `crawl`.
- **Front** : `useProfile()` (contexte, profil analysé persistant) + `@/lib/client` (appels typés).

## Rafraîchir les statistiques de marché (cron)

La route `POST /api/crawl` re-scrape les catégories couvertes et enregistre des snapshots (historique réel).
À planifier via Vercel Cron ou une GitHub Action (protégée par `CRAWL_SECRET`) :

```bash
curl -X POST http://localhost:3005/api/crawl -H "Authorization: Bearer $CRAWL_SECRET"
```

## Note légale

Le copilote lit uniquement des **données publiques** (comme un visiteur), avec un rythme respectueux et du cache.
C'est de l'analyse de marché : comme le font les outils SEO. Le scraping reste contraire aux CGU des plateformes ;
à utiliser en connaissance de cause. Aucune donnée personnelle n'est stockée inutilement.

## Pages

Onboarding `/` · Dashboard · Explorer le marché · Analyse · Recommandations · Idées de services ·
Assistant IA · Réponses clients · Concurrents · Historique · Paramètres.
