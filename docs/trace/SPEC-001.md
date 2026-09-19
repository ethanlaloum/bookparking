---
spec: SPEC-001
genere_le: 2026-09-19
verdict: LACUNES MINEURES
genere: true
---

# Traçabilité — SPEC-001 · Publier une place de parking en location
_Généré par `jp-trace.mjs manifest` — ne pas éditer à la main._

Verdict : **LACUNES MINEURES** · 45/45 exemples couverts

## RG-01 — une place, identifiée par son adresse et son numéro de box, ne peut avoir qu'une seule annonce active

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-01 une première annonce pour une place qui n'en a aucune | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:34` | #2 | https://github.com/ethanlaloum/bookparking/pull/12 |
| EX-02 une seconde annonce pour la place déjà annoncée | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:129` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-13 republier la même place après l'avoir dépubliée | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:288` | #8 | https://github.com/ethanlaloum/bookparking/pull/19 |
| EX-14 un autre loueur publie le box déjà annoncé | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:145` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-35 un autre box à la même adresse | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:205` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-15 publier pendant une location en cours sur la place | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:162` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-16 la même adresse écrite autrement, le même box | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:177` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-38 le même box écrit avec une espace en trop | bug | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:221` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |
| EX-39 deux publications simultanées de la même place écrite autrement | bug | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts:44` | #4 | https://github.com/ethanlaloum/bookparking/pull/14 |

## RG-02 — une annonce n'est publiable que si elle porte une adresse, un numéro de box, une description de l'accès, au moins une photo, une grille tarifaire et une période de disponibilité

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-03 une annonce complète est publiée | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:20` | #11 | — |
| EX-04 une annonce sans aucune photo | mapping | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:38` | #3 | https://github.com/ethanlaloum/bookparking/pull/13 |
| EX-17 une annonce portant exactement une photo | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:48` | #2 | https://github.com/ethanlaloum/bookparking/pull/12 |
| EX-18 une période de disponibilité entièrement passée | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:99` | #3 | https://github.com/ethanlaloum/bookparking/pull/13 |
| EX-19 le stockage des photos répond une erreur | sonde | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts:22`<br>`apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:114` | #3 | https://github.com/ethanlaloum/bookparking/pull/13 |
| EX-36 un visiteur non connecté publie une annonce | bug | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:49` | #3 | https://github.com/ethanlaloum/bookparking/pull/13 |
| EX-37 un loueur connecté désigne un autre loueur dans son annonce | bug | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:60` | #3 | https://github.com/ethanlaloum/bookparking/pull/13 |

## RG-03 — le prix d'une durée est la combinaison la moins chère des paliers proposés par la grille du loueur ; la plateforme n'impose aucun tarif

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-05 un mois entier au tarif du mois | mapping | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts:9` | #6 | https://github.com/ethanlaloum/bookparking/pull/16 |
| EX-20 dix jours facturés à la meilleure combinaison de paliers | sonde | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts:24` | #6 | https://github.com/ethanlaloum/bookparking/pull/16 |
| EX-21 aucun palier ne couvre la période demandée | sonde | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts:41` | #6 | https://github.com/ethanlaloum/bookparking/pull/16 |
| EX-22 la grille change après une demande | sonde | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:11` | #7 | https://github.com/ethanlaloum/bookparking/pull/17 |
| EX-23 une combinaison de paliers au centime près | sonde | `apps/api/src/rental/domain/services/computeRentalPrice.unit.spec.ts:56` | #6 | https://github.com/ethanlaloum/bookparking/pull/16 |

## RG-04 — une grille tarifaire propose au moins une durée ; le loueur choisit lesquelles parmi jour, semaine et mois

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-06 une grille qui ne porte que le mois | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:254` | #5 | https://github.com/ethanlaloum/bookparking/pull/15 |
| EX-07 une grille sans aucune durée | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:238` | #5 | https://github.com/ethanlaloum/bookparking/pull/15 |
| EX-24 retirer la dernière durée d'une grille déjà publiée | sonde | `apps/api/src/listing/domain/usecases/update-listing-pricing/UpdateListingPricing.unit.spec.ts:7` | #5 | https://github.com/ethanlaloum/bookparking/pull/15 |
| EX-25 une grille à 0,00 € | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:271` | #5 | https://github.com/ethanlaloum/bookparking/pull/15 |

