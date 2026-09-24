---
spec: SPEC-007
statut: valide
revision: 1
valide_le: 2026-09-24
valide_par: JP
derive_de: SPEC-007
apps: [api, front, mobile, e2e]
cas: 20
stories: 3
---

# SPEC-007 · Plan

Construit à la main, sans agents ; la table `## Stories` tient lieu de backlog. L'app iPhone ne porte
aucun cas : elle réutilise l'hexagone du front (EX-01, EX-08, EX-09, EX-19) et se vérifie par
`typecheck` et un bundle iOS.

## Couverture par barreau

| Barreau | api | front | e2e | Cas |
|---|---|---|---|---|
| unit | 14 | 4 | 0 | 18 |
| int-http | 1 | 0 | 0 | 1 |
| e2e | 0 | 0 | 1 | 1 |
| **total** | 15 | 4 | 1 | **20** |

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-01 | unit | front | US-045 | `apps/front/src/app/account/domain/entities/Password.unit.spec.ts` | refuses a confirmation that differs from the password |
| EX-02 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates two kinds under twelve characters as weak |
| EX-03 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates a common password as weak whatever it counts |
| EX-04 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates two kinds and twelve characters as medium and accepts it |
| EX-05 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates four kinds as strong |
| EX-06 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates seven varied characters as too short |
| EX-07 | unit | api | US-045 | `apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts` | rates a long accented password with emoji as strong |
| EX-08 | unit | front | US-045 | `apps/front/src/app/account/domain/entities/Password.unit.spec.ts` | rates every password exactly as the api does |
| EX-09 | unit | front | US-045 | `apps/front/src/app/account/domain/entities/Password.unit.spec.ts` | fills the gauge from red to orange to green |
| EX-10 | unit | api | US-045 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | refuses a registration with a weak password |
| EX-11 | unit | api | US-045 | `apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts` | refuses a change to a weak password |
| EX-12 | unit | api | US-046 | `apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts` | accepts a right proof within its time |
| EX-13 | unit | api | US-046 | `apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts` | accepts a proof only once |
| EX-14 | unit | api | US-046 | `apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts` | refuses a proof presented twenty minutes after its challenge |
| EX-15 | unit | api | US-046 | `apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts` | refuses a wrong number |
| EX-16 | unit | api | US-046 | `apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts` | refuses a challenge the api did not sign |
| EX-17 | unit | api | US-046 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | refuses a registration without an accepted proof |
| EX-18 | int-http | api | US-046 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | serves a challenge and requires a proof to register |
| EX-19 | unit | front | US-047 | `apps/front/src/app/account/domain/use-cases/human-proof/humanProofEpic.unit.spec.ts` | solves the challenge and asks a fresh one after a refused registration |
| EX-20 | e2e | e2e | US-047 | `apps/e2e/tests/real/auth/register-and-sign-in.spec.ts` | registers an account and lands signed in |

<!-- jp-way:cas {"ex": "EX-01", "barreau": "unit", "app": "front", "story": "US-045", "chemin": "apps/front/src/app/account/domain/entities/Password.unit.spec.ts", "titre": "refuses a confirmation that differs from the password", "empreinte":"a4519b9c"} -->
<!-- jp-way:cas {"ex": "EX-02", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates two kinds under twelve characters as weak", "empreinte":"47cb17fa"} -->
<!-- jp-way:cas {"ex": "EX-03", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates a common password as weak whatever it counts", "empreinte":"816ad8bc"} -->
<!-- jp-way:cas {"ex": "EX-04", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates two kinds and twelve characters as medium and accepts it", "empreinte":"c083b441"} -->
<!-- jp-way:cas {"ex": "EX-05", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates four kinds as strong", "empreinte":"3ec7c88c"} -->
<!-- jp-way:cas {"ex": "EX-06", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates seven varied characters as too short", "empreinte":"bb1bed09"} -->
<!-- jp-way:cas {"ex": "EX-07", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/services/passwordStrength.unit.spec.ts", "titre": "rates a long accented password with emoji as strong", "empreinte":"24e04da1"} -->
<!-- jp-way:cas {"ex": "EX-08", "barreau": "unit", "app": "front", "story": "US-045", "chemin": "apps/front/src/app/account/domain/entities/Password.unit.spec.ts", "titre": "rates every password exactly as the api does", "empreinte":"1539021a"} -->
<!-- jp-way:cas {"ex": "EX-09", "barreau": "unit", "app": "front", "story": "US-045", "chemin": "apps/front/src/app/account/domain/entities/Password.unit.spec.ts", "titre": "fills the gauge from red to orange to green", "empreinte":"dff58eea"} -->
<!-- jp-way:cas {"ex": "EX-10", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "refuses a registration with a weak password", "empreinte":"8d47732a"} -->
<!-- jp-way:cas {"ex": "EX-11", "barreau": "unit", "app": "api", "story": "US-045", "chemin": "apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts", "titre": "refuses a change to a weak password", "empreinte":"e59efd25"} -->
<!-- jp-way:cas {"ex": "EX-12", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts", "titre": "accepts a right proof within its time", "empreinte":"542fbe5b"} -->
<!-- jp-way:cas {"ex": "EX-13", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts", "titre": "accepts a proof only once", "empreinte":"7affe75e"} -->
<!-- jp-way:cas {"ex": "EX-14", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts", "titre": "refuses a proof presented twenty minutes after its challenge", "empreinte":"05c80cf7"} -->
<!-- jp-way:cas {"ex": "EX-15", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts", "titre": "refuses a wrong number", "empreinte":"9c6d4f5d"} -->
<!-- jp-way:cas {"ex": "EX-16", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/services/human-proof/HashcashHumanProof.unit.spec.ts", "titre": "refuses a challenge the api did not sign", "empreinte":"c22eeb36"} -->
<!-- jp-way:cas {"ex": "EX-17", "barreau": "unit", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "refuses a registration without an accepted proof", "empreinte":"f0ba67fd"} -->
<!-- jp-way:cas {"ex": "EX-18", "barreau": "int-http", "app": "api", "story": "US-046", "chemin": "apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts", "titre": "serves a challenge and requires a proof to register", "empreinte":"b69a0d02"} -->
<!-- jp-way:cas {"ex": "EX-19", "barreau": "unit", "app": "front", "story": "US-047", "chemin": "apps/front/src/app/account/domain/use-cases/human-proof/humanProofEpic.unit.spec.ts", "titre": "solves the challenge and asks a fresh one after a refused registration", "empreinte":"862ca21b"} -->
<!-- jp-way:cas {"ex": "EX-20", "barreau": "e2e", "app": "e2e", "story": "US-047", "chemin": "apps/e2e/tests/real/auth/register-and-sign-in.spec.ts", "titre": "registers an account and lands signed in", "empreinte":"c99cb226"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-045 | Un mot de passe robuste et confirmé | api front | unit | EX-01 EX-02 EX-03 EX-04 EX-05 EX-06 EX-07 EX-08 EX-09 EX-10 EX-11 | — |
| 2 | US-046 | La preuve anti-robot côté api | api | unit int-http | EX-12 EX-13 EX-14 EX-15 EX-16 EX-17 EX-18 | — |
| 3 | US-047 | Les écrans d'inscription, site et app | front mobile e2e | unit e2e | EX-19 EX-20 | — |
