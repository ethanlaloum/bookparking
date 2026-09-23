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

`src/user-management` porte l'authentification, séparée de `listing` : `domain/ports/AccessTokenVerifier` est un port sans implémentation — vérifier un vrai jeton (session, JWT, fournisseur externe) est hors périmètre de SPEC-001 — et `adapters/rest/guards/AuthGuard` le consomme pour garder une route. `domain/entities/Account` est la première entité du contexte, construite uniquement par `register()` (nouveau compte) ou par `fromState()`, jamais par un constructeur public — même discipline que `Listing`. `domain/ports/AccountRepository` et `domain/ports/PasswordHasher` sont ses deux premiers ports propres ; `adapters/repositories/account/` porte leur première implémentation (`InMemoryAccountRepository`, `KnexAccountRepository`, son `SchemaAccountRepository`), et `adapters/services/password-hasher/ScryptPasswordHasher` implémente `PasswordHasher` — un adaptateur de service, sous `adapters/`, jamais sous `domain/ports/`. `domain/usecases/register-account/` porte le premier cas d'usage du contexte, `RegisterAccount`. `adapters/rest/controllers/account/` porte `AccountController`, premier contrôleur du contexte, et sa route `POST /account` ; `adapters/mappers/AccountMapper` la convertit vers `RegisterAccountResponseDto`, qui n'expose que l'identifiant et l'adresse.

`src/rental` porte le second contexte métier, avec son propre `domain/ports/` (`PublishedListingReader`, `RentalRepository`) et leurs doublures en mémoire sous `adapters/repositories/` : le cas d'usage `domain/usecases/request-rental/` (`RequestRental.ts`, son `.sut.ts`, son sous-dossier `errors/`) ne dépend d'aucune classe de `listing/`, même pour lire la grille d'une annonce publiée — l'issue de US-006 interdisait cet import (`docs/autonomous/SPEC-001.md`, AUTO-16). Les entités `domain/entities/RentalPlace`, `RentalRequest` et `ConfirmedRental` sont construites par `fromState()` ou par `RentalRequest.request()`, jamais par un constructeur public. `domain/services/computeRentalPrice.ts` reste la seule fonction pure du contexte ; `RequestRental` l'appelle désormais au moment de la demande (voir « Things that will bite you »). Les deux ports ont désormais une implémentation Knex, sous le même schéma que `listing/` : `adapters/repositories/rental-request/` (`KnexRentalRequestRepository`, sa migration, son `Schema...`) et `adapters/repositories/published-listing/` (`KnexPublishedListingReader`, qui lit la table `listings` sans importer aucune classe de `listing/` — voir « Things that will bite you »).

`src/infra` porte ce qui parle à une vraie base : les migrations Knex (`infra/migrations`) et l'outillage du barreau `int` (`testKnexfile.ts`, `testcontainers-setup.ts`, qui démarre un conteneur `postgres:15` par exécution). `src/shared/test/http` porte les doublures communes aux tests `int-http` (`TestAuthGuard`, `UseCaseDouble`, `createControllerTestApp`).

Chaque cas d'usage ou contrôleur porte un fichier `<Nom>.sut.ts` à côté de son test (`PublishListing.sut.ts`, `listing.controller.sut.ts`) : il construit le double — en mémoire, ou le module de test Nest — et les fonctions `given/when/then`, et n'est importé que par ce test-là.

Le build de production exclut les specs, les fichiers `.sut.ts`, `src/infra/testcontainers-setup.ts`, `src/infra/testKnexfile.ts` et `src/shared/test/**` (`apps/api/tsconfig.build.json:7-15`) : rien de ce qui n'existe que pour un test n'est livré.

## Commands

Toujours via `--filter` — nécessaire dès qu'une deuxième app rejoint le workspace.

| Quoi | Commande |
| --- | --- |
| build | `pnpm --filter bookparking-api build` |
| unit (**78 specs** — `find apps/api/src -name '*.unit.spec.ts' -exec grep -o '  it(' {} + \| wc -l`, 2026-09-22) | `TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` |
| int-repo + int-http (**7 specs** — `find apps/api/src -name '*.int.spec.ts' \| wc -l`, 2026-09-22 ; Docker requis) | `pnpm --filter bookparking-api exec jest --config ./jest.int.config.js` |
| lint, vérification seule, fichiers touchés | `pnpm --filter bookparking-api exec eslint <fichiers>` |

