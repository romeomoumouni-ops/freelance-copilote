"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getRentableIdeas, type RentableIdea } from "@/lib/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { iconMap } from "@/components/icons";
import { IconRefresh, IconTrophy, IconLightbulb, IconAlert, IconArrowRight } from "@/components/icons";

function serviceIcon(key: string) {
  return iconMap[key as keyof typeof iconMap] ?? iconMap.sparkles;
}

export default function Ideas() {
  const [ideas, setIdeas] = useState<RentableIdea[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIdeas(null);
    try {
      const d = await getRentableIdeas();
      setIdeas(d.ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = ideas
    ? [...ideas].sort((a, b) => (b.market?.opportunity ?? -1) - (a.market?.opportunity ?? -1))
    : [];

  return (
    <>
      <PageHeader
        title="Idées de services rentables"
        subtitle="Les métiers freelance qui rapportent vraiment sur ComeUp — avec la demande réelle du marché et la formation pour t'y mettre."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={14} />}
            onClick={load}
            disabled={loading}
          >
            Rafraîchir
          </Button>
        }
      />

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-white/60 py-20 text-center">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary-600" />
          <div>
            <p className="text-sm font-semibold text-ink">Analyse des marchés en cours…</p>
            <p className="mt-1 text-[12px] text-ink-mute">
              On lit plusieurs catégories ComeUp en direct, ça prend quelques secondes.
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <IconAlert size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">L&apos;analyse n&apos;a pas abouti</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-mute">{error}</p>
          </div>
          <Button variant="primary" size="sm" icon={<IconRefresh size={14} />} onClick={load}>
            Réessayer
          </Button>
        </Card>
      )}

      {!loading && !error && ideas && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {sorted.map((idea) => {
              const { service, formation, market } = idea;
              const Icon = serviceIcon(service.emojiFreeIcon);
              const highOpp = market ? market.opportunity >= 60 : false;
              return (
                <Card key={service.key} hover className="flex flex-col">
                  {/* En-tête */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <Icon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{service.name}</h3>
                        {market && (
                          <Badge tone={highOpp ? "green" : "violet"}>
                            Opportunité {market.opportunity}/100
                          </Badge>
                        )}
                      </div>
                      {market && <p className="mt-0.5 text-[12px] text-ink-mute">{market.label}</p>}
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{service.pitch}</p>

                  {/* Stats marché réel */}
                  {market ? (
                    <>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Stat label="Prix médian" value={`${market.price.median} €`} />
                        <Stat label="Demande" value={`${market.demand}/100`} hint="estimé" />
                        <Stat label="Saturation" value={`${market.saturation}/100`} hint="estimé" />
                      </div>
                      <p className="mt-2 text-[11px] text-ink-mute">
                        {market.sampleSize} services analysés en direct · leader {market.reviews.max} avis
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 rounded-xl bg-canvas px-3 py-2.5 text-[12px] text-ink-mute">
                      Marché momentanément indisponible — réessaie dans un instant.
                    </p>
                  )}

                  {/* Bloc formation */}
                  {formation && (
                    <div className="mt-4 flex flex-1 flex-col rounded-2xl bg-primary-50 p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary-600">
                          <IconTrophy size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
                            Formation
                          </p>
                          <p className="text-sm font-bold text-ink">{formation.title}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{formation.tagline}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-mute">
                        <span className="font-bold text-ink">
                          {formation.price.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span>· {formation.duration}</span>
                        <span>· {formation.level}</span>
                      </div>
                      <div className="mt-auto pt-4">
                        <Link href="/learn">
                          <Button variant="violet" size="sm" full iconRight={<IconArrowRight size={15} />}>
                            Me former sur ce métier
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Encart bas */}
          <Card className="mt-6 flex items-start gap-3 bg-gradient-to-br from-primary-50/70 to-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-card">
              <IconLightbulb size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Comment lire ces chiffres ?</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Une opportunité élevée = forte demande et encore de la place. Choisis un métier, forme-toi, lance-toi.
                Les indices de demande, saturation et opportunité sont des estimations.
              </p>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-2.5 py-2 text-center">
      <p className="text-sm font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-ink-mute">
        {label}
        {hint && <span className="block text-primary-600/70">{hint}</span>}
      </p>
    </div>
  );
}
