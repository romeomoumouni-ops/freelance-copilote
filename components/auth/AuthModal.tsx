"use client";

/* Modal d'inscription / connexion, dans la charte : carte blanche
   bordée noire à ombre jaune, CTA bleu, bascule JAUNE en bas. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { IconX } from "@/components/icons";

export type AuthView = "signup" | "login";

export default function AuthModal({
  open,
  view: initialView,
  onClose,
}: {
  open: boolean;
  view: AuthView;
  onClose: () => void;
}) {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [view, setView] = useState<AuthView>(initialView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setView(initialView);
      setError("");
      setNotice("");
    }
  }, [open, initialView]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (view === "signup") {
        const { needsConfirm } = await signUp({ name, email, password });
        if (needsConfirm) {
          setNotice("Ton compte est créé ! Ouvre l'e-mail qu'on vient de t'envoyer pour le confirmer, puis connecte-toi.");
        } else {
          onClose();
          router.push("/dashboard");
        }
      } else {
        await signIn({ email, password });
        onClose();
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-royal";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-up rounded-3xl border-2 border-ink bg-white p-6 shadow-[8px_8px_0_0_#FFEE66] sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-mute hover:bg-ink/5"
          aria-label="Fermer"
        >
          <IconX size={18} />
        </button>

        <h2 className="pr-8 text-[22px] font-extrabold leading-snug tracking-tight text-ink">
          {view === "signup" ? "Je suis nouveau, je veux m'inscrire" : "Content de te revoir !"}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          {view === "signup"
            ? "Crée ton compte gratuitement et ouvre ton espace de prospection."
            : "Connecte-toi pour retrouver ton espace de prospection."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          {view === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton prénom (ou ton nom pro)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aïcha" className={input} />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton e-mail</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="toi@exemple.com" className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton mot de passe</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              placeholder={view === "signup" ? "6 caractères minimum" : "Ton mot de passe"}
              className={input}
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-600">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-royal px-6 py-3.5 text-[14.5px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,0.7)] transition-all hover:bg-royal-dark active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Un instant..." : view === "signup" ? "Créer mon compte" : "Me connecter"}
          </button>
        </form>

        {/* Bascule : bouton JAUNE, charte ComeUp */}
        <button
          onClick={() => {
            setView(view === "signup" ? "login" : "signup");
            setError("");
            setNotice("");
          }}
          className="mt-3 w-full rounded-2xl bg-brand px-6 py-3.5 text-[14px] font-bold text-ink transition-all hover:bg-primary-400 active:scale-[0.99]"
        >
          {view === "signup" ? "J'ai déjà un compte" : "Je suis nouveau, je veux m'inscrire"}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-mute">
          Gratuit, sans carte bancaire. Tes données restent à toi.
        </p>
      </div>
    </div>,
    document.body
  );
}