## Things that will bite you

- **Le script `lint` réécrit les fichiers ; `lint:check` se contente de vérifier.**
  `lint` porte `--fix` (`apps/api/package.json:10`), `lint:check` ne l'a pas (`apps/api/package.json:11`).
  Lancer `lint` sur un dossier entier modifie des fichiers que cette pull request n'a pas relus.
  Utiliser `lint:check`, ou `eslint` directement sur les fichiers de la story.

- ~~**`POST /listing` n'est monté dans aucune application.**~~ — **périmé depuis #50.**
  `app.module.ts` et `main.ts` existent, `SlidingAccessTokenVerifier` implémente `AccessTokenVerifier`, et les quatre contrôleurs sont montés. Piège conservé barré parce qu'il a commandé la forme du code pendant deux specs.

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

- **La contrainte d'exclusion de `rental_requests` est désormais *partielle* : c'est elle, et non le statut, qui dégèle une place.**
  `rental_requests_place_period_excl` porte `WHERE (status <> 'EXPIRED')` depuis
  `20260922130000_expire_stale_rental_requests.ts`. Avant cette migration, marquer une demande `EXPIRED`
  ne libérait rien du tout : la contrainte ignorait le statut et une ligne périmée continuait de bloquer
  toute demande chevauchante (AUTO-26). Une `CONFIRMED`, elle, bloque toujours — c'est une réservation.
  Ne jamais reconstruire cette contrainte sans sa clause `WHERE` : l'expiration redeviendrait décorative.
  Son `down()` réinstalle la contrainte totale *et* le `CHECK` à deux statuts : les deux échouent si une
  seule ligne `EXPIRED` subsiste. Décider du sort de ces lignes avant tout rollback — le `down()` ne le
  fait pas à votre place.

- ~~**L'expiration est paresseuse : `RequestRental` est son seul déclencheur, il n'existe aucun ordonnanceur.**~~
  — **périmé depuis SPEC-004.** `RentalSweepScheduler` fait passer `SweepRentalRequests` toutes les cinq
  minutes ; `RequestRental` garde l'expiration à la demande comme filet, pour libérer des dates échues à
  l'instant précis où quelqu'un les veut. Voir « L'encaissement » plus bas.

- **Le délai d'expiration est un réglage, pas une constante du domaine — et la question qui le fixe est ouverte.**
  `environment.rentalRequestExpiryInHours()` lit `RENTAL_REQUEST_EXPIRY_IN_HOURS`, 48 h par défaut, et le
  délai descend jusqu'à `RequestRental` par son constructeur. C'est Q-18 du brainstorm du 10/09
  (`docs/brainstorm/BR-20260910-reserver-et-louer-une-place/BRAINSTORM.md`), marquée « tranché par JP » et
  « bloque la règle d'expiration » : le brainstorm la range parmi les réglages du back-office, à côté de la
  marge et du délai d'annulation.
  Ne pas figer cette valeur dans le domaine — elle attend le back-office.

- **`RentalRequest.request()` engendre son identifiant : le défaut de la colonne `id` ne joue jamais.**
  `RentalRequest.ts` appelle `randomUUID()` et `insertOnActiveListing` écrit toujours `id: state.id` —
  même situation que `Listing.publish()` (AUTO-28). Sans cet identifiant, rien ne pouvait nommer une
  demande pour la confirmer.
  Ne pas retirer `id: state.id` de l'insertion en comptant sur `defaultTo(knex.fn.uuid())` : plus rien ne
  relirait jamais l'identifiant que le domaine a rendu à l'appelant.

- **Confirmer une demande qu'on ne possède pas répond `404`, exactement comme une demande inexistante.**
  `ConfirmRentalRequest.execute` renvoie la même `RentalRequestNotFoundError` quand le résumé est `null`
  et quand `summary.ownerId !== props.ownerId` ; le contrôleur en fait un `404` dont le corps ne contient
  pas l'identifiant. Un `403` distinct confirmerait à n'importe qui qu'une demande porte cet identifiant.
  Une demande *expirée*, elle, répond `409` en le disant : le loueur la possède, rien ne se divulgue.
  Ne pas séparer les deux premiers cas en deux réponses distinctes.

