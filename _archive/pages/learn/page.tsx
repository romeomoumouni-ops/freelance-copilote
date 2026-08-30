"use client";

import { useMemo, useState } from "react";
import { formations, type Formation } from "@/lib/formations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { iconMap } from "@/components/icons";
import { IconCheck, IconTrophy, IconSparkles } from "@/components/icons";

type LevelFilter = "Toutes" | "Débutant" | "Intermédiaire" | "Tous niveaux";

/* ⚙️ À CONFIGURER — ta chaîne / vidéo YouTube.
   Mets SOIT une vidéo (videoId), SOIT une playlist (playlistId) pour que les
   gens puissent parcourir toute ta chaîne dans le lecteur, sans quitter le site. */
const FOUNDER = {
  videoId: "aqz-KE-bpKQ", // ← remplace par l'ID de ta vidéo (la partie après watch?v=)
  playlistId: "", // ← ou l'ID d'une playlist "uploads"/chaîne (ex: "PLxxxx"), sinon laisse vide
};
function ytEmbedSrc() {
  const base = "https://www.youtube-nocookie.com/embed";
  return FOUNDER.playlistId
    ? `${base}/videoseries?list=${FOUNDER.playlistId}&rel=0`
    : `${base}/${FOUNDER.videoId}?rel=0`;
}

const REASSURANCES = [
  { title: "Accès à vie", text: "Tu paies une fois, tu la gardes pour toujours." },
  { title: "Concret, pas de blabla", text: "Que de l'actionnable, prêt à vendre." },
  { title: "Pensé pour débutants", text: "Aucun prérequis, on part de zéro." },
];

function formatPrice(price: number) {
  return `${price.toLocaleString("fr-FR")} FCFA`;
}

function levelTone(level: Formation["level"]): "green" | "orange" | "blue" {
  if (level === "Débutant") return "green";
  if (level === "Intermédiaire") return "orange";
  return "blue";
}

