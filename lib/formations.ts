/* Catalogue des services rentables + formations associées.
   C'est le socle du modèle économique : chaque "idée de service rentable"
   pointe vers une formation vendue dans "Me former".
   Le marché réel de chaque service est lu via ComeUp (slug de catégorie
   ou mot-clé) pour afficher demande / prix / opportunité réels. */

export interface MarketRef {
  kind: "category" | "query";
  value: string; // slug de catégorie ComeUp OU mot-clé de recherche
  label: string;
}

export interface Formation {
  id: string;
  serviceKey: string; // relie l'idée de service à la formation
  title: string;
  tagline: string;
  price: number; // FCFA
  currency: "FCFA";
  duration: string;
  level: "Débutant" | "Intermédiaire" | "Tous niveaux";
  outcome: string; // ce que l'élève sait faire à la fin
  modules: string[];
  icon: string; // clé iconMap
}

export interface RentableService {
  key: string;
  name: string;
  emojiFreeIcon: string; // clé iconMap
  pitch: string; // pourquoi c'est rentable
  market: MarketRef;
  formationId: string;
}

export const rentableServices: RentableService[] = [
  {
    key: "copywriting",
    name: "Copywriting",
    emojiFreeIcon: "pen",
    pitch: "Écrire des textes qui vendent : pages de vente, e-mails, publicités. Une compétence rare, très demandée, sans plafond de prix.",
    market: { kind: "query", value: "copywriting", label: "Copywriting" },
    formationId: "f-copywriting",
  },
  {
    key: "miniatures",
    name: "Miniatures & bannières",
    emojiFreeIcon: "image",
    pitch: "Les créateurs et marques en achètent en continu. Livraison rapide, tickets récurrents, facile à industrialiser.",
    market: { kind: "category", value: "miniatures-et-bannieres", label: "Miniatures & bannières" },
    formationId: "f-miniatures",
  },
  {
    key: "montage-video",
    name: "Montage vidéo",
    emojiFreeIcon: "flask",
    pitch: "Explosion du contenu vidéo (TikTok, Reels, YouTube). Demande énorme et paniers élevés pour les monteurs qui maîtrisent le rythme.",
    market: { kind: "category", value: "montage-video", label: "Montage vidéo" },
    formationId: "f-montage",
  },
  {
    key: "community",
    name: "Community management",
    emojiFreeIcon: "message",
    pitch: "Chaque entreprise a besoin de réseaux sociaux vivants. Missions récurrentes au mois = revenu stable et prévisible.",
    market: { kind: "category", value: "reseaux-sociaux", label: "Réseaux sociaux" },
    formationId: "f-community",
  },
  {
    key: "site-web",
    name: "Création de site web",
    emojiFreeIcon: "globe",
    pitch: "Le service au plus fort panier moyen. Un seul client peut payer plusieurs centaines d'euros pour un site clé en main.",
    market: { kind: "category", value: "site-developpement", label: "Création de site web" },
    formationId: "f-siteweb",
  },
  {
    key: "logo",
    name: "Design & logo",
    emojiFreeIcon: "star",
    pitch: "Catégorie immense sur ComeUp. Toute nouvelle marque a besoin d'un logo : un flux de commandes qui ne se tarit jamais.",
    market: { kind: "category", value: "logos", label: "Logos" },
    formationId: "f-logo",
  },
];

