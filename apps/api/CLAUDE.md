# apps/api

## Layout

`src/listing` sépare le domaine et les adaptateurs :

- `domain/entities` — les entités (`Listing`), constructibles seulement par `publish()` ou `fromState()`, jamais par un constructeur public.
- `domain/ports` — des interfaces seulement (`ListingRepository`, `PhotoStorage`). Aucune implémentation, pas même une doublure de test, n'y vit : le domaine ne dépend d'aucune classe concrète.
- `domain/usecases/<cas-d-usage>/` — un dossier par cas d'usage (`publish-listing/`), avec son sous-dossier `errors/` pour les erreurs propres à ce seul cas d'usage (`ListingAlreadyActiveError`, `ListingNotFoundError`). Chaque cas d'usage implémente le contrat partagé `UseCase<Props, T>` de `src/shared/use-case/UseCase.ts`.
- `domain/errors/` — les erreurs que l'entité elle-même peut lever, partagées par plusieurs cas d'usage (`IncompletePricingError`, levée à la fois par `Listing.publish()` et par `Listing.edit()` ; `AvailabilityPeriodExpiredError`, `UnknownPhotoError` et `ActiveListingNotFoundError`, que `PublishListing` et `EditListing` partagent ; `PhotoTooLargeError` et `UnsupportedPhotoFormatError`, levées par `ListingPhoto.upload()`) ; une erreur qu'un seul cas d'usage renvoie reste sous son propre `domain/usecases/<cas-d-usage>/errors/`.
- `adapters/repositories/<agrégat>/` — les implémentations des ports, y compris les doublures en mémoire utilisées par les tests unitaires (`InMemoryListingRepository`), plus un `Schema<Nom>.ts` par table Knex (`SchemaListingRepository`) qui décrit les colonnes réelles.
- `adapters/rest/controllers/<agrégat>/` et `adapters/rest/dtos/` — les contrôleurs Nest et leurs schémas `effect/Schema` de validation de requête.
- `adapters/mappers/<agrégat>/` — les convertisseurs entité → DTO de réponse (`ListingMapper`), un fichier par agrégat : ils décident seuls ce qu'une réponse HTTP montre, et donc ce qu'elle omet délibérément (voir « Things that will bite you »).
- `adapters/services/<service>/` — les adaptateurs de port qui ne sont ni un dépôt ni un contrôleur. `listing` n'en a plus : les photos vivent en base, derrière `adapters/repositories/listing-photo/` (`KnexPhotoStorage`, `InMemoryPhotoStorage`).
- `domain/builders/<Entité>Builder.ts` — un bâtisseur d'entité partagé entre plusieurs `.sut.ts` d'un même agrégat (`ListingBuilder` est utilisé à la fois par `PublishListing.sut.ts` et par `KnexListingRepository.sut.ts`) : il construit l'entité via `fromState()`, jamais par un constructeur public, pour donner à toute fixture d'annonce active un seul point de vérité entre les barreaux `unit` et `int-repo`.

`src/user-management` porte l'authentification, séparée de `listing` : `domain/ports/AccessTokenVerifier` est un port sans implémentation — vérifier un vrai jeton (session, JWT, fournisseur externe) est hors périmètre de SPEC-001 — et `adapters/rest/guards/AuthGuard` le consomme pour garder une route. `domain/entities/Account` est la première entité du contexte, construite uniquement par `register()` (nouveau compte) ou par `fromState()`, jamais par un constructeur public — même discipline que `Listing`. `domain/ports/AccountRepository` et `domain/ports/PasswordHasher` sont ses deux premiers ports propres ; `adapters/repositories/account/` porte leur première implémentation (`InMemoryAccountRepository`, `KnexAccountRepository`, son `SchemaAccountRepository`), et `adapters/services/password-hasher/ScryptPasswordHasher` implémente `PasswordHasher` — un adaptateur de service, sous `adapters/`, jamais sous `domain/ports/`. `domain/usecases/register-account/` porte le premier cas d'usage du contexte, `RegisterAccount`. `adapters/rest/controllers/account/` porte `AccountController`, premier contrôleur du contexte, et sa route `POST /account` ; `adapters/mappers/AccountMapper` la convertit vers `RegisterAccountResponseDto`, qui n'expose que l'identifiant et l'adresse.

`src/rental` porte le second contexte métier, avec son propre `domain/ports/` (`PublishedListingReader`, `RentalRepository`) et leurs doublures en mémoire sous `adapters/repositories/` : le cas d'usage `domain/usecases/request-rental/` (`RequestRental.ts`, son `.sut.ts`, son sous-dossier `errors/`) ne dépend d'aucune classe de `listing/`, même pour lire la grille d'une annonce publiée — l'issue de US-006 interdisait cet import (`docs/autonomous/SPEC-001.md`, AUTO-16). Les entités `domain/entities/RentalPlace`, `RentalRequest` et `ConfirmedRental` sont construites par `fromState()` ou par `RentalRequest.request()`, jamais par un constructeur public. `domain/services/computeRentalPrice.ts` reste la seule fonction pure du contexte ; `RequestRental` l'appelle désormais au moment de la demande (voir « Things that will bite you »). Les deux ports ont désormais une implémentation Knex, sous le même schéma que `listing/` : `adapters/repositories/rental-request/` (`KnexRentalRequestRepository`, sa migration, son `Schema...`) et `adapters/repositories/published-listing/` (`KnexPublishedListingReader`, qui lit la table `listings` sans importer aucune classe de `listing/` — voir « Things that will bite you »).

`src/notification` porte l'envoi des e-mails (SPEC-006) : la rédaction (`domain/services/composeEmail`), le balayage de la file (`domain/usecases/send-queued-emails/`), le port `EmailSender` et son adaptateur `adapters/services/resend/ResendEmailSender`, et `adapters/cron/EmailSweepScheduler`. La file elle-même vit dans le noyau partagé, `src/shared/email-outbox/` (entité `OutgoingEmail`, port `EmailOutbox`, `KnexEmailOutbox`, `InMemoryEmailOutbox`), parce que chaque contexte y écrit sans importer `notification/`. `src/shared/unit-of-work/` porte `UnitOfWork` et ses deux implémentations, `src/shared/scheduler/SweepScheduler` le minuteur que partagent les deux balayages.

