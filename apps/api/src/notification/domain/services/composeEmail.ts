import {
  OutgoingEmail,
  OutgoingEmailKind,
} from '../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';

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

interface NoticeCopy {
  subject: string;
  lines: string[];
  action: string;
  path: string;
}

const RECEIVED_REQUESTS = '/compte?onglet=demandes-recues';
const MY_BOOKINGS = '/compte?onglet=reservations';

// Aucun e-mail de notification ne dit l'adresse de la place ni les dates : la
// boîte aux lettres n'est pas le site, et la cloche les montre à qui se
// connecte. Chaque phrase sur l'argent doit rester vraie quel que soit l'état
// de paiement de la demande — une demande d'avant l'encaissement n'a pas
// d'empreinte à lever.
const NOTICES: Record<NotificationKind, NoticeCopy> = {
  RENTAL_REQUEST_RECEIVED: {
    subject: 'Nouvelle demande de réservation',
    lines: [
      'Un conducteur souhaite louer votre place.',
      'Acceptez sa demande depuis votre espace : sans réponse de votre part, elle expirera et rien ne lui sera prélevé.',
    ],
    action: 'Voir la demande',
    path: RECEIVED_REQUESTS,
  },
  RENTAL_REQUEST_ACCEPTED: {
    subject: 'Votre réservation est confirmée',
    lines: [
      'Le loueur a accepté votre demande : la place vous est réservée.',
      "Retrouvez les dates et l'adresse dans votre espace.",
    ],
    action: 'Voir ma réservation',
    path: MY_BOOKINGS,
  },
  RENTAL_REQUEST_DECLINED: {
    subject: "Votre demande n'a pas été acceptée",
    lines: [
      'Le loueur a décliné votre demande de réservation.',
      'Rien ne vous a été prélevé.',
    ],
    action: 'Voir mes réservations',
    path: MY_BOOKINGS,
  },
  RENTAL_REQUEST_EXPIRED: {
    subject: 'Votre demande a expiré',
    lines: [
      "Le loueur n'a pas répondu à temps à votre demande de réservation.",
      'Rien ne vous a été prélevé.',
    ],
    action: 'Voir mes réservations',
    path: MY_BOOKINGS,
  },
  RENTAL_REQUEST_UNANSWERED: {
    subject: 'Une demande a expiré sans réponse',
    lines: [
      "Une demande de réservation sur votre place a expiré : vous n'y avez pas répondu à temps.",
      'Le conducteur en a été prévenu, et rien ne lui a été prélevé.',
    ],
    action: 'Voir mes demandes reçues',
    path: RECEIVED_REQUESTS,
  },
  RENTAL_CANCELLED_BY_RENTER: {
    subject: 'Une réservation sur votre place a été annulée',
    lines: [
      'Le conducteur a annulé sa réservation.',
      'Les dates sont de nouveau libres pour une autre demande.',
    ],
    action: 'Voir mes demandes reçues',
    path: RECEIVED_REQUESTS,
  },
  RENTAL_CANCELLED_BY_OWNER: {
    subject: 'Votre réservation a été annulée',
    lines: [
      'Le loueur a annulé votre réservation.',
      'Tout ce qui vous a été prélevé vous est rendu.',
    ],
    action: 'Voir mes réservations',
    path: MY_BOOKINGS,
  },
  RENTAL_CANCELLED_BY_OPERATOR: {
    subject: 'Une réservation a été annulée par Bookparking',
    lines: [
      'Bookparking a annulé une réservation qui vous concerne.',
      'Tout ce qui a été prélevé au conducteur lui est rendu.',
    ],
    action: 'Voir mon espace',
    path: '/compte',
  },
  RENTAL_PAYOUT_SENT: {
    subject: 'Votre versement est parti',
    lines: [
      "L'argent d'une location, commission déduite, a été viré vers votre compte Stripe.",
      'Stripe le verse ensuite sur votre compte bancaire, selon son calendrier habituel.',
    ],
    action: 'Voir mes versements',
    path: '/compte?onglet=versements',
  },
  RENTAL_PAYMENT_FAILED: {
    subject: "Votre paiement n'a pas abouti",
    lines: [
      'Le loueur a accepté votre demande, mais votre banque a refusé le paiement.',
      "La réservation n'a pas pu être confirmée, et rien ne vous a été prélevé.",
    ],
    action: 'Voir mes réservations',
    path: MY_BOOKINGS,
  },
};