export const formations: Formation[] = [
  {
    id: "f-copywriting",
    serviceKey: "copywriting",
    title: "Copywriting qui vend",
    tagline: "Écris des textes qui transforment les lecteurs en clients.",
    price: 14900,
    currency: "FCFA",
    duration: "4 h · 6 modules",
    level: "Débutant",
    outcome: "Rédiger une page de vente, une séquence d'e-mails et une publicité qui convertissent.",
    modules: [
      "Les 5 déclencheurs psychologiques de l'achat",
      "La structure d'une page de vente qui convertit",
      "Écrire des accroches irrésistibles",
      "Séquences d'e-mails qui relancent et vendent",
      "Adapter son texte à chaque plateforme",
      "Décrocher ses premiers clients en copywriting",
    ],
    icon: "pen",
  },
  {
    id: "f-miniatures",
    serviceKey: "miniatures",
    title: "Miniatures qui font cliquer",
    tagline: "Crée des visuels qui explosent le taux de clic.",
    price: 9900,
    currency: "FCFA",
    duration: "3 h · 5 modules",
    level: "Débutant",
    outcome: "Concevoir des miniatures et bannières professionnelles qui se vendent en série.",
    modules: [
      "Les codes visuels qui attirent l'œil",
      "Maîtriser Canva / Photoshop pour aller vite",
      "Composer un visuel lisible en 2 secondes",
      "Créer un pack pour vendre plus cher",
      "Trouver des clients réguliers",
    ],
    icon: "image",
  },
  {
    id: "f-montage",
    serviceKey: "montage-video",
    title: "Montage vidéo pro",
    tagline: "Monte des vidéos dynamiques qui gardent l'attention.",
    price: 19900,
    currency: "FCFA",
    duration: "6 h · 7 modules",
    level: "Intermédiaire",
    outcome: "Monter des vidéos courtes (Reels, TikTok, YouTube) au rythme professionnel.",
    modules: [
      "Prise en main de l'outil (CapCut / Premiere)",
      "Le rythme qui retient l'attention",
      "Sous-titres, effets et transitions propres",
      "Habillage sonore et musique",
      "Formats verticaux qui performent",
      "Livrer vite sans perdre en qualité",
      "Fixer ses prix et fidéliser ses clients",
    ],
    icon: "flask",
  },
  {
    id: "f-community",
    serviceKey: "community",
    title: "Community manager en 30 jours",
    tagline: "Gère les réseaux d'une marque comme un pro.",
    price: 14900,
    currency: "FCFA",
    duration: "5 h · 6 modules",
    level: "Débutant",
    outcome: "Gérer une page, créer un calendrier éditorial et décrocher des contrats au mois.",
    modules: [
      "Le rôle exact d'un community manager",
      "Construire une ligne éditoriale qui engage",
      "Calendrier de contenu sur 30 jours",
      "Créer des visuels et des captions efficaces",
      "Répondre et animer une communauté",
      "Signer des clients en abonnement mensuel",
    ],
    icon: "message",
  },
  {
    id: "f-siteweb",
    serviceKey: "site-web",
    title: "Crée des sites qui rapportent",
    tagline: "Livre des sites vitrines pro sans coder pendant des mois.",
    price: 24900,
    currency: "FCFA",
    duration: "8 h · 8 modules",
    level: "Tous niveaux",
    outcome: "Concevoir et livrer un site vitrine professionnel avec WordPress/Elementor.",
    modules: [
      "Installer et sécuriser WordPress",
      "Elementor : construire sans coder",
      "Design d'un site qui inspire confiance",
      "Pages essentielles qui convertissent",
      "Optimisation mobile et vitesse",
      "SEO de base pour être trouvé sur Google",
      "Chiffrer et vendre un site au bon prix",
      "Gérer la livraison et la maintenance",
    ],
    icon: "globe",
  },
  {
    id: "f-logo",
    serviceKey: "logo",
    title: "Design de logo professionnel",
    tagline: "Crée des identités visuelles que les marques s'arrachent.",
    price: 12900,
    currency: "FCFA",
    duration: "4 h · 6 modules",
    level: "Débutant",
    outcome: "Concevoir un logo professionnel et une mini-charte, et le vendre au bon prix.",
    modules: [
      "Les principes d'un bon logo",
      "Outils : Illustrator / Canva Pro",
      "Du brief client au concept",
      "Décliner le logo (couleurs, variantes)",
      "Présenter et livrer comme un pro",
      "Construire une offre qui se vend",
    ],
    icon: "star",
  },
];

export function formationById(id: string): Formation | undefined {
  return formations.find((f) => f.id === id);
}
export function formationForService(serviceKey: string): Formation | undefined {
  return formations.find((f) => f.serviceKey === serviceKey);
}
