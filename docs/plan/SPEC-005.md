---
spec: SPEC-005
statut: valide
revision: 2
valide_le: 2026-09-23
valide_par: JP
derive_de: SPEC-005
apps: [api, front, e2e]
cas: 18
stories: 5
---

# SPEC-005 · Plan

Construit à la main, sans agents, sur la même branche que SPEC-004 ; la table `## Stories` tient lieu
de backlog.

## Couverture par barreau

| Barreau | api | front | e2e | Cas |
|---|---|---|---|---|
| unit | 12 | 2 | 0 | 14 |
| int-repo | 2 | 0 | 0 | 2 |
| int-http | 1 | 0 | 0 | 1 |
| e2e | 0 | 0 | 1 | 1 |
| **total** | 15 | 2 | 1 | **18** |

Aucun écart avec la suggestion de la spec.

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-01 | unit | api | US-035 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | releases the hold of a request still awaiting the owner |
| EX-02 | unit | api | US-035 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | refuses to cancel a rental that has started |
| EX-03 | unit | api | US-035 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | refunds once when cancelled twice |
| EX-04 | unit | api | US-035 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | lets no other account cancel |
| EX-05 | unit | api | US-035 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | does not cancel a request awaiting payment, which is abandoned instead |
| EX-06 | unit | api | US-036 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | refunds in full a rental cancelled five days before |
| EX-07 | unit | api | US-036 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | refunds a rental cancelled at the deadline itself |
| EX-08 | unit | api | US-036 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | keeps the money of a rental cancelled one minute after the deadline |
| EX-09 | int-repo | api | US-036 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | gives back the dates of a rental cancelled without refund |
| EX-10 | unit | api | US-037 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | keeps the deadline frozen at request time when the delay grows later |
| EX-11 | int-repo | api | US-037 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | writes the free-cancellation deadline with the request |
| EX-12 | unit | api | US-038 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | refunds in full a rental the owner cancels after the renter deadline |
| EX-13 | unit | api | US-038 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | releases the hold of a request the owner cancels |
| EX-14 | unit | api | US-038 | `apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts` | lets the owner cancel no request he cannot see |
| EX-15 | unit | front | US-039 | `apps/front/src/app/rental/domain/entities/RentalCancellation.unit.spec.ts` | reads the cancellation terms before confirming |
| EX-16 | unit | front | US-039 | `apps/front/src/app/rental/domain/entities/RentalRequestView.unit.spec.ts` | labels a rental cancelled without refund |
| EX-17 | int-http | api | US-035 | `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts` | answers the effect on the money, 404 for a malformed id, 409 once started |
| EX-18 | e2e | e2e | US-039 | `apps/e2e/tests/real/rental/cancel-a-booking.spec.ts` | lets the renter cancel a paid booking and see the refund |

