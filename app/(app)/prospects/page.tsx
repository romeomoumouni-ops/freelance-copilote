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
import { IconCopy, IconExternal, IconPlus, IconRefresh, IconSearch, IconTrash } from "@/components/icons";
import { api, type CallScript, type Prospect } from "@/lib/prospect/client";
import { STATUS_LABELS, type ProspectStatus } from "@/lib/prospect/types";

import type { BadgeTone } from "@/components/ui/Badge";

const scoreTone = (s: number): BadgeTone => (s >= 60 ? "orange" : s >= 35 ? "violet" : "gray");

export default function ProspectsPage() {
  const toast = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [raw, setRaw] = useState("");
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

  /* Import : "Entreprise ; site ; email ; contact" (site ou email optionnels).
     Une URL seule marche aussi : l'entreprise prend le nom de domaine. */
  async function runImport() {
    const rows = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[;,\t]/).map((s) => s.trim());
        if (parts.length === 1 && /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(parts[0])) {
          const dom = parts[0].replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
          return { entreprise: dom.split(".")[0], site: parts[0] };
        }
        const out: Record<string, string> = { entreprise: parts[0] || "" };
        for (const p of parts.slice(1)) {
          if (/@/.test(p)) out.email = p;
          else if (/\.|www|http/i.test(p)) out.site = p;
          else if (p) out.contact = p;
        }
        return out;
      })
      .filter((r) => r.entreprise);
    if (!rows.length) {
      toast("Ajoute au moins une ligne.", "warning");
      return;
    }
    setImporting(true);
    try {
      const { added, prospects: fresh } = await api.addProspects(rows);
      toast(`${added} prospect${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}.`);
      setRaw("");
      setOpenImport(false);
      await load();
      // analyse séquentielle des VRAIS sites, avec avancement visible
      for (let i = 0; i < fresh.length; i++) {
        const p = fresh[i];
        if (!p.site) continue;
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
      .sort((a, b) => b.score - a.score);
  }, [prospects, filter]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Prospects"
        subtitle="Chaque prospect est analysé sur son vrai site : signaux concrets, score d'urgence, accroche prête."
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
            Colle une liste d'entreprises (une par ligne) : l'outil lit leur site, repère ce qui cloche et écrit ton accroche.
          </p>
          <Button variant="primary" className="mt-5 !bg-royal hover:!bg-royal-dark" onClick={() => setOpenImport(true)}>
            Ajouter mes premiers prospects
          </Button>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {shown.map((p) => (
            <Card key={p.id} hover flush className="cursor-pointer p-4" onClick={() => setSelected(p)}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-bold text-ink">{p.entreprise}</p>
                    <Badge tone={p.status === "repondu" ? "green" : p.status === "nouveau" ? "gray" : "blue"}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-ink-mute">
                    {p.email || "Pas d'e-mail"}
                    {p.site ? ` · ${p.site.replace(/^https?:\/\//, "")}` : " · Pas de site"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.signals.slice(0, 3).map((s) => (
                    <Badge key={s.key} tone={s.severity === 3 ? "red" : s.severity === 2 ? "orange" : "gray"}>
                      {s.label}
                    </Badge>
                  ))}
                  <Badge tone={scoreTone(p.score)} className="!text-[12px]">
                    {p.score}/100
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal import */}
      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Ajouter des prospects">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Une ligne par prospect, au format <span className="font-semibold text-ink">Entreprise ; site ; email ; contact</span>.
          Seul le nom est obligatoire. Une simple adresse de site marche aussi.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder={"Chez Marco ; chezmarco.fr ; contact@chezmarco.fr ; Marco\nclinique-sourire.com\nBoulangerie Kpondehou ; ; kpondehou@gmail.com"}
          className="mt-3 w-full rounded-2xl border border-line bg-canvas p-3.5 font-mono text-[12.5px] text-ink outline-none focus:border-royal"
        />
        <Button full variant="primary" className="mt-4 !bg-royal hover:!bg-royal-dark" onClick={runImport} disabled={importing}>
          {importing ? "Ajout en cours" : "Ajouter et analyser les sites"}
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
  const [busy, setBusy] = useState<string | null>(null);
  const [script, setScript] = useState<CallScript | null>(null);

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
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">Signaux détectés sur son site</p>
            <div className="flex items-center gap-2">
              {p.site && (
                <a
                  href={/^https?:/.test(p.site) ? p.site : `https://${p.site}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-royal hover:text-royal-dark"
                >
                  Ouvrir le site <IconExternal size={12} />
                </a>
              )}
              <Button size="sm" variant="secondary" disabled={busy === "analyze"} onClick={() => run("analyze", async () => { await api.analyze(p.id); await onChanged(); toast("Site analysé."); })}>
                {busy === "analyze" ? "Analyse..." : p.signals.length ? "Réanalyser" : "Analyser"}
              </Button>
            </div>
          </div>
          {p.signals.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-ink-mute">{p.site ? "Pas encore analysé." : "Ce prospect n'a pas de site : c'est déjà un excellent angle d'attaque."}</p>
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
              <a href={`/audit/${p.id}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">Voir</Button>
              </a>
              <Button size="sm" variant="primary" icon={<IconCopy size={13} />} onClick={() => copy(`${location.origin}/audit/${p.id}`, "Lien de l'audit copié.")}>
                Copier le lien
              </Button>
            </div>
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
