---
spec: SPEC-006
statut: valide
revision: 1
valide_le: 2026-09-24
valide_par: JP
derive_de: SPEC-006
apps: [api, e2e]
cas: 24
stories: 5
---

# SPEC-006 · Plan

Construit à la main, sans agents, dans la même arbre de travail que la refonte du front ; la table
`## Stories` tient lieu de backlog.

## Couverture par barreau

| Barreau | api | e2e | Cas |
|---|---|---|---|
| unit | 20 | 0 | 20 |
| int-repo | 4 | 0 | 4 |
| int-http | 0 | 0 | 0 |
| e2e | 0 | 0 | 0 |
| **total** | 24 | 0 | **24** |

Aucun écart avec la suggestion de la spec. `apps/e2e` ne gagne aucun cas : sa pile locale démarre
seulement l'api avec `EMAIL_SENDING=disabled` (Q-03).

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-01 | unit | api | US-040 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | queues a welcome email with the new account |
| EX-02 | unit | api | US-040 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | addresses the welcome email to the normalised address |
| EX-03 | unit | api | US-040 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | queues nothing when the address already has an account |
| EX-04 | unit | api | US-040 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | fails the registration when the email outbox is unreachable |
| EX-05 | int-repo | api | US-040 | `apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts` | leaves no email behind a transaction that fails |
| EX-06 | int-repo | api | US-040 | `apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts` | writes a queued email as pending with no attempt |
| EX-07 | unit | api | US-041 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | sends the welcome email and marks it sent |
| EX-08 | unit | api | US-041 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | sends an email swept twice only once |
| EX-09 | int-repo | api | US-041 | `apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts` | reads only pending emails, oldest first, one batch at a time |
| EX-10 | int-repo | api | US-041 | `apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts` | keeps the first sending time when an email is marked sent twice |
| EX-11 | unit | api | US-041 | `apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts` | posts the email to Resend with the key, the sender and the idempotency key |
| EX-12 | unit | api | US-042 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | keeps an email Resend cannot take and sends it on the next sweep |
| EX-13 | unit | api | US-042 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | abandons an email Resend refuses |
| EX-14 | unit | api | US-042 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | keeps retrying an email just short of 24 hours in the queue |
| EX-15 | unit | api | US-042 | `apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts` | abandons an email still failing 24 hours after it was queued |
| EX-16 | unit | api | US-042 | `apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts` | reads a rate limit as unavailable |
| EX-17 | unit | api | US-042 | `apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts` | reads a network failure as unavailable |
| EX-18 | unit | api | US-042 | `apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts` | reads an invalid address as refused |
| EX-19 | unit | api | US-043 | `apps/api/src/notification/domain/services/composeEmail.unit.spec.ts` | writes the welcome email in French with a link to the site |
| EX-20 | unit | api | US-043 | `apps/api/src/notification/domain/services/composeEmail.unit.spec.ts` | escapes markup carried by the address in the HTML version |
| EX-21 | unit | api | US-044 | `apps/api/src/infra/config/environment.unit.spec.ts` | refuses to start without a Resend key |
| EX-22 | unit | api | US-044 | `apps/api/src/infra/config/environment.unit.spec.ts` | starts with sending disabled and no key |
| EX-23 | unit | api | US-044 | `apps/api/src/infra/config/environment.unit.spec.ts` | refuses a sender with no address |
| EX-24 | unit | api | US-044 | `apps/api/src/notification/adapters/cron/EmailSweepScheduler.unit.spec.ts` | never sweeps when sending is disabled |

