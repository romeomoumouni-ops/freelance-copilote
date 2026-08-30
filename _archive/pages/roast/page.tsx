"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ShareActions from "@/components/ShareActions";
import { getRoast, type RoastResult } from "@/lib/client";
import { scoreTextClass } from "@/lib/utils";
import { IconZap, IconAlert, IconArrowRight, IconCheck, IconSparkles, IconTrophy } from "@/components/icons";

const EXAMPLE = "https://comeup.com/fr/service/1044/creer-votre-site-web-professionnel-cle-en-main-vitrine-e-commerce-sur-mesure";

export default function RoastPage() {
  const { analysis } = useProfile();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [res, setRes] = useState<RoastResult | null>(null);
  const [err, setErr] = useState("");

  const prefill = analysis?.mainGig?.url ?? "";

  async function roastIt(target?: string) {
    const link = (target ?? url).trim();
    if (!link) {
      setErr("Colle le lien de ton service ComeUp.");
      return;
    }
    setUrl(link);
    setState("loading");
    setErr("");
    setRes(null);
    try {
      const r = await getRoast(link);
      setRes(r);
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Analyse impossible");
      setState("error");
    }
  }

  const ok = res && res.ok ? res : null;
  const shareText = ok
    ? `🔥 Mon service ComeUp est passé au Coup de gueule du copilote : ${ok.roast.score}/100. « ${ok.roast.headline} » Teste le tien gratuitement sur Freelance Copilot.`
    : "";

  return (
    <>
      <PageHeader
        title="Coup de gueule du copilote"
        subtitle="Ton service passé au grill. Franc, cash — mais chaque pique vient avec la solution."
      />

      <Card>
        <label className="block text-[13px] font-semibold text-ink">Lien de ton service ComeUp</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && roastIt()}
            placeholder="https://comeup.com/fr/service/…"
            className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm outline-none transition-all placeholder:text-ink-mute focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
          <Button variant="primary" size="lg" icon={<IconZap size={16} />} onClick={() => roastIt()} disabled={state === "loading"}>
            {state === "loading" ? "Ça chauffe…" : "Balance mon service"}
          </Button>
        </div>
        {err && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-500">
            <IconAlert size={13} /> {err}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          {prefill && (
            <button onClick={() => roastIt(prefill)} className="text-[12px] font-medium text-primary-600 hover:underline">
              Utiliser mon service analysé →
            </button>
          )}
          <button onClick={() => roastIt(EXAMPLE)} className="text-[12px] font-medium text-ink-mute hover:underline">
            Essayer avec un exemple
          </button>
        </div>
      </Card>

      {state === "loading" && (
        <Card className="mt-4 flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
          <p className="text-sm text-ink-mute">Le copilote lit ton service et aiguise ses piques…</p>
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
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-pop">
            <div className="flex items-center justify-between bg-ink px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600">
                  <IconZap size={14} />
                </span>
                <span className="text-[13px] font-bold">Coup de gueule du copilote</span>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold">
                {ok.roast.score}/100
              </span>
            </div>

            <div className="px-6 py-6">
              <p className="text-xl font-black leading-tight text-ink sm:text-2xl">{ok.roast.headline}</p>
              {ok.service && <p className="mt-1 text-[13px] text-ink-mute">Sur : {ok.service}</p>}

              <div className="mt-5 space-y-3">
                {ok.roast.lines.map((l, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-canvas p-4">
                    <p className="flex gap-2 text-[14px] font-semibold leading-snug text-ink">
                      <span className="shrink-0 text-primary-600">🔥</span>
                      <span>{l.burn}</span>
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-emerald-700">
                      <IconCheck size={14} className="mt-0.5 shrink-0" />
                      {l.fix}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-4">
                <p className="text-[14px] font-semibold text-ink">{ok.roast.verdict}</p>
              </div>
            </div>

            <div className="border-t border-line px-6 py-3 text-center text-[11px] text-ink-mute">
              Généré par Freelance Copilot à partir de tes vraies données ComeUp · copilot-freelance.app
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ShareActions text={shareText} className="flex flex-wrap gap-2" />
            <Link href="/profile">
              <Button variant="ghost" iconRight={<IconArrowRight size={15} />}>
                Voir le plan détaillé
              </Button>
            </Link>
          </div>

          <Card className="mt-4 flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-primary-50/70 to-white sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <IconTrophy size={18} />
              </span>
              <div>
                <p className="font-semibold text-ink">Envie de passer au niveau au-dessus ?</p>
                <p className="text-[13px] text-ink-mute">Nos formations te montrent exactement comment corriger tout ça.</p>
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

      {!ok && state !== "loading" && (
        <Card className="mt-4 flex items-center gap-3 bg-canvas">
          <IconSparkles size={18} className="text-primary-600" />
          <p className="text-[13px] text-ink-mute">Le copilote ne t&apos;épargnera pas — mais il a toujours raison, et il te dit quoi corriger.</p>
        </Card>
      )}
    </>
  );
}
