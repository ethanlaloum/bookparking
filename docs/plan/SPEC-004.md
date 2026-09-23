---
spec: SPEC-004
statut: valide
revision: 3
valide_le: 2026-09-23
valide_par: JP
derive_de: SPEC-004
apps: [api, front, e2e]
cas: 43
stories: 9
---

# SPEC-004 · Plan

Construit à la main, sans agents (préférence de JP du 22/09/2026) : une seule branche, une seule
pull request pour toute la spec, et la table `## Stories` tient lieu de backlog — aucune issue
GitHub par story.

## Couverture par barreau

| Barreau | api | front | e2e | Cas |
|---|---|---|---|---|
| unit | 27 | 1 | 0 | 28 |
| int-repo | 5 | 0 | 0 | 5 |
| int-http | 4 | 0 | 0 | 4 |
| journey | 0 | 0 | 0 | 0 |
| e2e | 0 | 0 | 3 | 3 |
| **total** | 36 | 1 | 3 | **40** |

**Écarts avec la suggestion de la spec (4)**

- **EX-29, `journey` → `unit`.** Ce que l'exemple affirme, c'est que le balayage part d'une horloge
  de processus et non de l'arrivée d'une demande. L'api n'a aucun harnais `journey`, et l'en bâtir un
  pour cet exemple imposerait aussi un vrai Stripe dans ce barreau. Le déclencheur
  (`RentalSweepScheduler`) est prouvé au barreau `unit` sous une horloge simulée, et ce qu'il
  déclenche l'est par EX-26.
- **EX-30, EX-31, EX-32, `unit` → `int-repo`.** L'annulation par l'exploitant est une seule écriture
  de `KnexBackOfficeRepository.cancelRentalRequest`, qui passe le statut à `CANCELLED` et l'argent à
  « dû » dans le même `UPDATE` ; le back-office n'a aucun double en mémoire. C'est la ligne écrite
  qui porte la règle, et seul `int-repo` la lit. Le retour effectif de l'argent chez Stripe est
  celui du balayage, prouvé par EX-33, EX-34 et EX-36.

**Deux exemples portés à deux barreaux — EX-15 et EX-24** (T7). Leur cas `unit` prouve que le
domaine fait passer la demande à `ABANDONED` ou `PAYMENT_FAILED` ; leur cas `int-repo` prouve que
la contrainte d'exclusion rend alors les dates — ce qu'aucun double en mémoire ne sait dire.