- **`confirmRequest` filtre sur `status = 'PENDING'` dans son `UPDATE` — c'est là qu'est l'idempotence, pas dans le cas d'usage.**
  `ConfirmRentalRequest` sort tôt sur un résumé déjà confirmé, mais cette lecture est périmée au moment où
  l'écriture part : deux confirmations concurrentes passeraient toutes deux la garde applicative.
  Seul le filtre du `UPDATE` fait qu'une seule écrit, et que `confirmed_at` n'est jamais réécrit.
  Ne pas retirer ce `where` en le croyant redondant.

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

- ~~**Une demande `PENDING` jamais confirmée gèle la place sur toute sa période, jusqu'à 366 jours — rien
  ne l'expire encore.**~~ — **périmé** : l'expiration existe depuis SPEC-002 et le balayage depuis SPEC-004.
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

- **`Schema.optional(x)` fait fuiter la valeur soumise dans la `400`, même quand `x` est annoté partout : utiliser `Schema.optionalWith(x, { exact: true })`.**
  `Schema.optional` compose une union avec `undefined`. Quand le champ est présent mais mal typé, la
  branche `undefined` échoue elle aussi et porte le message par défaut d'`effect`,
  `Expected undefined, actual "<valeur>"` — que `parseSchemaError` concatène tel quel. Annoter l'union
  n'y change rien : `ArrayFormatter` descend dans chaque membre et rend leurs messages. Constaté pendant
  cette story sur `UpdateListingPricingSchema` : un prix envoyé en chaîne repartait en clair dans la
  réponse, contre la contrainte « Secret » du §8 de SPEC-002 — la même régression que `3af4eda` et
  `04fb79b`, par un chemin que les deux annotations de `RegisterAccountSchema` ne couvrent pas.
  `exact: true` rend le champ facultatif **sans** composer d'union : un palier absent est absent, un
  palier présent est jugé par le seul schéma annoté.
  Pour tout champ facultatif d'un schéma de décodage : `optionalWith(..., { exact: true })`, jamais
  `optional(...)` — et un test `int-http` qui envoie le champ mal typé et vérifie que la réponse ne
  contient pas la valeur.

- **`DELETE /listing/:id` et `PATCH /listing/:id/pricing` sont clés sur l'identifiant, mais leurs cas d'usage sont clés sur la place — `GetListing` fait la jonction dans le contrôleur.**
  `UnpublishListing` et `UpdateListingPricing` prennent `address` + `box` et calculent `placeKeyOf` ;
  les deux routes prennent l'identifiant que `GET /listing` rend aux clients. Le contrôleur appelle donc
  `GetListing` d'abord, puis le cas d'usage : une lecture de plus par requête, assumée pour ne pas
  réécrire deux cas d'usage déjà prouvés au barreau `unit`.
  C'est le seul endroit du dépôt où un contrôleur enchaîne deux cas d'usage. Si un troisième chemin en a
  besoin, préférer alors donner l'identifiant aux cas d'usage plutôt que répandre ce montage.

- **`DELETE /listing/:id` répond `204` pour un identifiant inconnu, mal formé, ou déjà dépublié — ce n'est pas un trou.**
  Le domaine fait réussir silencieusement une seconde dépublication (RG-07/EX-33, `UnpublishListing.ts:19-20`) ;
  la route tient la même promesse, et un `404` sur l'un de ces cas en ferait un oracle d'existence sur une
  route pourtant gardée. Le seul refus est `403`, quand l'annonce existe et appartient à quelqu'un d'autre.
  Un `403` — et non un `404` — parce qu'une annonce est publiquement lisible (RG-05) : masquer le refus de
  propriété ne protégerait rien que `GET /listing/:id` ne donne déjà. Ce raisonnement ne vaut pas pour
  `POST /rental-request/:id/confirmation`, où l'existence d'une demande, elle, est privée.
  Ne pas « réparer » ces `204` en `404`.

- **`accounts.email` ne porte aucune garantie de normalisation côté base — seul `Account.register()` la fait.**
  La migration `20260920120000_create_accounts.ts:6-11` indexe la colonne `email` telle quelle (commentaire :
  « stored as given and never normalized here ») ; `normalizeEmail` (`Account.ts:3-4`) — NFKC, espaces
  réduits, `trim`, minuscule — ne s'exécute que dans `Account.register()` et `Account.isIdentifiedBy()`,
  sans copie figée en SQL comme `place_key` pour `listings` (voir `ADR-007`).
  Toute écriture qui contourne `Account.register()` peut insérer une adresse non normalisée
  qu'`accounts_email_unique` ne rapprochera jamais d'un compte existant équivalent.

