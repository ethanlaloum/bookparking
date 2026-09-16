# bookparking

## Layout

Monorepo pnpm, un seul package aujourd'hui (`apps/api`), déclaré dans `pnpm-workspace.yaml`
(`packages: apps/*`). Chaque app porte son propre `tsconfig.json`, qui étend
`tsconfig.base.json` à la racine (`skipLibCheck`, `forceConsistentCasingInFileNames`) — la
seule configuration TypeScript partagée entre apps.

## Things that will bite you

- **`pnpm-workspace.yaml` autorise le build natif de `unrs-resolver`, jamais celui de `@parcel/watcher`.**
  pnpm bloque par défaut les scripts `postinstall`/`build` des dépendances tant qu'ils ne
  figurent pas dans `allowBuilds` ; `unrs-resolver` est le résolveur natif de `jest-resolve@30`
  et a besoin de son binaire de plateforme, quand `@parcel/watcher` ne sert qu'au mode watch de
  `jest-haste-map` (banni ici) et se contente de son repli JS pur.
  Ne pas retirer ces deux lignes lors d'un nettoyage de dépendances sans relire `pnpm-workspace.yaml:5-6`.
