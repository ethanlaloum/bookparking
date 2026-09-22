const path = require('path');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    "La variable d'environnement DATABASE_URL est absente. Le démarrage est interrompu : aucune valeur de repli n'existe.",
  );

module.exports = {
  client: 'pg',
  connection: databaseUrl,
  migrations: {
    directory: path.join(__dirname, 'dist', 'infra', 'migrations'),
    loadExtensions: ['.js'],
  },
};
