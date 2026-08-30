"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { getCategories, getMarket } from "@/lib/client";
import type { CategoryDef, MarketStats } from "@/lib/client";
import { iconMap } from "@/components/icons";
import {
  IconSearch,
  IconSparkles,
  IconAlert,
  IconRefresh,
  IconEuro,
  IconStar,
  IconGauge,
  IconLayers,
  IconTarget,
  IconGlobe,
  IconExternal,
  IconTrendingUp,
  IconLightbulb,
  IconArrowRight,
} from "@/components/icons";
import { formatNumber } from "@/lib/utils";

const COUNTRY_COLORS = ["#EA680C", "#10B981", "#3B82F6", "#EC4899", "#0EA5E9", "#8B5CF6", "#64748B"];

export default function Market() {
  const toast = useToast();

  // Catégories (chargées au montage)
  const [categories, setCategories] = useState<CategoryDef[] | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [group, setGroup] = useState("all");

  // Marché sélectionné (scrapé en direct)
  const [market, setMarket] = useState<MarketStats | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("");

  // Recherche libre
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const { categories } = await getCategories();
        if (alive) setCategories(categories);
      } catch (e) {
        if (alive) setCatError(e instanceof Error ? e.message : "Impossible de charger les niches. Réessayez.");
      } finally {
        if (alive) setCatLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    if (!categories) return [];
    return Array.from(new Set(categories.map((c) => c.group)));
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    return group === "all" ? categories : categories.filter((c) => c.group === group);
  }, [categories, group]);

  async function loadCategory(cat: CategoryDef) {
    setActiveSlug(cat.slug);
    setActiveLabel(cat.label);
    setMarket(null);
    setMarketError(null);
    setMarketLoading(true);
    try {
      const { market } = await getMarket({ category: cat.slug });
      setMarket(market);
    } catch (e) {
      setMarketError(e instanceof Error ? e.message : "Le scraping en direct a échoué. Réessayez dans un instant.");
    } finally {
      setMarketLoading(false);
    }
  }

  async function loadQuery() {
    const q = query.trim();
    if (!q) {
      toast("Entrez un mot-clé à analyser (ex : « logo minimaliste »).", "warning");
      return;
    }
    setActiveSlug(null);
    setActiveLabel(q);
    setMarket(null);
    setMarketError(null);
    setMarketLoading(true);
    try {
      const { market } = await getMarket({ q });
      setMarket(market);
    } catch (e) {
      setMarketError(e instanceof Error ? e.message : "Le scraping en direct a échoué. Réessayez dans un instant.");
    } finally {
      setMarketLoading(false);
    }
  }

  function retry() {
    if (activeSlug) {
      const cat = categories?.find((c) => c.slug === activeSlug);
      if (cat) return void loadCategory(cat);
    }
    if (activeLabel) {
      setQuery(activeLabel);
      void loadQuery();
    }
  }

  return (
    <>
      <PageHeader
        title="Explorer le marché"
        subtitle="Les vraies statistiques de chaque niche ComeUp, lues en direct : prix, demande, concurrence, opportunités."
      />

      {/* Recherche libre */}
      <Card>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <IconSearch size={16} />
          </span>
          <h2 className="text-sm font-bold text-ink">Analyser un mot-clé précis</h2>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !marketLoading && loadQuery()}
              placeholder="Ex : logo minimaliste, boutique Shopify, montage TikTok…"
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-sm outline-none transition-all placeholder:text-ink-mute focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <Button
            variant="violet"
            size="lg"
            icon={<IconSparkles size={16} />}
            onClick={loadQuery}
            disabled={marketLoading}
            className="shrink-0"
          >
            Analyser ce mot-clé
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-ink-mute">
          Le copilote lit en direct les services correspondants sur ComeUp — quelques secondes la première fois.
        </p>
      </Card>

      {/* Niches / catégories */}
      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Niches suivies en profondeur</h2>
            <p className="text-sm text-ink-mute">Cliquez une niche pour lire ses vraies statistiques de marché.</p>
          </div>
          {groups.length > 0 && (
            <Select
              value={group}
              onChange={setGroup}
              ariaLabel="Filtrer par famille"
              options={[{ value: "all", label: "Toutes les familles" }, ...groups.map((g) => ({ value: g, label: g }))]}
            />
          )}
        </div>

        {catLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : catError ? (
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <IconAlert size={20} />
            </span>
            <p className="max-w-sm text-sm text-ink-soft">{catError}</p>
            <Button variant="secondary" icon={<IconRefresh size={15} />} onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((cat) => {
              const Icon = iconMap[cat.icon as keyof typeof iconMap] ?? IconLayers;
              const active = activeSlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => loadCategory(cat)}
                  disabled={marketLoading}
                  className={`group flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:cursor-wait ${
                    active ? "border-primary-300 ring-2 ring-primary-100" : "border-line"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      active ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600"
                    }`}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{cat.label}</p>
                    <p className="text-[12px] text-ink-mute">{cat.group}</p>
                  </div>
                  {active && marketLoading ? (
                    <Spinner size={16} />
                  ) : (
                    <IconArrowRight
                      size={16}
                      className="shrink-0 text-ink-mute opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Résultat du marché */}
      <div className="mt-8">
        {marketLoading && (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Spinner size={40} />
            <p className="text-base font-bold text-ink">Lecture du marché en direct…</p>
            <p className="max-w-sm text-sm text-ink-mute">
              Scraping des services « {activeLabel} » sur ComeUp — prix, notes, avis et vendeurs.
            </p>
          </Card>
        )}

        {!marketLoading && marketError && (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <IconAlert size={20} />
            </span>
            <p className="max-w-sm text-sm text-ink-soft">{marketError}</p>
            <Button variant="secondary" icon={<IconRefresh size={15} />} onClick={retry}>
              Relancer le scraping
            </Button>
          </Card>
        )}

        {!marketLoading && !marketError && market && <MarketResult market={market} activeLabel={activeLabel} />}
      </div>
    </>
  );
}

function MarketResult({ market, activeLabel }: { market: MarketStats; activeLabel: string }) {
  const title = market.label || activeLabel;
  return (
    <div className="animate-fade-up space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <IconTarget size={16} className="text-primary-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Marché ComeUp</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
          </div>
          <Badge tone="green" dot>
            {market.sampleSize} services analysés en direct
          </Badge>
        </div>

        {/* Stats réelles */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={<IconEuro size={16} />} label="Prix médian" value={`${market.price.median} €`}>
            <p className="mt-1.5 text-[11px] text-ink-mute">
              Fourchette {market.price.min} – {market.price.max} € · moyenne {market.price.avg} €
            </p>
          </StatTile>

          <StatTile icon={<IconStar size={16} />} label="Note moyenne" value={`${market.ratingAvg}/5`}>
            <p className="mt-1.5 text-[11px] text-ink-mute">
              {formatNumber(market.reviews.total)} avis cumulés sur la niche
            </p>
          </StatTile>

          <IndexTile
            icon={<IconGauge size={16} />}
            label="Demande"
            value={market.demand}
            color="#10B981"
            hint="Volume d'avis cumulés = preuve d'achats."
          />

          <IndexTile
            icon={<IconLayers size={16} />}
            label="Saturation"
            value={market.saturation}
            color="#F59E0B"
            hint="Offre abondante + avis concentrés = niche disputée."
          />
        </div>

        {/* Opportunité mise en avant */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <IconTrendingUp size={20} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-white/80">Indice d&apos;opportunité (estimé)</p>
                <p className="text-[13px] text-white/70">Forte demande, place encore disponible = terrain à prendre.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold leading-none">
                {market.opportunity}
                <span className="text-lg font-semibold text-white/70">/100</span>
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, market.opportunity))}%` }}
            />
          </div>
        </div>

        {/* Répartition pays */}
        {market.countries.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 flex items-center gap-2">
              <IconGlobe size={15} className="text-ink-mute" />
              <p className="text-[12px] font-semibold text-ink-soft">Provenance des vendeurs</p>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/[0.06]">
              {market.countries.map((c, i) => (
                <div
                  key={c.code}
                  title={`${c.code} · ${c.share}%`}
                  style={{ width: `${c.share}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {market.countries.map((c, i) => (
                <span key={c.code} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                  />
                  <span className="font-semibold text-ink">{c.code}</span> {c.share}%
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Meilleurs services */}
      {market.topGigs.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <IconStar size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-ink">Meilleurs services de la niche</h3>
            <Badge tone="gray">{market.topGigs.length}</Badge>
          </div>
          <div className="space-y-2">
            {market.topGigs.map((g) => (
              <a
                key={g.id}
                href={g.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-ink">
                    <span className="truncate">{g.title}</span>
                    <IconExternal size={12} className="shrink-0 text-ink-mute" />
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-mute">
                    <span>{g.seller || "vendeur"}</span>
                    {g.sellerCountry && <span>· {g.sellerCountry}</span>}
                    <span>· {formatNumber(g.reviews)} avis</span>
                  </p>
                </div>
                {g.rating != null && (
                  <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-amber-500">
                    <IconStar size={12} /> {g.rating}
                  </span>
                )}
                <span className="w-16 shrink-0 text-right text-sm font-bold text-ink">{g.price} €</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Encart opportunité → idées */}
      <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-emerald-50/70 to-white sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <IconLightbulb size={18} />
          </span>
          <div>
            <p className="font-semibold text-ink">Une opportunité élevée = forte demande et encore de la place.</p>
            <p className="text-[13px] text-ink-mute">
              Transformez cette niche en service concret : le copilote propose des idées prêtes à publier.
            </p>
          </div>
        </div>
        <Link href="/ideas" className="shrink-0">
          <Button variant="primary" iconRight={<IconArrowRight size={15} />}>
            Voir les idées de services
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex items-center gap-2 text-ink-mute">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
          {icon}
        </span>
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="mt-2.5 text-[24px] font-bold leading-none tracking-tight text-ink">{value}</p>
      {children}
    </div>
  );
}

function IndexTile({
  icon,
  label,
  value,
  color,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-mute">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
            {icon}
          </span>
          <span className="text-[12px] font-medium">{label}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">estimé</span>
      </div>
      <p className="mt-2.5 text-[24px] font-bold leading-none tracking-tight text-ink">
        {value}
        <span className="text-sm font-semibold text-ink-mute">/100</span>
      </p>
      <Progress value={value} color={color} className="mt-2.5" />
      <p className="mt-2 text-[11px] leading-relaxed text-ink-mute">{hint}</p>
    </div>
  );
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 animate-spin rounded-full border-primary-100 border-t-primary-600"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 12)) }}
    />
  );
}