## RG-05 — l'adresse exacte est visible sur l'annonce, avant toute réservation

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-08 une conductrice consulte l'annonce sans avoir rien demandé | mapping | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:79` | #10 | https://github.com/ethanlaloum/bookparking/pull/21 |
| EX-26 un visiteur non connecté consulte l'annonce | sonde | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:98` | #10 | https://github.com/ethanlaloum/bookparking/pull/21 |
| EX-27 l'annonce dépubliée ne montre plus rien | sonde | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:116` | #10 | https://github.com/ethanlaloum/bookparking/pull/21 |
| EX-44 la description d'accès n'est pas publique | bug | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:136` | — | — |
| EX-45 un lien d'annonce mal formé | bug | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts:154` | — | — |

## RG-06 — une annonce reste publiée pendant une location, et les dates déjà louées ne sont plus demandables

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-09 des dates libres après la location en cours | mapping | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:38` | #7 | https://github.com/ethanlaloum/bookparking/pull/17 |
| EX-10 des dates déjà louées | mapping | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:57` | #7 | https://github.com/ethanlaloum/bookparking/pull/17 |
| EX-28 le dernier jour loué reste indisponible | sonde | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:76` | #7 | https://github.com/ethanlaloum/bookparking/pull/17 |
| EX-29 une journée demandée depuis un autre fuseau | sonde | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:95` | #7 | https://github.com/ethanlaloum/bookparking/pull/17 |
| EX-40 une période demandée démesurément longue | bug | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:117` | — | — |
| EX-41 une date de demande impossible | bug | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:136` | — | — |
| EX-30 deux conducteurs demandent les mêmes dates au même instant | sonde | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts:24` | #9 | https://github.com/ethanlaloum/bookparking/pull/20 |
| EX-31 une demande sur une annonce dépubliée | sonde | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts:155` | #8 | https://github.com/ethanlaloum/bookparking/pull/19 |

## RG-07 — un loueur peut dépublier son annonce à tout moment, sans effet sur les locations déjà confirmées

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-11 dépublier alors qu'une location est confirmée | mapping | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts:10` | #8 | https://github.com/ethanlaloum/bookparking/pull/19 |
| EX-32 une demande arrive à l'instant de la dépublication | sonde | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts:37` | #9 | https://github.com/ethanlaloum/bookparking/pull/20 |
| EX-33 dépublier une annonce déjà dépubliée | sonde | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts:27` | #8 | https://github.com/ethanlaloum/bookparking/pull/19 |
| EX-42 la dépublication vue de la base | bug | `apps/api/src/listing/adapters/repositories/listing/KnexListingRepository.int.spec.ts:67` | — | — |
| EX-43 dépublier l'annonce d'un autre loueur | bug | `apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.unit.spec.ts:47` | — | — |

## RG-08 — publier une annonce n'exige ni identité vérifiée ni IBAN

| Exemple | Origine | Tests | Story | PR |
|---|---|---|---|---|
| EX-12 publier sans pièce d'identité ni IBAN | mapping | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:63` | #2 | https://github.com/ethanlaloum/bookparking/pull/12 |
| EX-34 une vérification d'identité commencée et non terminée | sonde | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts:82` | #2 | https://github.com/ethanlaloum/bookparking/pull/12 |

## Lacunes

- 🟡 **amont-code** — cette spec a été écrite sur api@d3bf33b, l'app est maintenant à f7900eb
- 🟡 **amont-code** — code_sha cite l'app « mobile », absente de la configuration
- 🟡 **plan** — le plan dérive de la spec au sha 6a4a2bd, elle est maintenant à f7900eb
- 🟡 **chemins** — EX-03 · le fichier planifié n'existe pas : apps/e2e/tests/real/listing/publish-listing.spec.ts
