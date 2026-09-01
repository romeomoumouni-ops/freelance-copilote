/* Envoi SMTP via la boîte Gmail du freelance (mot de passe d'application).
   Volontairement en texte brut : meilleur pour la délivrabilité d'un
   mail de prospection. Désabonnement obligatoire en pied de mail. */

import nodemailer from "nodemailer";
import type { MailboxSettings } from "@/lib/prospect/types";

export function makeTransport(m: MailboxSettings) {
  return nodemailer.createTransport({
    host: m.host,
    port: m.port,
    secure: m.port === 465,
    auth: { user: m.email, pass: m.appPassword },
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });
}

export async function verifyMailbox(m: MailboxSettings): Promise<void> {
  await makeTransport(m).verify();
}

export function unsubFooter(uid: string, email: string, baseUrl: string): string {
  const token = Buffer.from(uid + "|" + email.trim().toLowerCase()).toString("base64url");
  return `\n\n--\nPour ne plus recevoir mes messages : ${baseUrl}/api/unsub?e=${token}`;
}

export async function sendOne(
  m: MailboxSettings,
  input: {
    to: string;
    subject: string;
    text: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ messageId: string }> {
  const transporter = makeTransport(m);
  const info = await transporter.sendMail({
    from: `${m.fromName} <${m.email}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    inReplyTo: input.inReplyTo,
    references: input.references,
    headers: { "X-Mailer": "Freelance Copilote" },
  });
  return { messageId: info.messageId };
}
