# apps/api

## Layout

`src/listing` sépare le domaine et les adaptateurs :

- `domain/entities` — les entités (`Listing`), constructibles seulement par `publish()` ou `fromState()`, jamais par un constructeur public.
- `domain/ports` — des interfaces seulement (`ListingRepository`, `PhotoStorage`). Aucune implémentation, pas même une doublure de test, n'y vit : le domaine ne dépend d'aucune classe concrète.
- `domain/usecases/<cas-d-usage>/` — un dossier par cas d'usage (`publish-listing/`), avec son sous-dossier `errors/` pour les erreurs propres à ce seul cas d'usage (`AvailabilityPeriodExpiredError`, `ActiveListingNotFoundError`). Chaque cas d'usage implémente le contrat partagé `UseCase<Props, T>` de `src/shared/use-case/UseCase.ts`.
- `domain/errors/` — les erreurs que l'entité elle-même peut lever, partagées par plusieurs cas d'usage (`IncompletePricingError`, levée à la fois par `Listing.publish()` et par `Listing.changePricing()`) ; une erreur qu'un seul cas d'usage renvoie reste sous son propre `domain/usecases/<cas-d-usage>/errors/`.
- `adapters/repositories/<agrégat>/` — les implémentations des ports, y compris les doublures en mémoire utilisées par les tests unitaires (`InMemoryListingRepository`), plus un `Schema<Nom>.ts` par table Knex (`SchemaListingRepository`) qui décrit les colonnes réelles.
- `adapters/rest/controllers/<agrégat>/` et `adapters/rest/dtos/` — les contrôleurs Nest et leurs schémas `effect/Schema` de validation de requête.
- `adapters/mappers/<agrégat>/` — les convertisseurs entité → DTO de réponse (`ListingMapper`), un fichier par agrégat : ils décident seuls ce qu'une réponse HTTP montre, et donc ce qu'elle omet délibérément (voir « Things that will bite you »).
- `adapters/services/<service>/` — les adaptateurs de port qui ne sont ni un dépôt ni un contrôleur (`InMemoryPhotoStorage`).
- `domain/builders/<Entité>Builder.ts` — un bâtisseur d'entité partagé entre plusieurs `.sut.ts` d'un même agrégat (`ListingBuilder` est utilisé à la fois par `PublishListing.sut.ts` et par `KnexListingRepository.sut.ts`) : il construit l'entité via `fromState()`, jamais par un constructeur public, pour donner à toute fixture d'annonce active un seul point de vérité entre les barreaux `unit` et `int-repo`.

`src/user-management` porte l'authentification, séparée de `listing` : `domain/ports/AccessTokenVerifier` est un port sans implémentation — vérifier un vrai jeton (session, JWT, fournisseur externe) est hors périmètre de SPEC-001 — et `adapters/rest/guards/AuthGuard` le consomme pour garder une route.

`src/rental` porte le second contexte métier, avec son propre `domain/ports/` (`PublishedListingReader`, `RentalRepository`) et leurs doublures en mémoire sous `adapters/repositories/` : le cas d'usage `domain/usecases/request-rental/` (`RequestRental.ts`, son `.sut.ts`, son sous-dossier `errors/`) ne dépend d'aucune classe de `listing/`, même pour lire la grille d'une annonce publiée — l'issue de US-006 interdisait cet import (`docs/autonomous/SPEC-001.md`, AUTO-16). Les entités `domain/entities/RentalPlace`, `RentalRequest` et `ConfirmedRental` sont construites par `fromState()` ou par `RentalRequest.request()`, jamais par un constructeur public. `domain/services/computeRentalPrice.ts` reste la seule fonction pure du contexte ; `RequestRental` l'appelle désormais au moment de la demande (voir « Things that will bite you »). Les deux ports ont désormais une implémentation Knex, sous le même schéma que `listing/` : `adapters/repositories/rental-request/` (`KnexRentalRequestRepository`, sa migration, son `Schema...`) et `adapters/repositories/published-listing/` (`KnexPublishedListingReader`, qui lit la table `listings` sans importer aucune classe de `listing/` — voir « Things that will bite you »).

