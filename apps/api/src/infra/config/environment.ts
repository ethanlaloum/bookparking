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

export const environment = {
  accessTokenSecret: (): string => required('ACCESS_TOKEN_SECRET'),
  databaseUrl: (): string => required('DATABASE_URL'),
  port: (): number => Number(process.env.PORT ?? 3000),
  rentalRequestExpiryInHours: (): number =>
    Number(
      process.env.RENTAL_REQUEST_EXPIRY_IN_HOURS ??
        RENTAL_REQUEST_EXPIRY_IN_HOURS_BY_DEFAULT,
    ),
};
