/* Catégories ComeUp ciblées par le copilote (slugs réels vérifiés).
   C'est le périmètre que le crawler balaie régulièrement et que
   l'explorateur de marché propose. On ne scanne PAS "tout ComeUp" —
   on couvre en profondeur les niches qui comptent pour nos utilisateurs. */

export interface CategoryDef {
  slug: string; // slug ComeUp (/fr/category/<slug>/services)
  label: string;
  group: string;
  icon: string; // clé iconMap
}

export const categories: CategoryDef[] = [
  { slug: "site-developpement", label: "Création de site web", group: "Web & Dev", icon: "layers" },
  { slug: "wordpress", label: "WordPress", group: "Web & Dev", icon: "globe" },
  { slug: "shopify", label: "Shopify & e-commerce", group: "Web & Dev", icon: "bag" },
  { slug: "correction-de-bugs", label: "Correction de bugs", group: "Web & Dev", icon: "shield" },
  { slug: "logos", label: "Logos", group: "Design", icon: "image" },
  { slug: "design-graphisme", label: "Design & graphisme", group: "Design", icon: "image" },
  { slug: "miniatures-et-bannieres", label: "Miniatures & bannières", group: "Design", icon: "image" },
  { slug: "cartes-de-visite", label: "Cartes de visite", group: "Design", icon: "image" },
  { slug: "montage-video", label: "Montage vidéo", group: "Audiovisuel", icon: "flask" },
  { slug: "voix-off", label: "Voix off", group: "Audiovisuel", icon: "message" },
  { slug: "videos-et-photos-ugc", label: "Vidéos & photos UGC", group: "Audiovisuel", icon: "star" },
  { slug: "marketing-digital", label: "Marketing digital", group: "Marketing", icon: "trending" },
  { slug: "reseaux-sociaux", label: "Réseaux sociaux", group: "Marketing", icon: "message" },
  { slug: "creation-de-backlinks", label: "SEO & backlinks", group: "Marketing", icon: "search" },
  { slug: "e-mailing", label: "E-mailing", group: "Marketing", icon: "message" },
  { slug: "campagnes-publicitaires", label: "Publicité en ligne", group: "Marketing", icon: "zap" },
];

export function categoryBySlug(slug: string): CategoryDef | undefined {
  return categories.find((c) => c.slug === slug);
}
