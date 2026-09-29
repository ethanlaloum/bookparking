import { Either } from 'effect/index';

import { InvalidPlatformSettingsError } from '../errors/InvalidPlatformSettingsError';

// Les quatre conditions de location que l'exploitant règle depuis le
// back-office. Chacune est figée sur une demande au moment où elle est faite :
// une valeur changée ne vaut que pour les demandes suivantes.
export interface PlatformSettings {
  platformFeePercent: number;
  freeCancellationHours: number;
  requestExpiryHours: number;
  payoutReleaseDelayHours: number;
}

export type PlatformSetting = keyof PlatformSettings;

// Les valeurs d'avant le back-office (D-10, D-14, D-22, SPEC-005) : celles
// qu'une base sans aucune version applique.
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformFeePercent: 15,
  freeCancellationHours: 24,
  requestExpiryHours: 48,
  payoutReleaseDelayHours: 24,
};

interface Bounds {
  min: number;
  max: number;
  // Le nombre de décimales admises : la commission se règle au centième de
  // point, les délais à l'heure.
  decimals: number;
}

// Des bornes de raison, pas de goût :
// - une commission au-delà de la moitié du prix est une faute de frappe ;
// - une empreinte de carte ne vit que quelques jours (sept pour la plupart des
//   cartes) : au-delà de 96 heures d'attente, le loueur confirmerait des
//   empreintes déjà mortes ;
// - l'annulation gratuite et la libération de l'argent tiennent en deux
//   semaines et un mois.
export const PLATFORM_SETTINGS_BOUNDS: Record<PlatformSetting, Bounds> = {
  platformFeePercent: { min: 0, max: 50, decimals: 2 },
  freeCancellationHours: { min: 0, max: 336, decimals: 0 },
  requestExpiryHours: { min: 1, max: 96, decimals: 0 },
  payoutReleaseDelayHours: { min: 0, max: 720, decimals: 0 },
};

const hasAtMostDecimals = (value: number, decimals: number): boolean =>
  Math.abs(Math.round(value * 10 ** decimals) - value * 10 ** decimals) < 1e-9;

const isWithin = (value: number, bounds: Bounds): boolean =>
  Number.isFinite(value) &&
  value >= bounds.min &&
  value <= bounds.max &&
  hasAtMostDecimals(value, bounds.decimals);

export const checkPlatformSettings = (
  candidate: PlatformSettings,
): Either.Either<PlatformSettings, InvalidPlatformSettingsError> => {
  const settings = Object.keys(PLATFORM_SETTINGS_BOUNDS) as PlatformSetting[];
  const invalid = settings.find(
    (setting) =>
      !isWithin(candidate[setting], PLATFORM_SETTINGS_BOUNDS[setting]),
  );
  return invalid === undefined
    ? Either.right(candidate)
    : Either.left(
        new InvalidPlatformSettingsError(
          invalid,
          PLATFORM_SETTINGS_BOUNDS[invalid],
        ),
      );
};
