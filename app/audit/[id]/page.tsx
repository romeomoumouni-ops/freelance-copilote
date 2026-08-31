/* Mini-audit public : la page qu'on ENVOIE au prospect. Une page propre,
   à son nom, avec les constats réels. C'est la preuve de sérieux du
   freelance. Pas indexée par Google. */

import type { Metadata } from "next";
import { getProspects } from "@/lib/prospect/store";
import { domainOf } from "@/lib/prospect/analyze";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mini-audit de votre site",
  robots: { index: false, follow: false },
};

const sevLabel: Record<number, { txt: string; cls: string }> = {
  3: { txt: "Prioritaire", cls: "bg-red-50 text-red-600" },
  2: { txt: "Important", cls: "bg-amber-50 text-amber-700" },
  1: { txt: "À prévoir", cls: "bg-ink/5 text-ink-soft" },
};

export default async function AuditPage({ params }: { params: { id: string } }) {
  const prospect = (await getProspects()).find((p) => p.id === params.id);

  if (!prospect || prospect.signals.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="rounded-3xl border-2 border-ink bg-white p-8 text-center shadow-[8px_8px_0_0_#FFEE66]">
          <p className="text-[15px] font-bold text-ink">Cet audit n&apos;existe pas ou n&apos;est plus disponible.</p>
        </div>
      </main>
    );
  }

  const p = prospect;
  const dom = domainOf(p.site);
  const date = new Date(p.audit?.fetchedAt || p.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[8px_8px_0_0_#FFEE66] sm:p-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-mute">Mini-audit de présence en ligne</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{p.entreprise}</h1>
          <p className="mt-1 text-[13px] text-ink-mute">
            {dom ? `Site analysé : ${dom} · ` : ""}Réalisé le {date}
          </p>

          <div className="mt-6 rounded-2xl bg-canvas p-4">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Ce document liste ce que nous avons constaté en visitant votre site, comme le ferait n&apos;importe lequel
              de vos clients. Chaque point est factuel et vérifiable.
            </p>
          </div>

          <ul className="mt-6 space-y-4">
            {p.signals.map((s, i) => (
              <li key={s.key} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[14px] font-bold text-ink">{s.label}</p>
                  <span className={`ml-auto rounded-full px-2.5 py-1 text-[10.5px] font-bold ${sevLabel[s.severity].cls}`}>
                    {sevLabel[s.severity].txt}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.detail}</p>
              </li>
            ))}
          </ul>

          {p.audit?.ok && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Temps de réponse", v: `${(p.audit.ms / 1000).toFixed(1)} s` },
                { l: "Sécurité HTTPS", v: p.audit.https ? "Oui" : "Non" },
                { l: "Adapté mobile", v: p.audit.viewport ? "Oui" : "Non" },
                { l: "Technologie", v: p.audit.tech || "Inconnue" },
              ].map((m) => (
                <div key={m.l} className="rounded-2xl bg-canvas p-3 text-center">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-mute">{m.l}</p>
                  <p className="mt-1 text-[15px] font-extrabold text-ink">{m.v}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 rounded-2xl bg-brand/40 p-4">
            <p className="text-[13px] leading-relaxed text-ink">
              Chacun de ces points se corrige. Si vous souhaitez en parler, répondez simplement au mail qui accompagne
              cet audit : la personne qui vous l&apos;a envoyé saura exactement quoi faire.
            </p>
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-ink-mute">
          Audit réalisé avec Freelance Copilote · document informatif, sans engagement
        </p>
      </div>
    </main>
  );
}
