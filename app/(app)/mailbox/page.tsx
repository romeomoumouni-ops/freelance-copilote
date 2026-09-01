"use client";

/* Boîte mail : assistant de connexion Gmail en 3 étapes.
   Objectif : que quelqu'un qui n'a jamais entendu parler d'un « mot de
   passe d'application » y arrive seul en 3 minutes. Collage intelligent,
   test automatique dès que le format est bon, aide WhatsApp si blocage. */

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconCheck, IconChevronLeft, IconExternal, IconLock, IconRefresh, IconShield, IconZap } from "@/components/icons";
import { api } from "@/lib/prospect/client";

/* Numéro WhatsApp du support (format international sans +). À remplacer. */
const WHATSAPP = "22900000000";
const WA_TEXT = encodeURIComponent(
  "Salut ! Je suis sur Freelance Copilote et je bloque sur la connexion de ma boîte Gmail. Tu peux m'aider ?"
);

type TestState = "idle" | "testing" | "ok" | "error";

export default function MailboxPage() {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [rawPassword, setRawPassword] = useState("");
  const [dailyCap, setDailyCap] = useState(40);
  const [test, setTest] = useState<TestState>("idle");
  const [testError, setTestError] = useState("");
  const testedRef = useRef("");

  const cleaned = rawPassword.replace(/\s+/g, "").toLowerCase();
  const passwordValid = /^[a-z]{16}$/.test(cleaned);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    api
      .mailbox()
      .then(({ mailbox }) => {
        if (mailbox) {
          setEmail(mailbox.email);
          setFromName(mailbox.fromName);
          setDailyCap(mailbox.dailyCap);
          if (mailbox.verifiedAt) setConnected(true);
          else if (mailbox.hasPassword) setWizard(true), setStep(2);
        } else {
          setWizard(true);
        }
      })
      .catch(() => setWizard(true))
      .finally(() => setLoaded(true));
  }, []);

  /* Test automatique : dès que e-mail + 16 caractères valides sont là. */
  useEffect(() => {
    if (!passwordValid || !emailValid || !fromName.trim()) return;
    const key = email + "|" + cleaned;
    if (testedRef.current === key) return;
    testedRef.current = key;
    setTest("testing");
    setTestError("");
    api
      .saveMailbox({ email: email.trim(), fromName: fromName.trim(), appPassword: cleaned, dailyCap, action: "test" })
      .then(() => {
        setTest("ok");
        setConnected(true);
        toast("Ta boîte est connectée et vérifiée !");
      })
      .catch((e) => {
        setTest("error");
        setTestError(e instanceof Error ? e.message : "Connexion impossible");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordValid, emailValid, cleaned, email, fromName]);

  if (!loaded) {
    return (
      <div className="flex justify-center py-24">
        <IconRefresh size={22} className="animate-spin text-ink-mute" />
      </div>
    );
  }

  /* ---------- Vue « connectée » ---------- */
  if (connected && !wizard) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="Boîte mail"
          subtitle="Tes mails partent de TA boîte Gmail : c'est toi que le prospect voit, pas un robot."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-[15px] font-bold text-ink">Ta boîte</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
                <span className="text-[13px] text-ink-mute">Adresse</span>
                <span className="text-[13.5px] font-bold text-ink">{email}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
                <span className="text-[13px] text-ink-mute">Expéditeur</span>
                <span className="text-[13.5px] font-bold text-ink">{fromName}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
                <span className="text-[13px] text-ink-mute">Plafond par jour</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={dailyCap}
                    onChange={(e) => setDailyCap(Number(e.target.value))}
                    className="h-9 w-20 rounded-lg border border-line px-2 text-center text-[13px] font-bold text-ink outline-none focus:border-royal"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await api.saveMailbox({ email, fromName, dailyCap });
                        toast("Plafond mis à jour.");
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Impossible", "warning");
                      }
                    }}
                  >
                    OK
                  </Button>
                </span>
              </div>
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-mute">
              40 max recommandé : c'est ce rythme raisonnable qui garde tes mails en boîte de réception.
            </p>
          </Card>
          <Card>
            <h2 className="text-[15px] font-bold text-ink">Ce qui tourne pour toi</h2>
            <ul className="mt-3 space-y-2.5">
              {[
                "Tes campagnes partent toutes seules, sous ton plafond quotidien.",
                "Les relances s'envoient dans le même fil que ton premier mail.",
                "Les réponses sont détectées et stoppent la séquence du prospect.",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line pt-4">
              <Button variant="secondary" onClick={() => { setWizard(true); setStep(2); setTest("idle"); testedRef.current = ""; setRawPassword(""); }}>
                Changer de mot de passe
              </Button>
              <Button variant="ghost" onClick={() => { setWizard(true); setStep(0); }}>
                Revoir le guide
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- Wizard 3 étapes ---------- */
  const steps = ["Sécurise ton compte", "Crée le mot de passe", "Colle et c'est prêt"];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Connecter ma boîte Gmail"
        subtitle="3 minutes, une seule fois. On te guide clic par clic."
        actions={
          <a href={`https://wa.me/${WHATSAPP}?text=${WA_TEXT}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">Bloqué ? On le fait avec toi</Button>
          </a>
        }
      />

      {/* Fil d'avancement */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <button
            key={label}
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors ${
              i === step ? "bg-ink text-white" : i < step ? "bg-emerald-50 text-emerald-700" : "bg-canvas text-ink-mute"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i === step ? "bg-white/20" : i < step ? "bg-emerald-100" : "bg-white"}`}>
              {i < step ? <IconCheck size={11} /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-2xl">
        {step === 0 && (
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy">
                <IconShield size={20} />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-ink">Active la validation en deux étapes</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  C'est un réglage de sécurité de ton compte Google. Sans lui, Google ne propose pas de mot de passe
                  d'application. Si c'est déjà activé chez toi, passe directement à la suite.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-canvas p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Ce que tu vas voir chez Google</p>
              <div className="mt-2.5 rounded-xl border border-line bg-white p-3.5">
                <p className="text-[12.5px] text-ink-soft">Compte Google → Sécurité</p>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-ink">Validation en deux étapes</span>
                  <span className="rounded-full bg-royal px-2.5 py-1 text-[10.5px] font-bold text-white">Activer</span>
                </div>
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-mute">
                Google te demande ton numéro de téléphone, t'envoie un code, et c'est réglé.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a href="https://myaccount.google.com/signinoptions/two-step-verification" target="_blank" rel="noreferrer">
                <Button variant="primary" className="!bg-royal hover:!bg-royal-dark" iconRight={<IconExternal size={14} />}>
                  Ouvrir la page Google
                </Button>
              </a>
              <Button variant="secondary" onClick={() => setStep(1)}>
                C'est fait, je continue
              </Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy">
                <IconLock size={20} />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-ink">Crée ton mot de passe d'application</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  C'est une clé spéciale, différente de ton vrai mot de passe. Elle sert uniquement à envoyer tes mails
                  et relever tes réponses, et tu peux la supprimer quand tu veux.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-canvas p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Ce que tu vas voir chez Google</p>
              <div className="mt-2.5 rounded-xl border border-line bg-white p-3.5">
                <p className="text-[12.5px] text-ink-soft">Mots de passe des applications</p>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2.5">
                  <span className="text-[13px] text-ink-mute">Nom de l'appli :</span>
                  <span className="rounded-md bg-brand px-2 py-0.5 text-[12.5px] font-bold text-ink">Freelance Copilote</span>
                </div>
                <div className="mt-2 rounded-lg bg-ink px-3 py-3 text-center">
                  <p className="font-mono text-[15px] font-bold tracking-[0.2em] text-white">abcd efgh ijkl mnop</p>
                  <p className="mt-1 text-[10.5px] text-white/60">Google affiche 16 caractères comme ça : copie-les tout de suite</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
                <Button variant="primary" className="!bg-royal hover:!bg-royal-dark" iconRight={<IconExternal size={14} />}>
                  Créer mon mot de passe
                </Button>
              </a>
              <Button variant="secondary" onClick={() => setStep(2)}>
                Je l'ai copié, je continue
              </Button>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-mute hover:text-ink">
                <IconChevronLeft size={14} /> Retour
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-primary-50 p-3 text-[12px] leading-relaxed text-ink-soft">
              Tu ne vois pas « Mots de passe des applications » ? C'est que l'étape 1 n'est pas finie : la validation en
              deux étapes doit être active. Sinon, écris-nous sur WhatsApp, on le fait avec toi.
            </p>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy">
                <IconZap size={20} />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-ink">Colle, on teste tout seuls</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  Colle tes 16 caractères tels quels, avec ou sans espaces : on nettoie et on teste la connexion
                  automatiquement.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton adresse Gmail</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="toi@gmail.com"
                  className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-royal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton nom d'expéditeur</span>
                <input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Aïcha de AK Studio"
                  className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-royal"
                />
                <span className="mt-1 block text-[11.5px] text-ink-mute">C'est ce que le prospect verra dans sa boîte de réception.</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-ink">Le mot de passe d'application</span>
                <input
                  value={rawPassword}
                  onChange={(e) => { setRawPassword(e.target.value); if (test === "error") { setTest("idle"); testedRef.current = ""; } }}
                  placeholder="abcd efgh ijkl mnop"
                  autoComplete="off"
                  className={`h-12 w-full rounded-xl border bg-white px-3.5 font-mono text-[14px] tracking-widest text-ink outline-none ${
                    rawPassword && !passwordValid ? "border-amber-400" : "border-line focus:border-royal"
                  }`}
                />
                <span className="mt-1 block text-[11.5px] text-ink-mute">
                  {rawPassword === ""
                    ? "16 lettres, avec ou sans espaces."
                    : passwordValid
                      ? "Format parfait."
                      : `${cleaned.length}/16 caractères : colle bien les 16 lettres données par Google.`}
                </span>
              </label>

              {/* État du test automatique */}
              {test === "testing" && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-canvas px-4 py-3.5">
                  <IconRefresh size={16} className="animate-spin text-royal" />
                  <p className="text-[13px] font-semibold text-ink">Test de la connexion en cours...</p>
                </div>
              )}
              {test === "ok" && (
                <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_0_#FFEE66]">
                  <p className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><IconCheck size={14} /></span>
                    Ta boîte est prête !
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                    Connexion vérifiée. Direction Prospects pour ajouter ta première liste, puis Campagnes pour lancer.
                  </p>
                  <Button variant="primary" className="mt-3 !bg-royal hover:!bg-royal-dark" onClick={() => setWizard(false)}>
                    Terminer
                  </Button>
                </div>
              )}
              {test === "error" && (
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-[13px] font-bold text-red-600">La connexion a échoué.</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-red-600/80">{testError}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                    Vérifie que l'adresse est la bonne et que le mot de passe vient bien de la page « Mots de passe des
                    applications ». Modifie un champ pour relancer le test, ou écris-nous sur WhatsApp.
                  </p>
                  <a href={`https://wa.me/${WHATSAPP}?text=${WA_TEXT}`} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <Button size="sm" variant="secondary">Demander de l'aide</Button>
                  </a>
                </div>
              )}

              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-mute hover:text-ink">
                <IconChevronLeft size={14} /> Retour
              </button>
            </div>
          </Card>
        )}

        <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-[11.5px] leading-relaxed text-ink-mute">
          <IconLock size={13} className="mt-0.5 shrink-0" />
          Cette clé sert uniquement à envoyer tes mails et relever tes réponses. Tu peux la révoquer à tout moment
          depuis ton compte Google, sans toucher à ton vrai mot de passe.
        </p>
      </div>
    </div>
  );
}