export default function Learn() {
  const toast = useToast();
  const [filter, setFilter] = useState<LevelFilter>("Toutes");
  const [selected, setSelected] = useState<Formation | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  const tabs = useMemo(() => {
    const count = (lvl: LevelFilter) =>
      lvl === "Toutes" ? formations.length : formations.filter((f) => f.level === lvl).length;
    return [
      { key: "Toutes", label: "Toutes", count: count("Toutes") },
      { key: "Débutant", label: "Débutant", count: count("Débutant") },
      { key: "Intermédiaire", label: "Intermédiaire", count: count("Intermédiaire") },
      { key: "Tous niveaux", label: "Tous niveaux", count: count("Tous niveaux") },
    ];
  }, []);

  const visible = useMemo(
    () => (filter === "Toutes" ? formations : formations.filter((f) => f.level === filter)),
    [filter],
  );

  function buy() {
    toast("Paiement simulé — accès débloqué (démo)", "success");
    setSelected(null);
  }

  return (
    <>
      <PageHeader
        title="Me former"
        subtitle="Apprends un métier freelance rentable et vends dès ce mois-ci. Des formations courtes, concrètes, pas chères."
      />

      {/* Héro */}
      <Card className="bg-gradient-to-br from-primary-50 to-white animate-fade-up">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-600 shadow-card">
              <IconSparkles size={13} /> Le raccourci vers ton premier client
            </span>
            <h2 className="mt-3 text-xl font-bold leading-snug text-ink sm:text-2xl">
              Chaque formation = une compétence que tu peux vendre sur ComeUp cette semaine.
            </h2>
          </div>
          <ul className="grid shrink-0 gap-2.5">
            {REASSURANCES.map((r) => (
              <li key={r.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <IconCheck size={14} />
                </span>
                <span className="text-[13px] leading-tight">
                  <span className="font-semibold text-ink">{r.title}</span>
                  <span className="block text-ink-mute">{r.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Vidéo d'éducation gratuite — la vidéo du fondateur */}
      <button
        onClick={() => setVideoOpen(true)}
        className="group mt-4 flex w-full flex-col items-center gap-5 overflow-hidden rounded-3xl bg-ink p-6 text-left text-white transition-all hover:brightness-110 sm:flex-row sm:p-7"
      >
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-white/5" />
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-200">
            Gratuit
          </span>
          <h2 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">Vidéo d&apos;éducation gratuite</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/70">
            Regarde la vidéo du fondateur directement ici — les bases pour te lancer en freelance, sans quitter la plateforme.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink transition-transform group-hover:scale-[1.03]">
          Regarder la vidéo
        </span>
      </button>

      {/* Filtre par niveau */}
      <div className="mt-8">
        <Tabs
          tabs={tabs}
          active={filter}
          onChange={(k) => setFilter(k as LevelFilter)}
          variant="segment"
        />
      </div>

      {/* Grille de formations */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {visible.map((f) => {
          const Icon = iconMap[f.icon as keyof typeof iconMap];
          return (
            <Card key={f.id} hover className="flex flex-col animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  {Icon ? <Icon size={22} /> : null}
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Badge tone={levelTone(f.level)}>{f.level}</Badge>
                  <Badge tone="gray">{f.duration}</Badge>
                </div>
              </div>

              <h3 className="mt-4 text-base font-bold leading-snug text-ink">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{f.tagline}</p>

              <div className="mt-auto pt-5">
                <p className="text-2xl font-bold tracking-tight text-ink">{formatPrice(f.price)}</p>
                <p className="text-[12px] text-ink-mute">Paiement unique · accès à vie</p>
                <Button variant="violet" full className="mt-3" onClick={() => setSelected(f)}>
                  Voir la formation
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Encart bas */}
      <Card className="mt-8 border-dashed bg-primary-50/40 text-center">
        <p className="text-[13px] font-semibold text-ink">D&apos;autres formations arrivent bientôt.</p>
        <p className="mt-1 text-[12px] text-ink-mute">
          On ajoute chaque mois de nouveaux métiers rentables. Commence par celui qui te parle — tu pourras toujours en débloquer d&apos;autres.
        </p>
      </Card>

      {/* Modal vidéo — lecteur YouTube embarqué (on reste sur la plateforme) */}
      <Modal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        size="xl"
        title="Vidéo d'éducation gratuite"
        subtitle="La vidéo du fondateur — regarde-la ici, sans quitter la plateforme."
      >
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-ink"
          style={{ paddingTop: "56.25%" }}
        >
          <iframe
            className="absolute inset-0 h-full w-full"
            src={ytEmbedSrc()}
            title="Vidéo du fondateur"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-mute">
          Astuce : avec une playlist de ta chaîne, les visiteurs peuvent enchaîner toutes tes vidéos
          directement dans ce lecteur.
        </p>
      </Modal>

      {/* Modal détail */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected?.title}
        subtitle={selected?.tagline}
        footer={
          selected ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Fermer
              </Button>
              <Button variant="primary" onClick={buy}>
                Acheter — {formatPrice(selected.price)}
              </Button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={levelTone(selected.level)}>{selected.level}</Badge>
              <Badge tone="gray">{selected.duration}</Badge>
            </div>

            {/* Ce que tu sauras faire */}
            <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-card">
                <IconTrophy size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
                  Ce que tu sauras faire
                </p>
                <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink">{selected.outcome}</p>
              </div>
            </div>

            {/* Programme */}
            <div>
              <h4 className="text-sm font-bold text-ink">Programme</h4>
              <ol className="mt-3 space-y-2.5">
                {selected.modules.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-600">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[13px] leading-relaxed text-ink-soft">{m}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Prix */}
            <div className="flex items-end justify-between rounded-2xl border border-line bg-canvas px-4 py-3">
              <div>
                <p className="text-[12px] text-ink-mute">Prix unique · accès à vie</p>
                <p className="text-2xl font-bold tracking-tight text-ink">{formatPrice(selected.price)}</p>
              </div>
              <span className="text-[12px] font-medium text-ink-mute">{selected.duration}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
