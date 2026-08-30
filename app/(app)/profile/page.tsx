"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import { generate, type ProfileAnalysis } from "@/lib/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { ImpactBadge } from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import Progress from "@/components/ui/Progress";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import EmptyProfile from "@/components/EmptyProfile";
import ReviewInsights from "@/components/ReviewInsights";
import { iconMap, IconSparkles, IconStar, IconExternal, IconTarget, IconRefresh, IconGlobe, IconWallet, IconLayers, IconBag, IconCopy, IconCheck, IconArrowRight, IconLightbulb, IconTrendingUp } from "@/components/icons";
import { formatNumber, scoreTextClass, scoreLabel } from "@/lib/utils";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export default function ProfilePage() {
  const { analysis, hydrated } = useProfile();
  const toast = useToast();

  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genText, setGenText] = useState("");
  const [genSource, setGenSource] = useState<"ia" | "template" | null>(null);

  if (!hydrated) return <div className="h-40 animate-pulse rounded-3xl bg-white/60" />;
  if (!analysis) return <EmptyProfile />;

  const a: ProfileAnalysis = analysis;
  const { profile, market, scores, mainGig, recommendations, competitors } = a;
  const displayName = profile.displayName || profile.username || "vous";

  // Prix médian réel du freelance (services facturés)
  const myPrices = profile.gigs.map((g) => g.price).filter((p) => p > 0);
  const myMedian = median(myPrices);

  // Avis cumulés réels
  const totalReviews = profile.totalReviews || profile.gigs.reduce((s, g) => s + g.reviews, 0);

  // Verdict = 2 scores les plus faibles
  const weakest = [...scores].sort((x, y) => x.score - y.score).slice(0, 2);
  const verdict =
    weakest.length >= 2
      ? `Vos deux maillons faibles : ${weakest[0].label} (${weakest[0].score}/100) et ${weakest[1].label} (${weakest[1].score}/100). C'est là que se cache le plus de revenus à débloquer.`
      : scoreLabel(a.globalScore);

  async function runGenerate() {
    if (!mainGig) return;
    setGenOpen(true);
    setGenLoading(true);
    setGenText("");
    setGenSource(null);
    try {
      const r = await generate({ kind: "description", url: mainGig.url });
      setGenText(r.text);
      setGenSource(r.source);
    } catch (e) {
      setGenText("");
      toast(e instanceof Error ? e.message : "Génération impossible", "warning");
      setGenOpen(false);
    } finally {
      setGenLoading(false);
    }
  }

  function copyDescription() {
    if (!genText) return;
    navigator.clipboard.writeText(genText).then(
      () => toast("Description copiée dans le presse-papiers", "success"),
      () => toast("Copie impossible", "warning"),
    );
  }

  function applyReco(id: string) {
    setApplied((prev) => ({ ...prev, [id]: true }));
    toast("Priorité marquée comme appliquée. Bravo !", "success");
  }

  const packs = mainGig?.packs ?? [];

  return (
    <>
      <PageHeader
        title={`Bonjour ${displayName}`}
        subtitle={`Votre profil lu et comparé en direct au marché « ${market.label} » (${formatNumber(market.sampleSize)} services analysés).`}
        actions={
          <Link href="/">
            <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />}>
              Relancer une analyse
            </Button>
          </Link>
        }
      />

      {/* 1. HÉRO SCORE */}
      <Card className="animate-fade-up bg-gradient-to-br from-primary-50/60 to-white">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing value={a.globalScore} size={112} suffix="%" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Pourcentage de réussite</p>
              <p className={`text-lg font-bold ${scoreTextClass(a.globalScore)}`}>{scoreLabel(a.globalScore)}</p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-soft">{verdict}</p>
            </div>
          </div>
          <div className="space-y-2.5 lg:border-l lg:border-line lg:pl-6">
            {scores.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-[13px] font-medium text-ink-soft" title={s.label}>
                  {s.label}
                </span>
                <Progress value={s.score} className="flex-1" />
                <span className={`w-10 shrink-0 text-right text-[13px] font-bold ${scoreTextClass(s.score)}`}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<IconLayers size={16} />} label="Services lus" value={formatNumber(profile.gigs.length)} sub="sur votre boutique" />
        <Kpi icon={<IconStar size={16} />} label="Avis cumulés" value={formatNumber(totalReviews)} sub="preuve de ventes" />
        <Kpi
          icon={<IconWallet size={16} />}
          label="Votre prix médian"
          value={myMedian > 0 ? `${myMedian} €` : "—"}
          sub={`marché : ${market.price.median} €`}
        />
        <Kpi
          icon={<IconTrendingUp size={16} />}
          label="Opportunité marché"
          value={`${market.opportunity}/100`}
          sub={`demande ${market.demand} · saturation ${market.saturation} (estimé)`}
        />
      </div>

      {/* 3. VOS PRIORITÉS */}
      <div className="mt-8 mb-3 flex items-center gap-2">
        <IconTarget size={18} className="text-primary-600" />
        <h2 className="text-lg font-bold text-ink">Vos priorités</h2>
      </div>
      {recommendations.length === 0 ? (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50/40">
          <IconCheck size={18} className="shrink-0 text-emerald-600" />
          <p className="text-[13px] text-ink-soft">Aucune priorité urgente : votre profil coche déjà les grands fondamentaux du marché. Continuez à récolter des avis pour renforcer votre avance.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((r) => {
            const Icon = iconMap[r.icon as keyof typeof iconMap] ?? IconLightbulb;
            const done = applied[r.id];
            return (
              <Card key={r.id} className={done ? "opacity-60" : ""}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-ink">{r.title}</h3>
                      <ImpactBadge impact={r.impact} />
                      <Badge tone="gray">{r.category}</Badge>
                      <span className="text-[12px] font-semibold text-emerald-600">{r.gain}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{r.description}</p>
                    <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink">Preuve : </span>
                      {r.evidence}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {done ? (
                      <Badge tone="green" dot>
                        Appliquée
                      </Badge>
                    ) : (
                      <Button variant="soft" size="sm" icon={<IconCheck size={14} />} onClick={() => applyReco(r.id)}>
                        Marquer faite
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. MARCHÉ + CONCURRENTS */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <IconGlobe size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-ink">Votre marché en direct</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Prix médian" value={`${market.price.median} €`} />
            <Metric label="Fourchette" value={`${market.price.min} – ${market.price.max} €`} />
            <Metric label="Note moyenne" value={market.ratingAvg ? `${market.ratingAvg.toFixed(1)} ★` : "—"} />
            <Metric label="Avis médians" value={formatNumber(market.reviews.median)} />
          </div>
          <div className="mt-4 space-y-2.5">
            <EstLine label="Demande" value={market.demand} />
            <EstLine label="Saturation" value={market.saturation} />
            <EstLine label="Opportunité" value={market.opportunity} />
          </div>
          <p className="mt-2 text-[11px] italic text-ink-mute">Demande, saturation et opportunité sont des estimations calculées à partir des volumes d'avis publics.</p>
          {market.countries.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-1.5 text-[12px] font-semibold text-ink-mute">Répartition des vendeurs</p>
              <div className="flex flex-wrap gap-1.5">
                {market.countries.slice(0, 6).map((c) => (
                  <Badge key={c.code} tone="gray">
                    {c.code} · {c.share}%
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconTarget size={16} className="text-primary-600" />
              <h3 className="text-sm font-bold text-ink">Vos vrais concurrents</h3>
            </div>
            <span className="text-[11px] font-semibold text-ink-mute">lus en direct</span>
          </div>
          {competitors.length === 0 ? (
            <p className="text-[13px] text-ink-mute">Aucun concurrent détecté sur ce marché pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {competitors.slice(0, 4).map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      <span className="truncate">{c.title}</span>
                      <IconExternal size={12} className="shrink-0 text-ink-mute" />
                    </p>
                    <p className="text-[12px] text-ink-mute">
                      {c.sellerCountry ?? "?"} · {formatNumber(c.reviews)} avis
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink">{c.price} €</span>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 6. AVIS CLIENTS + PALIERS */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <IconStar size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-ink">Ce que disent vos clients</h3>
          </div>
          {mainGig ? (
            <ReviewInsights url={mainGig.url} variant="yours" />
          ) : (
            <p className="text-[13px] text-ink-mute">Aucun service phare identifié : impossible de lire vos avis pour l'instant.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <IconBag size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-ink">Vos paliers d'offre</h3>
          </div>
          {packs.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-800">
              Aucun palier détecté. Créez au moins 3 formules (Essentiel, Standard, Premium) : c'est le levier n°1 pour augmenter votre panier moyen sans plus de prospects.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {packs.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                    <span className="truncate text-[13px] font-medium text-ink">{p.name}</span>
                    <span className="shrink-0 text-[13px] font-bold text-ink">{p.price != null ? `${p.price} €` : "—"}</span>
                  </div>
                ))}
              </div>
              {packs.length < 3 && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800">
                  Vous n'avez que {packs.length} palier{packs.length > 1 ? "s" : ""}. Visez 3 formules, dont une Premium : même le client prêt à payer plus a besoin d'une case à cocher.
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* 7. GÉNÉRER UNE DESCRIPTION */}
      {mainGig && (
        <Card className="mt-4 bg-gradient-to-br from-primary-50/50 to-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <IconSparkles size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Générer une meilleure description</h3>
                <p className="mt-0.5 max-w-md text-[13px] text-ink-soft">
                  Votre copilote réécrit la description de votre service phare en s'appuyant sur les mots-clés qui dominent votre marché.
                </p>
              </div>
            </div>
            <Button variant="violet" icon={<IconSparkles size={15} />} onClick={runGenerate}>
              Rédiger avec l'IA
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Nouvelle description"
        subtitle={genSource ? (genSource === "ia" ? "Rédigé par l'IA à partir de votre marché" : "Proposition basée sur les mots-clés du marché") : undefined}
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={runGenerate} disabled={genLoading}>
              Régénérer
            </Button>
            <Button variant="primary" size="sm" icon={<IconCopy size={14} />} onClick={copyDescription} disabled={genLoading || !genText}>
              Copier
            </Button>
          </div>
        }
      >
        {genLoading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-ink-mute">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
            Rédaction en cours…
          </div>
        ) : genText ? (
          <div className="whitespace-pre-line rounded-2xl bg-canvas p-4 text-[13px] leading-relaxed text-ink-soft">{genText}</div>
        ) : (
          <p className="py-6 text-[13px] text-ink-mute">Aucun texte généré.</p>
        )}
      </Modal>
    </>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-ink-mute">
        <span className="text-primary-600">{icon}</span>
        <span className="text-[12px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] text-ink-mute">{sub}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function EstLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[13px] text-ink-soft">{label}</span>
      <Progress value={value} className="flex-1" />
      <span className="w-14 shrink-0 text-right text-[12px] font-medium text-ink-mute">{value} · estimé</span>
    </div>
  );
}
