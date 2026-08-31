"use client";

/* Boîte mail : connexion de la boîte Gmail du freelance en SMTP/IMAP
   via un mot de passe d'application. Guide pas à pas inclus : c'est
   LA marche que nos utilisateurs ratent partout ailleurs. */

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconCheck, IconExternal, IconLock } from "@/components/icons";
import { api } from "@/lib/prospect/client";

export default function MailboxPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [dailyCap, setDailyCap] = useState(40);
  const [hasPassword, setHasPassword] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);

  useEffect(() => {
    api
      .mailbox()
      .then(({ mailbox }) => {
        if (mailbox) {
          setEmail(mailbox.email);
          setFromName(mailbox.fromName);
          setDailyCap(mailbox.dailyCap);
          setHasPassword(mailbox.hasPassword);
          setVerifiedAt(mailbox.verifiedAt);
        }
      })
      .catch(() => {});
  }, []);

  async function submit(action?: "test") {
    setBusy(action === "test" ? "test" : "save");
    try {
      const r = await api.saveMailbox({ email, fromName, appPassword: appPassword || undefined, dailyCap, action });
      if (action === "test" && r.verified) {
        setVerifiedAt(new Date().toISOString());
        toast("Connexion réussie ! Ta boîte est prête à envoyer.");
      } else {
        toast("Réglages enregistrés.");
      }
      setHasPassword(true);
      setAppPassword("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Enregistrement impossible", "warning");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Boîte mail"
        subtitle="Tes mails partent de TA boîte Gmail : c'est toi que le prospect voit, pas un robot."
        actions={
          verifiedAt ? (
            <Badge tone="green" dot>
              Connectée et vérifiée
            </Badge>
          ) : hasPassword ? (
            <Badge tone="orange" dot>
              Enregistrée, pas encore testée
            </Badge>
          ) : (
            <Badge tone="gray" dot>
              Pas encore connectée
            </Badge>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="text-[15px] font-bold text-ink">Connexion</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton adresse Gmail</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="toi@gmail.com"
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-royal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">Ton nom d'expéditeur</span>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Aïcha de AK Studio"
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-royal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">
                Mot de passe d'application {hasPassword && <span className="font-normal text-ink-mute">(déjà enregistré, remplis pour changer)</span>}
              </span>
              <input
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-royal"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-ink">Plafond d'envois par jour</span>
              <input
                value={dailyCap}
                onChange={(e) => setDailyCap(Number(e.target.value))}
                type="number"
                min={5}
                max={80}
                className="h-11 w-28 rounded-xl border border-line bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-royal"
              />
              <span className="mt-1.5 block text-[11.5px] leading-relaxed text-ink-mute">
                40 max recommandé. C'est ce rythme raisonnable qui garde tes mails en boîte de réception et pas en spam.
              </span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary" className="!bg-royal hover:!bg-royal-dark" onClick={() => submit()} disabled={busy !== null}>
                {busy === "save" ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="secondary" onClick={() => submit("test")} disabled={busy !== null}>
                {busy === "test" ? "Test en cours..." : "Tester la connexion"}
              </Button>
            </div>
            <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-mute">
              <IconLock size={13} className="mt-0.5 shrink-0" />
              Ce mot de passe sert uniquement à envoyer tes mails et relever tes réponses. Tu peux le révoquer à tout
              moment depuis ton compte Google, sans toucher à ton vrai mot de passe.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-[15px] font-bold text-ink">Le guide, pas à pas</h2>
          <p className="mt-1 text-[12.5px] text-ink-mute">5 minutes, une seule fois. Suis dans l'ordre.</p>
          <ol className="mt-4 space-y-3.5">
            {[
              {
                t: "Active la validation en deux étapes",
                d: "Sur ton compte Google : Sécurité, puis « Validation en deux étapes ». Sans elle, Google ne propose pas de mot de passe d'application.",
                href: "https://myaccount.google.com/signinoptions/two-step-verification",
              },
              {
                t: "Crée un mot de passe d'application",
                d: "Toujours dans Sécurité, cherche « Mots de passe des applications ». Donne-lui un nom (Freelance Copilote) et Google t'affiche 16 caractères.",
                href: "https://myaccount.google.com/apppasswords",
              },
              {
                t: "Colle-le ici et teste",
                d: "Copie les 16 caractères dans le champ à gauche (avec ou sans espaces), enregistre, puis « Tester la connexion ».",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-ink">{s.t}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{s.d}</p>
                  {s.href && (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-royal hover:text-royal-dark"
                    >
                      Ouvrir la page Google <IconExternal size={12} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl bg-canvas p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <IconCheck size={14} className="text-emerald-600" /> Ce que ça débloque
            </p>
            <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-ink-soft">
              <li>Tes campagnes partent toutes seules, sous ton plafond quotidien.</li>
              <li>Les relances s'envoient dans le même fil que ton premier mail.</li>
              <li>Les réponses sont détectées et stoppent la séquence du prospect.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