`src/infra` porte ce qui parle à une vraie base : les migrations Knex (`infra/migrations`) et l'outillage du barreau `int` (`testKnexfile.ts`, `testcontainers-setup.ts`, qui démarre un conteneur `postgres:15` par exécution). `src/shared/test/http` porte les doublures communes aux tests `int-http` (`TestAuthGuard`, `UseCaseDouble`, `createControllerTestApp`).

Chaque cas d'usage ou contrôleur porte un fichier `<Nom>.sut.ts` à côté de son test (`PublishListing.sut.ts`, `listing.controller.sut.ts`) : il construit le double — en mémoire, ou le module de test Nest — et les fonctions `given/when/then`, et n'est importé que par ce test-là.

Le build de production exclut les specs, les fichiers `.sut.ts`, `src/infra/testcontainers-setup.ts`, `src/infra/testKnexfile.ts` et `src/shared/test/**` (`apps/api/tsconfig.build.json:7-15`) : rien de ce qui n'existe que pour un test n'est livré.

## Commands

Toujours via `--filter` — nécessaire dès qu'une deuxième app rejoint le workspace.

| Quoi | Commande |
| --- | --- |
| build | `pnpm --filter bookparking-api build` |
| unit (**162 specs** — `find apps/api/src -name '*.unit.spec.ts' -exec grep -o '  it(' {} + \| wc -l`, 2026-09-24) | `TZ=UTC pnpm --filter bookparking-api exec jest --config ./jest.unit.config.js` |
| int-repo + int-http (**10 fichiers** — `find apps/api/src -name '*.int.spec.ts' \| wc -l`, 2026-09-24 ; Docker requis) | `pnpm --filter bookparking-api exec jest --config ./jest.int.config.js` |
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

- **Dans `RequestRental`, l'ordre des gardes est chargé de sens : dates lisibles, puis durée ≤ `366` jours, puis prix, puis ouverture, puis disponibilité.**
  L'ouverture (`coversDays` sur `PublishedListing.openDays`, jours UTC de `available_from`/`available_to`) refuse en
  `422` « La place n'est pas ouverte sur toute la période demandée » ; elle vient après la construction de la demande,
  seule à refuser des jours illisibles, et une période à la fois fermée et sans tarif répond donc « aucun tarif ».
  `KnexPublishedListingReader` recopie ces deux colonnes de `listings`, comme le reste.
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

- **Le délai d'expiration est un réglage du back-office, figé sur chaque demande.** Q-18 du brainstorm
  du 10/09 le rangeait parmi les réglages du back-office : il y est (voir « Les réglages de location »
  plus bas). `RequestRental` le lit dans `platform_settings` et l'écrit dans
  `rental_requests.request_expiry_hours` ; le balayage expire chaque ligne selon le sien. Ne pas le
  refaire descendre par un constructeur.

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
  Ne pas ajouter ce champ à `GetListingResponseDto` sans rouvrir AUTO-29. Qui le voit est désormais tranché
  ailleurs : `GET /rental-request` le rend en `accessInstructions` au seul conducteur d'une réservation
  `CONFIRMED`, jusqu'au dernier instant loué (`presentRentalRequest`, contexte `rental`) — jamais par la
  fiche publique, jamais par e-mail ni par push.

- **Le paramètre de chemin `:id` de `GET /listing/:id` est décodé comme un UUID avant d'atteindre le dépôt — un identifiant mal formé répond comme une annonce inconnue, jamais 500.**
  `listing.controller.ts:108` appelle `Schema.decodeUnknownEither(Schema.UUID)(id)` et lève, sur un échec de décodage,
  la même `ListingNotFoundError` qu'une annonce absente (AUTO-29, `docs/autonomous/SPEC-001.md`) ; EX-45 fige cette égalité de réponse.
  Toute nouvelle route qui prend un identifiant de domaine en paramètre de chemin doit le décoder de la même façon avant de l'utiliser.

- **`Schema.optional(x)` fait fuiter la valeur soumise dans la `400`, même quand `x` est annoté partout : utiliser `Schema.optionalWith(x, { exact: true })`.**
  `Schema.optional` compose une union avec `undefined`. Quand le champ est présent mais mal typé, la
  branche `undefined` échoue elle aussi et porte le message par défaut d'`effect`,
  `Expected undefined, actual "<valeur>"` — que `parseSchemaError` concatène tel quel. Annoter l'union
  n'y change rien : `ArrayFormatter` descend dans chaque membre et rend leurs messages. Constaté pendant
  cette story sur `UpdateListingPricingSchema` (devenu `EditListingSchema`) : un prix envoyé en chaîne repartait en clair dans la
  réponse, contre la contrainte « Secret » du §8 de SPEC-002 — la même régression que `3af4eda` et
  `04fb79b`, par un chemin que les deux annotations de `RegisterAccountSchema` ne couvrent pas.
  `exact: true` rend le champ facultatif **sans** composer d'union : un palier absent est absent, un
  palier présent est jugé par le seul schéma annoté.
  Pour tout champ facultatif d'un schéma de décodage : `optionalWith(..., { exact: true })`, jamais
  `optional(...)` — et un test `int-http` qui envoie le champ mal typé et vérifie que la réponse ne
  contient pas la valeur.

- **`DELETE /listing/:id` est clé sur l'identifiant, mais `UnpublishListing` l'est sur la place — `GetListing` fait la jonction dans le contrôleur.**
  `UnpublishListing` prend `address` + `box` et calcule `placeKeyOf` ; la route prend l'identifiant
  que `GET /listing` rend aux clients. Le contrôleur appelle donc `GetListing` d'abord : une lecture de
  plus par requête, assumée pour ne pas réécrire un cas d'usage déjà prouvé.
  `EditListing`, lui, prend directement `listingId` (`findActiveById`) : c'est la forme à suivre pour
  tout nouveau cas d'usage appelé par une route à identifiant, plutôt que répandre cette jonction.

