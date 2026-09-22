---
id: ADR-009
titre: Le filtre et la pagination de la liste vivent dans le cas d'usage, pas dans la requête SQL
date: 2026-09-22
statut: acceptee
spec: SPEC-003
remplace: null
remplacee_par: null
---

# ADR-009 · Le filtre et la pagination de la liste vivent dans le cas d'usage, pas dans la requête SQL

## Contexte

SPEC-003 demande de filtrer les annonces actives par lieu et par période, et de les rendre page par
page (`docs/specs/SPEC-003-chercher-une-place.md`, RG-01 et RG-02). Ses dix exemples portent tous le
barreau `unit` : aucune ligne `Alors` ne nomme une colonne, un index ni un code HTTP.

Deux endroits pouvaient porter cette logique : `ListActiveListings`, au-dessus du port
`ListingRepository`, ou `KnexListingRepository.findAllActive`, dans la clause `where` et le
`limit/offset`.

## Décision

`ListActiveListings.execute` charge toutes les annonces actives par `findAllActive()`, puis filtre et
découpe en mémoire (`ListActiveListings.ts`). `Listing` répond aux deux questions —
`addressCarries(place)` et `availabilityCovers(from, to)` (`Listing.ts`) —, le cas d'usage se contente
de les poser. Le port `ListingRepository` n'a pas bougé.

## Alternatives écartées

| Alternative | Pourquoi écartée / ce qu'elle aurait coûté |
|---|---|
| Filtrer et paginer en SQL, dans `findAllActive` | Aucun des dix exemples ne serait alors prouvable au barreau `unit` : ils descendraient tous en `int-repo`, donc dans Docker, pour un gain de performance qu'aucune mesure ne demande aujourd'hui — la table `listings` porte quelques lignes. Surtout, la comparaison sans accents (`malaussena` → « Malausséna », EX-02) n'est pas gratuite en Postgres : elle demande `unaccent`, donc une extension et un index fonctionnel, décidés pour un volume que personne n'a encore observé. |
| Ajouter une méthode `search(criteria)` au port et la doubler en mémoire | Déplace le même code dans les deux implémentations du port, et fait diverger la version en mémoire (celle que les tests `unit` exercent) de la version SQL (celle que la production exerce) — exactement la divergence silencieuse que la note T7 du plan de SPEC-002 documente. |

## Conséquences

Chaque appel à `GET /listing` charge **toutes** les annonces actives, filtre comprise ou non. La
réponse reste bornée (100 annonces au plus), mais la lecture en base ne l'est pas : le coût croît
linéairement avec le nombre d'annonces actives, et aucun index ne porte `address`. C'est le risque
nommé au §11 de la spec.

## Réversibilité

Descendre le filtre en SQL est un changement contenu — `findAllActive` gagne des critères, le cas
d'usage perd son `filter` — mais il fait descendre les dix exemples de `unit` vers `int-repo`, donc le
plan en révision 2 et la suite `int` allongée d'autant.

## Signaux de remise en cause

Un temps de réponse de `GET /listing` qui monte avec le nombre d'annonces actives, ou une table
`listings` qui dépasse quelques milliers de lignes actives.

## Statut

`acceptee` le 22/09/2026, au DoD de US-023 / US-024 / US-025.