`src/infra` porte ce qui parle à une vraie base : les migrations Knex (`infra/migrations`) et l'outillage du barreau `int` (`testKnexfile.ts`, `testcontainers-setup.ts`, qui démarre un conteneur `postgres:15` par exécution). `src/shared/test/http` porte les doublures communes aux tests `int-http` (`TestAuthGuard`, `UseCaseDouble`, `createControllerTestApp`).

Chaque cas d'usage ou contrôleur porte un fichier `<Nom>.sut.ts` à côté de son test (`PublishListing.sut.ts`, `listing.controller.sut.ts`) : il construit le double — en mémoire, ou le module de test Nest — et les fonctions `given/when/then`, et n'est importé que par ce test-là.

Le build de production exclut les specs, les fichiers `.sut.ts`, `src/infra/testcontainers-setup.ts`, `src/infra/testKnexfile.ts` et `src/shared/test/**` (`apps/api/tsconfig.build.json:7-15`) : rien de ce qui n'existe que pour un test n'est livré.

## Commands

Toujours via `--filter` — nécessaire dès qu'une deuxième app rejoint le workspace.

| Quoi | Commande |
| --- | --- |
| build | `pnpm --filter bookparking-api build` |
| unit (**33 specs** — `find apps/api/src -name '*.unit.spec.ts' -exec grep -o '  it(' {} + \| wc -l`, 2026-09-18) | `TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` |
| int-repo + int-http (**3 specs** — `find apps/api/src -name '*.int.spec.ts' \| wc -l`, 2026-09-18 ; Docker requis) | `pnpm --filter bookparking-api exec jest --config ./jest.int.config.js` |
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

- **Modifier `normalizePlacePart` (`Listing.ts`) ne recalcule aucune `place_key` déjà stockée.**
  `infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts:3-9` en garde une copie figée en JavaScript brut, parce que Postgres ne normalise ni la casse ni les espaces Unicode (`U+00A0`, NFKC) comme le fait `String.prototype.normalize('NFKC')` — un backfill écrit en SQL produirait des clés que le runtime ne produit jamais, et l'index unique partiel laisserait passer un doublon.
  Toute évolution de la règle de normalisation exige une nouvelle migration qui recalcule `place_key` sur les lignes existantes, jamais une simple modification de `Listing.ts`.

- **`ListingRepository.save()` ne crée jamais d'annonce, il ne fait que mettre à jour l'annonce active existante.**
  `KnexListingRepository.save` filtre sur `place_key` + `status = 'ACTIVE'` et lève `ActiveListingNotFoundError` si aucune ligne ne correspond (`KnexListingRepository.ts`) ; `InMemoryListingRepository.save` fait de même en mémoire (`InMemoryListingRepository.ts`) — aucun des deux n'insère.
  Publier une annonce passe toujours par `create()` ; `save()` sert uniquement à un cas d'usage qui modifie une annonce déjà active.

- **Un palier absent de la grille tarifaire est `null`, jamais `0` — `0` est un prix valide.**
  `Listing.offersAnyDuration` (`Listing.ts`) teste `!== null` sur chaque durée, pas sa valeur.
  Voir `ADR-002` pour l'alternative écartée (représenter l'absence par `0`) et son coût.

