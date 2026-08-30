"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { getStatus, getCategories } from "@/lib/client";
import type { SourceStatus, CategoryDef } from "@/lib/client";
import {
  iconMap,
  IconExternal,
  IconTrash,
  IconCheck,
  IconAlert,
  IconRefresh,
  IconBot,
  IconLock,
  IconLayers,
  IconGauge,
  IconGlobe,
  IconWallet,
  IconArrowRight,
  IconSparkles,
} from "@/components/icons";
import { scoreTextClass } from "@/lib/utils";

type SettingsTab = "sources" | "profil" | "couverture" | "abonnement";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "sources", label: "Sources" },
  { key: "profil", label: "Profil" },
  { key: "couverture", label: "Couverture" },
  { key: "abonnement", label: "Abonnement" },
];

const PLATFORM_META: Record<string, { name: string; color: string }> = {
  comeup: { name: "ComeUp", color: "#2563EB" },
  fiverr: { name: "Fiverr", color: "#16A34A" },
};

const freeFeatures = [
  "Analyse en direct de votre profil ComeUp",
  "Recommandations prioritaires sur vos vrais chiffres",
  "Explorateur de marché et concurrents réels",
];

const proFeatures = [
  "Analyses illimitées (au lieu d'une par semaine)",
  "Source Fiverr en plus de ComeUp",
  "Alertes concurrents en temps réel",
  "Rapports de croissance exportables",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Spinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="relative flex h-11 w-11 items-center justify-center">
        <span className="absolute h-11 w-11 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary-600" />
        <IconSparkles size={16} className="text-primary-600" />
      </span>
      <p className="mt-4 text-sm text-ink-mute">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border border-red-100">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <IconAlert size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Impossible de charger ces données</p>
          <p className="mt-0.5 text-[13px] text-ink-mute">{message}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { analysis, hydrated, clear } = useProfile();

  const [tab, setTab] = useState<SettingsTab>("sources");

  const [status, setStatus] = useState<{ sources: SourceStatus[]; ai: boolean } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryDef[] | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);

  const [plan, setPlan] = useState<"Gratuit" | "Pro">("Gratuit");

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const r = await getStatus();
      setStatus(r);
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    setCatError(null);
    try {
      const r = await getCategories();
      setCategories(r.categories);
    } catch (e) {
      setCatError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadCategories();
  }, [loadStatus, loadCategories]);

  const groupedCategories = useMemo<[string, CategoryDef[]][]>(() => {
    if (!categories) return [];
    const map = new Map<string, CategoryDef[]>();
    for (const c of categories) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return Array.from(map.entries());
  }, [categories]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Paramètres"
        subtitle="Vos sources de données, votre profil et la configuration du copilote."
      />

      <div className="mt-6">
        <Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as SettingsTab)} variant="segment" />
      </div>

      <div className="mt-6 max-w-3xl space-y-4">
        {/* ================= SOURCES ================= */}
        {tab === "sources" && (
          <div className="animate-fade-in space-y-4">
            {statusLoading ? (
              <Card>
                <Spinner message="Vérification de vos sources de données…" />
              </Card>
            ) : statusError ? (
              <ErrorState message={statusError} onRetry={loadStatus} />
            ) : status ? (
              <>
                {status.sources.map((s) => {
                  const meta = PLATFORM_META[s.platform] ?? { name: s.platform, color: "#EA680C" };
                  const connected = s.available;
                  return (
                    <Card key={s.platform}>
                      <div className="flex flex-wrap items-start gap-3">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink">{meta.name}</p>
                            {connected ? (
                              <Badge tone="green" dot>
                                {s.mode === "provider" ? "Connecté · API" : "Connecté · live"}
                              </Badge>
                            ) : (
                              <Badge tone="gray" dot>
                                {s.mode === "error" ? "Erreur" : "Non configuré"}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">{s.message}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Ligne IA */}
                <Card>
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <IconBot size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">Rédaction par IA</p>
                        {status.ai ? (
                          <Badge tone="violet" dot>
                            IA active
                          </Badge>
                        ) : (
                          <Badge tone="gray" dot>
                            Mode modèles (sans clé)
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">
                        {status.ai
                          ? "Vos réponses aux clients et descriptions de services sont rédigées en direct par l'IA."
                          : "Sans clé, le copilote utilise des modèles éprouvés. Ajoutez une clé pour une rédaction sur-mesure."}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Encart configuration */}
                <div className="rounded-2xl border border-line bg-canvas p-5">
                  <div className="flex items-center gap-2">
                    <IconLock size={15} className="text-ink-soft" />
                    <p className="text-sm font-semibold text-ink">Activer plus de sources</p>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">
                    Ces sources s&apos;activent côté serveur via des variables d&apos;environnement. Aucune clé
                    n&apos;est saisie ni stockée depuis cette page.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-start gap-2 rounded-xl border border-line bg-white p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">Lecture Fiverr en direct</p>
                        <p className="mt-0.5 text-[12px] text-ink-mute">
                          Définissez{" "}
                          <code className="rounded bg-ink/5 px-1.5 py-0.5 text-[11px] font-semibold tracking-tight text-ink-soft">
                            FIVERR_APIFY_TOKEN
                          </code>{" "}
                          pour comparer aussi vos services au marché Fiverr.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 rounded-xl border border-line bg-white p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">Rédaction IA sur-mesure</p>
                        <p className="mt-0.5 text-[12px] text-ink-mute">
                          Définissez{" "}
                          <code className="rounded bg-ink/5 px-1.5 py-0.5 text-[11px] font-semibold tracking-tight text-ink-soft">
                            ANTHROPIC_API_KEY
                          </code>{" "}
                          pour des réponses et descriptions générées par l&apos;IA.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ================= PROFIL ================= */}
        {tab === "profil" && (
          <div className="animate-fade-in">
            {!hydrated ? (
              <div className="h-40 animate-pulse rounded-2xl bg-white/60" />
            ) : analysis ? (
              <Card>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-soft">
                    <IconGlobe size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {analysis.profile.displayName || analysis.profile.username || "Profil analysé"}
                      </p>
                      <Badge tone="violet">{PLATFORM_META[analysis.profile.platform]?.name ?? analysis.profile.platform}</Badge>
                    </div>
                    <a
                      href={analysis.profile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[13px] font-medium text-primary-600 hover:underline"
                    >
                      <span className="truncate">{analysis.profile.url.replace(/^https?:\/\//, "")}</span>
                      <IconExternal size={13} className="shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoTile
                    icon={<IconLayers size={16} />}
                    label="Services lus"
                    value={`${analysis.profile.gigs.length}`}
                  />
                  <InfoTile
                    icon={<IconGauge size={16} />}
                    label="Score global"
                    value={`${analysis.globalScore}/100`}
                    valueClass={scoreTextClass(analysis.globalScore)}
                  />
                  <InfoTile
                    icon={<IconGlobe size={16} />}
                    label="Marché analysé"
                    value={analysis.market.label}
                  />
                  <InfoTile
                    icon={<IconRefresh size={16} />}
                    label="Dernière analyse"
                    value={formatDate(analysis.generatedAt)}
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                  <p className="text-[12px] text-ink-mute">
                    Oublier votre profil efface l&apos;analyse locale et déverrouille une nouvelle analyse.
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<IconTrash size={15} />}
                    onClick={() => {
                      clear();
                      toast("Profil oublié, vous pouvez relancer une analyse", "warning");
                    }}
                  >
                    Oublier ce profil
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <IconSparkles size={22} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-ink">Aucun profil analysé pour l&apos;instant</p>
                  <p className="mt-1 max-w-sm text-[13px] text-ink-mute">
                    Analysez votre profil ComeUp pour remplir cette section et débloquer tout le copilote.
                  </p>
                  <Link href="/" className="mt-5">
                    <Button variant="primary" iconRight={<IconArrowRight size={15} />}>
                      Analyser mon profil
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ================= COUVERTURE ================= */}
        {tab === "couverture" && (
          <div className="animate-fade-in space-y-4">
            {catLoading ? (
              <Card>
                <Spinner message="Chargement des catégories couvertes…" />
              </Card>
            ) : catError ? (
              <ErrorState message={catError} onRetry={loadCategories} />
            ) : categories ? (
              <Card>
                <h2 className="text-sm font-semibold text-ink">Catégories ComeUp analysées par votre copilote</h2>
                <p className="mt-1 text-[13px] text-ink-mute">
                  Le crawler balaie en profondeur ces {categories.length} niches pour situer vos prix, vos concurrents
                  et vos opportunités.
                </p>
                <div className="mt-5 space-y-5">
                  {groupedCategories.map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{group}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {items.map((c) => {
                          const Icon = iconMap[c.icon as keyof typeof iconMap];
                          return (
                            <span
                              key={c.slug}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-soft"
                            >
                              {Icon && <Icon size={13} className="text-primary-600" />}
                              {c.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        )}

        {/* ================= ABONNEMENT ================= */}
        {tab === "abonnement" && (
          <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-ink">Gratuit</h2>
                  <Badge tone={plan === "Gratuit" ? "dark" : "gray"}>
                    {plan === "Gratuit" ? "Votre plan actuel" : "Gratuit"}
                  </Badge>
                </div>
                <p className="mt-1 text-2xl font-bold text-ink">
                  0 €<span className="text-sm font-medium text-ink-mute"> / mois</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-ink-mute" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[12px] text-ink-mute">Idéal pour découvrir votre potentiel de croissance.</p>
              </Card>

              <Card className="border-2 border-primary-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <IconWallet size={15} />
                    </span>
                    <h2 className="text-sm font-semibold text-ink">Pro</h2>
                  </div>
                  {plan === "Pro" ? (
                    <Badge tone="green" dot>
                      Plan actif
                    </Badge>
                  ) : (
                    <Badge tone="violet">Recommandé</Badge>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold text-ink">
                  19 €<span className="text-sm font-medium text-ink-mute"> / mois</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-primary-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {plan === "Pro" ? (
                    <Button variant="secondary" full disabled>
                      Plan Pro activé
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      full
                      onClick={() => {
                        setPlan("Pro");
                        toast("Paiement simulé : Pro activé", "success");
                      }}
                    >
                      Passer en Pro
                    </Button>
                  )}
                  <p className="mt-2.5 text-center text-[12px] text-ink-mute">Annulable à tout moment.</p>
                </div>
              </Card>
            </div>
            <p className="text-[12px] text-ink-mute">
              Une seule recommandation appliquée (ex : aligner votre prix de base sur la médiane du marché) rembourse
              souvent l&apos;abonnement plusieurs fois.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex items-center gap-2 text-ink-mute">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600">
          {icon}
        </span>
        <p className="text-[12px] font-medium">{label}</p>
      </div>
      <p className={`mt-2 text-[15px] font-bold leading-tight text-ink ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}
