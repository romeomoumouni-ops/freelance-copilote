/* E-mails transactionnels via Resend (confirmation d'inscription...).
   MAIL_FROM doit être sur un domaine vérifié dans Resend. */

export function mailReady(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendAppMail(input: { to: string; subject: string; html: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquante : l'envoi d'e-mails n'est pas configuré.");
  const from = process.env.MAIL_FROM || "Freelance Copilote <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  });
  if (!res.ok) throw new Error("Envoi de l'e-mail impossible : " + (await res.text()).slice(0, 300));
}

/* Gabarit dans la charte : fond canvas, carte bordée noire, surligné jaune, bouton bleu. */
export function confirmEmailHtml(input: { name: string; link: string }): string {
  const prenom = input.name ? input.name.split(" ")[0] : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#F7F6F3;font-family:'Montserrat',system-ui,-apple-system,sans-serif">
  <div style="max-width:480px;margin:0 auto">
    <p style="text-align:center;font-size:17px;font-weight:800;color:#17161C;margin:0 0 20px">Freelance <span style="background:#FFEE66;padding:0 4px;border-radius:3px">Copilote</span></p>
    <div style="background:#ffffff;border:2px solid #17161C;border-radius:24px;padding:32px;box-shadow:8px 8px 0 0 #FFEE66">
      <h1 style="font-size:21px;color:#17161C;margin:0 0 12px">Bienvenue${prenom ? " " + prenom : ""} !</h1>
      <p style="font-size:14px;line-height:1.7;color:#4B4856;margin:0 0 24px">
        Ton compte est presque prêt. Clique sur le bouton ci-dessous pour confirmer ton adresse e-mail
        et ouvrir ton espace de prospection.
      </p>
      <a href="${input.link}" style="display:block;background:#2563EB;color:#ffffff;text-decoration:none;text-align:center;font-size:15px;font-weight:700;padding:15px 24px;border-radius:16px">
        Je confirme mon adresse
      </a>
      <p style="font-size:12px;line-height:1.6;color:#8B8798;margin:24px 0 0">
        Ce lien est valable quelques heures et ne sert qu'une fois. Si tu n'es pas à l'origine de cette
        inscription, ignore simplement ce message.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#8B8798;margin:20px 0 0">Freelance Copilote · La prospection devient simple</p>
  </div>
</body></html>`;
}
