---
id: ADR-001
titre: Le loueur est identifié par le compte authentifié, jamais par un nom saisi
date: 2026-09-17
statut: acceptee
spec: SPEC-001
remplace: null
remplacee_par: null
---

# ADR-001 · Le loueur est identifié par le compte authentifié, jamais par un nom saisi

## Contexte

`PublishListing` acceptait un champ `ownerName` porté par le corps de la requête, et `ListingController`
n'exposait aucune garde d'authentification. La revue de sécurité de US-002 a signalé qu'un visiteur non
connecté pouvait ainsi publier une annonce, et qu'un loueur connecté pouvait publier au nom de n'importe
quel autre loueur en changeant une valeur du corps (`docs/autonomous/SPEC-001.md`, AUTO-01). La revue de
conformité a signalé que la colonne stockant ce nom n'était protégée par aucune règle qui en impose la
vérification.

## Décision

Le loueur d'une annonce est l'identifiant du compte porté par la requête authentifiée
(`req.user.id`, posé par `AuthGuard` après vérification du jeton), jamais une valeur du corps de la
requête. `PublishListing.execute` prend un `ownerId` (`apps/api/src/listing/domain/usecases/publish-listing/PublishListing.ts`),
`Listing` stocke `owner_id` (`apps/api/src/infra/migrations/20260917120000_create_listings.ts`), et le
corps de `POST /listing` ne porte plus aucun champ loueur (`PublishListingSchema.ts`). La vérification
réelle du jeton reste derrière le port `AccessTokenVerifier`
(`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts`), sans implémentation : le mécanisme
d'authentification proprement dit (session, JWT, fournisseur externe) est hors périmètre de SPEC-001.

## Alternatives écartées

- **Garder `ownerName` porté par le corps et reporter la sécurité à une story ultérieure** — écartée :
  une autorisation manquante est majeure par construction, et l'humain a explicitement demandé de retirer
  `ownerName` avant de reprendre cette spec (`docs/autonomous/SPEC-001.md`, consigne avant de partir).
- **Construire la chaîne d'authentification complète (émission de jeton, secret, comptes) dans cette
  story** — écartée : hors périmètre de SPEC-001 (§2, la vérification d'identité n'est déclenchée
  qu'avant le premier versement, jamais pour publier une annonce), et nouvelle dépendance qu'aucun exemple
  de cette spec ne prouve.
- **Retirer tout loueur de l'annonce** — écartée : RG-07 (dépublier sa propre annonce, US-007) et EX-14
  (refuser l'annonce d'un autre loueur pour un box déjà actif, US-003) ont besoin d'un propriétaire porté
  par l'annonce elle-même.

## Conséquences

`POST /listing` n'est utilisable par aucune application tant qu'aucun `AccessTokenVerifier` réel n'existe
— échec fermé assumé, pas un oubli : `find apps/api/src -iname '*.module.ts' -o -iname main.ts` ne
retourne aucun résultat au 17/09/2026. Le renommage `ownerName` → `ownerId` s'étend à la migration et à
toute story future qui lira ou affichera le loueur. Le garde réel (`auth.guard.ts`) n'est prouvé par
aucun test à ce stade : les tests `int-http` le remplacent systématiquement par `TestAuthGuard`
(`createControllerTestApp.ts:12`), donc une régression dans le garde réel ne ferait échouer ni
`@EX-001-36` ni `@EX-001-37`.

## Réversibilité

Revenir à un champ `ownerName` porté par le corps demande de défaire la migration (`owner_id` →
`owner_name`), de rouvrir RG-02 × Autorisation en un filet, et de retirer EX-36 et EX-37 de la spec —
plus coûteux que la story qui a introduit la colonne. Tant qu'aucune donnée réelle n'a été écrite (la
route n'est montée nulle part), le coût reste celui d'une migration `down`.

## Signaux de remise en cause

Si une story future doit permettre de publier une annonce pour le compte d'un tiers (délégation, agence)
sans que ce tiers soit le compte authentifié, le port `AccessTokenVerifier` et cette décision devront
porter une notion de mandat explicite plutôt qu'une identité unique.

## Statut
`acceptee` le 17/09/2026, au DoD de US-002, par la construction autonome (AUTO-01).