- **Un `Schema.Struct` `effect` sans annotation `message` — sur le type de base *et* sur chaque raffinement `.pipe(...)` — fait fuiter la valeur soumise dans la réponse `400`.**
  `parseSchemaError` (`shared/error/parseSchemaError.ts`) retombe sur le message par défaut d'`effect`, qui
  compose le texte avec la valeur reçue — un mot de passe envoyé en nombre JSON, ou un corps racine qui
  n'est pas un objet, repartaient en clair dans le `400` avant `3af4eda` et `04fb79b`. Un `.pipe(Schema.pattern(...))`
  ou `.pipe(Schema.minLength(...))` **n'hérite pas** de l'annotation posée sur le type de base qu'il raffine :
  annoter seulement le raffinement laisse un mismatch de type (un mot de passe soumis en nombre JSON, où le
  raffinement `minLength` ne s'applique même pas) retomber sur le message par défaut d'`effect`. Cette régression
  est réapparue puis a été corrigée à l'intérieur de cette story, sur `email` et `password`
  (`RegisterAccountSchema.ts:6-19`), qui est aujourd'hui le seul schéma du dépôt annoté à la fois sur le type de
  base et sur chaque raffinement ; `PublishListingSchema.ts` n'a aucune annotation.
  Annoter `.annotations({ message: () => '...' })` sur le type de base **et**, séparément, sur chaque
  `.pipe(Schema....)` de raffinement de tout nouveau schéma de décodage — jamais l'un sans l'autre.
  Ne pas fusionner les deux dans `{ message: () => ({ message: '…', override: true }) }` posé sur le seul
  raffinement — cette forme existe dans `effect` (`SchemaAST.MessageAnnotation`,
  `node_modules/effect/dist/dts/SchemaAST.d.ts:54-57`, `effect@3.22.2`) mais couvre le même message pour deux
  échecs distincts : d'après la sonde exécutée puis supprimée pendant cette story, un mot de passe envoyé en
  nombre y répondait « Le mot de passe doit contenir au moins 8 caractères », ce qui est faux — le champ n'est
  même pas une chaîne. Essayé puis écarté pendant cette story.

- **`KnexAccountRepository` ne traduit en `EmailAlreadyUsedError` que la violation de l'index unique
  `accounts_email_unique` (code Postgres `23505`) — toute autre erreur d'insertion remonte telle quelle.**
  `isEmailUniqueViolation` (`KnexAccountRepository.ts:9-13`) teste `error.code === '23505'` *et*
  `error.constraint === 'accounts_email_unique'` — même discipline que la contrainte d'exclusion de
  `rental_requests`, voir `ADR-004`.
  Renommer cet index dans une future migration sans mettre à jour cette chaîne romprait EX-03 en silence :
  l'erreur deviendrait brute, plus `EmailAlreadyUsedError`.

- **`ScryptPasswordHasher` normalise le mot de passe en NFC avant de le hacher, à la fois dans `hash()` et
  dans `verify()` — les deux doivent rester appariés.**
  `deriveKey` (`ScryptPasswordHasher.ts:9-10`) appelle `plainTextPassword.normalize('NFC')` avant
  `scryptSync` ; EX-10 prouve qu'un mot de passe de 200 caractères avec `é`, `ü` et `🚗` est accepté et se
  revérifie correctement grâce à cette normalisation partagée.
  Ne jamais appeler `scryptSync` sur `plainTextPassword` sans le même `.normalize('NFC')` ailleurs dans le
  contexte — un mot de passe composé différemment (NFD) ne se revérifierait plus.

- **`registered_at` est écrit par `Account.register()`/`toState()` et par la migration des comptes, mais
  rien ne le lit encore — ce n'est pas du code mort.**
  `Account` (`Account.ts`) ne porte même pas de *getter* public pour ce champ ; EX-01 nomme l'instant
  d'inscription (`01/10/2026 à 09:00`), et la revue de conformité de US-011 accepte cette colonne non lue
  comme un écart mineur, en anticipation d'une future période de rétention.
  Ne pas retirer `registered_at` ni le champ correspondant sans relire cet écart.

- **Dans un raffinement `.pipe(...)` `effect`, l'ordre est porteur de sens : le raffinement composé en
  premier devient l'intérieur du décodage, donc celui qui s'exécute en premier.**
  `Schema.pattern` composé avant `Schema.maxLength` faisait tourner la regex sur la chaîne brute, non
  bornée, avant tout rejet par longueur — sur `POST /account`, une route publique sans limitation de
  débit (`RegisterAccountSchema.ts:9-16`, ordre actuel : `maxLength` puis `pattern`).
  Composer la borne bon marché avant le contrôle coûteux dans tout nouveau raffinement `.pipe(...)`.

- **`signInThrottle` n'est appelé que depuis `SignIn` — et son journal d'échecs vit en mémoire, dans un seul fournisseur.**
  `SignIn.execute` consulte `signInDelayInMilliseconds` puis attend, **avant** `findByEmail` : le délai
  précède toute authentification pour qu'une adresse inconnue et un mot de passe faux se refusent au même
  rythme (contrainte « Indistinction du refus », §8 de SPEC-002). `InMemorySignInFailureLog` est instancié
  une seule fois, dans la `useFactory` de `SignIn` (`app.module.ts`) : le compteur ne survit ni à un
  redémarrage, ni à une seconde instance de l'api — limite assumée, notée au §8 et au §11 de la spec.
  Ne pas déplacer l'attente après la lecture du compte, et ne pas instancier un second journal ailleurs :
  chacun compterait ses propres échecs.

- **L'origine d'une tentative de connexion vient de `@Ip()`, jamais du corps de la requête.**
  `session.controller.ts` lit l'origine avec le décorateur `@Ip()` de Nest et retombe sur `origine-inconnue`
  quand elle est vide — une clé commune, de sorte que ces tentatives se ralentissent entre elles plutôt que
  d'échapper au compteur. `SignInSchema` ne déclare aucun champ d'origine : une valeur envoyée dans le corps
  est ignorée, ce qu'EX-46 fige.
  Ne jamais alimenter `originKey` depuis le corps décodé — un attaquant choisirait alors sa propre clé de
  ralentissement à chaque requête. Derrière un proxy, `@Ip()` ne rendra l'adresse réelle du client que si
  `trust proxy` est activé sur Express : sans cela, toutes les requêtes partagent l'IP du proxy et se
  ralentissent mutuellement.

- **Un exemple `unit` d'une règle de validation ne protège pas la frontière HTTP qui l'implémente —
  EX-39 (adresse accentuée acceptée) n'était prouvée qu'en `unit` avant cette story.**
  Le cas `unit` d'EX-39 (US-012) appelle `RegisterAccount` directement et ne traverse jamais
  `RegisterAccountSchema` ; un motif de validation ajouté côté schéma peut donc refuser une adresse que
  le domaine accepte sans faire échouer ce test-là (`RegisterAccountSchema.ts:3`).
  Toute règle observable aux deux barreaux a besoin d'un cas aux deux barreaux — voir `docs/plan/SPEC-002.md`, note T7.

- **Trois routes de lecture alimentent le tableau de bord, et aucune n'a demandé de migration.**
  `GET /listing/mine`, `GET /rental-request` et `GET /rental-request/received` lisent des colonnes
  qui existaient déjà : `listings.owner_id`, et sur `rental_requests` le couple `listing_id`/`renter_id`
  plus `price_in_cents`, `status` et `confirmed_at`. La donnée était là, personne ne la lisait.
  `GET /rental-request/received` est **la seule route du dépôt qui rende l'identifiant d'une demande
  à un client**, et donc la seule qui rende `POST /rental-request/:id/confirmation` atteignable
  autrement que par un lien fabriqué à la main.

- **`@Get('mine')` est déclarée avant `@Get(':id')` dans `listing.controller.ts` — l'ordre est la règle.**
  Nest confronte les routes dans l'ordre de déclaration : placée après, `mine` serait décodé comme un
  identifiant par `Schema.decodeUnknownEither(Schema.UUID)`, puis refusé en `404`. Le symptôme ne
  ressemble pas à un problème d'ordre, il ressemble à une annonce introuvable.

- **`RentalRequestView` est un modèle de lecture, pas un agrégat — et il ne rend ni `renterId` ni `ownerId`.**
  L'adresse et le box vivent sur `listings` ; `rental_requests` n'en garde qu'une clé (AUTO-24). Les deux
  finders les lisent par jointure, comme `findRequestSummary` lit déjà `owner_id`. Le mappeur, lui, laisse
  les deux identifiants de compte au vestiaire : les routes sont déjà clés sur le compte appelant, donc les
  rendre n'apprendrait rien à son destinataire légitime et désignerait un tiers à quiconque lirait la réponse.

- **`GetOwnerListingResponseDto` n'expose toujours pas `accessDescription`, même à son propriétaire.**
  Le DTO du tableau de bord ajoute `status` à ce que la lecture publique montre, et rien d'autre : AUTO-29
  a retiré ce champ des réponses et a laissé ouverte la question de qui doit le voir. Conséquence à
  connaître : **un propriétaire ne peut relire nulle part ses propres consignes d'accès.** C'est un manque
  réel, pas un oubli — le combler est une story, pas un champ de plus ici.

- **La jointure des deux finders ne filtre pas sur le statut de l'annonce.**
  Une demande faite sur une place depuis dépubliée reste une demande : la masquer priverait le propriétaire
  de l'historique qui justifie ses revenus.

- **`accepted_vehicles` est un tableau, et le tableau vide se lit « non déclaré ».**
  Jamais « n'accepte rien » : les annonces publiées avant cette notion le restent, et `Listing.accepts()`
  rend `true` pour une place silencieuse. Une recherche par véhicule ne doit pas les faire disparaître —
  l'absence d'information n'est pas un refus. Ne pas « corriger » ce `true` en `false`.

- **Postgres refuse tout paramètre lié dans l'expression d'un `CHECK`.**
  C'est du DDL, il n'y a pas de plan à préparer : `knex.raw` avec des `?` échoue sur
  « bind message supplies 5 parameters, but prepared statement requires 0 ». Les valeurs de
  `listings_accepted_vehicles_check` sont donc écrites littéralement, avec une garde qui vérifie
  qu'elles restent des identifiants simples. La contrainte utilise `<@`, seule forme qui valide chaque
  élément d'un tableau — un `CHECK IN (...)` ne saurait le faire.

- **Un `Schema.Literal` en union fait fuiter la valeur soumise, et l'annoter n'y change rien.**
  `ArrayFormatter` descend dans chaque membre : cinq littéraux donnent cinq messages
  « Expected "velo", actual "tracteur" » concaténés, qui recopient l'entrée dans la 400 — constaté à
  l'exécution pendant cette story. La forme qui marche est un **raffinement unique** :
  `Schema.String.annotations({...}).pipe(Schema.filter(...)).annotations({...})`, annoté sur le type de
  base *et* sur le raffinement, exactement comme le veut la règle des schémas de décodage.

- **`tsconfig.build.json` exclut les specs et les `.sut.ts` : `tsc -p tsconfig.build.json` ne les typecheck pas.**
  Ajouter un champ obligatoire à un `Props` de cas d'usage compile donc sans rien dire, et n'échoue
  qu'à l'exécution de jest, sur des messages qui ne ressemblent pas à une erreur de type. Après tout
  élargissement d'un `Props`, lancer la suite `unit` avant de conclure.

## L'encaissement (SPEC-004)

Stripe Checkout, en **empreinte** : la carte est autorisée à la demande (`capture_method: manual`), prélevée
quand le loueur confirme, levée sinon. Le contexte `rental` porte le port `PaymentGateway`, son adaptateur
`StripePaymentGateway`, le webhook et le balayage ; le back-office n'appelle jamais Stripe.

- **Le SDK de Stripe ne s'importe que depuis `rental/adapters/services/stripe/stripeSdk.ts`.**
  Il s'exporte par `export =`, et l'api compile en CommonJS sans `esModuleInterop` : `import Stripe from
  'stripe'` compile, puis plante au démarrage sur un `.default` absent. `import … = require(…)` est la
  seule forme juste, et la règle `no-require-imports` la refuse : elle vit dans ce seul fichier, avec
  sa dérogation commentée.
- **Trois variables sans repli : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONT_BASE_URL`.**
  `main.ts` les exige au démarrage, comme `ACCESS_TOKEN_SECRET`. Pour lancer l'api en local :
  `set -a; source ../../.env.stripe.local; set +a` (fichier ignoré par git), puis le secret que rend
  `stripe listen --print-secret`. `FRONT_BASE_URL` fabrique les adresses de retour de Stripe — jamais un
  en-tête de la requête, qui ferait de la page de paiement une redirection ouverte.
  `RENTAL_SWEEP_INTERVAL_IN_SECONDS` (300 par défaut) règle le balayage.
- **`NestFactory.create(AppModule, { rawBody: true })` n'est pas décoratif.** La signature du webhook
  porte sur les octets reçus ; relue depuis le JSON décodé, elle échoue toujours. `createControllerTestApp`
  active déjà `rawBody`.
- **Une demande naît `AWAITING_PAYMENT`, et c'est le webhook qui la fait passer `PENDING`.**
  Elle retient ses dates dès sa naissance — la contrainte d'exclusion ne libère que `EXPIRED`,
  `CANCELLED`, `ABANDONED` et `PAYMENT_FAILED` — pour que deux conducteurs ne puissent jamais payer la
  même période. Le loueur ne la voit pas : c'est `hasReachedTheOwner` dans `ListOwnerRentalRequests`
  et `ConfirmRentalRequest`, pas un filtre SQL, qui la lui cache.
- **Le retour du navigateur ne vaut jamais paiement.** Seul `payment_intent.amount_capturable_updated`,
  signé, pose l'empreinte ; `checkout.session.expired` abandonne. Tout autre événement, ou un
  identifiant de demande qui n'est pas un UUID, est accusé `200` sans effet : un refus ferait renvoyer
  l'événement par Stripe pendant trois jours.
- **Le statut et l'argent changent dans le même `UPDATE`, et chaque transition filtre sur l'état
  qu'elle quitte.** `expireHoldsPlacedSince` écrit `EXPIRED` et `RELEASE_DUE` ensemble ;
  `KnexBackOfficeRepository.cancelRentalRequest` passe l'argent à `RELEASE_DUE` ou `REFUND_DUE` par un
  `CASE` dans l'écriture même de l'annulation. Une annulation ne peut pas exister sans sa dette ; c'est
  le balayage qui l'éteint chez Stripe. Rejouée, une transition ne trouve plus de ligne et rend `false` :
  c'est là, et nulle part ailleurs, qu'est l'idempotence face aux événements dupliqués.
- **Une clé d'idempotence par demande et par opération, jamais par tentative** (`idempotencyKeyOf`).
  Une clé qui changerait à chaque essai ferait d'un prélèvement rejoué après une coupure un second
  prélèvement.
- **`ConfirmRentalRequest` prélève avant d'écrire.** Si l'écriture échoue ensuite, la confirmation
  rejouée rend le même prélèvement ; sinon, le balayage expire la demande, la levée répond « déjà
  prélevé », et `settleMoneyOwed` la relit **confirmée**. Seule une demande `EXPIRED` est relue ainsi :
  annulée, abandonnée ou refusée, ce qui a été pris est remboursé — le loueur seul prélève, en
  confirmant, et l'exploitant a pu annuler entre-temps (EX-41).
- **Stripe refuse une page qui expire moins de trente minutes après sa création, à la seconde près.**
  L'échéance du domaine (`paymentPageExpiryOf`, trente minutes après la demande) part de quelques
  millisecondes plus tôt : `StripePaymentGateway` impose une minute de marge.
- **Une empreinte de carte ne vit que quelques jours** (sept pour la plupart des cartes). Porter
  `RENTAL_REQUEST_EXPIRY_IN_HOURS` au-delà de 96 ferait prélever des empreintes déjà mortes.
- **Les demandes d'avant l'encaissement ont `money_status = 'NONE'`.** Elles gardent l'expiration de
  SPEC-002 (depuis `requested_at`, `expireRequestsPendingSince`) et n'ont jamais rien à rendre ; les
  demandes payées expirent depuis `hold_placed_at` (`expireHoldsPlacedSince`).
- **Aucune clé `sk_live_…` avant la spec du reversement.** Sans Stripe Connect, l'exploitant encaisserait
  sur son propre compte de l'argent dû aux loueurs — une activité réglementée (SPEC-004 §11).

## Frozen versions — do not bump without reading the reason

| App | Paquet | Pin | Pourquoi — ce qui casse |
| --- | --- | --- | --- |
| api | `typescript` | `~5.9.3` | `ts-jest` n'accepte que `typescript >=4.3 <7` et `typescript-eslint` que `>=4.8.4 <6.1.0` — c'est ce second plafond, plus étroit, qui commande. Vérifié dans le `peerDependencies` des paquets installés, 2026-09-16 : `grep -A8 '"peerDependencies"' node_modules/.pnpm/ts-jest@*/node_modules/ts-jest/package.json` → `>=4.3 <7` ; même commande sur `typescript-eslint` → `>=4.8.4 <6.1.0`. |