<!-- jp-way:cas {"ex": "EX-01", "barreau": "unit", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "releases the hold of a request still awaiting the owner","empreinte":"384d9de1"} -->
<!-- jp-way:cas {"ex": "EX-02", "barreau": "unit", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "refuses to cancel a rental that has started","empreinte":"d5289c11"} -->
<!-- jp-way:cas {"ex": "EX-03", "barreau": "unit", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "refunds once when cancelled twice","empreinte":"f6979fda"} -->
<!-- jp-way:cas {"ex": "EX-04", "barreau": "unit", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "lets no other account cancel","empreinte":"83a6612f"} -->
<!-- jp-way:cas {"ex": "EX-05", "barreau": "unit", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "does not cancel a request awaiting payment, which is abandoned instead","empreinte":"5a6cb151"} -->
<!-- jp-way:cas {"ex": "EX-06", "barreau": "unit", "app": "api", "story": "US-036", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "refunds in full a rental cancelled five days before","empreinte":"af2df1e7"} -->
<!-- jp-way:cas {"ex": "EX-07", "barreau": "unit", "app": "api", "story": "US-036", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "refunds a rental cancelled at the deadline itself","empreinte":"16b92a9b"} -->
<!-- jp-way:cas {"ex": "EX-08", "barreau": "unit", "app": "api", "story": "US-036", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "keeps the money of a rental cancelled one minute after the deadline","empreinte":"d06f4d4d"} -->
<!-- jp-way:cas {"ex": "EX-09", "barreau": "int-repo", "app": "api", "story": "US-036", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "gives back the dates of a rental cancelled without refund","empreinte":"a7329428"} -->
<!-- jp-way:cas {"ex": "EX-10", "barreau": "unit", "app": "api", "story": "US-037", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "keeps the deadline frozen at request time when the delay grows later","empreinte":"5989b778"} -->
<!-- jp-way:cas {"ex": "EX-11", "barreau": "int-repo", "app": "api", "story": "US-037", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "writes the free-cancellation deadline with the request","empreinte":"baa9fff9"} -->
<!-- jp-way:cas {"ex": "EX-12", "barreau": "unit", "app": "api", "story": "US-038", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "refunds in full a rental the owner cancels after the renter deadline","empreinte":"56e2c07d"} -->
<!-- jp-way:cas {"ex": "EX-13", "barreau": "unit", "app": "api", "story": "US-038", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "releases the hold of a request the owner cancels","empreinte":"3bf78e9d"} -->
<!-- jp-way:cas {"ex": "EX-14", "barreau": "unit", "app": "api", "story": "US-038", "chemin": "apps/api/src/rental/domain/usecases/cancel-rental/CancelRental.unit.spec.ts", "titre": "lets the owner cancel no request he cannot see","empreinte":"7b244bc8"} -->
<!-- jp-way:cas {"ex": "EX-15", "barreau": "unit", "app": "front", "story": "US-039", "chemin": "apps/front/src/app/rental/domain/entities/RentalCancellation.unit.spec.ts", "titre": "reads the cancellation terms before confirming","empreinte":"6419efd0"} -->
<!-- jp-way:cas {"ex": "EX-16", "barreau": "unit", "app": "front", "story": "US-039", "chemin": "apps/front/src/app/rental/domain/entities/RentalRequestView.unit.spec.ts", "titre": "labels a rental cancelled without refund","empreinte":"5c8c7bcd"} -->
<!-- jp-way:cas {"ex": "EX-17", "barreau": "int-http", "app": "api", "story": "US-035", "chemin": "apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts", "titre": "answers the effect on the money, 404 for a malformed id, 409 once started","empreinte":"54c4fd77"} -->
<!-- jp-way:cas {"ex": "EX-18", "barreau": "e2e", "app": "e2e", "story": "US-039", "chemin": "apps/e2e/tests/real/rental/cancel-a-booking.spec.ts", "titre": "lets the renter cancel a paid booking and see the refund","empreinte":"e147f8a8"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-035 | Le conducteur annule sa réservation avant son début | api | unit int-http | EX-01 EX-02 EX-03 EX-04 EX-05 EX-17 | — |
| 2 | US-036 | Remboursé jusqu'à l'échéance, pas après | api | unit int-repo | EX-06 EX-07 EX-08 EX-09 | — |
| 3 | US-037 | L'échéance figée à la demande | api | unit int-repo | EX-10 EX-11 | — |
| 4 | US-038 | Le loueur annule, le conducteur récupère tout | api | unit | EX-12 EX-13 EX-14 | — |
| 5 | US-039 | Lire ce que l'annulation coûte, et ce qu'elle a produit | front e2e | unit e2e | EX-15 EX-16 EX-18 | — |

## Dépendances

| Story | Dépend de | Nature |
|---|---|---|
| US-036 | US-035 | contrat — `CancelRental` et sa route |
| US-037 | US-036 | schéma — la colonne de l'échéance |
| US-038 | US-035 | contrat — `CancelRental` |
| US-039 | US-035 US-036 | contrat — la route et les champs `startsAt` / `freeCancellationUntil` |

## Ce qui n'est pas testé, et pourquoi

Les filets de la sonde de couverture de la spec : la dette envers le conducteur reprise par le
balayage de SPEC-004 ; l'annulation idempotente par filtre de statut ; l'échéance donnée par la
migration aux demandes d'avant cette spec ; l'état vide de « Mes réservations » ; les routes de
lecture limitées au compte connecté.
