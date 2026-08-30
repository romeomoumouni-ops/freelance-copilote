"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { getCategories, getMarket, generate, type CategoryDef, type MarketStats } from "@/lib/client";
import { topKeywords } from "@/lib/marketplace/stats";
import { useProfile } from "@/components/ProfileProvider";
import { IconRefresh, IconDownload, IconCopy, IconAlert, IconCheck } from "@/components/icons";

/* ============================================================
   Créer mon profil ComeUp — 3 ateliers :
   1. Photo de profil générée par IA (selon ta niche)
   2. Services & miniatures (selon ce qui marche sur ComeUp)
   3. Page de vente (description calibrée sur ton marché réel)
   ============================================================ */

type Atelier = "photo" | "services" | "vente";

const PHOTO_STYLES = [
  { key: "studio", label: "Studio pro", prompt: "professional studio headshot portrait, neutral light gray background, soft studio lighting, confident warm smile, sharp focus, high quality photography" },
  { key: "jaune", label: "Fond jaune", prompt: "professional headshot portrait, bright yellow studio background, modern lighting, confident smile, sharp focus, high quality photography" },
  { key: "moderne", label: "Moderne", prompt: "modern professional portrait, minimalist office background softly blurred, natural window light, approachable expression, high quality photography" },
];

const NICHE_PROMPTS: Record<string, string> = {
  "site-developpement": "web developer",
  wordpress: "wordpress web developer",
  shopify: "e-commerce specialist",
  "correction-de-bugs": "software engineer",
  logos: "graphic designer",
  "design-graphisme": "graphic designer",
  "miniatures-et-bannieres": "digital designer",
  "montage-video": "video editor",
  "voix-off": "voice-over artist with microphone",
  "videos-et-photos-ugc": "content creator",
  "marketing-digital": "digital marketing consultant",
  "reseaux-sociaux": "social media manager",
  "creation-de-backlinks": "SEO consultant",
  "e-mailing": "email marketing specialist",
  "campagnes-publicitaires": "advertising specialist",
};

const THUMB_BG: Record<string, string> = {
  default: "abstract modern gradient background, professional, vibrant, clean design, no text",
};

function nicheSubject(slug: string): string {
  return NICHE_PROMPTS[slug] ?? "freelance professional";
}