- **`PATCH /listing/:id` remplace tout ce qui se modifie, sauf l'adresse et le box.**
  Le corps (`EditListingSchema`) est l'annonce entière — consignes, photos, véhicules, grille, période —
  et non un patch partiel : un palier omis est effacé. L'adresse et le box restent hors d'atteinte parce
  qu'ils forment `place_key`, la clé sur laquelle `rental_requests_place_period_excl` départage deux
  demandes et que chaque demande recopie : les changer laisserait les réservations passées sur une
  autre clé que l'annonce, et la contrainte d'exclusion ne verrait plus le chevauchement. Changer de
  place, c'est dépublier puis publier. `Listing.edit()` rejoue les gardes de la publication (grille
  non vide, véhicules connus, période pas entièrement passée — une période déjà commencée reste
  modifiable) et ne relit **aucune** demande : réduire les dates ou retirer un véhicule ne touche pas
  une réservation déjà faite, exactement comme dépublier. Les nouvelles consignes d'accès, elles,
  sont lues aussitôt par le conducteur d'une réservation confirmée (jointure de `presentRentalRequest`).
  Seules les photos absentes de l'annonce sont vérifiées (envoyées par ce compte) : une référence que
  l'annonce porte déjà, même d'avant l'envoi de photos, reste acceptée.

- **Un `Schema.Date` fait fuiter la valeur soumise dès qu'elle n'est pas une chaîne, même annoté.**
  Son côté « chaîne » n'hérite pas de l'annotation : `123` rend « Expected string, actual 123 ».
  `EditListingSchema` compose donc un `Schema.String` annoté avec un `Schema.Date` annoté, puis annote
  le tout ; `PublishListingSchema` garde l'ancienne forme et fuit encore sur ce cas.

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

- **`GetOwnerListingResponseDto` expose `accessDescription`, et c'est la seule réponse qui le fasse avec `PATCH /listing/:id`.**
  Le propriétaire doit relire ses consignes pour les modifier ; `GET /listing/mine` est clé sur le
  compte appelant, donc personne d'autre ne les y lit. Les lectures publiques (`GET /listing`,
  `GET /listing/:id`) continuent de les omettre (AUTO-29, EX-44).

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
- **Une empreinte de carte ne vit que quelques jours** (sept pour la plupart des cartes). Un délai de
  réponse au-delà de 96 heures ferait prélever des empreintes déjà mortes : c'est la borne haute de
  `PLATFORM_SETTINGS_BOUNDS.requestExpiryHours`, que le back-office ne peut pas franchir.
- **Les demandes d'avant l'encaissement ont `money_status = 'NONE'`.** Elles gardent l'expiration de
  SPEC-002 (depuis `requested_at`, `expireLapsedPendingRequests`) et n'ont jamais rien à rendre ; les
  demandes payées expirent depuis `hold_placed_at` (`expireHoldsPlacedSince`).
- **`POST /rental-request` exige l'en-tête `Idempotency-Key` (un UUID), et c'est ce qui empêche un
  double clic de faire deux demandes** (RG-10). `RequestRental` cherche d'abord une demande du même
  compte sous cet identifiant et la rejoue — même identifiant, même page de paiement, en-tête
  `Idempotent-Replayed: true` — ou refuse `IdempotencyKeyReusedError` si la place ou la période
  diffèrent. Deux écritures simultanées sont départagées par l'index unique partiel
  `rental_requests_renter_idempotency_key_unique` sur `(renter_id, idempotency_key)` : la seconde lève
  `DuplicateIdempotencyKeyError` et rejoue la première. Deux pièges : le filtre `renter_id` de
  `findByIdempotencyKey` est la seule chose qui empêche un compte de relire la page de paiement d'un
  autre — le retirer ne ferait échouer qu'EX-44 au barreau `int-repo`, jamais au barreau `unit` ; et
  une page que Stripe n'a pas pu ouvrir **rend** son identifiant (`forgetIdempotencyKey`), sans quoi
  le conducteur qui réessaie rejouerait une demande abandonnée. Confirmer, abandonner, annuler et
  recevoir un événement de Stripe n'ont pas d'identifiant d'intention : ils sont idempotents par
  l'état qu'ils quittent.
- **Un conducteur n'est jamais bloqué par sa propre demande impayée** (EX-50, EX-51).
  `RequestRental` abandonne, avant d'écrire, les demandes `AWAITING_PAYMENT` **de ce conducteur** qui
  chevauchent la nouvelle sur la même place, et ferme leur page de paiement. Sans cela, quitter Stripe
  sans son lien de retour — onglet fermé, fiche rechargée — puis redemander les mêmes dates répondait
  « Ces dates sont déjà louées » pendant deux heures, au conducteur lui-même. Le chevauchement est jugé
  en SQL avec le même `tstzrange` que la contrainte d'exclusion ; le filtre `renter_id` est ce qui
  empêche de libérer les dates d'un autre, et seul EX-51 au barreau `int-repo` le garde.
- **Aucune clé `sk_live_…` tant que Stripe n'a pas validé la plateforme Connect.** Le reversement existe
  (voir « Le reversement au loueur ») ; sans Connect activé et validé côté Stripe, l'exploitant
  encaisserait pour compte de tiers — une activité réglementée (SPEC-004 §11).

## L'annulation d'une réservation (SPEC-005)

`POST /rental-request/:id/cancellation`, une route pour le conducteur et le loueur : `CancelRental`
reconnaît qui annule. `moneyAfterCancellation` (`domain/entities/RentalCancellation.ts`) est la seule
règle d'argent : une empreinte est toujours levée ; un prélèvement est remboursé si le loueur annule,
ou si le conducteur annule jusqu'à l'échéance **incluse** ; au-delà, il est gardé.

- **L'échéance d'annulation gratuite est figée sur la demande** (`free_cancellation_until`), calculée
  par `RentalRequest.request()` depuis le réglage `freeCancellationHours` du back-office et le
  premier instant de la location, heure de Paris — en heures, jamais en jours locaux. Un délai
  modifié plus tard ne la déplace pas (Q-13 tranchée par JP). `CancelRental` ne relit le délai courant
  que pour une ligne sans échéance, ce que la migration a rendu impossible en la calculant pour les
  demandes d'avant ; ce repli est aussi ce qui donne des dents à EX-10.
