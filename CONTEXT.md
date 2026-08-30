# Freelance Copilot : Guide de développement (V1)

SaaS copilote IA pour freelances (ComeUp, Fiverr, Upwork). Il ne vend pas des statistiques : il vend de la croissance. Chaque écran répond à « comment faire gagner plus d'argent au freelance ? ». Ton : consultant expert, orienté action.

## Stack & conventions

- Next.js 14 App Router + TypeScript strict + Tailwind. Port 3005.
- Toutes les pages sont des client components : première ligne `"use client";`
- Imports via alias `@/` (racine du projet). Ex : `import Card from "@/components/ui/Card";`
- Police Montserrat déjà appliquée globalement (`font-sans`). `<html lang="fr">` déjà en place.
- Interdits : nouvelle dépendance npm, modification des fichiers partagés (`components/`, `lib/`), emojis dans l'UI (icônes SVG uniquement via `@/components/icons`), texte lorem, écrans vides, `Date.now()` inutile.
- Copy 100 % en français, réaliste, orientée action. Monnaie : €.
- Apostrophes dans le JSX : utiliser `'` directement dans des chaînes JS (`{"l'analyse"}`) ou `&apos;` dans le texte JSX pour éviter les erreurs ESLint/JSX : le plus simple : écrire l'apostrophe typographique `'` (U+2019) directement dans le texte.

## Palette & style (premium, minimaliste, aéré)

- Fond : `bg-canvas` (déjà sur body, blanc cassé #F7F6F3). Cartes blanches.
- Violet principal : classes `primary-*` (50→900, 600 = #6C3EE8). CTA importants : noir (`Button variant="primary"`), violet pour actions IA (`variant="violet"`).
- Vert (emerald) = progressions ; orange (amber) = opportunités ; rouge = alertes uniquement.
- Coins très arrondis (`rounded-2xl`/`rounded-3xl`), ombres discrètes (`shadow-card`, `shadow-soft`), beaucoup d'espace blanc.
- Textes : `text-ink` (titres), `text-ink-soft` (corps), `text-ink-mute` (secondaire), bordures `border-line`.
- Animations discrètes : `animate-fade-up`, `animate-fade-in`, `hover` sur les cartes (`<Card hover>`).

## Responsive (obligatoire, vérifier mentalement à 375 px)

- Grilles : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` (adapter).
- Jamais de largeur fixe sur mobile ; `flex-wrap` sur les rangées de boutons ; tableaux dans `overflow-x-auto`.
- Le shell (sidebar 268 px + topbar) est déjà responsive : ne pas s'en occuper.

## Composants disponibles (`@/components/ui/…`, export default sauf mention)

- `Card` : `{ children, className?, flush?, hover? }` (padding p-5/p-6 par défaut ; `flush` le retire)
- `Button` : `{ variant?: "primary"(noir)|"violet"|"secondary"|"soft"|"ghost"|"danger", size?: "sm"|"md"|"lg", icon?, iconRight?, full?, ...button }`
- `Badge` : `{ tone?: "violet"|"green"|"orange"|"red"|"gray"|"dark"|"blue", dot?, children }` ; export nommé `ImpactBadge` : `{ impact: "Élevé"|"Moyen"|"Faible" }`
- `ScoreRing` : `{ value, size?=72, stroke?, suffix?, color?, className? }` (anneau de score, couleur auto selon valeur)
- `Progress` : `{ value, color?, height?, className? }`
- `Sparkline` : `{ data: number[], width?, height?, color?, fill? }`
- `LineChart` : `{ data: number[], labels: string[], color?, height?, formatValue? }` (courbe + tooltip au survol)
- `BarChart` : `{ data, labels, color?, height?, formatValue? }`
- `Modal` : `{ open, onClose, title?, subtitle?, children, footer?, size?: "md"|"lg"|"xl" }`
- `Tabs` : `{ tabs: {key,label,count?}[], active, onChange, variant?: "pill"|"segment" }`
- `Toggle` : `{ checked, onChange, label? }`
- `Select` : `{ value, onChange, options: {value,label}[], className?, ariaLabel? }`
- `StatCard` : `{ label, value, delta?, deltaPositive?, deltaLabel?, icon?, spark?, sparkColor? }`
- `PageHeader` : `{ title, subtitle?, actions? }`
- Toasts : `import { useToast } from "@/components/ui/Toast";` puis `const toast = useToast(); toast("Message", "success"|"info"|"warning")`. Utiliser pour TOUTE action simulée (Appliquer, Copier, Enregistrer…).

