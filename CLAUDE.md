# bookparking

## Layout

Monorepo pnpm, cinq packages déclarés par `pnpm-workspace.yaml` (`packages: apps/*`) :
`apps/api` (NestJS), `apps/front` (le site), `apps/bo` (le back-office, sur
`admin.bookparking.fr`), `apps/mobile` (l'app iPhone, Expo SDK 57, testée dans Expo Go) et
`apps/e2e` (Playwright). Chaque app porte
son propre `tsconfig.json`, qui étend `tsconfig.base.json` à la racine (`skipLibCheck`,
`forceConsistentCasingInFileNames`) — la seule configuration TypeScript partagée entre apps.

**L'app mobile n'a pas de domaine à elle.** Elle importe l'hexagone du front tel quel (entités,
epics, reducers, sélecteurs, passerelles HTTP) par l'alias `@front/*`, et ne réécrit que ses
écrans et quatre adaptateurs natifs. Une règle métier ne s'écrit donc qu'une fois, dans
`apps/front/src/app` — voir `apps/mobile/CLAUDE.md`.

**Le back-office est une app à part, `apps/bo`, sur son propre sous-domaine.** Il a sa propre
connexion, ouverte au seul compte pour lequel `GET /admin/access` répond 204, et rien de
l'administration ne reste dans le profil du site ni dans l'app iPhone : c'est une décision
du propriétaire (28/09/2026), qui annule le repli d'une première `apps/bo` dans `/compte`. Il
emprunte au front ses composants et son hexagone de session par `@front/*` — voir
`apps/bo/CLAUDE.md`.

## Things that will bite you

- **`pnpm-workspace.yaml` autorise le build natif de `unrs-resolver`, jamais celui de `@parcel/watcher`.**
  pnpm bloque par défaut les scripts `postinstall`/`build` des dépendances tant qu'ils ne
  figurent pas dans `allowBuilds` ; `unrs-resolver` est le résolveur natif de `jest-resolve@30`
  et a besoin de son binaire de plateforme, quand `@parcel/watcher` ne sert qu'au mode watch de
  `jest-haste-map` (banni ici) et se contente de son repli JS pur.
  Ne pas retirer ces deux lignes lors d'un nettoyage de dépendances sans relire `pnpm-workspace.yaml:5-6`.

- **Railway : trois services Docker, jamais Railpack à la racine.** Railpack ne trouve aucune commande
  de démarrage dans le `package.json` racine, et installerait Expo et Playwright. Chaque service garde
  la racine du dépôt comme répertoire (pnpm a besoin du lockfile) et son Dockerfile :
  `apps/api/Dockerfile` (migrations en `preDeployCommand`), `apps/front/Dockerfile` et
  `apps/bo/Dockerfile` (Caddy sert le build et relaie `/api` vers `$API_INTERNAL_URL` sur le
  réseau privé — l'api n'a pas de CORS, et le back-office est une autre origine que le site).
  Railway refuse désormais de pointer un `railway.json` (Config as Code déprécié) : les
  `apps/*/railway.json` ne sont plus lus, leurs réglages sont recopiés à la main sur chaque
  service — les modifier ne change rien au déploiement. La sonde de l'api est `/listing` :
  Railway n'accepte pas de tiret dans un chemin de healthcheck.
  `.dockerignore` tient `.env` et `.env.stripe.local` hors des images : ne pas l'alléger.

