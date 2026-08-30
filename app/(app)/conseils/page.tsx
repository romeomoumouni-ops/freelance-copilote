"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconSend, IconCopy } from "@/components/icons";

type Msg = { role: "user" | "expert"; text: string };

const SUGGESTIONS = [
  "Comment avoir mes premières commandes ?",
  "Mon prix est-il bon ?",
  "Comment avoir plus d'avis ?",
  "Quel titre pour être visible ?",
  "Comment améliorer ma photo et ma bio ?",
];

export default function ConseilsPage() {
  const toast = useToast();
  const { analysis } = useProfile();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hello = analysis
      ? `Salut ${analysis.profile.displayName ?? ""} 👋 Je suis ton expert ComeUp. J'ai ton analyse sous les yeux : ${analysis.globalScore} % de réussite sur le marché « ${analysis.market.label} ». Pose-moi n'importe quelle question, je te réponds avec tes vrais chiffres.`
      : "Salut 👋 Je suis ton expert ComeUp. Pose-moi tes questions (prix, avis, visibilité, premières commandes…). Astuce : lance d'abord ton analyse pour que je te réponde avec tes vrais chiffres.";
    setMsgs([{ role: "expert", text: hello }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.generatedAt]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  function buildContext() {
    if (!analysis) return undefined;
    const prices = analysis.profile.gigs.map((g) => g.price).filter((p) => p > 0).sort((a, b) => a - b);
    return {
      seller: analysis.profile.displayName,
      score: analysis.globalScore,
      marketLabel: analysis.market.label,
      priceMedian: analysis.market.price.median,
      myMedianPrice: prices.length ? prices[Math.floor(prices.length / 2)] : undefined,
      reviewsMax: analysis.market.reviews.max,
      myReviews: analysis.mainGig?.reviews,
      missingKeywords: analysis.missingKeywords,
      topRecos: analysis.recommendations.map((r) => r.title),
    };
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: buildContext() }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "expert", text: data.text ?? data.error ?? "Réessaie dans un instant." }]);
    } catch {
      setMsgs((m) => [...m, { role: "expert", text: "Petit souci de connexion, réessaie." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Conseils"
        subtitle="Ton expert ComeUp, disponible 24h/24 : des réponses personnalisées, appuyées sur tes vrais chiffres."
      />

      <Card flush className="flex h-[calc(100vh-15rem)] min-h-[420px] flex-col">
        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-ink">
            CU
          </span>
          <div>
            <p className="text-[13px] font-extrabold text-ink">Expert ComeUp</p>
            <p className="text-[11px] text-ink-mute">
              {analysis ? `Contexte chargé : ${analysis.globalScore} % · ${analysis.market.label}` : "Sans analyse : réponses générales"}
            </p>
          </div>
          {!analysis && (
            <Link href="/" className="ml-auto text-[12px] font-bold text-ink underline decoration-brand decoration-[3px] underline-offset-2">
              Analyser mon profil
            </Link>
          )}
        </div>

        {/* Messages */}
        <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] font-medium leading-relaxed text-white">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-extrabold text-ink">
                  CU
                </span>
                <div className="max-w-[85%]">
                  <p className="whitespace-pre-line rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-[13px] leading-relaxed text-ink-soft">
                    {m.text}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.text);
                      toast("Réponse copiée", "success");
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-mute hover:text-ink"
                  >
                    <IconCopy size={11} /> Copier
                  </button>
                </div>
              </div>
            )
          )}
          {busy && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-extrabold text-ink">CU</span>
              <span className="flex gap-1 rounded-2xl border border-line bg-white px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-mute" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Suggestions + input */}
        <div className="border-t border-line px-5 py-4">
          {msgs.length < 3 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question à l'expert ComeUp…"
              disabled={busy}
              aria-label="Ta question"
              className="h-11 flex-1 rounded-xl border-2 border-line bg-white px-4 text-sm font-medium outline-none transition-colors focus:border-ink disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Envoyer"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-ink transition-all hover:bg-primary-400 disabled:opacity-40"
            >
              <IconSend size={17} />
            </button>
          </form>
        </div>
      </Card>
    </>
  );
}