**Une précision de barreau — EX-02.** La spec dit « la page de paiement ouverte porte 4500
centimes ». Au barreau `int-http`, le cas d'usage est une doublure : ce qui s'observe à la frontière,
c'est qu'aucun prix envoyé dans le corps n'atteint le cas d'usage. Que ce dernier ouvre la page au
prix figé est EX-01.

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-07 | int-repo | api | US-023 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | refuses a second request on dates still awaiting payment |
| EX-35 | int-repo | api | US-023 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | writes the expiry and the release owed on the same row, in one statement |
| EX-01 | unit | api | US-024 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | opens a card hold for the price the api froze |
| EX-03 | unit | api | US-024 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | opens no payment page for a period no price covers |
| EX-08 | unit | api | US-024 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | lets the payment page expire thirty minutes after the request |
| EX-09 | unit | api | US-024 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | abandons the request and frees its dates when Stripe does not answer |
| EX-02 | int-http | api | US-024 | `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts` | never passes a price sent in the body to the use-case |
| EX-04 | int-http | api | US-024 | `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts` | answers 201 with the request id and the payment page address |
| EX-05 | unit | api | US-024 | `apps/api/src/rental/domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests.unit.spec.ts` | hides a request still awaiting payment from the owner |
| EX-10 | unit | api | US-025 | `apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts` | hands the request to the owner once Stripe reports the hold |
| EX-12 | unit | api | US-025 | `apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts` | counts a hold reported twice only once |
| EX-15 | unit | api | US-025 | `apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts` | abandons the request when its payment page expires |
| EX-19 | unit | api | US-025 | `apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts` | releases a hold that arrives after the request was abandoned |
| EX-11 | int-http | api | US-025 | `apps/api/src/rental/adapters/rest/controllers/payment-webhook/payment-webhook.controller.int.spec.ts` | answers 400 to an event signed with another secret and changes nothing |
| EX-13 | int-http | api | US-025 | `apps/api/src/rental/adapters/rest/controllers/payment-webhook/payment-webhook.controller.int.spec.ts` | acknowledges with 200 a well-signed event no request carries |
| EX-16 | unit | api | US-026 | `apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts` | closes the payment page and abandons the request |
| EX-17 | unit | api | US-026 | `apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts` | refuses to abandon somebody else request as if it did not exist |
| EX-20 | unit | api | US-026 | `apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts` | refuses to abandon a request whose hold is already placed |
| EX-06 | unit | api | US-027 | `apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts` | refuses to confirm a request still awaiting payment |
| EX-21 | unit | api | US-027 | `apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts` | captures the hold when the owner confirms |
| EX-22 | unit | api | US-027 | `apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts` | captures once when the owner confirms twice |
| EX-23 | unit | api | US-027 | `apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts` | fails the confirmation and changes nothing when Stripe does not answer |
| EX-24 | unit | api | US-027 | `apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts` | fails the confirmation and frees the dates when the bank declines the capture |
| EX-14 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | counts the owner forty-eight hours from the hold, not from the request |
| EX-18 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | abandons a request left without news from Stripe for two hours |
| EX-25 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | records as confirmed a capture the database missed |
| EX-26 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | expires the request and releases the hold forty-eight hours after it |
| EX-27 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | leaves the request alone one minute before |
| EX-28 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | never expires a confirmed request |
| EX-33 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | keeps a release owed when Stripe does not answer, and settles it on the next sweep |
| EX-34 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | sends the same idempotency key on every attempt |
| EX-36 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | never returns money twice |
| EX-29 | unit | api | US-028 | `apps/api/src/rental/adapters/cron/RentalSweepScheduler.unit.spec.ts` | sweeps on its own clock, with no other request coming |
| EX-30 | int-repo | api | US-029 | `apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts` | owes the renter a full refund when a confirmed request is cancelled |
| EX-31 | int-repo | api | US-029 | `apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts` | owes the renter a release when a request awaiting the owner is cancelled |
| EX-32 | int-repo | api | US-029 | `apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts` | owes nothing when a request made before payments is cancelled |
| EX-37 | unit | front | US-030 | `apps/front/src/app/rental/domain/entities/RentalRequestView.unit.spec.ts` | labels every state of the renter money |
| EX-38 | e2e | e2e | US-031 | `apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts` | takes the renter to the Stripe payment page for the right amount |
| EX-39 | e2e | e2e | US-031 | `apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts` | frees the dates when the renter comes back without paying |
| EX-40 | e2e | e2e | US-031 | `apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts` | shows the hold to the renter and the request to the owner once paid |
| EX-41 | unit | api | US-028 | `apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts` | refunds, and never confirms, a cancelled request whose capture the database missed |
| EX-15 | int-repo | api | US-023 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | frees the dates of an abandoned request |
| EX-24 | int-repo | api | US-023 | `apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts` | frees the dates of a request whose capture the bank declined |

