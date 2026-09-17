# apps/api

## Layout

`src/listing` sépare le domaine et les adaptateurs :

- `domain/entities` — les entités (`Listing`), constructibles seulement par `publish()` ou `fromState()`, jamais par un constructeur public.
- `domain/ports` — des interfaces seulement (`ListingRepository`, `PhotoStorage`). Aucune implémentation, pas même une doublure de test, n'y vit : le domaine ne dépend d'aucune classe concrète.
- `domain/usecases/<cas-d-usage>/` — un dossier par cas d'usage (`publish-listing/`), avec son sous-dossier `errors/` pour les erreurs métier qu'il renvoie (`AvailabilityPeriodExpiredError`, `PhotoStorageFailedError`). Chaque cas d'usage implémente le contrat partagé `UseCase<Props, T>` de `src/shared/use-case/UseCase.ts`.
- `adapters/repositories/<agrégat>/` — les implémentations des ports, y compris les doublures en mémoire utilisées par les tests unitaires (`InMemoryListingRepository`), plus un `Schema<Nom>.ts` par table Knex (`SchemaListingRepository`) qui décrit les colonnes réelles.
- `adapters/rest/controllers/<agrégat>/` et `adapters/rest/dtos/` — les contrôleurs Nest et leurs schémas `effect/Schema` de validation de requête.
- `adapters/services/<service>/` — les adaptateurs de port qui ne sont ni un dépôt ni un contrôleur (`InMemoryPhotoStorage`).

`src/user-management` porte l'authentification, séparée de `listing` : `domain/ports/AccessTokenVerifier` est un port sans implémentation — vérifier un vrai jeton (session, JWT, fournisseur externe) est hors périmètre de SPEC-001 — et `adapters/rest/guards/AuthGuard` le consomme pour garder une route.

`src/infra` porte ce qui parle à une vraie base : les migrations Knex (`infra/migrations`) et l'outillage du barreau `int` (`testKnexfile.ts`, `testcontainers-setup.ts`, qui démarre un conteneur `postgres:15` par exécution). `src/shared/test/http` porte les doublures communes aux tests `int-http` (`TestAuthGuard`, `UseCaseDouble`, `createControllerTestApp`).

Chaque cas d'usage ou contrôleur porte un fichier `<Nom>.sut.ts` à côté de son test (`PublishListing.sut.ts`, `listing.controller.sut.ts`) : il construit le double — en mémoire, ou le module de test Nest — et les fonctions `given/when/then`, et n'est importé que par ce test-là.

Le build de production exclut les specs, les fichiers `.sut.ts`, `src/infra/testcontainers-setup.ts`, `src/infra/testKnexfile.ts` et `src/shared/test/**` (`apps/api/tsconfig.build.json:7-15`) : rien de ce qui n'existe que pour un test n'est livré.

## Commands

Toujours via `--filter` — nécessaire dès qu'une deuxième app rejoint le workspace.

| Quoi | Commande |
| --- | --- |
| build | `pnpm --filter bookparking-api build` |
| unit (**7 specs** — `grep -c '  it(' apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts`, 2026-09-17) | `TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` |
| int-repo + int-http (**2 specs** — `find apps/api/src -name '*.int.spec.ts' \| wc -l`, 2026-09-17 ; Docker requis) | `pnpm --filter bookparking-api exec jest --config ./jest.int.config.js` |
| lint, vérification seule, fichiers touchés | `pnpm --filter bookparking-api exec eslint <fichiers>` |

## Things that will bite you

- **Le script `lint` réécrit les fichiers ; `lint:check` se contente de vérifier.**
  `lint` porte `--fix` (`apps/api/package.json:10`), `lint:check` ne l'a pas (`apps/api/package.json:11`).
  Lancer `lint` sur un dossier entier modifie des fichiers que cette pull request n'a pas relus.
  Utiliser `lint:check`, ou `eslint` directement sur les fichiers de la story.

- **`POST /listing` n'est monté dans aucune application.**
  Aucun `AppModule` ni `main.ts` n'existe encore dans `apps/api/src` (`find apps/api/src -iname '*.module.ts' -o -iname main.ts` → aucun résultat, 2026-09-17), et `AuthGuard` dépend du port `AccessTokenVerifier`, qui n'a aucune implémentation.
  Ne pas relier le contrôleur à un module tant qu'un vrai vérificateur de jeton n'existe pas — la route serait accessible sans authentification réelle.

- **Le barreau `int` démarre un vrai conteneur Postgres — sans Docker, il n'échoue pas tout de suite, il attend.**
  `testcontainers-setup.ts` appelle `PostgreSqlContainer('postgres:15').start()`, et le `beforeAll` qui l'attend porte un délai explicite de 120 s (`KnexListingRepository.int.spec.ts:9-11`) : sans démon Docker actif, la suite bloque jusqu'à deux minutes avant d'échouer.
  Vérifier `docker info` avant `pnpm --filter bookparking-api exec jest --config ./jest.int.config.js`.

- **`createControllerTestApp` remplace toujours `AuthGuard` par `TestAuthGuard` — le vrai garde n'est prouvé par aucun test.**
  `createControllerTestApp.ts:12` fait `overrideGuard(AuthGuard).useValue(new TestAuthGuard(...))` pour chaque test `int-http` ; une régression dans `auth.guard.ts` ne ferait échouer ni `@EX-001-36` ni `@EX-001-37`.
  Un test contre le vrai `AuthGuard` reste à écrire quand un `AccessTokenVerifier` réel existera.

## Frozen versions — do not bump without reading the reason

| App | Paquet | Pin | Pourquoi — ce qui casse |
| --- | --- | --- | --- |
| api | `typescript` | `~5.9.3` | `ts-jest` n'accepte que `typescript >=4.3 <7` et `typescript-eslint` que `>=4.8.4 <6.1.0` — c'est ce second plafond, plus étroit, qui commande. Vérifié dans le `peerDependencies` des paquets installés, 2026-09-16 : `grep -A8 '"peerDependencies"' node_modules/.pnpm/ts-jest@*/node_modules/ts-jest/package.json` → `>=4.3 <7` ; même commande sur `typescript-eslint` → `>=4.8.4 <6.1.0`. |
