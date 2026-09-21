---
id: ADR-007
titre: La normalisation de l'adresse e-mail est portée par le domaine, jamais par une colonne dérivée en base
date: 2026-09-21
statut: acceptee
spec: SPEC-002
remplace: null
remplacee_par: null
---

# ADR-007 · La normalisation de l'adresse e-mail est portée par le domaine, jamais par une colonne dérivée en base

## Contexte

La table `accounts` (`apps/api/src/infra/migrations/20260920120000_create_accounts.ts:6-11`) stocke
l'adresse e-mail dans une colonne `email` commentée « stored as given and never normalized here », et
l'index unique `accounts_email_unique` (mêmes lignes 23-26) porte sur cette colonne brute. `listings`
porte déjà un précédent différent pour le même problème : une colonne dérivée `place_key`, backfillée
par une migration qui garde une copie figée de la normalisation
(`infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts:3-9`), et son index unique
porte sur cette colonne dérivée, jamais sur `address`/`box` bruts (`apps/api/CLAUDE.md`, « Modifier
`normalizePlacePart`… »). Cette story ajoute `normalizeEmail` — NFKC, espaces réduits, `trim`,
minuscule — à `Account.register()` et `Account.isIdentifiedBy()` (`Account.ts:3-4,33-36,52-53`), prouvé
par EX-07 (casse et espaces) et EX-39 (accents).

## Décision

L'unicité et la normalisation de l'adresse e-mail sont garanties entièrement par le domaine :
`Account.register()` normalise avant d'écrire, `Account.isIdentifiedBy()` normalise avant de comparer,
et la colonne `email` ainsi que son index unique restent sur la valeur brute écrite par l'entité —
aucune colonne dérivée, aucune expression normalisée côté base, à la différence de `place_key`.

## Alternatives écartées et pourquoi

| Alternative | Pourquoi écartée / ce qu'elle aurait coûté |
|---|---|
| Une colonne dérivée `email_key`, backfillée et indexée, sur le modèle de `place_key` | Une migration de plus, et une copie figée en SQL brut de `normalizeEmail` à maintenir en accord avec l'entité — exactement le piège déjà documenté pour `place_key` — pour une table qui n'a aujourd'hui qu'un seul point d'écriture (`Account.register()`). |
| Un index d'expression Postgres (`CREATE UNIQUE INDEX ... (lower(trim(email)))`) | Postgres ne reproduit ni la normalisation NFKC ni le repli des espaces Unicode que fait `String.prototype.normalize('NFKC')` — même limite déjà relevée pour `place_key` ; un index d'expression aurait laissé passer exactement les doublons qu'EX-39 doit refuser. |

## Conséquences

Tant que `Account.register()` reste l'unique point d'écriture de `accounts.email`, la garantie tient.
Toute écriture qui le contournerait — un script d'administration, un futur cas d'usage, une migration
de données — pourrait insérer une adresse non normalisée qu'`accounts_email_unique` ne rapprocherait
jamais d'un compte existant équivalent (`apps/api/CLAUDE.md`, « `accounts.email` ne porte aucune
garantie de normalisation… »). Cette dépendance à un point d'écriture unique n'existe pas pour
`listings` : `place_key` protège même une écriture qui contournerait l'entité, au prix de la migration
de backfill à maintenir.

## Réversibilité

Revenir sur ce choix demande d'ajouter une colonne dérivée puis une migration de backfill qui recalcule
la forme normalisée de chaque ligne existante — le même exercice déjà fait pour `place_key`
(`20260917130000_enforce_unique_active_listing_place_key.ts`) — et de décider du sort de toute ligne
qui, entre-temps, aurait été insérée hors `Account.register()` avec une adresse non normalisée en
doublon d'une adresse déjà normalisée.

## Signaux de remise en cause

Un deuxième point d'écriture sur `accounts.email` qui ne passerait pas par `Account.register()` — un
script d'import, un provisioning direct — ferait apparaître la faille que `place_key` n'a pas : une
adresse en doublon que la base ne détecterait jamais.

## Statut
`proposee` le 21/09/2026, au DoD de US-012 (issue #26).
