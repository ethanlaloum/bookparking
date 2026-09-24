# bookparking

## Layout

Monorepo pnpm, quatre packages déclarés par `pnpm-workspace.yaml` (`packages: apps/*`) :
`apps/api` (NestJS), `apps/front` (le site, administration comprise), `apps/mobile`
(l'app iPhone, Expo SDK 57, testée dans Expo Go) et `apps/e2e` (Playwright). Chaque app porte
son propre `tsconfig.json`, qui étend `tsconfig.base.json` à la racine (`skipLibCheck`,
`forceConsistentCasingInFileNames`) — la seule configuration TypeScript partagée entre apps.

**L'app mobile n'a pas de domaine à elle.** Elle importe l'hexagone du front tel quel (entités,
epics, reducers, sélecteurs, passerelles HTTP) par l'alias `@front/*`, et ne réécrit que ses
écrans et trois adaptateurs natifs. Une règle métier ne s'écrit donc qu'une fois, dans
`apps/front/src/app` — voir `apps/mobile/CLAUDE.md`.

**Il n'y a pas d'application d'administration séparée.** Une `apps/bo` a existé le temps
d'une session : elle a été repliée dans `apps/front`, où les écrans de modération sont
quatre onglets de `/compte`, ouverts au seul compte pour lequel `GET /admin/access` répond
204. Ne pas la recréer sans relire pourquoi elle a disparu — voir `apps/front/CLAUDE.md`.

## Things that will bite you

- **`pnpm-workspace.yaml` autorise le build natif de `unrs-resolver`, jamais celui de `@parcel/watcher`.**
  pnpm bloque par défaut les scripts `postinstall`/`build` des dépendances tant qu'ils ne
  figurent pas dans `allowBuilds` ; `unrs-resolver` est le résolveur natif de `jest-resolve@30`
  et a besoin de son binaire de plateforme, quand `@parcel/watcher` ne sert qu'au mode watch de
  `jest-haste-map` (banni ici) et se contente de son repli JS pur.
  Ne pas retirer ces deux lignes lors d'un nettoyage de dépendances sans relire `pnpm-workspace.yaml:5-6`.