<!-- jp-way:cas {"ex": "EX-07", "barreau": "int-repo", "app": "api", "story": "US-023", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "refuses a second request on dates still awaiting payment","empreinte":"9f71f794"} -->
<!-- jp-way:cas {"ex": "EX-35", "barreau": "int-repo", "app": "api", "story": "US-023", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "writes the expiry and the release owed on the same row, in one statement","empreinte":"4149a4f3"} -->
<!-- jp-way:cas {"ex": "EX-01", "barreau": "unit", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts", "titre": "opens a card hold for the price the api froze","empreinte":"fd03e3a6"} -->
<!-- jp-way:cas {"ex": "EX-03", "barreau": "unit", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts", "titre": "opens no payment page for a period no price covers","empreinte":"f350c1c9"} -->
<!-- jp-way:cas {"ex": "EX-08", "barreau": "unit", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts", "titre": "lets the payment page expire thirty minutes after the request","empreinte":"08857b44"} -->
<!-- jp-way:cas {"ex": "EX-09", "barreau": "unit", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts", "titre": "abandons the request and frees its dates when Stripe does not answer","empreinte":"bd89c335"} -->
<!-- jp-way:cas {"ex": "EX-02", "barreau": "int-http", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts", "titre": "never passes a price sent in the body to the use-case","empreinte":"0419d26f"} -->
<!-- jp-way:cas {"ex": "EX-04", "barreau": "int-http", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts", "titre": "answers 201 with the request id and the payment page address","empreinte":"b724d69a"} -->
<!-- jp-way:cas {"ex": "EX-05", "barreau": "unit", "app": "api", "story": "US-024", "chemin": "apps/api/src/rental/domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests.unit.spec.ts", "titre": "hides a request still awaiting payment from the owner","empreinte":"d16dc5ed"} -->
<!-- jp-way:cas {"ex": "EX-10", "barreau": "unit", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts", "titre": "hands the request to the owner once Stripe reports the hold","empreinte":"3df86839"} -->
<!-- jp-way:cas {"ex": "EX-12", "barreau": "unit", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts", "titre": "counts a hold reported twice only once","empreinte":"af084591"} -->
<!-- jp-way:cas {"ex": "EX-15", "barreau": "unit", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts", "titre": "abandons the request when its payment page expires","empreinte":"972a25c0"} -->
<!-- jp-way:cas {"ex": "EX-19", "barreau": "unit", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/domain/usecases/record-payment-event/RecordPaymentEvent.unit.spec.ts", "titre": "releases a hold that arrives after the request was abandoned","empreinte":"d16c26bb"} -->
<!-- jp-way:cas {"ex": "EX-11", "barreau": "int-http", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/adapters/rest/controllers/payment-webhook/payment-webhook.controller.int.spec.ts", "titre": "answers 400 to an event signed with another secret and changes nothing","empreinte":"120d0f1f"} -->
<!-- jp-way:cas {"ex": "EX-13", "barreau": "int-http", "app": "api", "story": "US-025", "chemin": "apps/api/src/rental/adapters/rest/controllers/payment-webhook/payment-webhook.controller.int.spec.ts", "titre": "acknowledges with 200 a well-signed event no request carries","empreinte":"3063ae25"} -->
<!-- jp-way:cas {"ex": "EX-16", "barreau": "unit", "app": "api", "story": "US-026", "chemin": "apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts", "titre": "closes the payment page and abandons the request","empreinte":"297ad7b4"} -->
<!-- jp-way:cas {"ex": "EX-17", "barreau": "unit", "app": "api", "story": "US-026", "chemin": "apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts", "titre": "refuses to abandon somebody else request as if it did not exist","empreinte":"fe579ab3"} -->
<!-- jp-way:cas {"ex": "EX-20", "barreau": "unit", "app": "api", "story": "US-026", "chemin": "apps/api/src/rental/domain/usecases/abandon-rental-request/AbandonRentalRequest.unit.spec.ts", "titre": "refuses to abandon a request whose hold is already placed","empreinte":"382d1537"} -->
<!-- jp-way:cas {"ex": "EX-06", "barreau": "unit", "app": "api", "story": "US-027", "chemin": "apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts", "titre": "refuses to confirm a request still awaiting payment","empreinte":"63799892"} -->
<!-- jp-way:cas {"ex": "EX-21", "barreau": "unit", "app": "api", "story": "US-027", "chemin": "apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts", "titre": "captures the hold when the owner confirms","empreinte":"1196fb76"} -->
<!-- jp-way:cas {"ex": "EX-22", "barreau": "unit", "app": "api", "story": "US-027", "chemin": "apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts", "titre": "captures once when the owner confirms twice","empreinte":"3af213fa"} -->
<!-- jp-way:cas {"ex": "EX-23", "barreau": "unit", "app": "api", "story": "US-027", "chemin": "apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts", "titre": "fails the confirmation and changes nothing when Stripe does not answer","empreinte":"74499889"} -->
<!-- jp-way:cas {"ex": "EX-24", "barreau": "unit", "app": "api", "story": "US-027", "chemin": "apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.unit.spec.ts", "titre": "fails the confirmation and frees the dates when the bank declines the capture","empreinte":"bba70aa5"} -->
<!-- jp-way:cas {"ex": "EX-14", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "counts the owner forty-eight hours from the hold, not from the request","empreinte":"0919eaa3"} -->
<!-- jp-way:cas {"ex": "EX-18", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "abandons a request left without news from Stripe for two hours","empreinte":"2dfe9692"} -->
<!-- jp-way:cas {"ex": "EX-25", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "records as confirmed a capture the database missed","empreinte":"f95ef40e"} -->
<!-- jp-way:cas {"ex": "EX-26", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "expires the request and releases the hold forty-eight hours after it","empreinte":"2adf9028"} -->
<!-- jp-way:cas {"ex": "EX-27", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "leaves the request alone one minute before","empreinte":"eb4d3521"} -->
<!-- jp-way:cas {"ex": "EX-28", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "never expires a confirmed request","empreinte":"a9ca313c"} -->
<!-- jp-way:cas {"ex": "EX-33", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "keeps a release owed when Stripe does not answer, and settles it on the next sweep","empreinte":"c6ed9321"} -->
<!-- jp-way:cas {"ex": "EX-34", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "sends the same idempotency key on every attempt","empreinte":"009abef6"} -->
<!-- jp-way:cas {"ex": "EX-36", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "never returns money twice","empreinte":"1e7aa0b6"} -->
<!-- jp-way:cas {"ex": "EX-29", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/adapters/cron/RentalSweepScheduler.unit.spec.ts", "titre": "sweeps on its own clock, with no other request coming","empreinte":"0b6bd5c8"} -->
<!-- jp-way:cas {"ex": "EX-30", "barreau": "int-repo", "app": "api", "story": "US-029", "chemin": "apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts", "titre": "owes the renter a full refund when a confirmed request is cancelled","empreinte":"57bb7901"} -->
<!-- jp-way:cas {"ex": "EX-31", "barreau": "int-repo", "app": "api", "story": "US-029", "chemin": "apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts", "titre": "owes the renter a release when a request awaiting the owner is cancelled","empreinte":"751bcdf9"} -->
<!-- jp-way:cas {"ex": "EX-32", "barreau": "int-repo", "app": "api", "story": "US-029", "chemin": "apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.int.spec.ts", "titre": "owes nothing when a request made before payments is cancelled","empreinte":"cc889a7e"} -->
<!-- jp-way:cas {"ex": "EX-37", "barreau": "unit", "app": "front", "story": "US-030", "chemin": "apps/front/src/app/rental/domain/entities/RentalRequestView.unit.spec.ts", "titre": "labels every state of the renter money","empreinte":"088d53d9"} -->
<!-- jp-way:cas {"ex": "EX-38", "barreau": "e2e", "app": "e2e", "story": "US-031", "chemin": "apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts", "titre": "takes the renter to the Stripe payment page for the right amount","empreinte":"ea290957"} -->
<!-- jp-way:cas {"ex": "EX-39", "barreau": "e2e", "app": "e2e", "story": "US-031", "chemin": "apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts", "titre": "frees the dates when the renter comes back without paying","empreinte":"bfea5102"} -->
<!-- jp-way:cas {"ex": "EX-40", "barreau": "e2e", "app": "e2e", "story": "US-031", "chemin": "apps/e2e/tests/real/rental/pay-a-rental-request.spec.ts", "titre": "shows the hold to the renter and the request to the owner once paid","empreinte":"97903df4"} -->
<!-- jp-way:cas {"ex": "EX-41", "barreau": "unit", "app": "api", "story": "US-028", "chemin": "apps/api/src/rental/domain/usecases/sweep-rental-requests/SweepRentalRequests.unit.spec.ts", "titre": "refunds, and never confirms, a cancelled request whose capture the database missed","empreinte":"7cb1d6df"} -->
<!-- jp-way:cas {"ex": "EX-15", "barreau": "int-repo", "app": "api", "story": "US-023", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "frees the dates of an abandoned request","empreinte":"972a25c0"} -->
<!-- jp-way:cas {"ex": "EX-24", "barreau": "int-repo", "app": "api", "story": "US-023", "chemin": "apps/api/src/rental/adapters/repositories/rental-request/KnexRentalRequestRepository.int.spec.ts", "titre": "frees the dates of a request whose capture the bank declined","empreinte":"bba70aa5"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-023 | Porter l'argent d'une demande en base | api | int-repo | EX-07 EX-15 EX-24 EX-35 | — |
| 2 | US-024 | Ouvrir la page de paiement à la demande | api | unit int-http | EX-01 EX-02 EX-03 EX-04 EX-05 EX-08 EX-09 | — |
| 3 | US-025 | Constater l'empreinte et l'expiration par Stripe | api | unit int-http | EX-10 EX-11 EX-12 EX-13 EX-15 EX-19 | — |
| 4 | US-026 | Abandonner sa demande en revenant de Stripe | api | unit | EX-16 EX-17 EX-20 | — |
| 5 | US-027 | Prélever à la confirmation | api | unit | EX-06 EX-21 EX-22 EX-23 EX-24 | — |
| 6 | US-028 | Balayer : expirer, abandonner, rendre l'argent | api | unit | EX-14 EX-18 EX-25 EX-26 EX-27 EX-28 EX-29 EX-33 EX-34 EX-36 EX-41 | — |
| 7 | US-029 | Rendre l'argent quand l'exploitant annule | api | int-repo | EX-30 EX-31 EX-32 | — |
| 8 | US-030 | Lire où en est son argent | front | unit | EX-37 | — |
| 9 | US-031 | Payer une demande dans un vrai navigateur | e2e | e2e | EX-38 EX-39 EX-40 | — |

US-024 et US-028 dépassent le plafond de cinq exemples : leurs exemples partagent un seul cas
d'usage chacun (`RequestRental`, `SweepRentalRequests`), et les couper ferait deux stories sur le
même fichier.

## Dépendances

| Story | Dépend de | Nature |
|---|---|---|
| US-024 | US-023 | schéma — les colonnes de paiement et le statut d'attente |
| US-025 | US-023 | schéma |
| US-026 | US-024 | contrat — le port `PaymentGateway` et la page ouverte |
| US-027 | US-025 | contrat — une empreinte constatée à prélever |
| US-028 | US-025 US-027 | contrat — les états de l'argent qu'il fait avancer |
| US-029 | US-023 | schéma |
| US-030 | US-024 | contrat — `GET /rental-request` et ses champs d'argent |
| US-031 | US-024 US-025 US-026 US-030 | contrat — le parcours entier |

## Ce qui n'est pas testé, et pourquoi

**Filets structurels (13)** — repris de la sonde de couverture de la spec, chacun pointant le code
ou la contrainte qui le tient : l'identité du conducteur tirée du jeton ; l'adresse de retour
construite depuis `FRONT_BASE_URL` ; le montant de Stripe jamais relu ; les renvois d'événements de
Stripe pendant trois jours ; l'unicité de la clé d'idempotence par demande et par opération ; le
balayage par lots ; l'annulation idempotente par filtre de statut ; `AdminGuard` ; l'état vide
existant de « Mes demandes » ; la route `GET /rental-request` limitée au compte connecté.

**L'adaptateur Stripe n'a pas de barreau à lui.** `StripePaymentGateway` parle au vrai Stripe ; il
est exercé par EX-38, EX-39 et EX-40, en mode test, dans le barreau `e2e`. Aucune doublure de
Stripe n'est écrite pour le tester : elle ne prouverait que la doublure.
