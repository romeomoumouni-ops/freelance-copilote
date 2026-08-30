"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconAlert, IconArrowRight } from "@/components/icons";

const INCLUS = [
  "Analyse complète de ton profil ComeUp",
  "Création de photos de profil professionnelles ComeUp",
  "Création de miniatures ComeUp",
  "Création de ta page de vente ComeUp",
  "Chat intégré avec l'équipe Freelance Copilote",
];

function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="absolute inset-x-[-2px] bottom-[0.08em] h-[0.38em] rounded-sm bg-brand" />
      <span className="relative">{children}</span>
    </span>
  );
}

export default function Abonnement() {
  const [form, setForm] = useState({ nom: "", email: "", whatsapp: "", comeupUrl: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim() || !form.email.trim()) {
      setError("Ton nom et ton e-mail sont nécessaires.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
      setState("idle");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-brand px-4 py-2 text-center text-[12px] font-bold text-ink">
        Abonnement Freelance Copilote : 100 000 FCFA pour 6 mois
      </div>

      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-[17px] font-extrabold tracking-tight text-ink">
          Freelance <Hl>Copilote</Hl>
        </Link>
        <Link href="/" className="text-[13px] font-semibold text-ink-soft hover:text-ink">
          Retour à l&apos;accueil
        </Link>
      </nav>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulaire */}
        <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[8px_8px_0_0_#FFEE66] sm:p-8">
          {state === "done" ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <IconCheck size={26} />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold text-ink">C&apos;est noté, {form.nom.split(" ")[0]} !</h1>
              <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-soft">
                On revient vers toi très vite sur {form.email} avec tes accès et la marche à suivre pour
                le paiement. Prépare le lien de ton profil ComeUp, on attaque dès l&apos;ouverture de ton espace.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-black"
              >
                Retour à l&apos;accueil <IconArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                Je suis freelance, je <Hl>m&apos;abonne.</Hl>
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                Laisse tes infos : on ouvre ton espace et on te guide pour le paiement. Tu commences à
                améliorer ton profil ComeUp dès aujourd&apos;hui.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field label="Ton nom complet" required>
                  <input
                    value={form.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    placeholder="Roméo Attolou"
                    className="h-13 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-[16px] font-medium outline-none transition-colors focus:border-ink"
                  />
                </Field>
                <Field label="Ton e-mail" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="toi@exemple.com"
                    className="h-13 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-[16px] font-medium outline-none transition-colors focus:border-ink"
                  />
                </Field>
                <Field label="Ton WhatsApp">
                  <input
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    placeholder="+229 ..."
                    className="h-13 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-[16px] font-medium outline-none transition-colors focus:border-ink"
                  />
                </Field>
                <Field label="Le lien de ton profil ComeUp">
                  <input
                    value={form.comeupUrl}
                    onChange={(e) => set("comeupUrl", e.target.value)}
                    placeholder="https://comeup.com/fr/@ton-pseudo"
                    className="h-13 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-[16px] font-medium outline-none transition-colors focus:border-ink"
                  />
                </Field>
                <Field label="Un mot sur ton activité">
                  <textarea
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    rows={3}
                    placeholder="Ce que tu vends, où tu bloques…"
                    className="w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-[16px] font-medium outline-none transition-colors focus:border-ink"
                  />
                </Field>

                {error && (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500">
                    <IconAlert size={14} /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="w-full rounded-full bg-royal px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,0.7)] transition-all hover:bg-royal-dark active:scale-[0.99] disabled:opacity-60"
                >
                  {state === "sending" ? "Envoi en cours…" : "Envoyer ma demande d'abonnement"}
                </button>
                <p className="text-center text-[11px] text-ink-mute">
                  Aucun paiement ici. On te contacte pour finaliser.
                </p>
              </form>
            </>
          )}
        </div>

        {/* Récapitulatif offre */}
        <aside className="lg:pt-4">
          <div className="rounded-3xl bg-canvas p-6 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Ton abonnement</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
              100 000 FCFA
              <span className="block text-base font-bold text-ink-mute">pour 6 mois d&apos;accès</span>
            </p>
            <ul className="mt-6 space-y-3">
              {INCLUS.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
                  <IconCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-mute">
              Outil indépendant créé pour les vendeurs ComeUp, non affilié à ComeUp.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink">
        {label}
        {required && <span className="text-royal"> *</span>}
      </span>
      {children}
    </label>
  );
}
