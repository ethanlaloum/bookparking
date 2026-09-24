---
spec: SPEC-008
statut: valide
revision: 1
valide_le: 2026-09-24
valide_par: JP
derive_de: SPEC-008
apps: [api, front, mobile, e2e]
cas: 5
stories: 2
---

# SPEC-008 · Plan

Construit à la main, sans agents. La case du site et de l'app n'a pas de cas unitaire : c'est un champ de
formulaire, prouvé par le parcours e2e (EX-05).

## Couverture par barreau

| Barreau | api | e2e | Cas |
|---|---|---|---|
| unit | 2 | 0 | 2 |
| int-repo | 1 | 0 | 1 |
| int-http | 1 | 0 | 1 |
| e2e | 0 | 1 | 1 |
| **total** | 4 | 1 | **5** |

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-01 | unit | api | US-048 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | notes when the terms were accepted |
| EX-02 | unit | api | US-048 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | refuses a registration without accepting the terms |
| EX-03 | int-repo | api | US-048 | `apps/api/src/user-management/adapters/repositories/account/KnexAccountRepository.int.spec.ts` | writes when the terms were accepted |
| EX-04 | int-http | api | US-048 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses a registration that says nothing of the terms |
| EX-05 | e2e | e2e | US-049 | `apps/e2e/tests/real/auth/register-and-sign-in.spec.ts` | refuses to create the account until the terms box is ticked |

<!-- jp-way:cas {"ex": "EX-01", "barreau": "unit", "app": "api", "story": "US-048", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "notes when the terms were accepted", "empreinte":"54e3133f"} -->
<!-- jp-way:cas {"ex": "EX-02", "barreau": "unit", "app": "api", "story": "US-048", "chemin": "apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts", "titre": "refuses a registration without accepting the terms", "empreinte":"5227212d"} -->
<!-- jp-way:cas {"ex": "EX-03", "barreau": "int-repo", "app": "api", "story": "US-048", "chemin": "apps/api/src/user-management/adapters/repositories/account/KnexAccountRepository.int.spec.ts", "titre": "writes when the terms were accepted", "empreinte":"96917691"} -->
<!-- jp-way:cas {"ex": "EX-04", "barreau": "int-http", "app": "api", "story": "US-048", "chemin": "apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts", "titre": "refuses a registration that says nothing of the terms", "empreinte":"552cf20b"} -->
<!-- jp-way:cas {"ex": "EX-05", "barreau": "e2e", "app": "e2e", "story": "US-049", "chemin": "apps/e2e/tests/real/auth/register-and-sign-in.spec.ts", "titre": "refuses to create the account until the terms box is ticked", "empreinte":"311dda74"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-048 | L'api exige et note l'acceptation | api | unit int-repo int-http | EX-01 EX-02 EX-03 EX-04 | — |
| 2 | US-049 | La case à cocher, site et app | front mobile e2e | e2e | EX-05 | — |
