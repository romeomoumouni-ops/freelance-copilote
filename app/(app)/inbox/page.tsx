"use client";

/* Réponses : chaque réponse de prospect, avec l'assistant qui propose
   3 façons d'y répondre (rendez-vous, prix, pas maintenant). */

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconCopy, IconRefresh } from "@/components/icons";
import { api, type Prospect, type ReplySuggestion } from "@/lib/prospect/client";

export default function InboxPage() {
  const toast = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const { prospects } = await api.prospects();
    setProspects(prospects);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function check() {
    setChecking(true);
    try {
      const r = await api.checkReplies();
      toast(
        r.found ? `${r.found} nouvelle${r.found > 1 ? "s" : ""} réponse${r.found > 1 ? "s" : ""} !` : `Boîte relevée (${r.checked} mails regardés) : rien de nouveau.`,
        r.found ? "success" : "info"
      );
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Relève impossible", "warning");
    } finally {
      setChecking(false);
    }
  }

  const replied = prospects.filter((p) => p.status === "repondu");
  const advanced = prospects.filter((p) => p.status === "rdv" || p.status === "signe");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Réponses"
        subtitle="Dès qu'un prospect répond, sa séquence s'arrête et il atterrit ici. À toi de conclure."
        actions={
          <Button variant="secondary" icon={<IconRefresh size={15} />} onClick={check} disabled={checking}>
            {checking ? "Relève en cours" : "Relever ma boîte"}
          </Button>
        }
      />

      {replied.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-[15px] font-bold text-ink">Pas de réponse à traiter.</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-mute">
            Les réponses sont détectées automatiquement quand tu relèves ta boîte. Tu peux aussi marquer un prospect
            « A répondu » depuis sa fiche.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {replied.map((p) => (
            <ReplyCard key={p.id} prospect={p} onChanged={load} />
          ))}
        </div>
      )}

      {advanced.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-ink">En cours de closing</h2>
          <div className="space-y-2">
            {advanced.map((p) => (
              <Card key={p.id} flush className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-ink">{p.entreprise}</p>
                  <p className="truncate text-[12px] text-ink-mute">{p.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={p.status === "signe" ? "green" : "blue"} dot>
                    {p.status === "signe" ? "Client signé" : "RDV calé"}
                  </Badge>
                  {p.status === "rdv" && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        await api.patchProspect({ id: p.id, status: "signe" });
                        toast("Client signé. Bravo !");
                        await load();
                      }}
                    >
                      Marquer signé
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyCard({ prospect: p, onChanged }: { prospect: Prospect; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const [their, setTheir] = useState("");
  const [suggestions, setSuggestions] = useState<ReplySuggestion[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await api.replies(p.id, their.trim() || undefined);
      setSuggestions(r.suggestions);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Génération impossible", "warning");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold text-ink">{p.entreprise}</p>
          <p className="truncate text-[12px] text-ink-mute">
            {p.email}
            {p.reply?.subject ? ` · « ${p.reply.subject} »` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await api.patchProspect({ id: p.id, status: "rdv" });
              toast("RDV calé !");
              await onChanged();
            }}
          >
            RDV calé
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await api.patchProspect({ id: p.id, status: "perdu" });
              await onChanged();
            }}
          >
            Sans suite
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-canvas p-3.5">
        <textarea
          value={their}
          onChange={(e) => setTheir(e.target.value)}
          rows={2}
          placeholder="Colle ici sa réponse (optionnel) : les suggestions seront plus précises."
          className="w-full rounded-xl border border-line bg-white p-3 text-[12.5px] text-ink outline-none focus:border-royal"
        />
        <Button size="sm" variant="primary" className="mt-2 !bg-royal hover:!bg-royal-dark" onClick={generate} disabled={busy}>
          {busy ? "Écriture..." : "Me proposer 3 réponses"}
        </Button>
        {suggestions && (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {suggestions.map((s) => (
              <div key={s.label} className="flex flex-col rounded-xl border border-line bg-white p-3">
                <p className="text-[11.5px] font-bold uppercase tracking-wide text-royal">{s.label}</p>
                <p className="mt-1.5 flex-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">{s.text}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  icon={<IconCopy size={12} />}
                  onClick={() => navigator.clipboard.writeText(s.text).then(() => toast("Réponse copiée."))}
                >
                  Copier
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
