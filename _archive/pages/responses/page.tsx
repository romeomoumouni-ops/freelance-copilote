"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  IconSparkles,
  IconInbox,
  IconCopy,
  IconBookmark,
  IconLightbulb,
  IconTrash,
  IconAlert,
  IconRefresh,
  IconArrowRight,
  IconCheck,
} from "@/components/icons";
import { generate } from "@/lib/client";

const TONES = [
  "Professionnelle",
  "Courte",
  "Persuasive",
  "Premium",
  "Relance",
  "Gérer une objection",
  "Annoncer un prix",
  "Refuser poliment",
] as const;
type Tone = (typeof TONES)[number];

const EXAMPLE_MESSAGE =
  "Bonjour, je gère un restaurant à Lyon et je cherche quelqu'un pour créer notre site web (menu en ligne, réservation, galerie photos). Mon budget est d'environ 400 €. Est-ce jouable, et sous quel délai pourriez-vous livrer ? Merci d'avance.";

type GeneratedReply = {
  tone: Tone;
  text: string;
  source: "ia" | "template";
};

type SavedReply = {
  id: string;
  tone: Tone;
  text: string;
  source: "ia" | "template";
};

export default function ResponsesPage() {
  const toast = useToast();
  const { analysis } = useProfile();
  const mainGig = analysis?.mainGig ?? null;
  const market = analysis?.market ?? null;

  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("Professionnelle");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedReply | null>(null);
  const [saved, setSaved] = useState<SavedReply[]>([]);
  const [savedCounter, setSavedCounter] = useState(0);

  const canGenerate = message.trim().length > 0 && !loading;

  /** Construit le contexte réel à partir du service phare (si un profil est chargé). */
  function buildContext(): Record<string, unknown> | undefined {
    if (!mainGig) return undefined;
    const ctx: Record<string, unknown> = { seller: mainGig.seller, price: mainGig.price };
    if (mainGig.deliveryDays != null) ctx.deliveryDays = mainGig.deliveryDays;
    return ctx;
  }

  async function runGenerate(nextTone: Tone): Promise<GeneratedReply | null> {
    const res = await generate({
      kind: "reply",
      message: message.trim(),
      tone: nextTone,
      context: buildContext(),
    });
    return { tone: nextTone, text: res.text, source: res.source };
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const reply = await runGenerate(tone);
      setGenerated(reply);
    } catch (e) {
      setGenerated(null);
      setError(e instanceof Error ? e.message : "La rédaction a échoué. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!generated || improving) return;
    setImproving(true);
    setError(null);
    try {
      const reply = await runGenerate(generated.tone);
      setGenerated(reply);
      toast("Nouvelle version rédigée à partir du même message", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de régénérer la réponse. Réessayez.");
    } finally {
      setImproving(false);
    }
  }

  function handleCopy(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    toast("Réponse copiée — collez-la sur votre plateforme", "success");
  }

  function handleSave() {
    if (!generated) return;
    const id = `saved-${savedCounter + 1}`;
    setSavedCounter((c) => c + 1);
    setSaved((prev) => [
      { id, tone: generated.tone, text: generated.text, source: generated.source },
      ...prev,
    ]);
    toast("Réponse enregistrée — retrouvez-la plus bas", "success");
  }

  function handleDelete(id: string) {
    setSaved((prev) => prev.filter((r) => r.id !== id));
    toast("Réponse supprimée de vos enregistrements", "warning");
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Réponses clients"
        subtitle="Collez un message reçu, choisissez le ton : votre copilote rédige la réponse."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* ---- Colonne gauche : message + tons ---- */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="client-message" className="text-sm font-semibold text-ink">
              Message reçu du client
            </label>
            <Button variant="ghost" size="sm" onClick={() => setMessage(EXAMPLE_MESSAGE)}>
              Utiliser un exemple
            </Button>
          </div>

          <textarea
            id="client-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Collez ici le message reçu sur ComeUp, Fiverr ou Upwork…"
            className="mt-3 min-h-40 w-full resize-y rounded-xl border border-line bg-white p-4 text-sm leading-relaxed text-ink transition placeholder:text-ink-mute focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />

          {mainGig && (
            <p className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-mute">
              <IconCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>
                Réponses calées sur votre service réel
                {mainGig.seller ? ` de ${mainGig.seller}` : ""} : {mainGig.price} €
                {mainGig.deliveryDays != null ? ` · livraison ${mainGig.deliveryDays} j` : ""}.
              </span>
            </p>
          )}

          <p className="mt-5 text-sm font-semibold text-ink">Ton de la réponse</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TONES.map((t) => {
              const active = t === tone;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "border-primary-600 bg-primary-600 text-white shadow-soft"
                      : "border-line bg-white text-ink-soft hover:border-primary-300 hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Button
              variant="violet"
              size="lg"
              full
              icon={<IconSparkles size={18} />}
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {loading ? "Rédaction…" : "Générer une réponse"}
            </Button>
          </div>
        </Card>

        {/* ---- Colonne droite : attente / chargement / erreur / réponse ---- */}
        {loading ? (
          <Card className="h-full">
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span className="absolute h-14 w-14 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary-600" />
                <IconSparkles size={20} className="text-primary-600" />
              </span>
              <p className="text-base font-semibold text-ink">Rédaction en cours…</p>
              <p className="max-w-xs text-sm text-ink-mute">
                Votre copilote adapte la réponse au ton « {tone} »
                {mainGig ? " et à votre service" : ""}. Quelques secondes.
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card className="h-full">
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <IconAlert size={24} className="text-red-500" />
              </div>
              <p className="text-base font-semibold text-ink">La rédaction a échoué</p>
              <p className="max-w-xs text-sm text-ink-mute">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                icon={<IconRefresh size={16} />}
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                Réessayer
              </Button>
            </div>
          </Card>
        ) : generated === null ? (
          <Card className="h-full">
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                <IconInbox size={24} className="text-primary-600" />
              </div>
              <p className="text-base font-semibold text-ink">
                Votre réponse apparaîtra ici
              </p>
              <p className="max-w-xs text-sm text-ink-mute">
                Collez le message du client, choisissez un ton, puis lancez la rédaction. Vous
                pourrez copier, améliorer ou enregistrer la réponse.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">Réponse générée</h2>
              <div className="flex items-center gap-1.5">
                <Badge tone="violet">{generated.tone}</Badge>
                <Badge tone={generated.source === "ia" ? "green" : "gray"}>
                  {generated.source === "ia" ? "IA" : "modèle"}
                </Badge>
              </div>
            </div>

            <div className="mt-4 whitespace-pre-line rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-ink-soft sm:p-5">
              {generated.text}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<IconCopy size={16} />}
                onClick={() => handleCopy(generated.text)}
              >
                Copier
              </Button>
              <Button
                variant="soft"
                size="sm"
                icon={<IconRefresh size={16} />}
                onClick={handleImprove}
                disabled={improving}
              >
                {improving ? "Amélioration…" : "Améliorer"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<IconBookmark size={16} />}
                onClick={handleSave}
              >
                Enregistrer
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* ---- Réponses enregistrées ---- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">Réponses enregistrées</h2>
          <Badge tone="gray">{saved.length}</Badge>
        </div>

        {saved.length === 0 ? (
          <Card>
            <p className="py-4 text-center text-sm text-ink-mute">
              Aucune réponse enregistrée pour le moment. Générez une réponse puis cliquez sur
              « Enregistrer » pour construire votre bibliothèque.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {saved.map((reply) => (
              <Card key={reply.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="violet">{reply.tone}</Badge>
                      <Badge tone={reply.source === "ia" ? "green" : "gray"}>
                        {reply.source === "ia" ? "IA" : "modèle"}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {reply.text}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<IconCopy size={16} />}
                      onClick={() => handleCopy(reply.text)}
                    >
                      Copier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<IconTrash size={16} />}
                      onClick={() => handleDelete(reply.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---- Conseil basé sur le marché ---- */}
      <Card flush className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <IconLightbulb size={18} className="text-amber-600" />
          </div>
          <p className="min-w-0 flex-1 text-sm text-ink-soft">
            {market
              ? `Le marché « ${market.label} » attend des réponses rapides : répondre vite et clairement au premier message est souvent ce qui déclenche la commande.`
              : "Les clients commandent le vendeur qui répond le plus vite et le plus clairement. Gardez vos meilleures réponses sous la main pour répondre en quelques secondes."}
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-3.5 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            Voir mon profil
            <IconArrowRight size={15} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
