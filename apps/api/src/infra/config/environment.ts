const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '')
    throw new Error(
      `La variable d'environnement ${name} est absente. Le démarrage est interrompu : aucune valeur de repli n'existe.`,
    );
  return value;
};

// Q-18 du brainstorm du 10/09 — « au bout de combien de temps une demande non
// confirmée est-elle abandonnée » — est restée ouverte, et le brainstorm la range
// déjà parmi les réglages du back-office, à côté de la marge et du délai
// d'annulation. Le délai est donc une variable d'environnement, pas une
// constante du domaine : le jour où le back-office existe, il la remplace sans
// toucher au code métier.
const RENTAL_REQUEST_EXPIRY_IN_HOURS_BY_DEFAULT = 48;

// Cinq minutes : l'argent dû est rendu au plus tard à ce délai près. Réglable
// pour les parcours de bout en bout, qui n'attendent pas cinq minutes.
const RENTAL_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT = 300;

// SPEC-005 : l'échéance d'annulation gratuite, figée sur chaque demande au
// moment où elle est faite. Un réglage, comme le délai d'expiration, en
// attendant l'écran de réglages du back-office (D-14).
const FREE_CANCELLATION_HOURS_BEFORE_START_BY_DEFAULT = 24;

// SPEC-006 : trente secondes entre deux balayages de la file d'e-mails.
const EMAIL_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT = 30;

// D-10 du brainstorm du 10/09 : la commission de la plateforme, en pourcentage
// du prix payé par le conducteur. 15 %, décidé le 24/09/2026 ; un réglage du
// back-office à terme, figé sur chaque demande au moment où elle est faite.
const PLATFORM_FEE_PERCENT_BY_DEFAULT = 15;

// D-22 : l'argent est libéré vers le loueur à l'arrivée confirmée par le
// conducteur, ou au plus tard ce délai après le premier instant loué.
const PAYOUT_RELEASE_DELAY_IN_HOURS_BY_DEFAULT = 24;

const PAYOUT_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT = 300;

// Un push vaut pour l'instant : dix secondes entre deux balayages.
const PUSH_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT = 10;

export interface ResendSettings {
  apiKey: string;
  from: string;
}

export type EmailSending = 'disabled' | ResendSettings;

// « adresse@domaine », ou « Nom <adresse@domaine> » : les deux formes que
// Resend accepte pour l'expéditeur.
const SENDER_ADDRESS = '[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+';
const MAIL_FROM_PATTERN = new RegExp(
  `^(?:${SENDER_ADDRESS}|[^<>]*<${SENDER_ADDRESS}>)$`,
  'u',
);

export const environment = {
  accessTokenSecret: (): string => required('ACCESS_TOKEN_SECRET'),
  databaseUrl: (): string => required('DATABASE_URL'),
  port: (): number => Number(process.env.PORT ?? 3000),
  // Les trois réglages de paiement n'ont aucune valeur de repli, comme le
  // secret des jetons : une api qui démarrerait sans eux ouvrirait des pages
  // de paiement vers nulle part, ou accepterait des événements non signés.
  stripeSecretKey: (): string => required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: (): string => required('STRIPE_WEBHOOK_SECRET'),
  frontBaseUrl: (): string => required('FRONT_BASE_URL').replace(/\/+$/, ''),
  // SPEC-006 RG-05 : sans clé ni expéditeur, l'api refuse de démarrer, comme
  // sans clé Stripe. Seul un `EMAIL_SENDING=disabled` explicite l'en dispense —
  // les parcours e2e, qui s'inscrivent avec des adresses `@bookparking.test`.
  emailSending: (): EmailSending => {
    if (process.env.EMAIL_SENDING === 'disabled') return 'disabled';
    const apiKey = required('RESEND_API_KEY');
    const from = required('MAIL_FROM').trim();
    if (!MAIL_FROM_PATTERN.test(from))
      throw new Error(
        "La variable d'environnement MAIL_FROM n'est pas une adresse d'expédition (« Nom <adresse@domaine> » ou « adresse@domaine »). Le démarrage est interrompu.",
      );
    return { apiKey, from };
  },
  emailSweepIntervalInSeconds: (): number =>
    Number(
      process.env.EMAIL_SWEEP_INTERVAL_IN_SECONDS ??
        EMAIL_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT,
    ),
  platformFeePercent: (): number => {
    const percent = Number(
      process.env.PLATFORM_FEE_PERCENT ?? PLATFORM_FEE_PERCENT_BY_DEFAULT,
    );
    if (!Number.isFinite(percent) || percent < 0 || percent >= 100)
      throw new Error(
        "La variable d'environnement PLATFORM_FEE_PERCENT doit être un pourcentage entre 0 et 100. Le démarrage est interrompu.",
      );
    return percent;
  },
  payoutReleaseDelayInHours: (): number =>
    Number(
      process.env.PAYOUT_RELEASE_DELAY_IN_HOURS ??
        PAYOUT_RELEASE_DELAY_IN_HOURS_BY_DEFAULT,
    ),
  payoutSweepIntervalInSeconds: (): number =>
    Number(
      process.env.PAYOUT_SWEEP_INTERVAL_IN_SECONDS ??
        PAYOUT_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT,
    ),
  pushSweepIntervalInSeconds: (): number =>
    Number(
      process.env.PUSH_SWEEP_INTERVAL_IN_SECONDS ??
        PUSH_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT,
    ),
  // Facultatif : Expo n'exige un jeton d'accès que si la « sécurité renforcée
  // des push » est activée sur le projet. Les clés Apple, elles, vivent chez
  // Expo (EAS), jamais ici.
  expoAccessToken: (): string | null => {
    const token = process.env.EXPO_ACCESS_TOKEN;
    return token === undefined || token.trim() === '' ? null : token.trim();
  },
  freeCancellationHoursBeforeStart: (): number =>
    Number(
      process.env.FREE_CANCELLATION_HOURS_BEFORE_START ??
        FREE_CANCELLATION_HOURS_BEFORE_START_BY_DEFAULT,
    ),
  rentalSweepIntervalInSeconds: (): number =>
    Number(
      process.env.RENTAL_SWEEP_INTERVAL_IN_SECONDS ??
        RENTAL_SWEEP_INTERVAL_IN_SECONDS_BY_DEFAULT,
    ),
  rentalRequestExpiryInHours: (): number =>
    Number(
      process.env.RENTAL_REQUEST_EXPIRY_IN_HOURS ??
        RENTAL_REQUEST_EXPIRY_IN_HOURS_BY_DEFAULT,
    ),
};
