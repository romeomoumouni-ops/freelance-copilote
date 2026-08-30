"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import Button from "@/components/ui/Button";
import ScoreRing from "@/components/ui/ScoreRing";
import Badge from "@/components/ui/Badge";
import {
  IconArrowRight,
  IconCheck,
  IconAlert,
  IconStar,
  IconWallet,
  IconImage,
  IconPen,
  IconTrendingUp,
  IconZap,
  IconTarget,
  IconMessageSquare,
  IconLock,
  IconMenu,
  IconX,
} from "@/components/icons";

const LOADING_STEPS = [
  "Lecture de ta page ComeUp…",
  "Extraction de tes services, prix et avis…",
  "Comparaison avec ton marché en direct…",
  "Calcul de ton pourcentage de réussite…",
];

const NAV = [
  { href: "#accueil", label: "Accueil" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
];

/** Surligné jaune ComeUp */
function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="absolute inset-x-[-2px] bottom-[0.08em] h-[0.38em] rounded-sm bg-brand" />
      <span className="relative">{children}</span>
    </span>
  );
}

const AVATAR_LEFT =
  "smiling professional headshot portrait of young african man, glasses, plain light background, high quality photography";
const AVATAR_RIGHT =
  "smiling professional headshot portrait of young african woman, braids, plain light background, high quality photography";

