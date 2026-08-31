/* Détection des réponses via IMAP (Gmail, mot de passe d'application).
   On relève les mails reçus depuis le dernier contrôle, on croise les
   expéditeurs avec les prospects contactés : dès qu'un prospect a
   répondu, sa séquence s'arrête automatiquement. Best effort : toute
   erreur est renvoyée proprement, jamais silencieuse. */

import { ImapFlow } from "imapflow";
import type { MailboxSettings } from "@/lib/prospect/types";

export interface InboundMail {
  from: string;
  subject: string;
  at: string;
}

export async function fetchRecentSenders(m: MailboxSettings, since: Date): Promise<InboundMail[]> {
  const client = new ImapFlow({
    host: m.imapHost,
    port: m.imapPort,
    secure: true,
    auth: { user: m.email, pass: m.appPassword },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
  const out: InboundMail[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ since });
      if (uids && uids.length) {
        for await (const msg of client.fetch(uids.slice(-300), { envelope: true })) {
          const env = msg.envelope;
          const from = env?.from?.[0]?.address || "";
          if (from) {
            out.push({
              from: from.toLowerCase(),
              subject: env?.subject || "",
              at: (env?.date ? new Date(env.date) : new Date()).toISOString(),
            });
          }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return out;
}