- **`computeRentalPrice` mesure un mois par `Date.UTC(année, mois + 1, jour)`, qui déborde silencieusement dans le mois suivant pour un départ le 29, 30 ou 31.**
  `sameDayNextMonth` (`computeRentalPrice.ts:25-28`) ne vérifie jamais que le mois cible porte ce quantième : pour une période commençant le 31/01/2026, le palier « mois » couvre jusqu'au 03/03/2026, pas jusqu'au dernier jour de février (vérifiable dans n'importe quelle console JS : `Date.UTC(2026, 1, 31)` retombe sur le 3 mars). Aucun `EX-nn` ne teste ce départ ; c'est la question restée ouverte dans `AUTO-15` (`docs/autonomous/SPEC-001.md`).
  Ne pas exposer un palier mensuel sur une annonce dont la période de disponibilité démarre après le 28 sans relire cette question.

- **`computeRentalPrice` compte les jours en millisecondes UTC sans connaître de fuseau : ne jamais lui donner les vrais instants `Europe/Paris`.**
  `dayCountingPeriodOfDays` (`CalendarDay.ts:88-93`) construit la paire neutre attendue par le calcul de prix ; `parisPeriodOfDays` (`CalendarDay.ts:76-79`) construit les vrais bornes utilisées par `overlaps()` — les deux renvoient le même type `RentalPeriod` et rien ne les distingue à l'appel.
  Utiliser `dayCountingPeriodOfDays` pour le prix, `parisPeriodOfDays` pour tout chevauchement — voir `RequestRental.ts` pour le bon appariement.

- **Dans `RequestRental`, l'ordre des gardes est chargé de sens : dates lisibles, puis durée ≤ `366` jours, puis prix, puis disponibilité.**
  `dayCountOfDays` (`CalendarDay.ts:56-61`) rend `NaN` sur une date invalide et `NaN > 366` vaut `false` : sans `isReadableDayRange` avant la borne de durée (`RentalRequest.ts:31-34`), puis la demande construite avant `findConfirmedByPlace` (`RequestRental.ts:57-80`), une date impossible franchirait la borne et lirait la place comme libre (`overlaps()` sur un `NaN` vaut toujours `false`).
  Ne jamais réordonner ces gardes.

- **`RentalPlace.placeKeyOf` duplique à la lettre `Listing.placeKeyOf` (même `normalizePlacePart`), sans import entre les deux contextes.**
  `RentalPlace.ts:6-7` et `Listing.ts:26-27` portent la même fonction de normalisation ; le contexte `rental` ne peut pas réutiliser celle de `listing/` (AUTO-16, `docs/autonomous/SPEC-001.md`).
  Faire évoluer l'une sans l'autre romprait silencieusement l'accord sur ce qu'est « la même place ».

- **La migration qui élargit `listings_status_check` ne se retourne pas une fois une annonce dépubliée.**
  `20260917150000_widen_listing_status_check.ts` remplace `CHECK (status IN ('ACTIVE'))` par
  `CHECK (status IN ('ACTIVE', 'UNPUBLISHED'))` ; son `down()` réinstalle l'ancienne contrainte avec
  `ADD CONSTRAINT`, qui valide chaque ligne existante et échoue dès la première ligne `UNPUBLISHED`.
  Ne jamais lancer un rollback sur cette migration une fois qu'une annonce a été dépubliée sans d'abord
  décider ce que ces lignes deviennent.

- **Dépublier une annonce déjà dépubliée réussit silencieusement — ce n'est pas un bug.**
  `UnpublishListing.execute` (`UnpublishListing.ts:19-20`) renvoie `Either.right(undefined)` dès que
  `findActiveByPlaceKey` ne trouve aucune annonce active, sans lever d'erreur ni écrire en base :
  RG-07/EX-33 exige justement qu'une seconde demande de dépublication ne produise ni erreur ni changement.
  Ne pas transformer cette branche en erreur (par ex. `ListingAlreadyUnpublishedError`) : cela romprait EX-33.

- **Deux demandes concurrentes sur la même place et les mêmes dates sont départagées par une contrainte
  d'exclusion Postgres, jamais par du code applicatif.**
  `rental_requests_place_period_excl` (`infra/migrations/20260918120000_create_rental_requests.ts:46-53`)
  est un `EXCLUDE USING gist (place_key WITH =, tstzrange(period_from, period_to, '[]') WITH &&)`, qui a
  besoin de l'extension `btree_gist` créée par la même migration ; `isPlacePeriodExclusionViolation`
  (`KnexRentalRequestRepository.ts:19-27`) ne traduit en `DatesAlreadyRentedError` que le code Postgres
  `23P01` sur ce nom de contrainte précis, toute autre erreur d'insertion remonte telle quelle.
  Ne pas remplacer cette contrainte par une lecture préalable dans le cas d'usage — voir `ADR-004` pour
  l'alternative écartée et son coût. Son `down()` (même fichier, ligne 66) fait
  `DROP EXTENSION IF EXISTS btree_gist` sans condition : avant de rollback cette migration, vérifier
  qu'aucune migration plus récente n'a ajouté un second index `gist`/`EXCLUDE` qui en dépend.

- **`KnexPublishedListingReader` lit la table `listings` en dupliquant son nom et le littéral `'ACTIVE'`,
  jamais en important une classe de `listing/`.**
  `SchemaPublishedListingReader.ts:1-7` recopie `LISTINGS_TABLE` et `ACTIVE_LISTING_STATUS` à la main —
  même discipline que `RentalPlace.placeKeyOf` pour `Listing.placeKeyOf` (AUTO-16) : le contexte `rental`
  n'importe aucune classe de `listing/`. Un renommage du statut `ACTIVE` dans `listing/` ne casse rien à
  la compilation ici et ne se voit qu'à l'exécution.
  Faire évoluer le vocabulaire de statut de `listing/` exige d'éditer cette copie à la main.

- **`createRequest` verrouille la ligne de l'annonce (`FOR UPDATE`) avant d'écrire, mais `UnpublishListing`
  ne verrouille rien : la garantie « aucune demande après dépublication » ne marche que dans un sens.**
  `insertOnActiveListing` (`KnexRentalRequestRepository.ts:83-86`) lit l'annonce `FOR UPDATE` dans la
  transaction qui écrit la demande, ce qui la fait attendre une dépublication concurrente et voir le
  retrait une fois celle-ci validée (AUTO-23, corrigé par AUTO-25 dans `docs/autonomous/SPEC-001.md`) —
  mais si la demande valide sa transaction la première, une ligne `PENDING` peut survivre sur une annonce
  dépubliée juste après : EX-32 ne prouve que le sens où la dépublication gagne.
  Ne pas lire AUTO-23 seule comme « aucune demande ne coexiste jamais avec une annonce dépubliée » — le
  sort d'une demande déjà insérée au moment de la dépublication reste ouvert, renvoyé à SPEC-002 (AUTO-25).

- **Une demande `PENDING` jamais confirmée gèle la place sur toute sa période, jusqu'à 366 jours — rien
  ne l'expire encore.**
  La contrainte d'exclusion ci-dessus ne distingue pas `status` : une ligne `PENDING` bloque une nouvelle
  demande sur la même place exactement comme une ligne `CONFIRMED` (AUTO-26, `docs/autonomous/SPEC-001.md`).
  L'expiration d'une demande est hors périmètre de SPEC-001 (`docs/specs/SPEC-001-publier-une-place.md`,
  §10) : ne pas inventer de délai ici, la question attend SPEC-002.

- **`rental_requests` ne recopie ni `address` ni `box` — `findConfirmedByPlace` reconstruit la place à
  partir de l'argument reçu, jamais d'une colonne stockée.**
  `KnexRentalRequestRepository.ts:116-129` compose la `ConfirmedRental` renvoyée avec `place.address` et
  `place.box`, la ligne ne portant que `listing_id` et `place_key` (minimisation décidée en AUTO-24 après
  la revue de conformité). Cette fidélité ne tient que parce que la requête filtre sur
  `placeKeyOf(place)` : appeler cette méthode avec une place différente de celle qui a produit les lignes
  renverrait un mensonge silencieux, pas une erreur.
  Ne pas ajouter `address`/`box` à la table sans rouvrir AUTO-24 et la dette de rétention (issue #18).

- **`KnexRentalRequestRepository.sut.ts` est le seul fichier de `rental/` autorisé à importer `listing/`
  — une exception de test, pas une porte ouverte.**
  Le SUT importe `KnexListingRepository`, `ListingBuilder` et `UnpublishListing` pour piloter la vraie
  dépublication qu'EX-32 met en scène (AUTO-27, `docs/autonomous/SPEC-001.md`) ; il est exclu du build de
  production (`tsconfig.build.json:7-15`). `apps/api/src/rental/domain/**` et les adaptateurs livrés,
  eux, n'importent toujours rien de `listing/`.
  Ne pas copier cet import dans un fichier qui n'est pas un `.sut.ts` de ce test précis.

- **`Listing.publish()` engendre lui-même l'identifiant, et le défaut de la colonne `id` en base ne joue plus jamais.**
  `Listing.ts:64` appelle `randomUUID()` avant de construire l'entité, et `KnexListingRepository.toRow`
  (`KnexListingRepository.ts:86`) écrit toujours cette valeur : `table.uuid('id').primary().defaultTo(knex.fn.uuid())`
  (`infra/migrations/20260917120000_create_listings.ts:5`) ne s'exécute donc plus (AUTO-28, `docs/autonomous/SPEC-001.md`).
  Ne pas retirer `id: state.id` de `toRow` en comptant sur ce défaut — rien ne relit jamais l'identifiant que Postgres aurait engendré.

- **`GET /listing/:id` ne porte aucun `AuthGuard`, à la différence de `POST /listing` — ce n'est pas un oubli.**
  RG-05 exige que l'adresse exacte et le box restent visibles pour une conductrice connectée sans réservation (EX-08)
  et pour un visiteur non connecté (EX-26) ; `listing.controller.ts:103-106` ne déclare donc pas de garde sur cette route.
  Ne pas ajouter `@UseGuards(AuthGuard)` ici sans rouvrir RG-05 — cela romprait EX-08 et EX-26.

- **`ListingMapper.toGetListingDto` et `GetListingResponseDto` omettent volontairement `accessDescription`.**
  Cette description partait dans la réponse publique jusqu'à la revue de sécurité de US-009 ; §8 de la spec
  n'autorise publiquement que l'adresse exacte et le box, et §10 fait de ce texte le substitut du code de portail
  (AUTO-29, `docs/autonomous/SPEC-001.md`). EX-44 fige cette non-exposition.
  Ne pas ajouter ce champ à `GetListingResponseDto` sans rouvrir AUTO-29 — qui doit le voir, et quand, reste une question ouverte.

- **Le paramètre de chemin `:id` de `GET /listing/:id` est décodé comme un UUID avant d'atteindre le dépôt — un identifiant mal formé répond comme une annonce inconnue, jamais 500.**
  `listing.controller.ts:108` appelle `Schema.decodeUnknownEither(Schema.UUID)(id)` et lève, sur un échec de décodage,
  la même `ListingNotFoundError` qu'une annonce absente (AUTO-29, `docs/autonomous/SPEC-001.md`) ; EX-45 fige cette égalité de réponse.
  Toute nouvelle route qui prend un identifiant de domaine en paramètre de chemin doit le décoder de la même façon avant de l'utiliser.

## Frozen versions — do not bump without reading the reason

| App | Paquet | Pin | Pourquoi — ce qui casse |
| --- | --- | --- | --- |
| api | `typescript` | `~5.9.3` | `ts-jest` n'accepte que `typescript >=4.3 <7` et `typescript-eslint` que `>=4.8.4 <6.1.0` — c'est ce second plafond, plus étroit, qui commande. Vérifié dans le `peerDependencies` des paquets installés, 2026-09-16 : `grep -A8 '"peerDependencies"' node_modules/.pnpm/ts-jest@*/node_modules/ts-jest/package.json` → `>=4.3 <7` ; même commande sur `typescript-eslint` → `>=4.8.4 <6.1.0`. |