export default function Landing() {
  const router = useRouter();
  const { analyze, loading } = useProfile();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyze>> | null>(null);
  const [step, setStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const analysis = result && result.status === "ok" ? result.analysis : null;

  async function onAnalyze() {
    setError(null);
    setInfo(null);
    setResult(null);
    if (!url.trim()) {
      setError("Colle le lien de ton profil ou d'un de tes services ComeUp.");
      return;
    }
    if (!/comeup\.com/i.test(url)) {
      setError("Cette V1 est dédiée à ComeUp : colle un lien comeup.com.");
      return;
    }
    try {
      const r = await analyze(url.trim());
      setResult(r);
      if (r.status !== "ok") setInfo(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'analyse a échoué. Réessaie.");
    }
  }

  return (
    <main id="accueil" className="min-h-screen scroll-smooth bg-white">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-white/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <a href="#accueil" className="shrink-0">
            <span className="text-[17px] font-extrabold tracking-tight text-ink">
              Freelance <Hl>Copilot</Hl>
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[13.5px] font-semibold text-ink-soft transition-colors hover:text-ink">
                {n.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden rounded-full border-2 border-ink px-4 py-1.5 text-[13px] font-bold text-ink transition-all hover:bg-ink hover:text-white sm:block"
            >
              Connexion
            </Link>
            <a
              href="#analyse"
              className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-black active:scale-[0.98]"
            >
              <span className="hidden sm:inline">Analyser mon profil</span>
              <span className="sm:hidden">Scanner</span>
            </a>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-1.5 text-ink md:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-line bg-white px-5 py-3 md:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-[14px] font-semibold text-ink-soft"
              >
                {n.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        {/* blobs de fond doux — hauts uniquement, pour laisser la scène héro sur blanc pur */}
        <div className="pointer-events-none absolute -left-36 -top-16 h-64 w-64 rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-36 -top-20 h-64 w-64 rounded-full bg-primary-100 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pt-10 text-center sm:pt-14">
          {/* Badge clients */}
          <div className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-2 pr-4 shadow-card">
            <span className="flex -space-x-2">
              {["AB", "KO", "FS"].map((i, n) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold ${
                    n === 1 ? "bg-ink text-white" : "bg-brand text-ink"
                  }`}
                >
                  {i}
                </span>
              ))}
            </span>
            <span className="text-[12px] font-bold text-ink">
              <span className="text-primary-600">800+</span> services ComeUp scannés en direct
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mt-6 max-w-3xl text-[38px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[60px]">
            Crée tout en un clic.
            <br />
            Ton profil ComeUp, prêt à vendre <Hl>10×&nbsp;plus.</Hl>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Colle ton lien ComeUp : tu obtiens ton vrai pourcentage de réussite, calculé sur de la
            vraie data. Puis tu crées ta photo de profil pro, tes miniatures et tes services en un
            clic. Résultat : tes ventes décollent.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#tarifs"
              className="rounded-full bg-ink px-6 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(23,22,28,0.5)] transition-all hover:bg-black active:scale-[0.98]"
            >
              Prix des abonnements
            </a>
            <a
              href="#comment"
              className="rounded-full border-2 border-primary-400 bg-white px-6 py-[10px] text-[14px] font-bold text-ink transition-all hover:bg-primary-50 active:scale-[0.98]"
            >
              Voir comment ça marche
            </a>
          </div>
        </div>

        {/* ===== Scène héro : analyseur centré + pops des deux côtés ===== */}
        <div className="relative mx-auto mt-10 max-w-5xl px-5 pb-16 sm:mt-12 sm:pb-24">
          {/* --- éléments flottants gauche (façon icônes sociales de la référence) --- */}
          <span className="absolute left-0 top-2 z-0 hidden h-12 w-12 -rotate-6 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-card lg:flex">
            <IconStar size={18} />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?prompt=${encodeURIComponent(AVATAR_LEFT)}&w=128&h=128&seed=fc-avatar-l1`}
            alt=""
            className="absolute left-14 top-40 z-0 hidden h-16 w-16 rounded-full border-4 border-white object-cover shadow-pop lg:block"
          />
          <span className="absolute left-2 bottom-36 z-0 hidden h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-navy-50 text-navy shadow-card lg:flex">
            <IconWallet size={18} />
          </span>

          {/* --- éléments flottants droite --- */}
          <span className="absolute right-0 top-4 z-0 hidden h-12 w-12 rotate-6 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-card lg:flex">
            <IconImage size={18} />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?prompt=${encodeURIComponent(AVATAR_RIGHT)}&w=128&h=128&seed=fc-avatar-r1`}
            alt=""
            className="absolute right-10 top-44 z-0 hidden h-16 w-16 rounded-full border-4 border-white object-cover shadow-pop lg:block"
          />
          <span className="absolute right-3 bottom-40 z-0 hidden h-12 w-12 -rotate-3 items-center justify-center rounded-2xl bg-navy text-white shadow-card lg:flex">
            <IconPen size={18} />
          </span>

          {/* --- centre : carte analyseur (gauche) + photo du fondateur (centre) --- */}
          <div className="relative flex flex-col items-center lg:flex-row lg:items-end lg:justify-center lg:gap-0">
            {/* PHOTO MOBILE — compacte, glissée derrière le haut de la carte */}
            <div className="relative z-0 -mb-7 flex w-full justify-center lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder.png"
                alt="Le fondateur de Freelance Copilot"
                className="h-44 w-auto object-contain drop-shadow-[12px_2px_10px_rgba(147,177,255,0.45)]"
              />
              <div className="absolute right-[calc(50%-130px)] top-1 rotate-3 rounded-xl bg-brand px-2.5 py-1.5 shadow-pop">
                <p className="text-[12px] font-extrabold leading-none text-ink">+34 %</p>
                <p className="text-[9px] font-semibold text-ink/70">de ventes</p>
              </div>
            </div>
            {/* pop bas de carte (< lg) */}
            <div className="absolute -left-2 -bottom-4 z-20 hidden -rotate-2 rounded-full border border-line bg-white px-4 py-2 shadow-pop sm:block lg:hidden">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                <IconCheck size={13} /> Yay ! Profil optimisé
              </p>
            </div>

            {/* L'ANALYSEUR (vrai, fonctionnel) */}
            <div
              id="analyse"
              className="relative z-10 w-full max-w-[560px] scroll-mt-24 rounded-3xl border-2 border-ink bg-white p-5 text-left shadow-[8px_8px_0_0_#FFEE66] sm:p-7 lg:mb-6 lg:max-w-[520px]"
            >
              {!loading && !analysis && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[16px] font-extrabold text-ink">Ton pourcentage de réussite</h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Gratuit
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-mute">
                    De la vraie data, lue en direct : tes services, tes prix, tes avis face à ton marché.
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                    <input
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
                      placeholder="https://comeup.com/fr/@ton-pseudo"
                      className={`h-14 flex-1 rounded-xl border-2 bg-white px-4 text-[16px] font-medium outline-none transition-all placeholder:font-normal placeholder:text-ink-mute sm:h-12 sm:text-sm ${
                        error ? "border-red-400" : "border-line focus:border-ink"
                      }`}
                    />
                    <button
                      onClick={onAnalyze}
                      className="h-14 w-full rounded-xl bg-ink px-6 text-[16px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(23,22,28,0.45)] transition-all hover:bg-black active:scale-[0.98] sm:h-12 sm:w-auto sm:text-sm"
                    >
                      Scanner
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-red-500">
                      <IconAlert size={13} /> {error}
                    </p>
                  )}
                  {info && (
                    <p className="mt-2 flex items-start gap-1.5 text-[12px] font-medium text-amber-700">
                      <IconAlert size={13} className="mt-0.5 shrink-0" /> {info}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setUrl("https://comeup.com/fr/@hbconsultant")}
                      className="text-[12px] font-semibold text-ink underline decoration-brand decoration-[3px] underline-offset-2 hover:opacity-70"
                    >
                      Essayer avec un vrai profil d&apos;exemple
                    </button>
                    <span className="flex items-center gap-1 text-[11px] text-ink-mute">
                      <IconLock size={11} /> Jamais de mot de passe
                    </span>
                  </div>
                </>
              )}

              {loading && (
                <div className="flex flex-col items-center py-6 text-center">
                  <span className="relative flex h-14 w-14 items-center justify-center">
                    <span className="absolute h-14 w-14 animate-spin rounded-full border-[3px] border-primary-100 border-t-ink" />
                    <span className="text-lg font-extrabold text-ink">%</span>
                  </span>
                  <p className="mt-4 text-[15px] font-extrabold text-ink">Analyse en cours…</p>
                  <div className="mt-4 w-full max-w-sm space-y-2 text-left">
                    {LOADING_STEPS.map((s, i) => (
                      <div
                        key={s}
                        className={`flex items-center gap-2 text-[12.5px] transition-all ${
                          i < step ? "text-ink-soft" : i === step ? "font-bold text-ink" : "text-ink-mute/50"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full ${
                            i < step ? "bg-emerald-100 text-emerald-600" : i === step ? "bg-brand text-ink" : "bg-ink/5"
                          }`}
                        >
                          {i < step ? <IconCheck size={10} /> : i === step ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> : null}
                        </span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis && (
                <div className="animate-fade-up">
                  <div className="flex flex-col items-center text-center">
                    <Badge tone="green" dot>
                      Analyse terminée · données réelles
                    </Badge>
                    <ScoreRing value={analysis.globalScore} size={120} suffix="%" className="mt-4" />
                    <p className="mt-3 text-[17px] font-extrabold text-ink">
                      Ton profil réussit à {analysis.globalScore} %
                    </p>
                    <p className="mt-1 max-w-md text-[12.5px] text-ink-mute">
                      {analysis.profile.displayName} · {analysis.profile.gigs.length} service
                      {analysis.profile.gigs.length > 1 ? "s" : ""} · marché « {analysis.market.label} » (
                      {analysis.market.sampleSize} services comparés)
                    </p>
                  </div>
                  {analysis.recommendations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {analysis.recommendations.slice(0, 2).map((r) => (
                        <div key={r.id} className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-3 text-left">
                          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand ring-2 ring-ink/10" />
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-ink">{r.title}</p>
                            <p className="text-[11.5px] text-ink-soft">{r.gain}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 space-y-2">
                    <Button variant="primary" size="lg" full iconRight={<IconArrowRight size={16} />} onClick={() => router.push("/profile")}>
                      Voir mon analyse complète
                    </Button>
                    <Button variant="violet" size="md" full onClick={() => router.push("/create")}>
                      Créer un profil qui vend
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PHOTO DU FONDATEUR — au centre, chevauche la carte (comme la référence) */}
            <div className="relative z-10 hidden w-[330px] shrink-0 lg:-ml-20 lg:block">
              {/* nappe bleu clair discrète, côté droit, au niveau de l'épaule (loin des bras posés) */}
              <div className="pointer-events-none absolute -right-6 top-[20%] z-0 h-52 w-24 rounded-full bg-[#B9CDFF]/40 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder.png"
                alt="Le fondateur de Freelance Copilot"
                className="relative z-10 w-full object-contain drop-shadow-[20px_2px_14px_rgba(147,177,255,0.45)]"
              />
              {/* modales AU-DESSUS de la photo */}
              <div className="absolute -right-12 top-14 z-20 rotate-3 rounded-2xl bg-brand px-4 py-3 shadow-pop">
                <div className="flex items-center gap-2">
                  <IconTrendingUp size={18} className="text-ink" />
                  <div>
                    <p className="text-[15px] font-extrabold leading-none text-ink">+34 %</p>
                    <p className="text-[10px] font-semibold text-ink/70">de ventes</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-16 bottom-40 z-20 -rotate-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
                  <IconZap size={14} /> Miniature prête
                </p>
              </div>
              {/* pop bas-gauche, à cheval sur la carte */}
              <div className="absolute -left-24 bottom-8 z-20 -rotate-2 rounded-full border border-line bg-white px-4 py-2 shadow-pop">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                  <IconCheck size={13} /> Yay ! Profil optimisé
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS ================= */}
      <section id="fonctionnalites" className="relative scroll-mt-20 overflow-hidden bg-canvas py-16">
        <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-navy/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tout pour <Hl>percer sur ComeUp</Hl>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-ink-soft">
            Trois armes, zéro blabla. Et tout tourne sur tes vraies données, pas sur du vent.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: "/icon-analyse.png",
                title: "Analyse complète de ton profil ComeUp",
                desc: "Ton vrai pourcentage de réussite, basé sur de la vraie data : tes services, tes prix, tes avis, comparés en direct à ton marché.",
              },
              {
                icon: "/icon-creation.png",
                title: "Photo, miniature, service : tout en un clic",
                desc: "Ta photo de profil pro générée par IA, tes miniatures prêtes à poster et tes services rédigés pour vendre. Tu cliques, c'est prêt.",
              },
              {
                icon: "/icon-expert.png",
                title: "Un expert ComeUp au bout du fil",
                desc: "Cale un rendez-vous téléphonique avec un expert ComeUp quand tu veux. Entre deux appels, le chat intégré prend le relais.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border-2 border-ink bg-white p-6 text-left shadow-[5px_5px_0_0_#FFEE66] transition-transform hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.icon} alt="" className="h-14 w-14 object-contain" />
                <h3 className="mt-4 text-lg font-extrabold text-ink">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section id="comment" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Comment ça marche ? <Hl>En 3 minutes.</Hl>
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "1", t: "Colle ton lien", d: "Ton profil ou un de tes services ComeUp. Public, sans mot de passe. Promis, on ne demande rien d'autre." },
              { n: "2", t: "Regarde ton score", d: "Le copilote lit tout en direct : services, prix, avis, concurrents. Et te dit franchement où tu perds des ventes." },
              { n: "3", t: "Crée et vends", d: "Photo, miniatures, pages de vente : tu génères, tu télécharges, tu mets en ligne. Et tu regardes les commandes arriver." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-canvas p-7 text-left">
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[15px] font-extrabold text-brand">
                  {s.n}
                </span>
                <h3 className="mt-3 text-[16px] font-extrabold text-ink">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
          <a
            href="#analyse"
            className="mt-9 inline-block rounded-full bg-ink px-7 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(23,22,28,0.5)] transition-all hover:bg-black"
          >
            Scanner mon profil maintenant
          </a>
        </div>
      </section>

      {/* ================= TARIFS ================= */}
      <section id="tarifs" className="scroll-mt-20 bg-canvas py-16">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Des prix <Hl>tout doux</Hl>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-ink-soft">
            Commence gratuitement. Passe en Pro quand tu veux tout débloquer.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {/* Gratuit */}
            <div className="rounded-3xl border-2 border-ink bg-white p-7 text-left shadow-[6px_6px_0_0_#FFEE66]">
              <h3 className="text-xl font-extrabold text-ink">Gratuit</h3>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink">
                0 FCFA<span className="text-base font-bold text-ink-mute"> / pour toi</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  { label: "Analyse complète de ton profil ComeUp", included: true },
                  { label: "Chat intégré avec l'équipe Freelance Copilot", included: true },
                  { label: "Création de photos de profil professionnelles ComeUp", included: false },
                  { label: "Création de miniatures ComeUp", included: false },
                  { label: "Création de ta page de vente ComeUp", included: false },
                ].map((f) => (
                  <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.included ? "text-ink-soft" : "text-ink-mute/70 line-through"}`}>
                    {f.included ? (
                      <IconCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    ) : (
                      <IconX size={15} className="mt-0.5 shrink-0 text-red-400" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
              <a
                href="#analyse"
                className="mt-6 block rounded-full bg-ink py-3 text-center text-[14px] font-bold text-white transition-all hover:bg-black"
              >
                Commencer gratuitement
              </a>
            </div>

            {/* Pro */}
            <div className="rounded-3xl border-2 border-ink bg-white p-7 text-left shadow-[6px_6px_0_0_#1E2A5A]">
              <h3 className="text-xl font-extrabold text-ink">Pro</h3>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink">
                30 000 FCFA<span className="text-base font-bold text-ink-mute"> / trimestre</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Analyse complète de ton profil ComeUp",
                  "Création de photos de profil professionnelles ComeUp",
                  "Création de miniatures ComeUp",
                  "Création de ta page de vente ComeUp",
                  "Chat intégré avec l'équipe Freelance Copilot",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <IconCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#analyse"
                className="mt-6 block rounded-full bg-brand py-3 text-center text-[14px] font-bold text-ink transition-all hover:bg-primary-400"
              >
                Commencer avec la version Pro
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            Freelance <Hl>Copilot</Hl>
          </span>
          <p className="max-w-md text-[11px] leading-relaxed text-ink-mute">
            Outil indépendant créé pour les vendeurs ComeUp, non affilié à ComeUp. Lecture des pages
            publiques uniquement, aucune donnée inventée, jamais de mot de passe.
          </p>
        </div>
      </footer>
    </main>
  );
}