const composeNotice =
  (copy: NoticeCopy) =>
  (_email: OutgoingEmail, siteUrl: string): ComposedEmail => {
    const link = `${siteUrl.replace(/\/+$/, '')}${copy.path}`;
    return {
      subject: copy.subject,
      text: [
        'Bonjour,',
        '',
        ...copy.lines,
        '',
        `${copy.action} : ${link}`,
        '',
        "L'équipe Bookparking",
      ].join('\n'),
      html: `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(copy.subject)}</h1>
${copy.lines.map((line) => `      <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(line)}</p>`).join('\n')}
      <p style="margin:8px 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;">${escapeHtml(copy.action)}</a></p>
      <p style="margin:0;color:#6b6b6b;font-size:14px;">L'équipe Bookparking</p>
    </div>
  </body>
</html>`,
    };
  };

// Un type d'e-mail sans rédaction ne compile pas : le `Record` exige une
// entrée par valeur de `OutgoingEmailKind`.
const RESET_NO_LONGER_KEPT: NoticeCopy = {
  subject: 'Réinitialisez votre mot de passe',
  lines: [
    "Ce lien de réinitialisation n'est plus disponible.",
    'Demandez-en un nouveau depuis la page de connexion.',
  ],
  action: 'Demander un nouveau lien',
  path: '/mot-de-passe-oublie',
};

const composePasswordReset = (
  email: OutgoingEmail,
  siteUrl: string,
): ComposedEmail => {
  const token = email.passwordResetToken;
  if (token === null)
    return composeNotice(RESET_NO_LONGER_KEPT)(email, siteUrl);
  const link = `${siteUrl.replace(/\/+$/, '')}/mot-de-passe/nouveau?jeton=${encodeURIComponent(token)}`;
  const subject = 'Réinitialisez votre mot de passe';
  const intro =
    "Une demande de réinitialisation du mot de passe de votre compte Bookparking vient d'être faite.";
  const invitation =
    'Choisissez un nouveau mot de passe avec ce lien, valable une heure et une seule fois :';
  const reassurance =
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe ne change pas.";
  return {
    subject,
    text: [
      'Bonjour,',
      '',
      intro,
      '',
      invitation,
      link,
      '',
      reassurance,
      '',
      "L'équipe Bookparking",
    ].join('\n'),
    html: `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(subject)}</h1>
      <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 16px;line-height:1.5;">Choisissez un nouveau mot de passe avec ce lien, valable une heure et une seule fois.</p>
      <p style="margin:8px 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;">Choisir un nouveau mot de passe</a></p>
      <p style="margin:0 0 16px;line-height:1.5;color:#6b6b6b;font-size:14px;">${escapeHtml(reassurance)}</p>
      <p style="margin:0;color:#6b6b6b;font-size:14px;">L'équipe Bookparking</p>
    </div>
  </body>
</html>`,
  };
};

const composers: Record<
  OutgoingEmailKind,
  (email: OutgoingEmail, siteUrl: string) => ComposedEmail
> = {
  WELCOME: (email, siteUrl) => composeWelcome(email.recipient, siteUrl),
  PASSWORD_RESET: composePasswordReset,
  RENTAL_REQUEST_RECEIVED: composeNotice(NOTICES.RENTAL_REQUEST_RECEIVED),
  RENTAL_REQUEST_ACCEPTED: composeNotice(NOTICES.RENTAL_REQUEST_ACCEPTED),
  RENTAL_REQUEST_DECLINED: composeNotice(NOTICES.RENTAL_REQUEST_DECLINED),
  RENTAL_REQUEST_EXPIRED: composeNotice(NOTICES.RENTAL_REQUEST_EXPIRED),
  RENTAL_REQUEST_UNANSWERED: composeNotice(NOTICES.RENTAL_REQUEST_UNANSWERED),
  RENTAL_CANCELLED_BY_RENTER: composeNotice(NOTICES.RENTAL_CANCELLED_BY_RENTER),
  RENTAL_CANCELLED_BY_OWNER: composeNotice(NOTICES.RENTAL_CANCELLED_BY_OWNER),
  RENTAL_CANCELLED_BY_OPERATOR: composeNotice(
    NOTICES.RENTAL_CANCELLED_BY_OPERATOR,
  ),
  RENTAL_PAYMENT_FAILED: composeNotice(NOTICES.RENTAL_PAYMENT_FAILED),
  RENTAL_PAYOUT_SENT: composeNotice(NOTICES.RENTAL_PAYOUT_SENT),
};

export const composeEmail = (
  email: OutgoingEmail,
  siteUrl: string,
): ComposedEmail => composers[email.kind](email, siteUrl);
