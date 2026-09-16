# apps/api

## Layout

`src/listing` sépare le domaine et les adaptateurs :

- `domain/entities` — les entités (`Listing`), constructibles seulement par `publish()` ou `fromState()`, jamais par un constructeur public.
- `domain/ports` — des interfaces seulement (`ListingRepository`). Aucune implémentation, pas même une doublure de test, n'y vit : le domaine ne dépend d'aucune classe concrète.
- `domain/usecases/<cas-d-usage>/` — un dossier par cas d'usage (`publish-listing/`). Chaque cas d'usage implémente le contrat partagé `UseCase<Props, T>` de `src/shared/use-case/UseCase.ts`.
- `adapters/repositories/<agrégat>/` — les implémentations des ports, y compris les doublures en mémoire utilisées par les tests unitaires (`InMemoryListingRepository`).

Chaque cas d'usage porte un fichier `<Nom>.sut.ts` à côté de son test (`PublishListing.sut.ts` pour `PublishListing.unit.spec.ts`) : il construit le double en mémoire et les fonctions `given/when/then`, et n'est importé que par ce test-là.

Le build de production exclut les specs et les fichiers `.sut.ts` (`apps/api/tsconfig.build.json:7`) : un `.sut.ts` n'est jamais du code livré.

## Commands

Toujours via `--filter` — nécessaire dès qu'une deuxième app rejoint le workspace.

| Quoi | Commande |
| --- | --- |
| build | `pnpm --filter bookparking-api build` |
| unit (5 specs) | `TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` |
| lint, vérification seule, fichiers touchés | `pnpm --filter bookparking-api exec eslint <fichiers>` |

Preuve, 2026-09-16 : `pnpm --filter bookparking-api build` exit 0 ;
`TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` → `Tests: 5 passed, 5 total`.

## Things that will bite you

- **Le script `lint` réécrit les fichiers ; `lint:check` se contente de vérifier.**
  `lint` porte `--fix` (`apps/api/package.json:10`), `lint:check` ne l'a pas (`apps/api/package.json:11`).
  Lancer `lint` sur un dossier entier modifie des fichiers que cette pull request n'a pas relus.
  Utiliser `lint:check`, ou `eslint` directement sur les fichiers de la story.

## Frozen versions — do not bump without reading the reason

| App | Paquet | Pin | Pourquoi — ce qui casse |
| --- | --- | --- | --- |
| api | `typescript` | `~5.9.3` | `ts-jest` n'accepte que `typescript >=4.3 <7` et `typescript-eslint` que `>=4.8.4 <6.1.0` — c'est ce second plafond, plus étroit, qui commande. Vérifié dans le `peerDependencies` des paquets installés, 2026-09-16 : `grep -A8 '"peerDependencies"' node_modules/.pnpm/ts-jest@*/node_modules/ts-jest/package.json` → `>=4.3 <7` ; même commande sur `typescript-eslint` → `>=4.8.4 <6.1.0`. |
