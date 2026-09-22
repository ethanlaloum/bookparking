const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '')
    throw new Error(
      `La variable d'environnement ${name} est absente. Le démarrage est interrompu : aucune valeur de repli n'existe.`,
    );
  return value;
};

export const environment = {
  accessTokenSecret: (): string => required('ACCESS_TOKEN_SECRET'),
  databaseUrl: (): string => required('DATABASE_URL'),
  port: (): number => Number(process.env.PORT ?? 3000),
};