<!-- jp-way:cas {"ex": "EX-01", "barreau": "unit", "app": "api", "story": "US-040", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "queues a welcome email with the new account", "empreinte":"cf8cc838"} -->
<!-- jp-way:cas {"ex": "EX-02", "barreau": "unit", "app": "api", "story": "US-040", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "addresses the welcome email to the normalised address", "empreinte":"701d12af"} -->
<!-- jp-way:cas {"ex": "EX-03", "barreau": "unit", "app": "api", "story": "US-040", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "queues nothing when the address already has an account", "empreinte":"c655d900"} -->
<!-- jp-way:cas {"ex": "EX-04", "barreau": "unit", "app": "api", "story": "US-040", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "fails the registration when the email outbox is unreachable", "empreinte":"13d211cd"} -->
<!-- jp-way:cas {"ex": "EX-05", "barreau": "int-repo", "app": "api", "story": "US-040", "chemin": "apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts", "titre": "leaves no email behind a transaction that fails", "empreinte":"3f7b47a9"} -->
<!-- jp-way:cas {"ex": "EX-06", "barreau": "int-repo", "app": "api", "story": "US-040", "chemin": "apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts", "titre": "writes a queued email as pending with no attempt", "empreinte":"3ab5717e"} -->
<!-- jp-way:cas {"ex": "EX-07", "barreau": "unit", "app": "api", "story": "US-041", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "sends the welcome email and marks it sent", "empreinte":"45266de6"} -->
<!-- jp-way:cas {"ex": "EX-08", "barreau": "unit", "app": "api", "story": "US-041", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "sends an email swept twice only once", "empreinte":"bde20713"} -->
<!-- jp-way:cas {"ex": "EX-09", "barreau": "int-repo", "app": "api", "story": "US-041", "chemin": "apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts", "titre": "reads only pending emails, oldest first, one batch at a time", "empreinte":"76e4de3b"} -->
<!-- jp-way:cas {"ex": "EX-10", "barreau": "int-repo", "app": "api", "story": "US-041", "chemin": "apps/api/src/shared/email-outbox/adapters/repositories/KnexEmailOutbox.int.spec.ts", "titre": "keeps the first sending time when an email is marked sent twice", "empreinte":"7efdfe4f"} -->
<!-- jp-way:cas {"ex": "EX-11", "barreau": "unit", "app": "api", "story": "US-041", "chemin": "apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts", "titre": "posts the email to Resend with the key, the sender and the idempotency key", "empreinte":"fd81eca8"} -->
<!-- jp-way:cas {"ex": "EX-12", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "keeps an email Resend cannot take and sends it on the next sweep", "empreinte":"9923daaf"} -->
<!-- jp-way:cas {"ex": "EX-13", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "abandons an email Resend refuses", "empreinte":"e4f29de2"} -->
<!-- jp-way:cas {"ex": "EX-14", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "keeps retrying an email just short of 24 hours in the queue", "empreinte":"8a41a55b"} -->
<!-- jp-way:cas {"ex": "EX-15", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/domain/usecases/send-queued-emails/SendQueuedEmails.unit.spec.ts", "titre": "abandons an email still failing 24 hours after it was queued", "empreinte":"efa1e2de"} -->
<!-- jp-way:cas {"ex": "EX-16", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts", "titre": "reads a rate limit as unavailable", "empreinte":"a9778d8b"} -->
<!-- jp-way:cas {"ex": "EX-17", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts", "titre": "reads a network failure as unavailable", "empreinte":"57eef0d3"} -->
<!-- jp-way:cas {"ex": "EX-18", "barreau": "unit", "app": "api", "story": "US-042", "chemin": "apps/api/src/notification/adapters/services/resend/ResendEmailSender.unit.spec.ts", "titre": "reads an invalid address as refused", "empreinte":"53df9d17"} -->
<!-- jp-way:cas {"ex": "EX-19", "barreau": "unit", "app": "api", "story": "US-043", "chemin": "apps/api/src/notification/domain/services/composeEmail.unit.spec.ts", "titre": "writes the welcome email in French with a link to the site", "empreinte":"05fe58f7"} -->
<!-- jp-way:cas {"ex": "EX-20", "barreau": "unit", "app": "api", "story": "US-043", "chemin": "apps/api/src/notification/domain/services/composeEmail.unit.spec.ts", "titre": "escapes markup carried by the address in the HTML version", "empreinte":"de1d66cb"} -->
<!-- jp-way:cas {"ex": "EX-21", "barreau": "unit", "app": "api", "story": "US-044", "chemin": "apps/api/src/infra/config/environment.unit.spec.ts", "titre": "refuses to start without a Resend key", "empreinte":"d7bc185d"} -->
<!-- jp-way:cas {"ex": "EX-22", "barreau": "unit", "app": "api", "story": "US-044", "chemin": "apps/api/src/infra/config/environment.unit.spec.ts", "titre": "starts with sending disabled and no key", "empreinte":"229ab0c5"} -->
<!-- jp-way:cas {"ex": "EX-23", "barreau": "unit", "app": "api", "story": "US-044", "chemin": "apps/api/src/infra/config/environment.unit.spec.ts", "titre": "refuses a sender with no address", "empreinte":"ee9acaef"} -->
<!-- jp-way:cas {"ex": "EX-24", "barreau": "unit", "app": "api", "story": "US-044", "chemin": "apps/api/src/notification/adapters/cron/EmailSweepScheduler.unit.spec.ts", "titre": "never sweeps when sending is disabled", "empreinte":"90cd1b53"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-040 | L'inscription met en file la bienvenue | api | unit int-repo | EX-01 EX-02 EX-03 EX-04 EX-05 EX-06 | — |
| 2 | US-041 | Le balayage envoie par Resend, une seule fois | api | unit int-repo | EX-07 EX-08 EX-09 EX-10 EX-11 | — |
| 3 | US-042 | Retenter une panne, abandonner un refus | api | unit | EX-12 EX-13 EX-14 EX-15 EX-16 EX-17 EX-18 | — |
| 4 | US-043 | Le contenu de la bienvenue | api | unit | EX-19 EX-20 | — |
| 5 | US-044 | Pas de clé, pas de démarrage | api e2e | unit | EX-21 EX-22 EX-23 EX-24 | — |
