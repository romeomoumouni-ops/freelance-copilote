"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ShareActions from "@/components/ShareActions";
import { getRevenue, type RevenueResult } from "@/lib/client";
import { formatRevenue } from "@/lib/analysis/revenue";
import { formatNumber } from "@/lib/utils";
import { IconWallet, IconSparkles, IconAlert, IconArrowRight, IconBag, IconEuro, IconStar, IconExternal, IconTrophy } from "@/components/icons";

const EXAMPLE = "https://comeup.com/fr/@hbconsultant";

export default function RevenuePage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [res, setRes] = useState<RevenueResult | null>(null);
  const [err, setErr] = useState("");

  async function reveal() {
    if (!url.trim()) {
      setErr("Colle un lien de profil ou de service ComeUp.");
      return;
    }
    setState("loading");
    setErr("");
    setRes(null);
    try {
      const r = await getRevenue(url.trim());
      setRes(r);
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Estimation impossible");
      setState("error");
    }
  }

  const ok = res && res.ok ? res : null;
  const shareText = ok
    ? `💰 ${ok.seller ?? "Ce freelance"} a généré ${formatRevenue(ok.estimate.totalRevenue)} sur ComeUp (estimation, ${formatNumber(ok.estimate.totalReviews)} avis). Analyse n'importe quel profil gratuitement sur Freelance Copilot.`
    : "";

  return (
    <>
      <PageHeader
        title="Revenu X-Ray"
        subtitle="Colle le lien d'un profil ou service ComeUp — le tien ou un concurrent — et découvre combien il a généré."
      />

      {/* Saisie */}
      <Card>
        <label className="block text-[13px] font-semibold text-ink">Lien ComeUp (profil ou service)</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && reveal()}
            placeholder="https://comeup.com/fr/@un-vendeur"
            className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm outline-none transition-all placeholder:text-ink-mute focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
          <Button variant="primary" size="lg" icon={<IconWallet size={16} />} onClick={reveal} disabled={state === "loading"}>
            {state === "loading" ? "Calcul en cours…" : "Révéler le revenu"}
          </Button>
        </div>
        {err && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-500">
            <IconAlert size={13} /> {err}
          </p>
        )}
        <button onClick={() => setUrl(EXAMPLE)} className="mt-3 text-[12px] font-medium text-primary-600 hover:underline">
          Essayer avec un exemple réel →
        </button>
      </Card>

      {state === "loading" && (
        <Card className="mt-4 flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
          <p className="text-sm text-ink-mute">Lecture des services et des avis en direct sur ComeUp…</p>
        </Card>
      )}

      {res && !res.ok && state === "done" && (
        <Card className="mt-4">
          <p className="text-sm text-ink-soft">{res.message}</p>
        </Card>
      )}

      {ok && (
        <div className="mt-6 animate-fade-up">
          {/* ---- CARTE PARTAGEABLE ---- */}
          <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-pop">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600">
                  <IconSparkles size={14} />
                </span>
                <span className="text-[13px] font-bold">Freelance Copilot · Revenu X-Ray</span>
              </div>
              <Badge tone="dark" className="bg-white/10 text-white/80">
                Estimation
              </Badge>
            </div>

            <div className="px-6 py-8 text-center">
              <p className="text-sm text-white/60">
                {ok.seller ?? "Ce vendeur"} · {ok.services} service{ok.services > 1 ? "s" : ""} · {formatNumber(ok.estimate.totalReviews)} avis
              </p>
              <p className="mt-2 text-[15px] font-medium text-white/80">a généré sur ComeUp</p>
              <p className="mt-1 bg-gradient-to-br from-primary-300 to-primary-500 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
                {formatRevenue(ok.estimate.totalRevenue)}
              </p>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
                <MiniStat icon={<IconBag size={15} />} value={formatNumber(ok.estimate.estimatedOrders)} label="commandes est." />
                <MiniStat icon={<IconEuro size={15} />} value={`${ok.estimate.avgPrice} €`} label="prix moyen" />
                <MiniStat icon={<IconStar size={15} />} value={formatNumber(ok.estimate.totalReviews)} label="avis" />
              </div>
            </div>

            <div className="border-t border-white/10 px-6 py-3 text-center text-[11px] text-white/45">
              Estimation à partir des avis publics (proxy des commandes) et des prix affichés · copilot-freelance.app
            </div>
          </div>

          {/* Partage + CTA */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ShareActions text={shareText} className="flex flex-wrap gap-2" />
            <Link href="/profile">
              <Button variant="ghost" iconRight={<IconArrowRight size={15} />}>
                Analyser ton propre profil
              </Button>
            </Link>
          </div>

          {/* Détail par service */}
          <Card className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-ink">Détail par service</h3>
            <div className="space-y-2">
              {ok.estimate.perGig.slice(0, 8).map((g) => (
                <a
                  key={g.url}
                  href={g.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{g.title}</p>
                    <p className="text-[12px] text-ink-mute">
                      {formatNumber(g.reviews)} avis · {g.price} € · ~{formatNumber(g.estimatedOrders)} commandes
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-600">{formatRevenue(g.revenue)}</span>
                  <IconExternal size={13} className="shrink-0 text-ink-mute" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-mute">{ok.estimate.note}</p>
          </Card>

          {/* Upsell formation */}
          <Card className="mt-4 flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-primary-50/70 to-white sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <IconTrophy size={18} />
              </span>
              <div>
                <p className="font-semibold text-ink">Toi aussi tu peux générer ça.</p>
                <p className="text-[13px] text-ink-mute">Apprends un service rentable et lance-toi ce mois-ci.</p>
              </div>
            </div>
            <Link href="/learn">
              <Button variant="violet" iconRight={<IconArrowRight size={15} />}>
                Voir les formations
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-3">
      <span className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-primary-300">{icon}</span>
      <p className="text-[15px] font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] text-white/50">{label}</p>
    </div>
  );
}