## Icônes (`@/components/icons`, exports nommés)

`IconSparkles, IconDashboard, IconLayers, IconGauge, IconClipboard, IconFlask, IconChat, IconInbox, IconTarget, IconClock, IconSettings, IconSearch, IconBell, IconMenu, IconX, IconCheck, IconPlus, IconCopy, IconSend, IconChevronDown/Right/Left, IconArrowRight, IconArrowUpRight, IconArrowDownRight, IconTrendingUp, IconTrendingDown, IconZap, IconStar, IconImage, IconRefresh, IconExternal, IconFilter, IconDownload, IconPen, IconLightbulb, IconShield, IconEye, IconBag, IconWallet, IconGlobe, IconLock, IconUser, IconCard, IconLogout, IconBookmark, IconBot, IconMore, IconHelp, IconAlert, IconTrash, IconThumbsUp, IconMessageSquare, IconCalendar, IconEuro, IconTrophy` : props `{ size?: number, className? }`.

Pour les icônes pilotées par les données : `import { iconMap } from "@/components/icons";` puis `const Icon = iconMap[rec.icon]; <Icon size={18} />`.

## Données simulées (`@/lib/data` : TOUT vient de là, ne rien dupliquer)

- `profile` : { name, initials, job, mainPlatform, mainService, memberSince, plan, email }
- `globalScore` (72), `globalScoreDelta` (+6), `mainScores` (5 scores du dashboard)
- `scoreDetails: ScoreDetail[]` : 9 scores détaillés { key, label, score, icon, explanation, problem, recommendation, impact, generateLabel }
- `kpis` : { views, orders, revenue, conversion } chacun { value, delta, spark[] }
- `recommendations: Recommendation[]` : { id, icon, category, title, description, impact ("Élevé"|"Moyen"|"Faible"), difficulty, time, gain, bucket ("today"|"week"|"later"|"done"), analysis, current?, proposed?, result? }
- `platforms: Platform[]` : ComeUp/Fiverr connectées + Upwork non connectée
- `saleTests: SaleTest[]` : { id, name, type, status ("En cours"|"Terminé"|"Brouillon"), start, duration, metric, current, proposed, result?, evolution?, conclusion?, progress? }
- `competitors: Competitor[]` : [0] = vous (isYou), puis 3 concurrents { score, price, rating, reviews, delivery, responseTime, options, titleQuality, descQuality, betterAt?, youBetterAt?, opportunities?, actions? }
- `history: Record<"7j"|"30j"|"90j"|"12m", HistorySeries>` : { labels, views, orders, revenue, conversion, score } ; `historySummary`
- `activities: Activity[]` : { icon, tone, text, time }
- `assistantSuggestions`, `assistantSeed`, `assistantReply(question)` → { role, content, bullets?, actions?: {label, toast}[] }
- `replyTones` (8 tons), `ReplyTone`, `sampleClientMessage`, `generateClientReply(message, tone)`
- `analysisSteps` (9 étapes de fausse analyse), `analyzedItems`

## Utilitaires (`@/lib/utils`)

`cn(...)`, `formatEuro(n)`, `formatNumber(n)`, `formatDelta(n)`, `scoreColor(score)`, `scoreTextClass(score)`, `scoreLabel(score)`

## Navigation (déjà câblée dans la sidebar)

`/` (onboarding, hors shell) · `/dashboard` · `/platforms` · `/analysis` · `/recommendations` · `/tests` · `/assistant` · `/responses` · `/competitors` · `/history` · `/settings` : toutes les pages du shell vivent dans `app/(app)/<route>/page.tsx`.
