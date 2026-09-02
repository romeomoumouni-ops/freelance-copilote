/* ============================================================
   Prospection : types partagés.
   Le produit : trouver des prospects avec un VRAI signal
   (site lent, pas de HTTPS, pas adapté mobile...), écrire des
   mails personnalisés, relancer, s'arrêter dès qu'on répond.
   ============================================================ */

export type ProspectStatus = "nouveau" | "contacte" | "repondu" | "rdv" | "signe" | "perdu";

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  nouveau: "À contacter",
  contacte: "Contacté",
  repondu: "A répondu",
  rdv: "RDV calé",
  signe: "Client signé",
  perdu: "Sans suite",
};

export interface Signal {
  key: string;
  label: string; // court, pour badge
  detail: string; // phrase chiffrée, pour l'audit
  severity: 1 | 2 | 3; // 3 = fort
  hook: string; // phrase réutilisable dans le mail (vouvoiement)
}

export interface SiteAudit {
  url: string;
  ok: boolean;
  fetchedAt: string;
  https: boolean;
  ms: number;
  title: string | null;
  metaDesc: string | null;
  h1: string | null;
  viewport: boolean;
  ogImage: boolean;
  socials: string[];
  emailFound: string | null;
  phoneFound: string | null;
  copyrightYear: number | null;
  tech: string | null;
  weightKb: number;
  error?: string;
}

export interface Accroche {
  subject: string;
  body: string;
  source: "ia" | "template";
  at: string;
}

export interface ReplyInfo {
  subject: string;
  at: string;
  from?: string;
}

export interface Prospect {
  id: string;
  createdAt: string;
  entreprise: string;
  contact?: string; // prénom ou nom de la personne
  email?: string;
  activite?: string; // ce que fait l'entreprise, en quelques mots
  site?: string;
  ville?: string;
  notes?: string;
  status: ProspectStatus;
  score: number; // priorité 0-100 (urgence + contactabilité)
  signals: Signal[];
  audit?: SiteAudit;
  accroche?: Accroche;
  reply?: ReplyInfo;
}

export interface CampaignStep {
  delayDays: number; // délai depuis l'étape précédente (0 pour la 1re)
  subject: string; // vide sur une relance = "Re:" du 1er mail
  body: string;
}

export type ContactRunStatus = "en_cours" | "repondu" | "termine" | "desabonne" | "erreur";

export interface ContactState {
  prospectId: string;
  stepDone: number; // nombre d'étapes déjà envoyées
  lastSentAt?: string;
  messageId?: string; // 1er message : sert au fil Gmail des relances
  firstSubject?: string;
  status: ContactRunStatus;
  error?: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  active: boolean;
  steps: CampaignStep[];
  contacts: ContactState[];
  signature: string;
}

export interface MailboxSettings {
  email: string;
  appPassword: string;
  fromName: string;
  dailyCap: number; // défaut 40 : plafond anti-spam
  host: string;
  port: number;
  imapHost: string;
  imapPort: number;
  lastReplyCheck?: string;
  verifiedAt?: string;
}

export interface DueSend {
  campaignId: string;
  campaignName: string;
  prospectId: string;
  stepIndex: number;
}

export interface EventLog {
  at: string;
  type: "envoi" | "reponse" | "rdv" | "signe" | "desabo" | "erreur";
  label: string;
}

export const DEFAULT_MAILBOX: Omit<MailboxSettings, "email" | "appPassword" | "fromName"> = {
  dailyCap: 40,
  host: "smtp.gmail.com",
  port: 465,
  imapHost: "imap.gmail.com",
  imapPort: 993,
};