export default function CreatePage() {
  const { analysis } = useProfile();
  const [atelier, setAtelier] = useState<Atelier>("photo");
  const [cats, setCats] = useState<CategoryDef[]>([]);
  const [niche, setNiche] = useState("site-developpement");

  useEffect(() => {
    getCategories().then((d) => setCats(d.categories)).catch(() => {});
  }, []);

  const nicheOptions = cats.map((c) => ({ value: c.slug, label: c.label }));
  const nicheLabel = cats.find((c) => c.slug === niche)?.label ?? niche;

  return (
    <>
      <PageHeader
        title="Créer mon profil ComeUp"
        subtitle="Photo de profil, services, miniatures et pages de vente — générés selon ta niche et ce qui marche vraiment sur ComeUp."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs
          variant="segment"
          active={atelier}
          onChange={(k) => setAtelier(k as Atelier)}
          tabs={[
            { key: "photo", label: "Photo de profil" },
            { key: "services", label: "Services & miniatures" },
            { key: "vente", label: "Page de vente" },
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-ink-mute">Ta niche :</span>
          <Select value={niche} onChange={setNiche} options={nicheOptions.length ? nicheOptions : [{ value: niche, label: nicheLabel }]} ariaLabel="Choisir ta niche" />
        </div>
      </div>

      {atelier === "photo" && <PhotoAtelier niche={niche} nicheLabel={nicheLabel} />}
      {atelier === "services" && <ServicesAtelier niche={niche} nicheLabel={nicheLabel} sellerName={analysis?.profile.displayName ?? null} />}
      {atelier === "vente" && <VenteAtelier niche={niche} nicheLabel={nicheLabel} />}
    </>
  );
}

/* ================= 1. PHOTO DE PROFIL IA ================= */

function PhotoAtelier({ niche, nicheLabel }: { niche: string; nicheLabel: string }) {
  const toast = useToast();
  const [style, setStyle] = useState(PHOTO_STYLES[0]);
  const [genKey, setGenKey] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [started, setStarted] = useState(false);

  const subjects = [
    "young african business man",
    "young african business woman",
    "african man with glasses, short beard",
    "african woman, elegant braids",
  ];
  const variants = subjects.map((subject, i) => ({
    prompt: `${style.prompt}, ${subject}, ${nicheSubject(niche)}, square format`,
    seed: `${niche}-${style.key}-${genKey}-${i * 37 + 11}`,
  }));

  async function download(src: string, name: string) {
    try {
      const blob = await (await fetch(src)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Photo téléchargée — ajoute-la sur ton profil ComeUp", "success");
    } catch {
      toast("Téléchargement impossible — réessaie", "warning");
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-ink">Ta photo de profil professionnelle</h3>
            <p className="mt-0.5 text-[13px] text-ink-mute">
              Générée par IA pour la niche « {nicheLabel} ». Choisis un style, télécharge celle que tu préfères.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PHOTO_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setStyle(s);
                  setLoadedCount(0);
                }}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                  style.key === s.key ? "bg-brand text-ink" : "bg-ink/5 text-ink-soft hover:bg-ink/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {!started ? (
          <div className="mt-5 flex flex-col items-center rounded-2xl bg-primary-50 py-10 text-center">
            <p className="max-w-sm text-[13px] text-ink-soft">
              4 propositions de photos seront générées par IA — gratuit, en quelques secondes.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setStarted(true)}>
              Générer mes photos
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {variants.map(({ prompt: vPrompt, seed }, i) => {
                const src = `/api/image?prompt=${encodeURIComponent(vPrompt)}&w=512&h=512&seed=${encodeURIComponent(seed)}`;
                return (
                  <div key={seed} className="group relative overflow-hidden rounded-2xl border border-line bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Proposition ${i + 1}`}
                      className="aspect-square w-full object-cover"
                      onLoad={() => setLoadedCount((c) => c + 1)}
                    />
                    <button
                      onClick={() => download(src, `photo-profil-comeup-${i + 1}.jpg`)}
                      className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-xl bg-ink/85 py-2 text-[12px] font-bold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                    >
                      <IconDownload size={14} /> Télécharger
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-ink-mute">
                {loadedCount < 4 ? `Génération en cours… ${loadedCount}/4` : "4 propositions prêtes — survole pour télécharger."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<IconRefresh size={14} />}
                onClick={() => {
                  setGenKey((k) => k + 1);
                  setLoadedCount(0);
                }}
              >
                Regénérer 4 autres
              </Button>
            </div>
          </>
        )}
      </Card>
      <p className="text-[11px] text-ink-mute">
        Astuce : une vraie photo de toi bien éclairée reste l&apos;idéal — ces visuels IA sont parfaits en attendant, ou comme avatar de marque.
      </p>
    </div>
  );
}

/* ================= 2. SERVICES & MINIATURES ================= */

function ServicesAtelier({ niche, nicheLabel, sellerName }: { niche: string; nicheLabel: string; sellerName: string | null }) {
  const toast = useToast();
  const [market, setMarket] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbState, setThumbState] = useState<"idle" | "gen" | "ready">("idle");
  const [thumbSeed, setThumbSeed] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setMarket(null);
    setSelectedTitle("");
    setThumbState("idle");
    getMarket({ category: niche })
      .then((d) => {
        if (alive) setMarket(d.market);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Lecture du marché impossible"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [niche]);

  const keywords = market ? topKeywords(market.topGigs.map((g) => g.title), 8).map((k) => k.word) : [];

  const titles = NICHE_TITLES[niche] ?? [
    `Je vais créer votre ${nicheLabel.toLowerCase()} professionnel`,
    `Je vais réaliser votre ${nicheLabel.toLowerCase()} en 72 h, révisions incluses`,
    `Je vais livrer un ${nicheLabel.toLowerCase()} haut de gamme, accompagnement complet`,
  ];
  const suggestions: { title: string; why: string }[] = market
    ? [
        { title: titles[0], why: `Aligné sur les mots-clés qui dominent ce marché : ${keywords.slice(0, 4).join(", ")}` },
        { title: titles[1], why: `Le délai express se démarque — prix médian du marché : ${market.price.median} €` },
        { title: titles[2], why: `Positionnement premium — les leaders cumulent jusqu'à ${market.reviews.max} avis` },
      ]
    : [];

  async function makeThumb(title: string) {
    setSelectedTitle(title);
    setThumbState("gen");
    try {
      const bgPrompt = `${THUMB_BG.default}, ${nicheSubject(niche)} theme`;
      const src = `/api/image?prompt=${encodeURIComponent(bgPrompt)}&w=1280&h=720&seed=${niche}-${thumbSeed}`;
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("bg"));
        img.src = src;
      });
      try {
        await document.fonts.load("800 72px Montserrat");
      } catch {
        /* police système en repli */
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 1280;
      canvas.height = 720;
      ctx.drawImage(img, 0, 0, 1280, 720);
      // voile sombre pour la lisibilité
      const grad = ctx.createLinearGradient(0, 0, 0, 720);
      grad.addColorStop(0, "rgba(10,10,12,0.25)");
      grad.addColorStop(1, "rgba(10,10,12,0.78)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
      // barre jaune ComeUp
      ctx.fillStyle = "#FFEE66";
      ctx.fillRect(72, 500, 120, 14);
      // titre (2 lignes max)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 64px Montserrat, sans-serif";
      ctx.textBaseline = "top";
      wrapText(ctx, title.replace(/^Je vais\s+/i, ""), 72, 540, 1130, 74, 2);
      // pseudo
      if (sellerName) {
        ctx.font = "600 30px Montserrat, sans-serif";
        ctx.fillStyle = "#FFEE66";
        ctx.fillText(`@${sellerName}`, 72, 60);
      }
      setThumbState("ready");
      toast("Miniature générée — télécharge-la pour ton service", "success");
    } catch {
      setThumbState("idle");
      toast("Génération du fond impossible — réessaie", "warning");
    }
  }

  function downloadThumb() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "miniature-comeup.png";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Miniature téléchargée (1280×720, prête pour ComeUp)", "success");
    }, "image/png");
  }

  return (
    <div className="animate-fade-up space-y-4">
      <Card>
        <h3 className="text-sm font-extrabold text-ink">Services conseillés — niche « {nicheLabel} »</h3>
        {loading && (
          <div className="mt-4 flex items-center gap-3 text-[13px] text-ink-mute">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-ink" />
            Lecture du marché « {nicheLabel} » en direct sur ComeUp…
          </div>
        )}
        {error && (
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-red-500">
            <IconAlert size={14} /> {error}
          </p>
        )}
        {market && (
          <>
            <p className="mt-1 text-[12px] text-ink-mute">
              Basé sur {market.sampleSize} services lus en direct · prix médian {market.price.median} € · mots-clés qui dominent :{" "}
              {keywords.slice(0, 5).join(", ")}
            </p>
            <div className="mt-4 space-y-2.5">
              {suggestions.map((s, i) => (
                <div key={i} className={`rounded-2xl border p-4 transition-colors ${selectedTitle === s.title ? "border-ink bg-primary-50" : "border-line"}`}>
                  <p className="text-[14px] font-bold text-ink">{s.title}</p>
                  <p className="mt-1 text-[12px] text-ink-mute">{s.why}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button variant="violet" size="sm" onClick={() => makeThumb(s.title)}>
                      Générer la miniature
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<IconCopy size={13} />}
                      onClick={() => {
                        navigator.clipboard.writeText(s.title);
                        toast("Titre copié", "success");
                      }}
                    >
                      Copier le titre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Miniature */}
      <Card className={thumbState === "idle" ? "hidden" : ""}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-ink">Ta miniature (1280×720)</h3>
          {thumbState === "ready" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<IconRefresh size={14} />}
                onClick={() => {
                  setThumbSeed((s) => s + 1);
                  makeThumb(selectedTitle);
                }}
              >
                Autre fond
              </Button>
              <Button variant="primary" size="sm" icon={<IconDownload size={14} />} onClick={downloadThumb}>
                Télécharger PNG
              </Button>
            </div>
          )}
        </div>
        {thumbState === "gen" && (
          <div className="mt-4 flex items-center gap-3 text-[13px] text-ink-mute">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-ink" />
            Génération du visuel par IA…
          </div>
        )}
        <canvas ref={canvasRef} className={`mt-4 w-full rounded-2xl border border-line ${thumbState === "ready" ? "" : "hidden"}`} />
      </Card>
    </div>
  );
}

/** Titres rédigés (français propre) par niche — les vraies données du marché
    servent à justifier et prioriser, pas à assembler des phrases. */
const NICHE_TITLES: Record<string, [string, string, string]> = {
  "site-developpement": [
    "Je vais créer votre site web professionnel (vitrine ou e-commerce)",
    "Je vais créer votre site web professionnel en 72 h, révisions incluses",
    "Je vais créer votre site sur mesure haut de gamme, accompagnement complet",
  ],
  wordpress: [
    "Je vais créer votre site WordPress professionnel et responsive",
    "Je vais créer votre site WordPress en 72 h, révisions incluses",
    "Je vais créer votre site WordPress premium avec SEO et maintenance",
  ],
  shopify: [
    "Je vais créer votre boutique Shopify clé en main",
    "Je vais créer votre boutique Shopify prête à vendre en 72 h",
    "Je vais créer votre boutique Shopify premium, produits et design inclus",
  ],
  "correction-de-bugs": [
    "Je vais corriger les bugs et erreurs de votre site web",
    "Je vais corriger votre bug urgent en moins de 24 h",
    "Je vais auditer et réparer entièrement votre site web",
  ],
  logos: [
    "Je vais créer votre logo professionnel et sa déclinaison complète",
    "Je vais créer votre logo professionnel en 48 h, révisions incluses",
    "Je vais créer votre identité visuelle complète (logo + charte graphique)",
  ],
  "design-graphisme": [
    "Je vais créer vos visuels professionnels (flyers, affiches, posts)",
    "Je vais créer votre design professionnel en 48 h, révisions incluses",
    "Je vais créer votre kit graphique complet haut de gamme",
  ],
  "miniatures-et-bannieres": [
    "Je vais créer vos miniatures YouTube qui font cliquer",
    "Je vais créer votre miniature percutante en 24 h",
    "Je vais créer votre pack de 10 miniatures + bannière de chaîne",
  ],
  "cartes-de-visite": [
    "Je vais créer votre carte de visite professionnelle et moderne",
    "Je vais créer votre carte de visite en 24 h, prête à imprimer",
    "Je vais créer votre papeterie complète (carte, en-tête, signature)",
  ],
  "montage-video": [
    "Je vais monter vos vidéos TikTok, Reels et YouTube au rythme pro",
    "Je vais monter votre vidéo en 48 h, sous-titres inclus",
    "Je vais monter vos vidéos en série, habillage complet de chaîne",
  ],
  "voix-off": [
    "Je vais enregistrer votre voix off professionnelle en français",
    "Je vais enregistrer votre voix off en 24 h, fichier prêt à monter",
    "Je vais enregistrer votre voix off premium avec mixage studio",
  ],
  "videos-et-photos-ugc": [
    "Je vais créer vos vidéos UGC authentiques pour vos publicités",
    "Je vais tourner votre vidéo UGC en 72 h, formats verticaux inclus",
    "Je vais créer votre pack de 5 vidéos UGC prêtes à sponsoriser",
  ],
  "marketing-digital": [
    "Je vais construire votre stratégie marketing digitale complète",
    "Je vais créer votre tunnel de vente prêt à convertir",
    "Je vais accompagner votre croissance en marketing digital chaque mois",
  ],
  "reseaux-sociaux": [
    "Je vais gérer et animer vos réseaux sociaux comme un pro",
    "Je vais créer votre calendrier de contenus pour 30 jours",
    "Je vais gérer vos réseaux sociaux au mois, contenus et community management",
  ],
  "creation-de-backlinks": [
    "Je vais créer des backlinks de qualité pour votre référencement",
    "Je vais booster votre SEO avec des backlinks en 7 jours",
    "Je vais construire votre stratégie SEO complète avec netlinking premium",
  ],
  "e-mailing": [
    "Je vais créer vos séquences d'e-mails qui convertissent",
    "Je vais rédiger votre newsletter professionnelle en 48 h",
    "Je vais automatiser tout votre e-mailing (séquences + templates)",
  ],
  "campagnes-publicitaires": [
    "Je vais créer et gérer vos campagnes publicitaires Facebook et Instagram",
    "Je vais lancer votre première campagne publicitaire en 72 h",
    "Je vais gérer vos publicités au mois avec optimisation continue",
  ],
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(lines === maxLines - 1 ? line + "…" : line, x, y + lines * lineH);
      lines++;
      if (lines >= maxLines) return;
      line = w;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineH);
}

