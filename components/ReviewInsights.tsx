"use client";

import { useState } from "react";
import { getReviews, type ReviewInsights as RI } from "@/lib/client";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { IconThumbsUp, IconAlert, IconMessageSquare } from "@/components/icons";

/** Charge à la demande les avis d'un service et affiche les thèmes récurrents.
    variant "yours" = votre service ; "competitor" = un concurrent (cadrage opportunité). */
export default function ReviewInsights({
  url,
  variant = "yours",
}: {
  url: string;
  variant?: "yours" | "competitor";
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<RI | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    setState("loading");
    setErr("");
    try {
      const r = await getReviews(url);
      setData(r.insights);
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lecture des avis impossible");
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <Button variant="soft" size="sm" icon={<IconMessageSquare size={14} />} onClick={load}>
        Analyser les avis clients
      </Button>
    );
  }
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-ink-mute">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" />
        Lecture des avis en direct…
      </div>
    );
  }
  if (state === "error") return <p className="text-[13px] text-red-500">{err}</p>;
  if (!data) return null;

  const yours = variant === "yours";
  const samples = data.samples.filter((s) => !s.isSellerReply).slice(0, 2);

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ink-mute">{data.count} avis clients analysés en direct.</p>

      {data.praises.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
            <IconThumbsUp size={13} />
            {yours ? "Ce que vos clients apprécient" : "Ce que ses clients apprécient — à mettre en avant chez vous"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.praises.map((p) => (
              <Badge key={p.theme} tone="green">
                {p.theme} · {p.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.complaints.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-amber-700">
            <IconAlert size={13} />
            {yours ? "Points de vigilance dans vos avis" : "Reproches de ses clients — votre opportunité"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.complaints.map((p) => (
              <Badge key={p.theme} tone="orange">
                {p.theme} · {p.count}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-ink-mute">Aucun reproche récurrent détecté dans les avis.</p>
      )}

      {samples.length > 0 && (
        <div className="space-y-1.5">
          {samples.map((s, i) => (
            <div key={i} className="rounded-lg bg-canvas px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">{s.author} : </span>
              {"« "}
              {s.text.slice(0, 150)}
              {s.text.length > 150 ? "…" : ""}
              {" »"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
