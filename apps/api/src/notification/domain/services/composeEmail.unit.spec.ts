import { OutgoingEmail } from '../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';
import { composeEmail } from './composeEmail';

const SITE_URL = 'https://bookparking.fr';
const QUEUED_AT = new Date('2026-10-01T07:00:00.000Z');

const welcomeFor = (recipient: string) =>
  composeEmail(
    OutgoingEmail.welcome({ recipient, queuedAt: QUEUED_AT }),
    SITE_URL,
  );

describe('composeEmail @SPEC-006', () => {
  it('writes the welcome email in French with a link to the site @EX-006-19', () => {
    const email = welcomeFor('marc.d@example.com');

    expect(email.subject).toEqual('Bienvenue sur Bookparking');
    expect(email.text).toContain('marc.d@example.com');
    expect(email.text).toContain(SITE_URL);
    expect(email.html).toContain(`href="${SITE_URL}"`);
  });

  it('escapes markup carried by the address in the HTML version @EX-006-20', () => {
    const email = welcomeFor('a<b>&c@exemple.fr');

    expect(email.html).toContain('a&lt;b&gt;&amp;c@exemple.fr');
    expect(email.html).not.toContain('<b>');
  });
});

const noticeFor = (kind: NotificationKind, siteUrl = SITE_URL) =>
  composeEmail(
    OutgoingEmail.aboutNotification({
      kind,
      recipient: 'marc.d@example.com',
      queuedAt: QUEUED_AT,
    }),
    siteUrl,
  );

describe('composeEmail — notifications', () => {
  it.each<[NotificationKind, string, string]>([
    [
      'RENTAL_REQUEST_RECEIVED',
      'Nouvelle demande de réservation',
      '/compte?onglet=demandes-recues',
    ],
    [
      'RENTAL_REQUEST_ACCEPTED',
      'Votre réservation est confirmée',
      '/compte?onglet=reservations',
    ],
    [
      'RENTAL_REQUEST_DECLINED',
      "Votre demande n'a pas été acceptée",
      '/compte?onglet=reservations',
    ],
    [
      'RENTAL_REQUEST_EXPIRED',
      'Votre demande a expiré',
      '/compte?onglet=reservations',
    ],
    [
      'RENTAL_REQUEST_UNANSWERED',
      'Une demande a expiré sans réponse',
      '/compte?onglet=demandes-recues',
    ],
    [
      'RENTAL_CANCELLED_BY_RENTER',
      'Une réservation sur votre place a été annulée',
      '/compte?onglet=demandes-recues',
    ],
    [
      'RENTAL_CANCELLED_BY_OWNER',
      'Votre réservation a été annulée',
      '/compte?onglet=reservations',
    ],
    [
      'RENTAL_CANCELLED_BY_OPERATOR',
      'Une réservation a été annulée par Bookparking',
      '/compte',
    ],
    [
      'RENTAL_PAYMENT_FAILED',
      "Votre paiement n'a pas abouti",
      '/compte?onglet=reservations',
    ],
    [
      'RENTAL_PAYOUT_SENT',
      'Votre versement est parti',
      '/compte?onglet=versements',
    ],
  ])('writes %s under "%s", linking to %s', (kind, subject, path) => {
    const email = noticeFor(kind);

    expect(email.subject).toEqual(subject);
    expect(email.text).toContain(`${SITE_URL}${path}`);
    expect(email.html).toContain(`href="${SITE_URL}${path}"`);
  });

  it('names neither the place nor the dates, which only the signed-in site shows', () => {
    const email = noticeFor('RENTAL_REQUEST_RECEIVED');

    expect(email.text).not.toMatch(/rue|box|octobre|\d{4}-\d{2}-\d{2}/i);
  });

  it('joins the site address and the page without doubling the slash', () => {
    const email = noticeFor('RENTAL_REQUEST_RECEIVED', `${SITE_URL}/`);

    expect(email.text).toContain(`${SITE_URL}/compte?onglet=demandes-recues`);
  });

  it('escapes the link in the HTML version', () => {
    const email = noticeFor('RENTAL_REQUEST_ACCEPTED', 'https://a.fr/?x="><b>');

    expect(email.html).not.toContain('<b>');
    expect(email.html).toContain('&quot;&gt;&lt;b&gt;');
  });
});

const resetFor = (token: string, siteUrl = SITE_URL) =>
  composeEmail(
    OutgoingEmail.passwordReset({
      recipient: 'marc.d@example.com',
      token,
      queuedAt: QUEUED_AT,
    }),
    siteUrl,
  );

describe('composeEmail — password reset', () => {
  it('writes the reset link, valid once and for one hour', () => {
    const email = resetFor('token-1');

    expect({ subject: email.subject, text: email.text }).toEqual({
      subject: 'Réinitialisez votre mot de passe',
      text: [
        'Bonjour,',
        '',
        "Une demande de réinitialisation du mot de passe de votre compte Bookparking vient d'être faite.",
        '',
        'Choisissez un nouveau mot de passe avec ce lien, valable une heure et une seule fois :',
        'https://bookparking.fr/mot-de-passe/nouveau?jeton=token-1',
        '',
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe ne change pas.",
        '',
        "L'équipe Bookparking",
      ].join('\n'),
    });
    expect(email.html).toContain(
      'href="https://bookparking.fr/mot-de-passe/nouveau?jeton=token-1"',
    );
  });

  it('encodes the token inside the link', () => {
    const email = resetFor('a+b/c=d', `${SITE_URL}/`);

    expect(email.text).toContain(
      'https://bookparking.fr/mot-de-passe/nouveau?jeton=a%2Bb%2Fc%3Dd',
    );
  });

  it('points to a new request once the token is no longer kept', () => {
    const email = composeEmail(
      OutgoingEmail.fromState({
        ...OutgoingEmail.passwordReset({
          recipient: 'marc.d@example.com',
          token: 'token-1',
          queuedAt: QUEUED_AT,
        }).toState(),
        passwordResetToken: null,
      }),
      SITE_URL,
    );

    expect(email.text).toContain('https://bookparking.fr/mot-de-passe-oublie');
    expect(email.text).not.toContain('jeton=');
  });
});