- **Le conducteur passe avant le loueur** dans `partyOf` : un compte qui louerait sa propre place
  annule selon les règles du conducteur, les plus strictes. Le loueur n'annule que ce qu'il voit
  (`hasReachedTheOwner`).
- **On n'annule plus une location commencée** (`RentalAlreadyStartedError`, 409), ni une demande en
  attente de paiement (`RentalNotCancellableError`, 409), qui s'abandonne.
- **`markCancelledBy` filtre sur `PENDING` et `CONFIRMED`**, dans le même `UPDATE` que l'argent dû, et
  note `cancelled_by` (`RENTER`, `OWNER`, `OPERATOR` pour le back-office) et `cancelled_at`. La garde de
  statut du cas d'usage double ce filtre : la retirer ne fait échouer aucun test, c'est un mutant
  équivalent assumé.
- **L'argent est rendu aussitôt** par `settleMoneyOwed` quand Stripe répond, sinon au balayage.
- **Après une annulation tardive, l'argent gardé reste `CAPTURED` sur une ligne `CANCELLED`** : le
  balayage ne le voit pas (il ne lit que les dettes), et il ne compte pas dans les revenus du loueur.
  Il attend la spec du reversement.

## Les e-mails (SPEC-006)

Une inscription écrit le compte **et** un e-mail de bienvenue dans la table `outgoing_emails`, dans la
même transaction (`KnexUnitOfWork`). `EmailSweepScheduler` passe toutes les 30 secondes : il lit au plus
50 e-mails `PENDING`, les rédige, les envoie à Resend par `fetch` (pas de SDK), et les passe `SENT`,
`FAILED`, ou les laisse en file avec un essai de plus.

- **Aucun cas d'usage n'envoie d'e-mail.** Il en met un en file, dans sa transaction, avec
  `emailOutbox.enqueue(email, trx)`. Envoyer depuis le cas d'usage ferait dépendre l'inscription de
  Resend, et un e-mail partirait pour un compte dont l'écriture a ensuite échoué.
- **Ajouter un moment clé, c'est trois endroits à la fois** : `OutgoingEmailKind` (`OutgoingEmail.ts`),
  `outgoing_emails_kind_check` (une nouvelle migration) et le `Record` `composers` de `composeEmail.ts`.
  Pour une notification, quatre : `NotificationKind` (`Notification.ts`) et `notifications_kind_check` en plus.
  Le `Record` refuse de compiler sans rédaction ; rien ne rattrape un oubli dans le `CHECK`, sinon une
  insertion qui échoue — et avec elle toute la transaction du cas d'usage.
- **`RESEND_API_KEY` et `MAIL_FROM` n'ont pas de repli** : `main.ts` refuse de démarrer sans eux, sauf
  `EMAIL_SENDING=disabled`, qui laisse les e-mails en file sans rien construire. La pile e2e locale le
  pose (`startLocalStack.ts`) : ses comptes sont en `@bookparking.test`, et chaque rebond abîme la
  réputation du domaine d'expédition. Une pile de développement qu'un parcours e2e vise doit le poser
  aussi.
- **Le `.env` n'est chargé que par `pnpm --filter bookparking-api start`** (`--env-file-if-exists=../../.env`,
  donc le `.env` à la racine du dépôt, ignoré par git). `node dist/main.js` et la pile e2e ne le lisent
  pas, exprès : la vraie clé ne doit jamais atteindre un parcours e2e.
- **La fenêtre de 24 heures n'est pas un réglage.** C'est la durée de vie d'une clé d'idempotence chez
  Resend, et la clé est l'identifiant de l'e-mail : au-delà, un renvoi après une réponse perdue
  pourrait doubler l'envoi. Ne pas l'allonger.
- **Seuls `400` et `422` abandonnent un e-mail.** Une clé ou un domaine refusés (`401`, `403`) sont un
  défaut de réglage : les e-mails restent `PENDING` et repartent dès la correction, dans les 24 heures.
  Le symptôme est un journal `ResendEmailSender` en `warn` avec `status: 403` à chaque balayage —
  aucune erreur ne remonte ailleurs.
- **`ResendEmailSender` coupe une requête au bout de 10 secondes.** `SweepScheduler` saute un balayage
  tant que le précédent n'a pas rendu la main : sans délai, une requête pendue gèlerait la file.
- **Un balayage qui rend `Either.left` n'est pas journalisé**, ni pour les e-mails ni pour les demandes :
  `SweepScheduler` ne journalise que ce qui est levé. Les e-mails restent en file, rien n'est perdu,
  mais rien ne le dit.
- **`ChangePassword.sut.ts` construit aussi `RegisterAccount`.** Changer son constructeur compile avec
  `pnpm build` (qui exclut les `.sut.ts`) et casse quatre tests de `ChangePassword` — constaté pendant
  cette spec.
- **`outgoing_emails.recipient` garde l'adresse de chaque e-mail envoyé.** Son effacement suit celui du
  compte, que porte SPEC-003 avec la dette #18.

## Les notifications