/* ================= 3. PAGE DE VENTE ================= */

function VenteAtelier({ niche, nicheLabel }: { niche: string; nicheLabel: string }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [source, setSource] = useState<"ia" | "template" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!title.trim()) {
      setError("Écris d'abord le titre de ton service.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await generate({ kind: "description", title: title.trim() });
      setText(r.text);
      setSource(r.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-sm font-extrabold text-ink">Ta page de vente ComeUp</h3>
        <p className="mt-0.5 text-[13px] text-ink-mute">
          Rédigée en s&apos;appuyant sur ce qui marche en ce moment dans « {nicheLabel} » (lecture du marché en direct).
        </p>
        <label className="mt-4 block text-[13px] font-bold text-ink">Titre de ton service</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={`Je vais créer votre ${nicheLabel.toLowerCase()}…`}
          className="mt-2 h-11 w-full rounded-xl border-2 border-line bg-white px-4 text-sm font-medium outline-none transition-colors focus:border-ink"
        />
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-red-500">
            <IconAlert size={13} /> {error}
          </p>
        )}
        <Button variant="primary" full className="mt-4" onClick={go} disabled={loading}>
          {loading ? "Rédaction en cours…" : "Générer ma page de vente"}
        </Button>
        <p className="mt-3 text-[11px] text-ink-mute">
          Le copilote lit d&apos;abord les services qui vendent dans ta niche, puis rédige dans cette logique.
        </p>
      </Card>

      <Card>
        {!text && !loading && (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl font-extrabold text-ink">¶</span>
            <p className="mt-3 max-w-xs text-[13px] text-ink-mute">Ta page de vente apparaîtra ici — structurée pour convertir, prête à coller sur ComeUp.</p>
          </div>
        )}
        {loading && (
          <div className="flex h-full min-h-[220px] items-center justify-center gap-3 text-[13px] text-ink-mute">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-ink" />
            Lecture du marché + rédaction…
          </div>
        )}
        {text && !loading && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-ink">Ta page de vente</h3>
              <Badge tone={source === "ia" ? "green" : "gray"}>{source === "ia" ? "Rédigée par IA" : "Modèle calibré marché"}</Badge>
            </div>
            <div className="mt-3 whitespace-pre-line rounded-2xl bg-canvas p-4 text-[13px] leading-relaxed text-ink-soft">{text}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="violet"
                size="sm"
                icon={<IconCopy size={14} />}
                onClick={() => {
                  navigator.clipboard.writeText(text);
                  toast("Page de vente copiée — colle-la sur ComeUp", "success");
                }}
              >
                Copier
              </Button>
              <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={go}>
                Régénérer
              </Button>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <IconCheck size={12} /> Basée sur ton marché réel
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
