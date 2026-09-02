"use client";

/* Prospects : la matière première. On ajoute des entreprises (une par
   ligne), l'outil lit leur VRAI site, en tire des signaux concrets et
   un score d'urgence, puis écrit l'accroche et le script d'appel. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { IconCopy, IconExternal, IconPlus, IconRefresh, IconSearch, IconTrash } from "@/components/icons";
import { api, type CallScript, type Prospect } from "@/lib/prospect/client";
import ProspectTable, { emptyRow, isEmptyRow, rowIsValid, type DraftRow } from "@/components/prospects/ProspectTable";
import { STATUS_LABELS, type ProspectStatus } from "@/lib/prospect/types";

/** Adresse complète et nom de domaine, sans importer le module serveur. */
function siteLinks(site?: string) {
  if (!site) return null;
  const href = /^https?:\/\//i.test(site) ? site : `https://${site}`;
  const label = site.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  return { href, label };
}

/* Priorité d'attaque, en mots : un « 54/100 » se lisait à tort comme un
   taux de remplissage de la fiche. Elle ne dépend que de ce qu'on a
   VRAIMENT constaté sur le site ; sans site, il n'y a rien à constater. */
function PriorityChip({ score, analysable }: { score: number; analysable: boolean }) {
  if (!analysable) {
    return (
      <span
        className="shrink-0 rounded-md border border-line bg-canvas px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-ink-mute"
        title="Ajoute son site pour que l'outil détecte ses problèmes et calcule une priorité."
      >
        Sans site à analyser
      </span>
    );
  }
  const [label, tone] =
    score >= 60
      ? ["Priorité haute", "border-amber-400 bg-amber-200 text-amber-900"]
      : score >= 35
        ? ["Priorité moyenne", "border-primary-300 bg-primary-200 text-[#6B4E00]"]
        : ["Priorité basse", "border-line bg-canvas text-ink-mute"];
  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em] ${tone}`}
      title={`Urgence estimée : ${score}/100, d'après les problèmes détectés sur son site.`}
    >
      {label}
    </span>
  );
}

