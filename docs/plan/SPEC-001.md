---
spec: SPEC-001
statut: valide
valide_le: 2026-09-17
valide_par: jp-way:auto
revision: 7
derive_de: SPEC-001@6a4a2bd86012937c99afc033c416e16d44f62de6
apps: [api, e2e]
cas: 45
stories: 10
---

# SPEC-001 · Plan

## Couverture par barreau

| Barreau | api | e2e | Cas | Exemples |
|---|---|---|---|---|
| unit | 33 | — | 33 | 33 |
| int-repo | 5 | — | 5 | 5 |
| int-http | 6 | — | 6 | 6 |
| journey | 0 | — | 0 | 0 |
| e2e | — | 1 | 1 | 1 |
| **total** | **44** | **1** | **45** | 43 exemples, 0 sans cas |

**Écarts avec la suggestion de la spec**
- EX-03 — suggéré `e2e` seul, planifié `unit` **et** `e2e` : sa première ligne `Alors` (« l'annonce est active ») est une décision de domaine (ligne 1, T1) ; sans cas `unit`, le chemin nominal de RG-02 ne serait prouvé qu'en haut de la pyramide. Redondance assumée (T7), seul `e2e` de la spec (T3).
- EX-19 — suggéré `int-repo`, planifié `unit` **et** `int-repo` (révision 2, 16/09/2026, pendant la construction de US-002) : sa ligne `Alors` « la publication est refusée avec « Impossible d'enregistrer les photos » » est un refus de domaine, observable au plus bas en `unit` (ligne 1, T1) ; sa ligne `Et` « aucune annonce, même incomplète, n'existe » est une garantie transactionnelle que seule une vraie base prouve (ligne 2). La révision 1 n'avait posé que le cas `int-repo`, ce qui obligeait `backend-data` à écrire dans un use-case. Redondance assumée (T7).
- EX-16 — suggéré `int-repo`, planifié `unit` : reconnaître deux écritures d'une même adresse comme la même place est une normalisation observable sans base (T1) ; la contrainte d'unicité en base est le filet ² de la sonde (T5).

- EX-36, EX-37 — ajoutés en révision 3 (17/09/2026, construction autonome de US-002, AUTO-01), suggérés et planifiés `int-http` : un garde qui refuse un appelant non authentifié et un loueur lu sur la requête authentifiée ne s'observent qu'à la frontière HTTP (ligne 3). Ils rejoignent US-002, story ouverte de la même app portant RG-02, qui passe à 5 exemples.

- EX-38, EX-39 — ajoutés en révision 4 (17/09/2026, construction autonome de US-003, AUTO-08) : EX-38 est un refus de domaine (ligne 1, `unit`) ; EX-39 est une contrainte d'unicité sur une clé de place normalisée que seule une vraie base prouve (ligne 2, `int-repo`). Ils rejoignent US-003, qui passe à 7 exemples : dépassement du plafond de 5 assumé pour ne pas livrer un contournement connu de RG-01.
- EX-15 — sa dernière ligne `Et` (« la location … n'est pas touchée ») n'a aucun sujet observable tant qu'aucun dépôt de locations n'existe (AUTO-10) ; le cas `unit` n'asserte que le refus et l'unicité.

- EX-41 — ajouté en révision 6 (17/09/2026, AUTO-19) : une date impossible échappait à la borne des 366 jours comme au contrôle des dates louées ; le barreau le plus bas qui l'observe est `unit` (T1). US-006 passe à 7 exemples.
- EX-40 — ajouté en révision 5 (17/09/2026, construction autonome de US-006, AUTO-17) : le refus d'une période démesurée est une décision de domaine (ligne 1, `unit`). US-006 passe à 6 exemples.

- EX-42, EX-43 — ajoutés en révision 7 (17/09/2026, construction autonome de US-007, AUTO-21) : la contrainte de la base n'acceptait que le statut actif, donc la dépublication ne pouvait pas être écrite (ligne 2, `int-repo`), et le refus de dépublier l'annonce d'autrui n'était prouvé par rien (ligne 1, `unit`). US-007 passe à 6 exemples et gagne le barreau `int-repo`.

**Découpage — le rouge d'abord**
- Un exemple qui affirme une **acceptation** ne peut être rouge pour la bonne raison que dans la story qui **crée** son use-case : après elle, la publication accepte déjà tout ce qu'aucune contrainte n'interdit, et le cadre est vert avant la moindre ligne de code — un cadre vide au sens de `build.md`, qui arrête la construction. Un **refus** ajoute une contrainte et reste rouge quelle que soit sa story.
- Le découpage place donc les acceptations dans la story qui crée leur use-case (US-001 pour la publication, US-006 pour la demande) et repousse les refus vers les stories suivantes.
- Un premier découpage par règle laissait 9 cadres verts d'emblée ; celui-ci en laisse **3, incompressibles** : la publication porte neuf exemples d'acceptation pour un plafond de cinq par story. Ce sont EX-35 (US-003), EX-06 et EX-25 (US-004) — des règles permissives (aucune borne de prix, une grille au seul mois, un autre box à la même adresse) dont la valeur est de garder contre un durcissement futur. Leur story l'annonce dans son bloc rouge.
- US-008 porte 2 exemples : reste légitime, aucune fusion possible sans dépasser 5 exemples (US-006, US-007) ni franchir l'agrégat. US-010 porte 1 exemple : story de parcours, seule de son app.

**Aucun cas `mobile`**
UX-01 (huit états), UX-02 et UX-03 ne portent aucun exemple dont la ligne `Alors` principale observe un état d'écran ; chaque ligne de refus correspond d'abord à la ligne 1 de la table. T2 interdit au plan d'en inventer. Correction : `/jp-way:spec SPEC-001` → `Réviser`.

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-03 | unit | api | US-001 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing carrying every mandatory field |
| EX-01 | unit | api | US-001 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | activates the first listing of a box that has none |
| EX-17 | unit | api | US-001 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing carrying exactly one photo |
| EX-12 | unit | api | US-001 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing without identity document or IBAN |
| EX-34 | unit | api | US-001 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing despite an unfinished identity verification |
| EX-18 | unit | api | US-002 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a listing whose availability period is entirely in the past |
| EX-19 | unit | api | US-002 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a listing when photo storage fails |
| EX-19 | int-repo | api | US-002 | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts` | leaves no partial listing when photo storage fails |
| EX-04 | int-http | api | US-002 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | responds with a validation error when the listing has no photo |
| EX-36 | int-http | api | US-002 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | refuses to publish a listing for an unauthenticated visitor |
| EX-37 | int-http | api | US-002 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | publishes the listing for the authenticated landlord whatever owner the body names |
| EX-02 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a second listing for a box that already has an active one |
| EX-14 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses another owner's listing for a box that already has an active one |
| EX-15 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a new listing for a box whose active listing is under rental |
| EX-16 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | treats a differently spelled address with the same box as the same place |
| EX-35 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | accepts a listing for another box at the same address |
| EX-38 | unit | api | US-003 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a listing whose box differs from an active one only by surrounding spaces |
| EX-39 | int-repo | api | US-003 | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts` | keeps a single active listing when the same place is written twice differently |
| EX-07 | unit | api | US-004 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | refuses a listing whose pricing offers no duration |
| EX-24 | unit | api | US-004 | `apps/api/src/listing/domain/usecases/update-listing-pricing/UpdateListingPricing.unit.spec.ts` | refuses removing the last duration from a published listing's pricing |
| EX-06 | unit | api | US-004 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing whose pricing offers only the month |
| EX-25 | unit | api | US-004 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing priced at zero with no price bound |
| EX-05 | unit | api | US-005 | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts` | prices a full calendar month at the monthly rate |
| EX-20 | unit | api | US-005 | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts` | prices ten days at the cheapest combination of one week and three days |
| EX-21 | unit | api | US-005 | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts` | finds no price when no offered duration covers the requested period |
| EX-23 | unit | api | US-005 | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts` | prices a tier combination to the cent without extra rounding |
| EX-22 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | keeps the price of a request made before the pricing changed |
| EX-09 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | accepts a request for free dates after the current rental |
| EX-10 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | refuses a request overlapping already rented dates |
| EX-28 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | refuses a request starting on the last rented day |
| EX-29 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | bounds a requested day on the Europe/Paris calendar day |
| EX-40 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | refuses a request longer than the maximum rental period |
| EX-41 | unit | api | US-006 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | refuses a request whose dates cannot be read |
| EX-11 | unit | api | US-007 | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts` | unpublishes a listing without releasing its confirmed rental |
| EX-33 | unit | api | US-007 | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts` | keeps an already unpublished listing unpublished without error |
| EX-42 | int-repo | api | US-007 | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts` | stores a listing as unpublished and stops returning it as active |
| EX-43 | unit | api | US-007 | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts` | refuses to unpublish another landlord's listing |
| EX-31 | unit | api | US-007 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | refuses a request on an unpublished listing |
| EX-13 | unit | api | US-007 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | activates a new listing for a box whose previous listing was unpublished |
| EX-30 | int-repo | api | US-008 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | records only one of two simultaneous requests for the same dates |
| EX-32 | int-repo | api | US-008 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | records no request that races an unpublishing |
| EX-08 | int-http | api | US-009 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | exposes the exact address and box to a signed-in driver without any booking |
| EX-26 | int-http | api | US-009 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | exposes the exact address and box to an unauthenticated visitor |
| EX-27 | int-http | api | US-009 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | does not serve an unpublished listing nor its address |
| EX-03 | e2e | e2e | US-010 | `apps/e2e/tests/real/listing/publish-listing.spec.ts` | publishes a complete listing through the three-step form |

<!-- jp-way:cas {"ex":"EX-03","barreau":"unit","app":"api","story":"US-001","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing carrying every mandatory field","empreinte":"ecb18b1a"} -->
<!-- jp-way:cas {"ex":"EX-01","barreau":"unit","app":"api","story":"US-001","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"activates the first listing of a box that has none","empreinte":"c4326941"} -->
<!-- jp-way:cas {"ex":"EX-17","barreau":"unit","app":"api","story":"US-001","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing carrying exactly one photo","empreinte":"c4811539"} -->
<!-- jp-way:cas {"ex":"EX-12","barreau":"unit","app":"api","story":"US-001","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing without identity document or IBAN","empreinte":"45746fb7"} -->
<!-- jp-way:cas {"ex":"EX-34","barreau":"unit","app":"api","story":"US-001","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing despite an unfinished identity verification","empreinte":"fbe04369"} -->
<!-- jp-way:cas {"ex":"EX-18","barreau":"unit","app":"api","story":"US-002","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a listing whose availability period is entirely in the past","empreinte":"6b6dff30"} -->
<!-- jp-way:cas {"ex":"EX-19","barreau":"unit","app":"api","story":"US-002","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a listing when photo storage fails","empreinte":"fe908700"} -->
<!-- jp-way:cas {"ex":"EX-19","barreau":"int-repo","app":"api","story":"US-002","chemin":"apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts","titre":"leaves no partial listing when photo storage fails","empreinte":"fe908700"} -->
<!-- jp-way:cas {"ex":"EX-04","barreau":"int-http","app":"api","story":"US-002","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"responds with a validation error when the listing has no photo","empreinte":"463074f7"} -->
<!-- jp-way:cas {"ex":"EX-36","barreau":"int-http","app":"api","story":"US-002","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"refuses to publish a listing for an unauthenticated visitor","empreinte":"c0b202fc"} -->
<!-- jp-way:cas {"ex":"EX-37","barreau":"int-http","app":"api","story":"US-002","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"publishes the listing for the authenticated landlord whatever owner the body names","empreinte":"a589a181"} -->
<!-- jp-way:cas {"ex":"EX-02","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a second listing for a box that already has an active one","empreinte":"9422c560"} -->
<!-- jp-way:cas {"ex":"EX-14","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses another owner's listing for a box that already has an active one","empreinte":"575cdec5"} -->
<!-- jp-way:cas {"ex":"EX-15","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a new listing for a box whose active listing is under rental","empreinte":"83a12eee"} -->
<!-- jp-way:cas {"ex":"EX-16","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"treats a differently spelled address with the same box as the same place","empreinte":"0c2e49e5"} -->
<!-- jp-way:cas {"ex":"EX-35","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"accepts a listing for another box at the same address","empreinte":"72eebb9c"} -->
<!-- jp-way:cas {"ex":"EX-38","barreau":"unit","app":"api","story":"US-003","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a listing whose box differs from an active one only by surrounding spaces","empreinte":"8dbd2ebb"} -->
<!-- jp-way:cas {"ex":"EX-39","barreau":"int-repo","app":"api","story":"US-003","chemin":"apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts","titre":"keeps a single active listing when the same place is written twice differently","empreinte":"82c89208"} -->
<!-- jp-way:cas {"ex":"EX-07","barreau":"unit","app":"api","story":"US-004","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"refuses a listing whose pricing offers no duration","empreinte":"c8c2f730"} -->
<!-- jp-way:cas {"ex":"EX-24","barreau":"unit","app":"api","story":"US-004","chemin":"apps/api/src/listing/domain/usecases/update-listing-pricing/UpdateListingPricing.unit.spec.ts","titre":"refuses removing the last duration from a published listing's pricing","empreinte":"1c2a81f2"} -->
<!-- jp-way:cas {"ex":"EX-06","barreau":"unit","app":"api","story":"US-004","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing whose pricing offers only the month","empreinte":"e0cbbcb5"} -->
<!-- jp-way:cas {"ex":"EX-25","barreau":"unit","app":"api","story":"US-004","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing priced at zero with no price bound","empreinte":"e5220fa6"} -->
<!-- jp-way:cas {"ex":"EX-05","barreau":"unit","app":"api","story":"US-005","chemin":"apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts","titre":"prices a full calendar month at the monthly rate","empreinte":"a38aba96"} -->
<!-- jp-way:cas {"ex":"EX-20","barreau":"unit","app":"api","story":"US-005","chemin":"apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts","titre":"prices ten days at the cheapest combination of one week and three days","empreinte":"b2e920b1"} -->
<!-- jp-way:cas {"ex":"EX-21","barreau":"unit","app":"api","story":"US-005","chemin":"apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts","titre":"finds no price when no offered duration covers the requested period","empreinte":"f0a413ea"} -->
<!-- jp-way:cas {"ex":"EX-23","barreau":"unit","app":"api","story":"US-005","chemin":"apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts","titre":"prices a tier combination to the cent without extra rounding","empreinte":"c4c346a1"} -->
<!-- jp-way:cas {"ex":"EX-22","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"keeps the price of a request made before the pricing changed","empreinte":"36c71a77"} -->
<!-- jp-way:cas {"ex":"EX-09","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"accepts a request for free dates after the current rental","empreinte":"1c7986c8"} -->
<!-- jp-way:cas {"ex":"EX-10","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"refuses a request overlapping already rented dates","empreinte":"2d7b4d3c"} -->
<!-- jp-way:cas {"ex":"EX-28","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"refuses a request starting on the last rented day","empreinte":"d0e3da6c"} -->
<!-- jp-way:cas {"ex":"EX-29","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"bounds a requested day on the Europe/Paris calendar day","empreinte":"f741bf4e"} -->
<!-- jp-way:cas {"ex":"EX-40","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"refuses a request longer than the maximum rental period","empreinte":"c2a1f9a6"} -->
<!-- jp-way:cas {"ex":"EX-41","barreau":"unit","app":"api","story":"US-006","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"refuses a request whose dates cannot be read","empreinte":"b72de22e"} -->
<!-- jp-way:cas {"ex":"EX-11","barreau":"unit","app":"api","story":"US-007","chemin":"apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts","titre":"unpublishes a listing without releasing its confirmed rental","empreinte":"9e24fb4c"} -->
<!-- jp-way:cas {"ex":"EX-33","barreau":"unit","app":"api","story":"US-007","chemin":"apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts","titre":"keeps an already unpublished listing unpublished without error","empreinte":"e1ed63cf"} -->
<!-- jp-way:cas {"ex":"EX-42","barreau":"int-repo","app":"api","story":"US-007","chemin":"apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts","titre":"stores a listing as unpublished and stops returning it as active","empreinte":"3767dbc7"} -->
<!-- jp-way:cas {"ex":"EX-43","barreau":"unit","app":"api","story":"US-007","chemin":"apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts","titre":"refuses to unpublish another landlord's listing","empreinte":"384b921d"} -->
<!-- jp-way:cas {"ex":"EX-31","barreau":"unit","app":"api","story":"US-007","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"refuses a request on an unpublished listing","empreinte":"bd5b02a4"} -->
<!-- jp-way:cas {"ex":"EX-13","barreau":"unit","app":"api","story":"US-007","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"activates a new listing for a box whose previous listing was unpublished","empreinte":"4067f33a"} -->
<!-- jp-way:cas {"ex":"EX-30","barreau":"int-repo","app":"api","story":"US-008","chemin":"apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts","titre":"records only one of two simultaneous requests for the same dates","empreinte":"e98ef649"} -->
<!-- jp-way:cas {"ex":"EX-32","barreau":"int-repo","app":"api","story":"US-008","chemin":"apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts","titre":"records no request that races an unpublishing","empreinte":"feba9bc9"} -->
<!-- jp-way:cas {"ex":"EX-08","barreau":"int-http","app":"api","story":"US-009","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"exposes the exact address and box to a signed-in driver without any booking","empreinte":"6742a31f"} -->
<!-- jp-way:cas {"ex":"EX-26","barreau":"int-http","app":"api","story":"US-009","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"exposes the exact address and box to an unauthenticated visitor","empreinte":"62bb715f"} -->
<!-- jp-way:cas {"ex":"EX-27","barreau":"int-http","app":"api","story":"US-009","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"does not serve an unpublished listing nor its address","empreinte":"4a3d546a"} -->
<!-- jp-way:cas {"ex":"EX-03","barreau":"e2e","app":"e2e","story":"US-010","chemin":"apps/e2e/tests/real/listing/publish-listing.spec.ts","titre":"publishes a complete listing through the three-step form","empreinte":"ecb18b1a"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-001 | Publier une annonce | api | unit | EX-03 EX-01 EX-17 EX-12 EX-34 | #2 |
| 2 | US-002 | Refuser une annonce incomplète | api | unit int-repo int-http | EX-18 EX-19 EX-04 EX-36 EX-37 | #3 |
| 3 | US-003 | N'accepter qu'une annonce active par box | api | unit int-repo | EX-02 EX-14 EX-15 EX-16 EX-35 EX-38 EX-39 | #4 |
| 4 | US-004 | Exiger au moins une durée dans la grille | api | unit | EX-07 EX-24 EX-06 EX-25 | #5 |
| 5 | US-005 | Calculer le prix d'une période | api | unit | EX-05 EX-20 EX-21 EX-23 | #6 |
| 6 | US-006 | Demander une place sur des dates libres | api | unit | EX-22 EX-09 EX-10 EX-28 EX-29 EX-40 EX-41 | #7 |
| 7 | US-007 | Dépublier une annonce | api | unit int-repo | EX-11 EX-33 EX-31 EX-13 EX-42 EX-43 | #8 |
| 8 | US-008 | Enregistrer une seule demande malgré la concurrence | api | int-repo | EX-30 EX-32 | #9 |
| 9 | US-009 | Exposer l'adresse exacte d'une annonce | api | int-http | EX-08 EX-26 EX-27 | #10 |
| 10 | US-010 | Parcours de publication d'une place | e2e | e2e | EX-03 | #11 |

## Dépendances

| Story | Dépend de | Nature |
|---|---|---|
| US-008 | US-002 | schéma — la table des annonces, créée par la migration de US-002, que la table des demandes référence |
| US-010 | US-001 … US-009 | parcours — un e2e ne peut pas être rouge pour la bonne raison avant les deux côtés |

Graphe acyclique, vérifié. Les autres enchaînements sont de l'ordre, pas des arêtes : les stories 2 à 7 et 9 étendent un use-case créé plus tôt sans consommer ni son contrat ni son schéma.

## Ce qui n'est pas testé, et pourquoi

- RG-01 × Concurrence — `EX-39 filet` ² : contrainte d'unicité en base sur la clé de place normalisée, restreinte aux annonces actives ; EX-39 en est le représentant testé contre Postgres.
- RG-02 × Vide — `EX-04 filet` ⁶ : l'absence d'un champ obligatoire est refusée par la validation de la requête ; EX-04 en est le représentant testé et porte déjà un cas — cette cellule n'est pas « non testée », elle est le filet dont EX-04 est l'échantillon.
- RG-04 × Autorisation, RG-06 × Autorisation — `filet` ⁸ (même mécanisme, deux règles) : garde d'authentification sur la route, et vérification que le loueur agit sur sa propre annonce. RG-02 × Autorisation n'est plus un filet depuis la révision 3 : EX-36 et EX-37 la portent.
- RG-02 × Volume — `filet` ¹¹ : nombre et taille des fichiers bornés par la validation à la frontière HTTP.
- RG-02 × Données — `filet` ¹² : longueur maximale et jeu de caractères portés par le schéma de la requête.
- RG-06 × Volume — `filet` ²¹ : index sur les dates de location et pagination de l'historique d'une annonce.
- RG-07 × Autorisation — `filet` ²³ : vérification que le loueur est propriétaire de l'annonce qu'il dépublie.
- Les 43 cellules `écarté` de la sonde portent chacune leur raison dans les notes de bas de page de `## 5. Sonde de couverture` de la spec — aucune ne produit de cas, et aucune n'a besoin d'en produire un.
- Aucun cas `mobile` — les trois écrans de la spec ne portent aucun exemple observable sur ce rung (T2) ; le manque se corrige dans la spec, jamais dans le plan.
- Les 4 cas `int-repo` et `e2e` exigent Docker, actuellement à l'arrêt. Sans Docker, `/jp-way:build` refuse ces barreaux story par story.
- Aucune app ne porte encore de runner ni de `commands` : US-001 crée la config Jest unitaire de `apps/api`, US-002 sa config Jest d'intégration, US-010 crée la config Playwright de `apps/e2e`.
