---
id: ADR-004
titre: La garantie anti-double-réservation est portée par une contrainte d'exclusion PostgreSQL, jamais par une vérification applicative
date: 2026-09-18
statut: acceptee
spec: SPEC-001
remplace: null
remplacee_par: null
---

# ADR-004 · La garantie anti-double-réservation est portée par une contrainte d'exclusion PostgreSQL, jamais par une vérification applicative

## Contexte

L'issue de US-008 demandait explicitement des « garanties de concurrence que seule une vraie base peut
prouver » : EX-30 met en scène deux demandes pour les mêmes dates au même instant, dont une seule doit
être enregistrée ; EX-32 met en scène une demande qui arrive à l'instant précis où le loueur dépublie son
annonce. Aucun des deux ne peut se prouver de façon fiable par un test qui pilote lui-même l'ordre
d'exécution d'une simple vérification en mémoire : c'est justement l'ordre d'exécution qui est en jeu.
`RequestRental` disposait déjà d'une vérification de chevauchement (`overlaps()`, utilisée par
`findConfirmedByPlace`) mais celle-ci lit avant d'écrire, dans deux requêtes séparées.

## Décision

L'absence de double réservation sur une même place et une même période est garantie par la base, pas par
le cas d'usage : la migration `20260918120000_create_rental_requests.ts` porte une contrainte
`rental_requests_place_period_excl`, un `EXCLUDE USING gist (place_key WITH =, tstzrange(period_from,
period_to, '[]') WITH &&)`, qui rend la seconde insertion impossible plutôt que refusée après coup.
`KnexRentalRequestRepository.insertOnActiveListing` traduit la violation de cette contrainte précise
(code Postgres `23P01`) en `DatesAlreadyRentedError` ; il ne fait lui-même aucune vérification préalable
de chevauchement avant d'insérer.

## Alternatives écartées

- **Vérifier en lisant avant d'écrire dans le cas d'usage** (l'approche déjà utilisée par
  `findConfirmedByPlace` pour les locations confirmées) — écartée : entre la lecture et l'écriture, une
  autre transaction peut s'insérer sur les mêmes dates ; fermer cette fenêtre demanderait un verrou
  explicite sur des lignes qui, pour une des deux demandes concurrentes, n'existent pas encore au moment
  de la lecture — rien à verrouiller. C'est exactement la fenêtre qu'EX-30 doit prouver fermée.
- **Laisser l'ordre d'arrivée décider laquelle des deux gagne** — écartée (AUTO-23) : le résultat
  dépendrait d'un hasard d'ordonnancement, et le test serait un coup sur deux vert pour la mauvaise
  raison.
- **Sérialiser toutes les écritures de l'application** (un verrou global, ou le niveau d'isolation
  `SERIALIZABLE` sur toute transaction) — écartée (AUTO-23) : hors de proportion avec le problème, qui ne
  concerne qu'une place et une période à la fois ; toute écriture sans rapport attendrait derrière ce
  verrou.

## Conséquences

La table dépend de l'extension `btree_gist`, créée par la même migration — une dépendance
d'infrastructure que la base doit supporter, pas seulement le schéma applicatif (`apps/api/CLAUDE.md`,
« Deux demandes concurrentes… »). La garantie couverte par la contrainte est symétrique sur les deux
demandes concurrentes (EX-30), mais elle ne couvre pas la course entre une demande et une dépublication :
cette seconde garantie repose sur un mécanisme différent — un verrou de ligne (`FOR UPDATE`) posé côté
demande, que `UnpublishListing` ne pose pas symétriquement — et ne joue que dans un sens (AUTO-23, corrigé
par AUTO-25 : voir `apps/api/CLAUDE.md`). La contrainte ne distingue pas non plus une demande `PENDING`
d'une demande `CONFIRMED` : une demande jamais confirmée gèle la place jusqu'à la fin de sa période, faute
d'expiration — un écart mineur accepté (AUTO-26), l'expiration relevant de SPEC-002. Enfin, prouver EX-32
contre une vraie dépublication a demandé au SUT du test d'importer des classes du contexte `listing/`, une
exception à la séparation des contextes que le code livré, lui, respecte toujours (AUTO-27).

## Réversibilité

Revenir à une vérification applicative coûterait plus cher que de réécrire cette story : il faudrait soit
accepter une fenêtre de course non fermée, soit ajouter un mécanisme de verrouillage explicite (verrou
consultatif sur `place_key`, par exemple) qui n'existe nulle part ailleurs dans le dépôt et qu'aucun
exemple ne couvre aujourd'hui. Retirer la contrainte demande aussi de décider du sort de l'extension
`btree_gist` : son `down()` la supprime sans condition (`apps/api/CLAUDE.md`), ce qui casserait toute autre
table qui en dépendrait entre-temps.

## Signaux de remise en cause

Un hébergement Postgres géré qui n'autoriserait pas `btree_gist` forcerait à revenir sur cette décision.
Le passage par SPEC-002 sur l'expiration d'une demande `PENDING` ou sur le sort d'une demande en attente
au moment d'une dépublication (AUTO-25, AUTO-26) peut faire apparaître un second mécanisme de
verrouillage ; s'il change la forme de la contrainte elle-même, cette décision devra être remplacée par
une nouvelle ADR plutôt que corrigée sur place.

## Statut
`proposee` le 18/09/2026, au DoD de US-008 (issue #9).
