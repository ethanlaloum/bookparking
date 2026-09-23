/**
 * Les finalités soumises à l'accord du visiteur : chacune est un service tiers
 * que le site appelle sans que le visiteur l'ait demandé, et qui reçoit son
 * adresse IP. La session et ce choix lui-même, gardés dans le navigateur, sont
 * strictement nécessaires : ils ne figurent pas ici et ne se refusent pas.
 *
 * Ajouter une finalité, c'est aussi incrémenter `CONSENT_VERSION` : un accord
 * donné pour deux finalités ne vaut pas pour une troisième.
 */
export const CONSENT_PURPOSES = ['map', 'fonts'] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export type ConsentChoices = Record<ConsentPurpose, boolean>;

export const CONSENT_VERSION = 1;

/** Six mois, la durée que recommande la CNIL avant de reposer la question. */
export const CONSENT_LIFETIME_DAYS = 180;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface Consent {
  version: number;
  decidedAt: string;
  choices: ConsentChoices;
}

const everyPurpose = (answer: boolean): ConsentChoices => ({ map: answer, fonts: answer });

export const acceptEverything = (): ConsentChoices => everyPurpose(true);

export const refuseEverything = (): ConsentChoices => everyPurpose(false);

/** Le silence n'est pas un accord : sans décision, rien n'est coché. */
export const choicesOf = (consent: Consent | null): ConsentChoices =>
  consent === null ? refuseEverything() : { ...consent.choices };

export const allows = (consent: Consent | null, purpose: ConsentPurpose): boolean =>
  consent !== null && consent.choices[purpose];

/** Accorder une finalité là où elle manque, sans toucher aux autres réponses. */
export const grant = (consent: Consent | null, purpose: ConsentPurpose): ConsentChoices => ({
  ...choicesOf(consent),
  [purpose]: true,
});

export const recordConsent = (choices: ConsentChoices, now: Date): Consent => ({
  version: CONSENT_VERSION,
  decidedAt: now.toISOString(),
  choices: { ...choices },
});

/**
 * Une décision relue du navigateur ne vaut que pour les finalités qu'elle a
 * tranchées, et pour six mois. Au-delà, on la tient pour absente : la question
 * est reposée plutôt que de présumer un accord ancien.
 */
export const restoreConsent = (consent: Consent | null, now: Date): Consent | null => {
  if (consent === null || consent.version !== CONSENT_VERSION) return null;
  const decidedAt = Date.parse(consent.decidedAt);
  if (Number.isNaN(decidedAt)) return null;
  const age = now.getTime() - decidedAt;
  if (age < 0 || age >= CONSENT_LIFETIME_DAYS * DAY_IN_MS) return null;
  return consent;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Lit ce que le navigateur a gardé. Tout enregistrement incomplet vaut absence
 * de décision — jamais un accord partiel : une finalité manquante n'a pas été
 * acceptée. Une finalité inconnue, elle, est ignorée.
 */
export const parseConsent = (raw: unknown): Consent | null => {
  if (!isRecord(raw) || !isRecord(raw.choices)) return null;
  if (typeof raw.version !== 'number' || typeof raw.decidedAt !== 'string') return null;

  const stored = raw.choices;
  const choices = refuseEverything();
  for (const purpose of CONSENT_PURPOSES) {
    const answer = stored[purpose];
    if (typeof answer !== 'boolean') return null;
    choices[purpose] = answer;
  }

  return { version: raw.version, decidedAt: raw.decidedAt, choices };
};
