"use client";

/* Campagnes : séquences de mails avec relances automatiques.
   3 étapes par défaut (accroche, relance J+3, dernier message J+7),
   arrêt automatique dès qu'un prospect répond ou se désabonne. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { IconChevronDown, IconPlus, IconTrash } from "@/components/icons";
import { api, type Campaign, type CampaignStep, type Prospect } from "@/lib/prospect/client";
import { STATUS_LABELS } from "@/lib/prospect/types";

export default function CampagnesPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [defaults, setDefaults] = useState<CampaignStep[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([api.campaigns(), api.prospects()]);
    setCampaigns(c.campaigns);
    setDefaults(c.defaults);
    setProspects(p.prospects);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const byId = useMemo(() => new Map(prospects.map((p) => [p.id, p])), [prospects]);

  async function toggle(c: Campaign) {
    try {
      await api.patchCampaign(c.id, !c.active);
      toast(c.active ? "Campagne en pause." : "Campagne relancée.");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action impossible", "warning");
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Campagnes"
        subtitle="Des séquences avec relances automatiques. Dès qu'un prospect répond, sa séquence s'arrête toute seule."
        actions={
          <Button variant="primary" className="!bg-royal hover:!bg-royal-dark" icon={<IconPlus size={15} />} onClick={() => setOpenCreate(true)}>
            Nouvelle campagne
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-[15px] font-bold text-ink">Aucune campagne pour l'instant.</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-mute">
            Choisis tes prospects, garde les 3 étapes proposées (elles sont écrites pour obtenir des réponses) et lance.
            Ensuite, un clic par jour suffit : « Envoyer la vague du jour ».
          </p>
          <Button variant="primary" className="mt-5 !bg-royal hover:!bg-royal-dark" onClick={() => setOpenCreate(true)}>
            Créer ma première campagne
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const sent = c.contacts.reduce((n, ct) => n + ct.stepDone, 0);
            const totalPlanned = c.contacts.length * c.steps.length;
            const replied = c.contacts.filter((ct) => ct.status === "repondu").length;
            const isOpen = expanded === c.id;
            return (
              <Card key={c.id} flush className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14.5px] font-bold text-ink">{c.name}</p>
                      <Badge tone={c.active ? "green" : "gray"} dot>
                        {c.active ? "Active" : "En pause"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-mute">
                      {c.contacts.length} prospect{c.contacts.length > 1 ? "s" : ""} · {c.steps.length} étapes · {sent}/{totalPlanned} mails envoyés
                      {replied ? ` · ${replied} réponse${replied > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggle(c)}>
                      {c.active ? "Mettre en pause" : "Relancer"}
                    </Button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="rounded-lg p-2 text-ink-mute transition-transform hover:bg-canvas"
                      aria-label="Détail"
                    >
                      <IconChevronDown size={16} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-line pt-3">
                    <ul className="divide-y divide-line">
                      {c.contacts.map((ct) => {
                        const p = byId.get(ct.prospectId);
                        return (
                          <li key={ct.prospectId} className="flex items-center justify-between gap-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-ink">{p?.entreprise || "Prospect supprimé"}</p>
                              <p className="truncate text-[11.5px] text-ink-mute">{p?.email}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[11.5px] text-ink-mute">étape {ct.stepDone}/{c.steps.length}</span>
                              <Badge
                                tone={
                                  ct.status === "repondu" ? "green" : ct.status === "erreur" ? "red" : ct.status === "desabonne" ? "orange" : ct.status === "termine" ? "gray" : "blue"
                                }
                              >
                                {ct.status === "en_cours" ? "en cours" : ct.status === "desabonne" ? "désabonné" : ct.status === "termine" ? "terminé" : ct.status}
                              </Badge>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<IconTrash size={13} />}
                        onClick={async () => {
                          await api.deleteCampaign(c.id);
                          toast("Campagne supprimée.");
                          await load();
                        }}
                      >
                        Supprimer la campagne
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-ink-mute">
        Les mails partent depuis <Link href="/dashboard" className="font-semibold text-royal">Aujourd'hui</Link>, par petites vagues et sous ton plafond quotidien.
        Chaque mail contient un lien de désabonnement : c'est obligatoire, et c'est ce qui te protège.
      </p>

      {openCreate && (
        <CreateCampaign
          prospects={prospects}
          defaults={defaults}
          onClose={() => setOpenCreate(false)}
          onCreated={async () => {
            setOpenCreate(false);
            toast("Campagne créée. Envoie ta première vague depuis Aujourd'hui.");
            await load();
          }}
        />
      )}
    </div>
  );
}

/* -------------------- création -------------------- */