export default function ProspectsPage() {
  const toast = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [draft, setDraft] = useState<DraftRow[]>(() => [emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [openImport, setOpenImport] = useState(false);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const { prospects } = await api.prospects();
    setProspects(prospects);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  /* Import depuis le tableau : e-mail et entreprise obligatoires, sinon
     on ne peut ni écrire au prospect ni personnaliser le message. */
  async function runImport() {
    const remplies = draft.filter((r) => !isEmptyRow(r));
    const rows = remplies.filter(rowIsValid).map((r) => ({
      entreprise: r.entreprise.trim(),
      email: r.email.trim(),
      activite: r.activite.trim() || undefined,
      service: r.service.trim() || undefined,
      contact: r.contact.trim() || undefined,
      site: r.site.trim() || undefined,
    }));
    if (!rows.length) {
      toast("Remplis au moins une ligne avec un nom d'entreprise et un e-mail valide.", "warning");
      return;
    }
    const ignorees = remplies.length - rows.length;
    setImporting(true);
    try {
      const { added, prospects: fresh } = await api.addProspects(rows);
      toast(
        `${added} prospect${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}.` +
          (ignorees ? ` ${ignorees} ligne${ignorees > 1 ? "s" : ""} incomplète${ignorees > 1 ? "s" : ""} ignorée${ignorees > 1 ? "s" : ""}.` : "")
      );
      setDraft([emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
      setOpenImport(false);
      await load();
      // analyse séquentielle des VRAIS sites, avec avancement visible
      // on analyse tout le monde : sans site, le signal « Pas de site »
      // est justement le meilleur angle d'attaque
      for (let i = 0; i < fresh.length; i++) {
        const p = fresh[i];
        setProgress(`Analyse ${i + 1}/${fresh.length} : ${p.entreprise}`);
        try {
          await api.analyze(p.id);
        } catch {
          /* on continue */
        }
      }
      setProgress("");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import impossible", "warning");
    } finally {
      setImporting(false);
      setProgress("");
    }
  }

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return [...prospects]
      .filter((p) => !q || p.entreprise.toLowerCase().includes(q) || (p.email || "").includes(q))
      .sort((a, b) => b.score - a.score || a.entreprise.localeCompare(b.entreprise));
  }, [prospects, filter]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Prospects"
        subtitle="Ce que fait l'entreprise, ce que tu lui proposes, et son site quand elle en a un : de quoi écrire une accroche sur mesure."
        actions={
          <Button variant="primary" className="!bg-royal hover:!bg-royal-dark" icon={<IconPlus size={15} />} onClick={() => setOpenImport(true)}>
            Ajouter des prospects
          </Button>
        }
      />

      {progress && (
        <Card className="mb-4 border-primary-300 bg-primary-50 !py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <IconRefresh size={14} className="animate-spin" /> {progress}
          </p>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-line bg-white px-4">
        <IconSearch size={15} className="shrink-0 text-ink-mute" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Chercher une entreprise ou un e-mail"
          className="h-11 w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-mute"
        />
      </div>

      {shown.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-[15px] font-bold text-ink">Commence par ajouter tes prospects.</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-mute">
Remplis le tableau : entreprise, e-mail, et son activité en deux mots. Si tu as son site, l'outil le lit et repère ce qui cloche pour écrire ton accroche.
          </p>
          <Button variant="primary" className="mt-5 !bg-royal hover:!bg-royal-dark" onClick={() => setOpenImport(true)}>
            Ajouter mes premiers prospects
          </Button>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {shown.map((p) => {
            const site = siteLinks(p.site);
            return (
            <Card key={p.id} hover flush className="cursor-pointer p-4" onClick={() => setSelected(p)}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-bold text-ink">{p.entreprise}</p>
                    <Badge tone={p.status === "repondu" ? "green" : p.status === "nouveau" ? "gray" : "blue"}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-mute">
                    {p.activite ? <span className="shrink-0 font-semibold text-ink-soft">{p.activite}</span> : null}
                    {p.activite ? <span className="shrink-0">·</span> : null}
                    <span className="truncate">{p.email}</span>
                    {site ? (
                      <>
                        <span className="shrink-0">·</span>
                        <a
                          href={site.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex shrink-0 items-center gap-1 font-semibold text-royal hover:underline"
                          title="Ouvrir le site du prospect"
                        >
                          {site.label}
                          <IconExternal size={10} />
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.signals.slice(0, 3).map((s) => (
                    <Badge key={s.key} tone={s.severity === 3 ? "red" : s.severity === 2 ? "orange" : "gray"}>
                      {s.label}
                    </Badge>
                  ))}
                  <PriorityChip score={p.score} analysable={!!p.site} />
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Modal import */}
      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Ajouter des prospects" size="xl">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Une ligne par prospect. L&apos;<span className="font-semibold text-ink">entreprise</span> et
          l&apos;<span className="font-semibold text-ink">e-mail</span> sont obligatoires : sans e-mail, impossible de le
          contacter. Son <span className="font-semibold text-ink">activité</span> et surtout
          <span className="font-semibold text-ink"> ce que tu lui proposes</span> servent à écrire ton mail d&apos;accroche.
          Le site, si elle en a un, permet en plus de détecter ses problèmes techniques.
        </p>
        <p className="mt-1.5 text-[12px] text-ink-mute">
          Tu as déjà ta liste dans Excel ou Google Sheets ? Copie tes colonnes et colle-les directement dans le tableau.
        </p>
        <div className="mt-4">
          <ProspectTable rows={draft} onChange={setDraft} />
        </div>
        <Button full variant="primary" className="mt-5 !bg-royal hover:!bg-royal-dark" onClick={runImport} disabled={importing}>
          {importing ? "Ajout en cours" : "Ajouter ces prospects"}
        </Button>
      </Modal>

      {selected && (
        <ProspectDetail
          prospect={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await load();
            const fresh = (await api.prospects()).prospects.find((x) => x.id === selected.id) || null;
            setSelected(fresh);
          }}
        />
      )}
    </div>
  );
}

/* -------------------- fiche prospect -------------------- */

function ProspectDetail({
  prospect: p,
  onClose,
  onChanged,
}: {
  prospect: Prospect;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [script, setScript] = useState<CallScript | null>(null);
  const auditPath = `/audit/${user?.id}/${p.id}`;

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action impossible", "warning");
    } finally {
      setBusy(null);
    }
  }

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text).then(() => toast(msg));
  };

  return (
    <Modal open onClose={onClose} title={p.entreprise}>
      <div className="space-y-4">
        {/* Statut */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_LABELS) as ProspectStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => run("status", async () => { await api.patchProspect({ id: p.id, status: s }); await onChanged(); })}
              className={
                "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors " +
                (p.status === s ? "bg-ink text-white" : "bg-canvas text-ink-soft hover:bg-line")
              }
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Signaux réels */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
              {p.site ? "Signaux détectés sur son site" : "Ce qu'on a trouvé"}
            </p>
            <div className="flex items-center gap-2">
              {p.site ? (
                <a
                  href={siteLinks(p.site)!.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-royal hover:text-royal-dark"
                >
                  Ouvrir le site <IconExternal size={12} />
                </a>
              ) : (
                /* Pas de site : on aide quand même le freelance à se renseigner */
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    [p.entreprise, p.activite].filter(Boolean).join(" ")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-royal hover:text-royal-dark"
                >
                  Chercher sur Google <IconExternal size={12} />
                </a>
              )}
              <Button size="sm" variant="secondary" disabled={busy === "analyze"} onClick={() => run("analyze", async () => { await api.analyze(p.id); await onChanged(); toast("Site analysé."); })}>
                {busy === "analyze" ? "Analyse..." : p.signals.length ? "Réanalyser" : "Analyser"}
              </Button>
            </div>
          </div>
          {p.signals.length === 0 ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-mute">
              {p.site
                ? "Pas encore analysé."
                : "Aucun site renseigné : l'outil n'affirme rien sur sa présence en ligne. Ajoute son site pour détecter ses problèmes, ou appuie-toi sur son activité et sur ce que tu lui proposes."}
            </p>
          ) : (
            <ul className="mt-2.5 space-y-2">
              {p.signals.map((s) => (
                <li key={s.key} className="flex items-start gap-2">
                  <Badge tone={s.severity === 3 ? "red" : s.severity === 2 ? "orange" : "gray"} className="mt-0.5 shrink-0">
                    {s.label}
                  </Badge>
                  <span className="text-[12.5px] leading-relaxed text-ink-soft">{s.detail}</span>
                </li>
              ))}
            </ul>
          )}
          {p.audit?.ok && (
            <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-ink-mute">
              Réponse en {(p.audit.ms / 1000).toFixed(1)} s · {p.audit.https ? "HTTPS ok" : "sans HTTPS"} ·{" "}
              {p.audit.tech || "techno inconnue"} · {p.audit.weightKb} Ko
            </p>
          )}
        </div>

        {/* Mini-audit partageable */}
        {p.signals.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_0_#FFEE66]">
            <div>
              <p className="text-[13px] font-bold text-ink">Mini-audit à envoyer</p>
              <p className="text-[11.5px] text-ink-mute">Une page propre, à son nom : ta meilleure preuve de sérieux.</p>
            </div>
            <div className="flex gap-2">
              <a href={auditPath} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">Voir</Button>
              </a>
              <Button size="sm" variant="primary" icon={<IconCopy size={13} />} onClick={() => copy(`${location.origin}${auditPath}`, "Lien de l'audit copié.")}>
                Copier le lien
              </Button>
            </div>
          </div>
        )}

        {/* Contexte du prospect */}
        {(p.activite || p.service) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {p.activite && (
              <div className="rounded-2xl bg-canvas p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">Son activité</p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{p.activite}</p>
              </div>
            )}
            {p.service && (
              <div className="rounded-2xl bg-canvas p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">Ce que tu lui proposes</p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{p.service}</p>
              </div>
            )}
          </div>
        )}

        {/* Accroche */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Ton mail d'accroche</p>
            <Button size="sm" variant="secondary" disabled={busy === "accroche"} onClick={() => run("accroche", async () => { await api.accroche(p.id); await onChanged(); })}>
              {busy === "accroche" ? "Écriture..." : p.accroche ? "Réécrire" : "Écrire mon accroche"}
            </Button>
          </div>
          {p.accroche ? (
            <div className="mt-2.5">
              <p className="text-[13px] font-bold text-ink">{p.accroche.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-ink-soft">{p.accroche.body}</pre>
              <Button size="sm" variant="primary" className="mt-3" icon={<IconCopy size={13} />} onClick={() => copy(`${p.accroche!.subject}\n\n${p.accroche!.body}`, "Accroche copiée.")}>
                Copier
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-[12.5px] text-ink-mute">Fondée sur ses vrais signaux, pas sur du blabla générique.</p>
          )}
        </div>

        {/* Script d'appel */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Script d'appel</p>
            <Button size="sm" variant="secondary" disabled={busy === "call"} onClick={() => run("call", async () => { const r = await api.callScript(p.id); setScript(r.script); })}>
              {busy === "call" ? "Préparation..." : script ? "Regénérer" : "Préparer l'appel"}
            </Button>
          </div>
          {script && (
            <div className="mt-2.5 space-y-2.5 text-[12.5px] leading-relaxed text-ink-soft">
              <p><span className="font-bold text-ink">Ouverture : </span>{script.ouverture}</p>
              <p><span className="font-bold text-ink">Le constat : </span>{script.constat}</p>
              <div>
                <p className="font-bold text-ink">Questions à poser :</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">{script.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </div>
              <div>
                <p className="font-bold text-ink">Objections :</p>
                <ul className="mt-1 space-y-1.5">
                  {script.objections.map((o) => (
                    <li key={o.objection} className="rounded-xl bg-white p-2.5">
                      <p className="font-semibold text-ink">« {o.objection} »</p>
                      <p className="mt-0.5">{o.reponse}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p><span className="font-bold text-ink">Conclusion : </span>{script.conclusion}</p>
            </div>
          )}
        </div>

        {/* Suppression */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="danger"
            icon={<IconTrash size={13} />}
            disabled={busy === "delete"}
            onClick={() => run("delete", async () => { await api.deleteProspect(p.id); toast("Prospect supprimé."); onClose(); await onChanged(); })}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