Chaque moment clé d'une demande écrit une ligne dans `notifications` **et** met un e-mail en file, dans
la transaction qui le motive : reçue (webhook d'empreinte → loueur), acceptée ou paiement refusé
(`ConfirmRentalRequest` → conducteur), refusée ou annulée (`CancelRental` → l'autre partie), expirée
(`expireLapsedRequests`, partagé par le balayage et `RequestRental` → les deux), annulée par Bookparking
(back-office → les deux). La file vit dans le noyau partagé (`src/shared/notification-outbox/`), la
cloche dans `src/notification` (`GET /notification`, `POST /notification/read`).

- **L'idempotence est l'index unique `notifications_once_per_recipient_unique`** (demande, type,
  destinataire). `KnexNotificationOutbox` insère en `ON CONFLICT DO NOTHING` et ne met l'e-mail en file
  que s'il a inséré : un webhook rejoué ou deux balayages ne doublent ni la cloche ni l'e-mail.
- **Seule l'écriture qui gagne la transition prévient.** `confirmRequest` rend désormais un booléen ;
  une confirmation concurrente, ou une demande expirée entre la lecture et l'écriture, ne dit rien.
- **L'e-mail ne dit ni l'adresse ni les dates** : il renvoie à `/compte?onglet=demandes-recues` ou
  `/compte?onglet=reservations`, que le site lit (`apps/front/src/lib/accountTabs.ts`). Renommer un
  onglet d'un côté casse les liens de l'autre.
- **`recipient_id` est du texte, sans clé étrangère**, comme `renter_id` et `owner_id` ; l'adresse de
  l'e-mail est lue sur `accounts` par `id::text`. Un identifiant sans compte a la cloche, pas d'e-mail.
- **Une capture relue « confirmée » par `settleMoneyOwed` ne prévient personne.** Ce cas rare (écriture
  perdue après le prélèvement, puis expiration) laisse au conducteur l'e-mail « expirée » alors que la
  réservation tient. Non traité.
- **Le push lit la même table.** `PushSweepScheduler` passe toutes les 10 s
  (`PUSH_SWEEP_INTERVAL_IN_SECONDS`) : `SendPendingPushes` lit les notifications où `pushed_at` est
  `NULL`, les pousse vers chaque téléphone du destinataire (`push_devices`) par l'api HTTP d'Expo,
  puis les clôt. Sans téléphone, ou plus d'une heure après, une notification est close sans rien
  envoyer. Envoyer puis clore n'est pas atomique : un arrêt entre les deux double un push, jamais
  ne le perd. La migration a clos toutes les notifications d'avant.
- **Les clés Apple vivent chez Expo (EAS), jamais dans l'api.** `EXPO_ACCESS_TOKEN` est facultatif :
  Expo ne l'exige que si la « sécurité renforcée des push » est activée sur le projet. Un refus
  `InvalidCredentials` (clé APNs absente ou révoquée chez EAS) garde tout le lot en file, et le
  journal `ExpoPushSender` le dit à chaque balayage.
- **`POST /notification/push-device/removal` n'a pas de garde, exprès** : l'app l'appelle en se
  déconnectant. Un jeton Expo permet déjà de pousser vers le téléphone ; l'oublier ne donne rien de
  plus. Un téléphone n'appartient qu'au dernier compte qui l'a enregistré (clé primaire `token`).
- **`DeviceNotRegistered` efface le téléphone** : l'app a été désinstallée.

## Consignes d'accès et échéance de réponse

- **`presentRentalRequest` décide ce qu'une liste de demandes montre.** Le dépôt lit toujours
  `listings.access_description` (jointure, comme l'adresse) ; le cas d'usage ne la rend qu'au conducteur
  (`ListRenterRentalRequests`), statut `CONFIRMED`, et tant que `now < period_to`. Annulée, expirée, pas
  encore confirmée ou terminée : `null`. Le loueur ne la reçoit jamais dans `GET /rental-request/received`.
- **`answerBy` recopie la règle du balayage** : `hold_placed_at` (ou `requested_at` avant l'encaissement)
  + `request_expiry_hours` de la ligne, par `answerDeadlineOf`. Changer l'expiration dans les requêtes
  `expireLapsed*` sans toucher `presentRentalRequest` ferait afficher une échéance fausse aux deux parties.
- **`POST /notification/:id/read` marque une seule notification** : c'est ce qui fait qu'une réservation
  confirmée n'est fêtée qu'une fois, sur le site ou dans l'app. Identifiant mal formé, inconnu ou d'un
  autre compte : 204, rien de marqué.

## Le reversement au loueur (D-10, D-22)

Stripe Connect Express, en « charges et virements séparés » : le conducteur paie la plateforme
(inchangé), puis `SendDuePayouts` (`PayoutSweepScheduler`, 5 min, `PAYOUT_SWEEP_INTERVAL_IN_SECONDS`)
vire au loueur le prix moins la commission, vers son compte Stripe. Le contexte `src/payout` porte le
compte (`payout_accounts`), les virements (`owner_transfers`) et `GET /payout`,
`POST /payout/onboarding`, `POST /payout/dashboard`.

- **Aucune coordonnée bancaire ni pièce d'identité ne passe par l'api.** Le loueur les saisit sur les
  pages de Stripe (`accountLinks`) ; la base ne garde que `acct_…` et `payouts_enabled`. Ne jamais
  ajouter un champ IBAN à un formulaire du site.
- **La commission est figée sur la demande** (`rental_requests.platform_fee_in_cents`, Q-13), calculée
  par `RentalRequest.request()` depuis le réglage `platformFeePercent` du back-office (15 % décidé le
  24/09/2026, borné à [0, 50] au centième). Les demandes d'avant ont reçu 15 % par la migration. Changer
  le taux ne touche que les demandes suivantes.
- **L'argent est libéré au premier de deux événements** (`releaseAtOf`) : l'arrivée confirmée par le
  conducteur (`POST /rental-request/:id/arrival`, pas avant le premier instant loué), ou le premier
  instant + `rental_requests.payout_release_delay_hours`, figé à la demande (24 par défaut). Seul l'argent
  `CAPTURED` est dû : une annulation
  remboursée n'est jamais virée ; une annulation tardive dont l'argent est gardé l'est, à la date prévue.
- **Un virement au plus par demande** : clé primaire `owner_transfers.rental_request_id` et clé
  d'idempotence Stripe `transfer-<demande>`. Un arrêt entre le virement et son écriture est rattrapé au
  passage suivant, qui rejoue la même clé.
- **Le virement est adossé au paiement** (`source_transaction` = la charge du PaymentIntent) : il part
  quand cet argent est disponible, jamais sur le solde de la plateforme.
- **Un loueur sans compte prêt attend** (`AWAITING_ACCOUNT`) ; son compte est relu chez Stripe à chaque
  passage et à chaque `GET /payout`, sans webhook Connect. Ajouter l'écoute d'`account.updated` le
  jour où la relecture coûte trop d'appels.
- **Trou connu : un remboursement après virement.** L'annulation par l'exploitant (`back-office`) ne
  vérifie pas le début de la location ; si elle rembourse une demande déjà virée, la plateforme rend
  l'argent au conducteur sans reprendre le virement du loueur (`transfers.createReversal`). À traiter
  avec les litiges (gel avant libération, D-22).

## Les réglages de location (back-office)

La commission, l'annulation gratuite, le délai de réponse du loueur et celui de la libération de
l'argent ne sont plus des variables d'environnement : ils vivent dans `platform_settings`, que le
back-office change par `POST /admin/settings`. Le noyau partagé `src/shared/platform-settings/` porte
l'entité (`PlatformSettings`, ses bornes, `checkPlatformSettings`), le port `PlatformSettingsReader` et
sa route publique `GET /rental-terms`, que le site lit pour la FAQ, les conditions d'utilisation et
« Versements ». Le changement et le journal appartiennent à `back-office`.

- **Chaque demande fige les quatre valeurs du jour où elle est faite** (décision du 28/09/2026). La
  commission et l'échéance d'annulation l'étaient déjà ; `request_expiry_hours` et
  `payout_release_delay_hours` le sont désormais aussi, et les requêtes d'expiration et de libération
  lisent la colonne de chaque ligne (`requested_at + request_expiry_hours * interval '1 hour'`). Un
  réglage raccourci n'expire donc jamais une demande en cours.
- **La table est un historique, pas une ligne.** Chaque changement insère une version ; la dernière
  (`effective_from`, puis `id`) est en vigueur. Une base sans version — celle des tests, que
  `cleanDatabase` vide — applique `DEFAULT_PLATFORM_SETTINGS`, les valeurs d'avant le back-office.
- **La migration `20260928160000` a lu les anciennes variables une dernière fois** pour écrire la
  première version et remplir les demandes existantes. `PLATFORM_FEE_PERCENT`,
  `FREE_CANCELLATION_HOURS_BEFORE_START`, `RENTAL_REQUEST_EXPIRY_IN_HOURS` et
  `PAYOUT_RELEASE_DELAY_IN_HOURS` ne sont plus lues par l'api : les retirer de Railway une fois la
  migration passée.
- **Le lecteur est interrogé à chaque exécution**, jamais au démarrage : un réglage vaut dès la demande
  suivante, sans redéployer.
- **`ChangePlatformSettings` écrit la version et sa ligne d'`admin_action_logs` dans une transaction**
  (`CHANGE_PLATFORM_SETTINGS`, cible `PLATFORM_SETTINGS` = l'identifiant de la version), mêmes gardes
  que la modération — administrateur, motif, puis valeurs. Une version identique à celle en vigueur est
  refusée (`PlatformSettingsUnchangedError`, 400) : le journal ne se remplit pas de non-changements.
- **`GET /admin/journal` lit tout le journal en une requête** (`findJournal`) : la cible est nommée par
  jointure selon son type (`target_id` est du texte, les identifiants des UUID, d'où les `::text`), et un
  changement de réglages est lu avec la version précédente (`LEFT JOIN LATERAL`). Une cible supprimée
  depuis rend `targetLabel: null`.

## Les réclamations

`POST /rental-request/:id/issue` (le conducteur), `POST /rental-request/:id/issue/answer` (le loueur),
`GET /admin/issues` et `POST /admin/issues/:id/resolution` (le back-office). Table `rental_issues`,
une ligne au plus par demande (`rental_request_id` unique). Les règles vivent dans
`rental/domain/entities/RentalIssue.ts`.

- **On ne se plaint que pendant la location** (`reportRefusalOf`) : réservation `CONFIRMED` et
  `CAPTURED`, entre le premier et le dernier instant loués, avant d'avoir confirmé son arrivée et avant
  que l'argent parte (`owner_transfers`). Après un virement, rembourser coûterait à Bookparking — c'est
  le trou connu du reversement. `presentRentalRequest` rejoue la même règle pour `issueReportable`.
- **Une réclamation ouverte gèle l'argent** : `findDuePayouts` ignore les demandes dont la réclamation
  est `OPEN`, `ReadPayouts` les montre `HELD`, et `ConfirmArrival` refuse l'arrivée (409) — elle
  libérerait l'argent.
- **Trancher** (`ResolveRentalIssue`, mêmes gardes et même journal que la modération, les deux parties
  prévenues) : `REFUND` passe par `cancelRentalRequest` (annulée par l'exploitant, `REFUND_DUE`, le
  balayage rend tout) ; `PARTIAL_REFUND` écrit `refund_in_cents`, pris sur la part du loueur et borné
  à cette part moins un centime, que `SweepRentalRequests` rend chez Stripe
  (`refund(paymentId, 'issue-refund-<demande>', montant)`, rejoué jusqu'à `refund_id`) et que
  `SendDuePayouts` retranche du virement ; `DISMISS` rend l'argent au loueur à la date prévue.
- **Trois notifications** (`RENTAL_ISSUE_REPORTED` au loueur, `RENTAL_ISSUE_ANSWERED` au conducteur,
  `RENTAL_ISSUE_RESOLVED` aux deux, qui se lit selon le destinataire comme l'annulation par
  l'exploitant). Le site et l'app les listent aussi (`TONES`, les icônes de la cloche).
- **La suppression d'un compte efface ce qu'il y a écrit** (`message` du conducteur, `owner_reply` du
  loueur) ; la réclamation reste, elle explique où est allé l'argent.

## L'inscription plus sûre (SPEC-007)

- **`passwordStrength.ts` a une copie à la lettre dans le site** (`apps/front/src/app/account/domain/entities/Password.ts`).
  Le site bloque ce que l'api refuse ; changer la règle ou la liste des mots de passe courants d'un côté
  seulement, et l'un acceptera ce que l'autre refuse. `Password.unit.spec.ts` (EX-08) rejoue les niveaux de l'api.
- **`WeakPasswordError` vit dans `domain/errors/`** : l'inscription et le changement de mot de passe la partagent.
- **`POST /account` exige `humanProof`** : le défi vient de `GET /account/human-challenge` (`HashcashHumanProof`,
  preuve de travail à la manière d'ALTCHA, 50 000 essais au plus, 20 minutes). Tout client qui inscrit un
  compte — le site, l'app, `apps/e2e/src/seed/ApiClient.ts` — doit résoudre le défi.
- **La clé des défis dérive de `ACCESS_TOKEN_SECRET`** (`app.module.ts`) : changer ce secret invalide aussi les
  défis en cours.
- **Les preuves servies vivent en mémoire, dans l'unique fournisseur `HumanProof`** — même limite que le journal
  des échecs de connexion : un redémarrage ou une seconde instance permet de rejouer une preuve pendant 20 minutes.
- **`POST /account` exige aussi `acceptsTerms` (SPEC-008)** : `false` répond 400 (`TermsNotAcceptedError`), et
  `accounts.terms_accepted_at` note l'instant de la case cochée — `null` pour les comptes d'avant. Tout client
  qui inscrit un compte doit l'envoyer, y compris `apps/e2e/src/seed/ApiClient.ts`.
- **`RegisterAccount` dépense la preuve avant de juger le mot de passe et l'adresse**, exprès : une preuve ne sert
  pas à sonder plusieurs adresses. Ne pas déplacer ce contrôle après `create`.

## Le mot de passe oublié

`POST /account/password-reset` (public, toujours `204`) met en file un e-mail portant un lien
`/mot-de-passe/nouveau?jeton=…`, valable une heure et une seule fois ; `POST /account/password-reset/confirmation`
remplace le mot de passe. Contexte `user-management` : `RequestPasswordReset`, `ResetPassword`, table `password_resets`.

- **Le jeton en clair ne vit que dans `outgoing_emails.password_reset_token`, le temps de l'envoi.**
  `password_resets` n'en garde que l'empreinte SHA-256, en clé primaire. `markSent` et `markFailed` vident la
  colonne ; `recordUnavailable` la garde pour l'essai suivant. `outgoing_emails_password_reset_token_check`
  interdit un jeton sur un autre type d'e-mail, et un e-mail de réinitialisation `PENDING` sans jeton. Ne jamais
  recopier le jeton ailleurs.
- **La réponse ne dit jamais si l'adresse a un compte.** Adresse inconnue, compte suspendu, ou seconde demande
  moins de deux minutes après la précédente (`PasswordReset.allowsAnotherRequestAt`) : `204`, rien d'écrit. Le
  temps de réponse, lui, diffère d'une écriture ; ce n'est pas une fuite nouvelle, `POST /account` répond déjà
  `409` sur une adresse prise.
- **Les deux minutes sont l'idempotence de la route**, pas un en-tête `Idempotency-Key` : un double clic n'envoie
  qu'un e-mail, et un tiers ne peut pas remplir la boîte d'un autre.
- **Réinitialiser dépense tous les liens encore valables du compte**, dans la transaction qui remplace le mot de
  passe. `spendUnspentByAccountId` rend les empreintes qu'il a dépensées, et `ResetPassword` refuse si celle du
  lien présenté n'y est pas : deux confirmations simultanées ne changent le mot de passe qu'une fois.
- **Un mot de passe trop faible ne dépense pas le lien** : la robustesse est jugée avant la transaction.
- **Les sessions ouvertes survivent à une réinitialisation**, comme à un changement de mot de passe (EX-002-33) :
  les jetons d'accès sont signés et sans état, rien ne sait les révoquer. Une session volée reste valable
  jusqu'à son expiration.
- **`/mot-de-passe/nouveau?jeton=` est écrit par `composeEmail` et lu par `NewPasswordPage` du site.** Renommer
  l'un casse les liens déjà partis.
- **La rédaction d'un e-mail ne doit jamais lever** : l'e-mail resterait premier de la file et bloquerait tous
  les autres. Sans jeton, celui de réinitialisation renvoie vers `/mot-de-passe-oublie`.

## La suppression d'un compte

`DELETE /account` (jeton, mot de passe redemandé dans le corps) supprime la ligne `accounts` ; `password_resets`
et `back_office_admins` suivent par `ON DELETE CASCADE`. Contexte `user-management` : `DeleteAccount`, et le port
`AccountFootprint` pour tout ce que le compte a laissé dans les autres contextes.

- **`SlidingAccessTokenVerifier` lit le compte à chaque requête gardée.** Un jeton est signé et sans état : sans
  cette lecture, l'iPhone resté connecté publierait encore au nom d'un compte effacé. C'est une requête par clé
  primaire de plus sur chaque route gardée. Un compte **suspendu**, lui, garde ses jetons : seule `SignIn` le
  refuse, et le verifier ne regarde pas `suspended_at`.
- **Refusée en `409` tant que le compte engage quelqu'un** (`KnexAccountFootprint.hasOngoingCommitments`) : une
  demande `PENDING` (conducteur ou loueur), une réservation `CONFIRMED` dont `period_to` n'est pas passé, ou, côté
  loueur, de l'argent `CAPTURED` sans ligne `owner_transfers`. Ce dernier est le « dû » de
  `KnexPayoutRepository.findDuePayouts` sans la condition de libération : les deux requêtes doivent bouger
  ensemble. C'est un écart assumé à D-07 du brainstorm comptes (« ne jamais refuser »), tranché avant l'argent :
  supprimer un loueur avec un versement dû laisserait l'argent en tête de `findDuePayouts` pour toujours.
- **Ce que `erase` fait, dans la transaction de la suppression :** les demandes `AWAITING_PAYMENT` du compte, et
  celles d'autres conducteurs sur ses places, passent `ABANDONED` (une page Stripe payée plus tard voit son
  empreinte levée par `RecordPaymentEvent`) ; ses annonces `ACTIVE` passent `UNPUBLISHED` (ADR-003) ; ses
  `notifications`, `push_devices`, `outgoing_emails` (par adresse) et `payout_accounts` sont supprimés. Les
  `rental_requests` et `owner_transfers` restent : `renter_id` et `owner_id` n'y désignent plus personne.
- **`KnexAccountFootprint` copie des noms de tables et de statuts d'autres contextes**, comme le back-office. Une
  table ou un statut renommé ailleurs ne casse pas la compilation : c'est `KnexAccountFootprint.int.spec.ts` qui
  le verra. Une nouvelle table qui porte un identifiant de compte ou une adresse doit y être ajoutée.
- **La vérification précède l'effacement dans la même transaction, sans verrou** : une empreinte posée entre les
  deux laisse une demande `PENDING` sur une annonce dépubliée, que l'expiration à 48 heures rend.
- **Pas d'`Idempotency-Key`** : rejouée, la suppression trouve un jeton sans compte et répond `401`.

## Les photos d'annonce

Deux temps : `POST /listing/photo` (jeton, multipart, champ `photo`) enregistre une photo et rend son
identifiant ; `POST /listing` et `PATCH /listing/:id` ne reçoivent que ces identifiants. `GET /listing/photo/:id`
est public, comme la fiche. Entité `ListingPhoto`, cas d'usage `UploadListingPhoto` et `GetListingPhoto`, table
`listing_photos`.

- **Les octets vivent dans Postgres (`listing_photos.bytes`, `bytea`), pas dans un stockage objet.** Rien à
  configurer sur Railway, et les photos suivent les sauvegardes de la base. Le site et l'app les réduisent à
  2048 px en JPEG avant l'envoi (quelques centaines de Ko). Passer à S3 ou R2, c'est un autre adaptateur de
  `PhotoStorage`, rien d'autre.
- **Le format se lit dans les premiers octets** (`ListingPhoto.upload`), jamais dans le `Content-Type` ni le nom
  du fichier : JPEG, PNG, WebP, sinon `415`. La photo est resservie sous ce format, avec `nosniff` et
  `Content-Security-Policy: default-src 'none'` : Caddy sert `/api` sur le domaine du site, et une page HTML
  déguisée en photo y deviendrait un script.
- **Une photo n'entre dans une annonce que si son propre compte l'a envoyée** (`findIdsOwnedBy`, sinon
  `UnknownPhotoError`, `400`). Sans ce filtre, n'importe qui recopierait les photos d'une autre annonce.
- **Multer coupe à 10 Mo avant le cas d'usage, en anglais.** `FileInterceptor` (de `@nestjs/platform-express`,
  sans `@types/multer` : `UploadedPhoto` est typé à la main) garde le fichier en mémoire et lève
  `PayloadTooLargeException('File too large')` au-delà ; `PhotoTooLargeFilter` la réécrit en français. Ne pas
  retirer la limite : elle protège aussi la mémoire du processus.
- **`Cache-Control: immutable` est posé par `res.setHeader`, après la lecture réussie — jamais par `@Header()`.**
  Nest pose les en-têtes de `@Header()` avant d'appeler le handler : un `404` ou un `500` serait mis en cache un an.
- **`KnexPhotoStorage` ne cherche que des UUID.** Les annonces d'avant portent des références en texte
  (`photo-1.jpg`) ; passées telles quelles à la colonne `uuid`, Postgres lèverait `invalid input syntax for type
  uuid`. Elles restent valables sur les annonces qui les portaient, et le front les montre sans image.
- **Les photos orphelines ne sont balayées par rien.** Une photo envoyée puis jamais publiée (formulaire
  abandonné, publication refusée puis relancée, qui renvoie tout), ou retirée d'une annonce, reste en base.
  Seule la suppression du compte les efface (`KnexAccountFootprint.erase`). Aucun quota par compte non plus :
  à traiter avant d'ouvrir largement l'inscription.

## La recherche par dates

`GET /listing?fromDay=AAAA-MM-JJ&toDay=AAAA-MM-JJ` (public) ne rend que les annonces libres sur tout le séjour :
`ListFreeListings` garde celles que `Listing.isOpenOver` déclare ouvertes du premier au dernier jour, et retire celles
dont le port `PlaceOccupancy` dit la place retenue. Sans les deux paramètres, la route est inchangée ; avec un seul,
`400`.

- **« Retenue » veut dire : la contrainte d'exclusion refuserait une demande sur ces jours.** `KnexPlaceOccupancy`
  lit `rental_requests` par des noms recopiés, comme `KnexAccountFootprint` : `status NOT IN ('EXPIRED', 'CANCELLED',
  'ABANDONED', 'PAYMENT_FAILED')` est la clause `WHERE` de `rental_requests_place_period_excl`, et le chevauchement
  est le même `tstzrange(..., '[]') &&`, les jours cherchés convertis en SQL aux bornes de `parisPeriodOfDays`
  (minuit de Paris, veille du lendemain moins une milliseconde). Un statut qui libère des dates change aux deux
  endroits, sinon la recherche promet une place que la demande refusera. `KnexPlaceOccupancy.int.spec.ts` garde les
  statuts, les jours qui se touchent et le passage à l'heure d'hiver.
- **Par `place_key`, jamais par `listing_id`** : une place dépubliée puis republiée garde ses réservations sous un autre
  identifiant d'annonce, et c'est la place que la contrainte départage.
- **`OptionalAuthGuard` sur `GET /listing`** : un jeton valide fait ignorer au compte **sa propre** demande
  `AWAITING_PAYMENT`, que `RequestRental` remplacerait (EX-50) — sans quoi le conducteur qui a fermé la page de
  Stripe ne retrouverait pas la place qu'il était en train de réserver. Un jeton absent, expiré ou forgé ne refuse
  jamais rien : la route reste publique. `createControllerTestApp` remplace cette garde aussi.
- **Une demande échue mais pas encore balayée retient encore la place**, jusqu'au prochain passage de
  `RentalSweepScheduler` (5 min) : `RequestRental` expire à la demande, la recherche ne fait que lire.
- **La fenêtre d'ouverture compare des jours UTC** (`available_from`/`available_to` sont écrits à minuit UTC par le
  formulaire), comme `isListingAvailableOn` du front et comme `POST /rental-request`, qui la vérifie aussi (voir
  « l'ordre des gardes » plus haut).

## Frozen versions — do not bump without reading the reason

| App | Paquet | Pin | Pourquoi — ce qui casse |
| --- | --- | --- | --- |
| api | `typescript` | `~5.9.3` | `ts-jest` n'accepte que `typescript >=4.3 <7` et `typescript-eslint` que `>=4.8.4 <6.1.0` — c'est ce second plafond, plus étroit, qui commande. Vérifié dans le `peerDependencies` des paquets installés, 2026-09-16 : `grep -A8 '"peerDependencies"' node_modules/.pnpm/ts-jest@*/node_modules/ts-jest/package.json` → `>=4.3 <7` ; même commande sur `typescript-eslint` → `>=4.8.4 <6.1.0`. |
