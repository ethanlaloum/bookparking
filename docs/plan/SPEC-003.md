---
spec: SPEC-003
statut: valide
revision: 1
valide_le: 2026-09-22
valide_par: JP
derive_de: SPEC-003@0000000000000000000000000000000000000000
apps: [api]
cas: 10
stories: 3
---

# SPEC-003 · Plan

## Couverture par barreau

| Barreau | api | Cas | Exemples |
|---|---|---|---|
| unit | 10 | 10 | 10 |
| int-repo | 0 | 0 | 0 |
| int-http | 0 | 0 | 0 |
| journey | 0 | 0 | 0 |
| **total** | **10** | **10** | 10 exemples, 0 sans cas |

**Écarts avec la suggestion de la spec**

Aucun. Les dix exemples gardent le barreau `unit` que suggère leur bloc `jp-way:ex`.

**Pourquoi tout tient au barreau `unit`**

Le filtrage et la pagination sont décidés dans `ListActiveListings`, au-dessus du port
`ListingRepository` : le dépôt rend les annonces actives, le cas d'usage retient celles qui
correspondent et découpe la tranche. Aucune ligne `Alors` de la spec ne nomme une colonne, un
index ni un code HTTP — la table de décision (`plan.md` §2) place donc chaque exemple au barreau
le plus bas qui peut l'observer, et ce barreau est `unit` (T1).

Ce choix a un coût, nommé au §11 de la spec : le filtre parcourt en mémoire toutes les annonces
actives. Le jour où il descend en SQL, ces dix exemples gagnent chacun un cas `int-repo` et le
plan passe en révision 2.

**Découpage — 3,3 exemples/story**

RG-01 porte sept exemples, au-dessus du plafond de cinq : il est coupé en deux tranches qui ne
partagent aucun critère — le lieu (US-023) et la période (US-024). RG-02 tient en une story
(US-025). Aucune fusion n'est possible : US-024 et US-025 dépendent chacune de la forme de
réponse qu'US-023 installe, et US-023 + US-024 feraient sept exemples.

## Cas

| Cas | Ex | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|---|
| 1 | EX-01 | unit | api | US-023 | `…/list-active-listings/ListActiveListings.unit.spec.ts` | matches an address in capitals from a lowercase place |
| 2 | EX-02 | unit | api | US-023 | idem | matches an accented address from an unaccented place |
| 3 | EX-03 | unit | api | US-023 | idem | leaves out every listing when no address carries the place |
| 4 | EX-04 | unit | api | US-024 | idem | keeps a listing whose availability covers the requested period |
| 5 | EX-05 | unit | api | US-024 | idem | leaves out a listing whose availability starts after the requested period |
| 6 | EX-06 | unit | api | US-024 | idem | leaves out a listing whose availability ends before the requested period |
| 7 | EX-07 | unit | api | US-024 | idem | keeps a listing whose availability matches the requested period exactly |
| 8 | EX-08 | unit | api | US-025 | idem | rends twenty listings out of twenty-five on the first page |
| 9 | EX-09 | unit | api | US-025 | idem | rends the five remaining listings on the second page |
| 10 | EX-10 | unit | api | US-025 | idem | caps an oversized page size at one hundred |

<!-- jp-way:cas {"ex":"EX-01","barreau":"unit","app":"api","story":"US-023","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"matches an address in capitals from a lowercase place","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-02","barreau":"unit","app":"api","story":"US-023","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"matches an accented address from an unaccented place","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-03","barreau":"unit","app":"api","story":"US-023","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"leaves out every listing when no address carries the place","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-04","barreau":"unit","app":"api","story":"US-024","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"keeps a listing whose availability covers the requested period","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-05","barreau":"unit","app":"api","story":"US-024","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"leaves out a listing whose availability starts after the requested period","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-06","barreau":"unit","app":"api","story":"US-024","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"leaves out a listing whose availability ends before the requested period","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-07","barreau":"unit","app":"api","story":"US-024","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"keeps a listing whose availability matches the requested period exactly","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-08","barreau":"unit","app":"api","story":"US-025","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"rends twenty listings out of twenty-five on the first page","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-09","barreau":"unit","app":"api","story":"US-025","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"rends the five remaining listings on the second page","empreinte":""} -->
<!-- jp-way:cas {"ex":"EX-10","barreau":"unit","app":"api","story":"US-025","chemin":"apps/api/src/listing/domain/usecases/list-active-listings/ListActiveListings.unit.spec.ts","titre":"caps an oversized page size at one hundred","empreinte":""} -->

## Stories

| Story | Titre | App | Barreaux | Exemples | Ordre | Dépend de | Issue |
|---|---|---|---|---|---|---|---|
| US-023 | Filtrer les annonces par lieu | api | unit | 3 | 1 | — | — |
| US-024 | Filtrer les annonces par période demandée | api | unit | 4 | 2 | US-023 | — |
| US-025 | Rendre la liste page par page | api | unit | 3 | 3 | US-023 | — |

Aucune issue GitHub n'a été créée pour cette spec : le backlog **est** cette table, à la demande
explicite de JP (« sans utiliser le workflow, ça mange trop de token »). Les trois stories ont été
livrées dans une seule branche et une seule pull request.

## Dépendances

`US-023 → US-024` et `US-023 → US-025` : US-023 remplace la réponse `Listing[]` du cas d'usage
par une enveloppe `{ annonces, total, page, taille }`, que les deux autres lisent. Le graphe est
acyclique.

## Ce qui n'est pas testé, et pourquoi

| Ce qui n'est pas prouvé | Pourquoi |
|---|---|
| Que `GET /listing` transmette bien `lieu`, `du`, `au`, `page` et `taille` au cas d'usage | Aucun `EX-nn` de la spec ne porte de code HTTP ni de paramètre de requête : la spec décrit la liste, pas sa route. Les trois tests `int-http` existants de `GET /listing` sont mis à jour pour l'enveloppe, mais ils ne portent aucun `@EX-003-nn` — ils ne prouvent aucun exemple. |
| Qu'une annonce déjà louée sur les dates demandées soit écartée | Hors périmètre, §2 et §10 de la spec. |
| Que le filtre descende en SQL | Le filtre est en mémoire, au-dessus de `findAllActive()` — voir « Pourquoi tout tient au barreau `unit` ». |
| La concurrence, l'autorisation, l'argent et les pannes de tiers | Écartés avec leur raison dans la sonde de la spec, §5. |
