import {
  OutgoingEmail,
  OutgoingEmailKind,
} from '../../../shared/email-outbox/domain/entities/OutgoingEmail';

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
}

// Le motif de l'inscription admet `<`, `>` et `&` dans une adresse
// (`RegisterAccountSchema.ts`) : tout ce qui entre dans la version HTML passe
// par ici, sans exception.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const composeWelcome = (recipient: string, siteUrl: string): ComposedEmail => {
  const address = escapeHtml(recipient);
  const site = escapeHtml(siteUrl);
  return {
    subject: 'Bienvenue sur Bookparking',
    text: [
      'Bonjour,',
      '',
      `Votre compte Bookparking est prêt. Vous vous y connectez avec l'adresse ${recipient}.`,
      '',
      'Vous pouvez dès maintenant réserver une place de parking, ou publier la vôtre :',
      siteUrl,
      '',
      "L'équipe Bookparking",
    ].join('\n'),
    html: `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Bienvenue sur Bookparking</h1>
      <p style="margin:0 0 16px;line-height:1.5;">Votre compte est prêt. Vous vous y connectez avec l'adresse <strong>${address}</strong>.</p>
      <p style="margin:0 0 24px;line-height:1.5;">Vous pouvez dès maintenant réserver une place de parking, ou publier la vôtre.</p>
      <p style="margin:0 0 24px;"><a href="${site}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;">Aller sur Bookparking</a></p>
      <p style="margin:0;color:#6b6b6b;font-size:14px;">L'équipe Bookparking</p>
    </div>
  </body>
</html>`,
  };
};

// Un type d'e-mail sans rédaction ne compile pas : le `Record` exige une
// entrée par valeur de `OutgoingEmailKind`.
const composers: Record<
  OutgoingEmailKind,
  (recipient: string, siteUrl: string) => ComposedEmail
> = {
  WELCOME: composeWelcome,
};

export const composeEmail = (
  email: OutgoingEmail,
  siteUrl: string,
): ComposedEmail => composers[email.kind](email.recipient, siteUrl);
