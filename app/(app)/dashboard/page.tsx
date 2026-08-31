"use client";

/* Aujourd'hui : le rituel quotidien. Ta vague de mails du jour,
   tes prospects chauds, les réponses à traiter. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconArrowRight, IconInbox, IconRefresh, IconSend, IconZap } from "@/components/icons";
import { api, type Prospect, type Stats } from "@/lib/prospect/client";
import { STATUS_LABELS } from "@/lib/prospect/types";

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([api.stats(), api.prospects()]);
    setStats(s);
    setProspects(p.prospects);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function sendWave() {
    setSending(true);
    let total = 0;
    try {
      // on rappelle la route tant qu'il reste des envois dus (par petites vagues, jamais en rafale)
      for (let i = 0; i < 12; i++) {
        const r = await api.send();
        total += r.sent;
        if (r.errors?.length) toast(r.errors[0], "warning");
        if (r.capped) {
          toast("Plafond du jour atteint : on protège ta boîte.", "info");
          break;
        }
        if (!r.remaining || !r.sent) break;
      }
      toast(total ? `${total} mail${total > 1 ? "s" : ""} envoyé${total > 1 ? "s" : ""}.` : "Rien à envoyer pour le moment.", total ? "success" : "info");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Envoi impossible", "warning");
    } finally {
      setSending(false);
    }
  }

  async function checkReplies() {
    setChecking(true);
    try {
      const r = await api.checkReplies();
      toast(r.found ? `${r.found} réponse${r.found > 1 ? "s" : ""} détectée${r.found > 1 ? "s" : ""} !` : "Pas de nouvelle réponse.", r.found ? "success" : "info");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Relève impossible", "warning");
    } finally {
      setChecking(false);
    }
  }

  const hot = prospects.filter((p) => p.status === "nouveau").sort((a, b) => b.score - a.score).slice(0, 8);
  const replied = prospects.filter((p) => p.status === "repondu").slice(0, 5);
  const t = stats?.totals;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Aujourd'hui"
        subtitle="Ton rituel : envoyer la vague du jour, relever les réponses, attaquer les prospects chauds."
        actions={
          <>
            <Button variant="secondary" icon={<IconRefresh size={15} />} onClick={checkReplies} disabled={checking}>
              {checking ? "Relève en cours" : "Relever les réponses"}
            </Button>
            <Button
              variant="primary"
              className="!bg-royal hover:!bg-royal-dark"
              icon={<IconSend size={15} />}
              onClick={sendWave}
              disabled={sending || !stats?.mailboxReady}
            >
              {sending ? "Envoi en cours" : `Envoyer la vague du jour${stats?.dueCount ? ` (${stats.dueCount})` : ""}`}
            </Button>
          </>
        }
      />

      {stats && !stats.mailboxReady && (
        <Card className="mb-5 border-primary-300 bg-primary-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13.5px] font-semibold text-ink">
              Connecte ta boîte Gmail pour pouvoir envoyer tes mails de prospection.
            </p>
            <Link href="/mailbox">
              <Button size="sm" variant="primary" iconRight={<IconArrowRight size={14} />}>Connecter ma boîte</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pipeline en chiffres */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Prospects", value: t?.prospects },
          { label: "À contacter", value: t?.nouveaux },
          { label: "Contactés", value: t?.contactes },
          { label: "Réponses", value: t?.repondus },
          { label: "RDV calés", value: t?.rdv },
          { label: "Clients signés", value: t?.signes },
        ].map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{s.value ?? "0"}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Prospects chauds */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-ink">Tes prospects les plus chauds</h2>
            <Link href="/prospects" className="text-[12px] font-semibold text-royal hover:text-royal-dark">
              Tout voir
            </Link>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-mute">Classés par urgence réelle : plus le site a de problèmes, plus le prospect a besoin de toi.</p>
          {hot.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-canvas p-6 text-center">
              <p className="text-[13px] font-semibold text-ink">Aucun prospect à contacter.</p>
              <Link href="/prospects" className="mt-2 inline-block text-[13px] font-semibold text-royal hover:text-royal-dark">
                Ajoute ta première liste de prospects
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {hot.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-ink">{p.entreprise}</p>
                    <p className="truncate text-[11.5px] text-ink-mute">
                      {p.signals[0]?.label || "Pas encore analysé"}
                      {p.signals[1] ? ` + ${p.signals.length - 1} autre${p.signals.length > 2 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={p.score >= 60 ? "orange" : "gray"}>{p.score}/100</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          {/* Réponses à traiter */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
                <IconInbox size={16} className="text-royal" /> Réponses à traiter
              </h2>
              <Link href="/inbox" className="text-[12px] font-semibold text-royal hover:text-royal-dark">
                Ouvrir
              </Link>
            </div>
            {replied.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-mute">Aucune réponse en attente. Les séquences continuent toutes seules.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {replied.map((p) => (
                  <li key={p.id} className="rounded-xl bg-emerald-50 px-3 py-2">
                    <p className="text-[13px] font-bold text-ink">{p.entreprise}</p>
                    <p className="truncate text-[11.5px] text-emerald-700">{p.reply?.subject || "A répondu à ta séquence"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Compteur du jour */}
          <Card>
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
              <IconZap size={16} className="text-royal" /> Envois du jour
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {stats?.sentToday ?? 0}
              <span className="text-base font-bold text-ink-mute"> / {stats?.dailyCap ?? 40}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-royal transition-all"
                style={{ width: `${Math.min(100, ((stats?.sentToday ?? 0) / (stats?.dailyCap || 40)) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-mute">
              Le plafond protège ta boîte : c'est lui qui garde tes mails hors des spams.
            </p>
          </Card>

          {/* Activité */}
          <Card>
            <h2 className="text-[15px] font-bold text-ink">Activité récente</h2>
            {(stats?.events?.length ?? 0) === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-mute">Encore rien. Ta première campagne va remplir ce journal.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {stats!.events.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-ink-soft">
                    <Badge tone={e.type === "reponse" ? "green" : e.type === "erreur" ? "red" : "gray"} className="mt-0.5 shrink-0">
                      {e.type}
                    </Badge>
                    <span className="min-w-0 truncate">{e.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] text-ink-mute">
        Statuts : {Object.values(STATUS_LABELS).join(" > ")}
      </p>
    </div>
  );
}