function CreateCampaign({
  prospects,
  defaults,
  onClose,
  onCreated,
}: {
  prospects: Prospect[];
  defaults: CampaignStep[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const toast = useToast();
  const eligible = prospects.filter((p) => p.email && p.status === "nouveau");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set(eligible.map((p) => p.id)));
  const [steps, setSteps] = useState<CampaignStep[]>(defaults);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  function setStep(i: number, patch: Partial<CampaignStep>) {
    setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st)));
  }

  async function create() {
    setBusy(true);
    try {
      await api.createCampaign({ name, prospectIds: Array.from(picked), steps, signature });
      await onCreated();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Création impossible", "warning");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nouvelle campagne" size="xl">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink">Nom de la campagne</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Restaurants de Cotonou, sites lents"
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-royal"
          />
        </label>

        <div>
          <p className="mb-1.5 text-[13px] font-bold text-ink">
            Prospects ({picked.size} sélectionné{picked.size > 1 ? "s" : ""})
          </p>
          {eligible.length === 0 ? (
            <p className="rounded-xl bg-canvas p-3 text-[12.5px] text-ink-mute">
              Aucun prospect « À contacter » avec un e-mail. Ajoute des prospects d'abord.
            </p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-line p-2">
              {eligible.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas">
                  <input
                    type="checkbox"
                    checked={picked.has(p.id)}
                    onChange={(e) => {
                      const next = new Set(picked);
                      if (e.target.checked) next.add(p.id);
                      else next.delete(p.id);
                      setPicked(next);
                    }}
                    className="h-4 w-4 accent-royal"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{p.entreprise}</span>
                  <span className="shrink-0 text-[11.5px] text-ink-mute">{p.signals[0]?.label || STATUS_LABELS[p.status]}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[13px] font-bold text-ink">Les étapes de ta séquence</p>
          <p className="-mt-2 text-[12px] leading-relaxed text-ink-mute">
            Les variables {"{{entreprise}}"}, {"{{contact}}"}, {"{{site}}"}, {"{{signal}}"} et {"{{moi}}"} sont remplacées
            automatiquement pour chaque prospect, avec ses vrais signaux. Objet vide sur une relance = réponse dans le même fil Gmail.
          </p>
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-line p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-bold text-ink">
                  {i === 0 ? "Mail d'accroche" : `Relance ${i}`}
                </p>
                {i > 0 && (
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    Envoyée
                    <input
                      type="number"
                      min={1}
                      value={s.delayDays}
                      onChange={(e) => setStep(i, { delayDays: Number(e.target.value) })}
                      className="h-8 w-14 rounded-lg border border-line px-2 text-center text-[12.5px] outline-none focus:border-royal"
                    />
                    jour{s.delayDays > 1 ? "s" : ""} après
                  </label>
                )}
              </div>
              {i === 0 && (
                <input
                  value={s.subject}
                  onChange={(e) => setStep(i, { subject: e.target.value })}
                  placeholder="Objet du mail"
                  className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-[12.5px] text-ink outline-none focus:border-royal"
                />
              )}
              <textarea
                value={s.body}
                onChange={(e) => setStep(i, { body: e.target.value })}
                rows={5}
                className="mt-2 w-full rounded-xl border border-line bg-canvas p-3 text-[12.5px] leading-relaxed text-ink outline-none focus:border-royal"
              />
            </div>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink">Ta signature (optionnelle)</span>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={2}
            placeholder={"Aïcha K.\nCréation de sites web pour commerces · +229 01 00 00 00 00"}
            className="w-full rounded-xl border border-line bg-white p-3 text-[12.5px] text-ink outline-none focus:border-royal"
          />
        </label>

        <Button full variant="primary" className="!bg-royal hover:!bg-royal-dark" disabled={busy || !picked.size} onClick={create}>
          {busy ? "Création..." : `Lancer la campagne (${picked.size} prospect${picked.size > 1 ? "s" : ""})`}
        </Button>
      </div>
    </Modal>
  );
}
