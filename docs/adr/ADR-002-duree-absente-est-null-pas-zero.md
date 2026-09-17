---
id: ADR-002
titre: Une durée absente de la grille tarifaire est `null`, jamais `0`
date: 2026-09-17
statut: acceptee
spec: SPEC-001
remplace: null
remplacee_par: null
---

# ADR-002 · Une durée absente de la grille tarifaire est `null`, jamais `0`

## Contexte

Avant cette story, `ListingPricing` portait trois nombres obligatoires (`dayInCents`, `weekInCents`,
`monthInCents`), le schéma HTTP `PublishListingSchema` exigeait les trois (`Schema.Int`), et les trois
colonnes correspondantes étaient `NOT NULL`. RG-04 impose désormais qu'une grille propose au moins une
durée mais pas nécessairement les trois (EX-06 : une grille qui ne porte que le mois). RG-04 impose aussi
qu'un tarif à `0,00 €` reste un tarif valide et publiable, sans borne de prix (EX-25). Ces deux exemples
posent ensemble la même contrainte : l'absence d'un palier et un palier fixé à `0,00 €` doivent rester
deux états distincts et non ambigus.

## Décision

Une durée non proposée par le loueur est représentée par `null`, du DTO HTTP jusqu'à la colonne : le
schéma de requête (`apps/api/src/listing/adapters/rest/dtos/PublishListingSchema.ts`) rend chaque
`pricing.*InCents` optionnel et le contrôleur convertit l'absence en `null`
(`apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.ts`) ; l'entité
`Listing.offersAnyDuration` (`apps/api/src/listing/domain/entities/Listing.ts`) teste chaque durée avec
`!== null` ; les colonnes `day_price_in_cents`, `week_price_in_cents`, `month_price_in_cents` deviennent
nullables (`apps/api/src/infra/migrations/20260917140000_make_listing_prices_nullable.ts`).

## Alternatives écartées

- **Représenter une durée absente par `0`** — écartée : EX-25 publie une grille au mois à `0,00 €` qui
  doit rester une annonce active sans aucune borne de prix ; si `0` signifiait à la fois « absent » et
  « gratuit », cette annonce deviendrait indiscernable d'une grille EX-07 (aucune durée), que RG-04 refuse
  explicitement. Les deux exemples de RG-04 seraient alors mutuellement incompatibles avec un seul
  sentinel numérique.

## Conséquences

Le contrat `POST /listing` change : `pricing.dayInCents`, `weekInCents` et `monthInCents` deviennent
optionnels côté requête (`PublishListingSchema.ts`), alors qu'ils étaient requis. Les trois colonnes
perdent leur contrainte `NOT NULL` ; toute lecture future d'un prix doit tester l'absence (`!== null`)
avant de raisonner sur sa valeur, sous peine de traiter un tarif gratuit comme un tarif manquant.

## Réversibilité

Rendre les trois durées de nouveau obligatoires demande de choisir une valeur de repli pour les grilles
existantes qui n'en portent pas trois, de restaurer `NOT NULL` sur les trois colonnes — ce que la
migration `20260917140000_make_listing_prices_nullable.ts` ne permet pas tant qu'une ligne porte un
`null` (son `down()` échoue au premier `null` rencontré) — et de retirer le chemin de refus
`IncompletePricingError` de `Listing.publish()` et `Listing.changePricing()`. Plus coûteux que réécrire
cette story.

## Signaux de remise en cause

Si une future règle doit distinguer un prix « pas encore décidé » d'un prix « explicitement absent »
(par exemple un brouillon de grille avant publication), la représentation actuelle par un seul `null`
ne suffira plus et demandera un troisième état.

## Statut
`proposee` le 2026-09-17, au DoD de US-004 (issue #5).
