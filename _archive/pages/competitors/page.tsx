"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { getCategories, getCompetitors, type Gig, type CategoryDef } from "@/lib/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import EmptyProfile from "@/components/EmptyProfile";
import ReviewInsights from "@/components/ReviewInsights";
import { IconStar, IconTarget, IconExternal, IconTrendingUp, IconRefresh, IconAlert, IconMessageSquare } from "@/components/icons";
import { formatNumber } from "@/lib/utils";

export default function Competitors() {
  const { analysis, hydrated } = useProfile();

  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [exploreSlug, setExploreSlug] = useState("");
  const [exploreGigs, setExploreGigs] = useState<Gig[] | null>(null);
  const [exploreLabel, setExploreLabel] = useState("");
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  if (!hydrated) return <div className="h-40 animate-pulse rounded-3xl bg-white/60" />;
  if (!analysis) return <EmptyProfile />;

  const { mainGig, market, competitors } = analysis;
  const you = mainGig;
  const leader = competitors[0];

  const rows = you
    ? [{ ...you, title: you.title, isYou: true }, ...competitors.map((c) => ({ ...c, isYou: false }))]
    : competitors.map((c) => ({ ...c, isYou: false }));
  const best = {
    price: Math.min(...rows.filter((r) => r.price > 0).map((r) => r.price)),
    rating: Math.max(...rows.map((r) => r.rating ?? 0)),
    reviews: Math.max(...rows.map((r) => r.reviews)),
  };

  async function explore(slug: string) {
    if (!slug) return;
    setExploreSlug(slug);
    setExploreLoading(true);
    setExploreError(null);
    setExploreGigs(null);
    try {
      const d = await getCompetitors({ category: slug });
      setExploreGigs(d.competitors);
      setExploreLabel(d.market.label);
    } catch (e) {
      setExploreError(e instanceof Error ? e.message : "Lecture impossible");
    } finally {
      setExploreLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Concurrents"
        subtitle={`Vos vrais concurrents sur le marché « ${market.label} » — les services les mieux notés, lus en direct.`}
      />

      {you && leader && (
        <Card className="bg-gradient-to-br from-primary-50/60 to-white">
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-wider text-ink-mute">Vous vs le meilleur du marché</p>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <Duel title="Votre service phare" gig={you} tone="violet" />
            <div className="flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-600 shadow-card">
                <IconTarget size={20} />
              </span>
            </div>
            <Duel title="N°1 du marché" gig={leader} tone="emerald" />
          </div>
          <p className="mt-4 rounded-xl bg-white/70 p-3 text-center text-[13px] text-ink-soft">
            {leader.reviews > you.reviews
              ? `Le leader affiche ${formatNumber(leader.reviews - you.reviews)} avis de plus que votre service phare. `
              : `Vous devancez le leader en volume d'avis. `}
            {you.price < market.price.median
              ? `Votre prix (${you.price} €) est sous la médiane du marché (${market.price.median} €) : il y a de la marge.`
              : `Votre prix (${you.price} €) est aligné ou au-dessus du marché (${market.price.median} €).`}
          </p>
        </Card>
      )}

      <Card flush className="mt-4 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-bold text-ink">Comparatif détaillé</h3>
          <p className="text-[12px] text-ink-mute">La meilleure valeur de chaque ligne est en vert. Données publiques réelles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-mute">
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Prix</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold">Avis</th>
                <th className="px-4 py-3 font-semibold">Délai</th>
                <th className="px-4 py-3 font-semibold">Pays</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id + String(i)} className={`border-b border-line/60 ${r.isYou ? "bg-primary-50/50" : ""}`}>
                  <td className="max-w-[240px] px-4 py-3">
                    <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-ink hover:text-primary-600">
                      <span className="truncate">
                        {r.isYou ? "Vous — " : ""}
                        {r.title}
                      </span>
                      {!r.isYou && <IconExternal size={12} className="shrink-0 text-ink-mute" />}
                    </a>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${r.price === best.price && r.price > 0 ? "text-emerald-600" : "text-ink"}`}>{r.price} €</td>
                  <td className={`px-4 py-3 ${(r.rating ?? 0) === best.rating && r.rating ? "font-bold text-emerald-600" : "text-ink-soft"}`}>{r.rating ?? "—"}</td>
                  <td className={`px-4 py-3 ${r.reviews === best.reviews ? "font-bold text-emerald-600" : "text-ink-soft"}`}>{formatNumber(r.reviews)}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.deliveryDays ? `${r.deliveryDays} j` : "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.sellerCountry ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h3 className="mb-3 mt-8 text-lg font-bold text-ink">Ce qui fait leur performance</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {competitors.map((c) => (
          <Card key={c.id} hover>
            <div className="flex items-start justify-between gap-3">
              <a href={c.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 font-semibold text-ink hover:text-primary-600">
                <span className="line-clamp-2">{c.title}</span>
              </a>
              <span className="shrink-0 text-sm font-bold text-ink">{c.price} €</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {c.rating && (
                <Badge tone="orange">
                  <IconStar size={11} /> {c.rating}
                </Badge>
              )}
              <Badge tone="gray">{formatNumber(c.reviews)} avis</Badge>
              {c.sellerCountry && <Badge tone="gray">{c.sellerCountry}</Badge>}
              {c.deliveryDays && <Badge tone="gray">{c.deliveryDays} j</Badge>}
              {c.sponsored && <Badge tone="violet">Sponsorisé</Badge>}
            </div>
            <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Pourquoi il performe : </span>
              {c.reviews >= market.reviews.median
                ? `un très gros volume d'avis (${formatNumber(c.reviews)}) le propulse en tête du classement`
                : "un bon positionnement sur les mots-clés du marché"}
              {c.price <= market.price.median ? `, à un prix compétitif (${c.price} €)` : `, sur un positionnement premium (${c.price} €)`}
              {c.deliveryDays ? ` et un délai de ${c.deliveryDays} jours` : ""}.
            </p>
            <div className="mt-3 border-t border-line pt-3">
              <ReviewInsights url={c.url} variant="competitor" />
            </div>
          </Card>
        ))}
      </div>

      {you && (
        <Card className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <IconMessageSquare size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-ink">Ce que disent vos propres clients</h3>
          </div>
          <ReviewInsights url={you.url} variant="yours" />
        </Card>
      )}

      <Card className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconTrendingUp size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-ink">Explorer les leaders d&apos;un autre marché</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select
              ariaLabel="Choisir une catégorie"
              value={exploreSlug}
              onChange={explore}
              options={[{ value: "", label: "Choisir une niche…" }, ...categories.map((c) => ({ value: c.slug, label: c.label }))]}
            />
            {exploreSlug && (
              <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => explore(exploreSlug)}>
                Relire
              </Button>
            )}
          </div>
        </div>

        {exploreLoading && (
          <div className="flex items-center gap-3 py-6 text-sm text-ink-mute">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
            Lecture en direct des leaders du marché…
          </div>
        )}
        {exploreError && (
          <p className="flex items-center gap-1.5 py-4 text-sm text-red-500">
            <IconAlert size={14} /> {exploreError}
          </p>
        )}
        {exploreGigs && !exploreLoading && (
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-ink-mute">Top services — {exploreLabel}</p>
            {exploreGigs.slice(0, 6).map((g) => (
              <a key={g.id} href={g.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-canvas">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{g.title}</p>
                  <p className="text-[12px] text-ink-mute">
                    {g.seller || "vendeur"} · {g.sellerCountry ?? "?"} · {formatNumber(g.reviews)} avis
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">{g.price} €</span>
              </a>
            ))}
          </div>
        )}
        {!exploreGigs && !exploreLoading && !exploreError && (
          <p className="py-2 text-[13px] text-ink-mute">Choisissez une niche pour voir ses meilleurs vendeurs en temps réel.</p>
        )}
      </Card>
    </>
  );
}

function Duel({ title, gig, tone }: { title: string; gig: Gig; tone: "violet" | "emerald" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "violet" ? "border-primary-200 bg-primary-50/40" : "border-emerald-200 bg-emerald-50/40"}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{title}</p>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold text-ink">{gig.title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="Prix" value={`${gig.price} €`} />
        <Mini label="Note" value={gig.rating ? String(gig.rating) : "—"} />
        <Mini label="Avis" value={formatNumber(gig.reviews)} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-ink">{value}</p>
      <p className="text-[10px] text-ink-mute">{label}</p>
    </div>
  );
}
