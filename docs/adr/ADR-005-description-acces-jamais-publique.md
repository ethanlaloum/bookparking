---
id: ADR-005
titre: La description d'accès n'est jamais servie par la lecture publique d'une annonce
date: 2026-09-19
statut: acceptee
spec: SPEC-001
remplace: null
remplacee_par: null
---

# ADR-005 · La description d'accès n'est jamais servie par la lecture publique d'une annonce

## Contexte

US-009 introduit la première route de lecture publique d'une annonce, `GET /listing/:id` (AUTO-28,
`docs/autonomous/SPEC-001.md`). Sa première version faisait passer toute l'entité `Listing` par
`ListingMapper.toGetListingDto`, y compris `accessDescription` : la revue de sécurité de US-009 l'a
relevé en constat majeur (`ListingMapper.ts`, `GetListingResponseDto.ts`). §8 de
`docs/specs/SPEC-001-publier-une-place.md` (« Données personnelles exposées volontairement ») ne rend
publics, sans authentification, que l'adresse exacte et le numéro de box — pas la description d'accès ;
§10 écarte explicitement un boîtier connecté ou un code de portail imposé au profit d'un texte libre
laissé au loueur, ce qui fait de ce texte le substitut du code de portail.

## Décision

`ListingMapper.toGetListingDto` et `GetListingResponseDto` ne portent pas de champ `accessDescription` :
la lecture publique d'une annonce ne rend que `id`, `address`, `box`, `photos`, `pricing` et
`availability`. La colonne reste écrite et lue en base (`access_description`, non nullable), et le champ
reste montré au loueur qui relit sa propre annonce (EX-03, barreau `e2e`) — seule la lecture publique le
perd. EX-44 (`int-http`) fige cette non-exposition : quel que soit l'appelant, connecté ou non, la
réponse ne contient jamais la chaîne saisie par le loueur.

## Alternatives écartées

- **Exposer la description d'accès dans la même réponse que l'adresse et le box** — écartée : c'est
  exactement ce que §10 refuse de remplacer par un mécanisme opposable, et §8 ne l'autorise pas ; la
  servir sans authentification donnerait à n'importe qui, y compris quelqu'un qui n'a jamais demandé
  cette place, le moyen concret d'entrer.
- **L'ajouter à §8 pour l'inscrire dans le périmètre volontairement public** — écartée : étendrait
  l'exposition assumée de RG-05 sans qu'aucune décision produit ne l'ait demandé, et une fois une
  réponse publique diffusée, une conductrice qui l'a lue une seule fois la connaît définitivement — rien
  ne permet de revenir dessus après coup.

## Conséquences

Une conductrice qui a une location confirmée sur cette place n'a aujourd'hui, par cette route, aucun
moyen de lire comment entrer : SPEC-001 s'arrête à la publication (§2) et ne dit rien de ce que voit un
conducteur après confirmation. La question de qui doit voir la description d'accès, et à partir de
quand — à la demande, à la confirmation, jamais publiquement — reste ouverte (AUTO-29,
`docs/autonomous/SPEC-001.md`) et n'est pas tranchée par cette ADR.

## Réversibilité

Retirer le champ d'une réponse déjà publique est un correctif local, sans migration : il suffit de ne
plus le sérialiser. Revenir en arrière et l'exposer de nouveau publiquement ne l'est pas de la même
façon : toute réponse déjà servie avant ce correctif a déjà pu être lue par n'importe quel appelant, et
rien ne peut effacer cette lecture-là après coup — l'exposition, une fois publiée, ne se reprend jamais
totalement.

## Signaux de remise en cause

Si SPEC-002 (demander et confirmer une location) répond à la question ouverte par AUTO-29 en donnant à
un conducteur avec une location confirmée un moyen de lire la description d'accès, cette décision devra
être remplacée par une nouvelle ADR qui pose les conditions de cette exposition-là, plutôt que corrigée
sur place.

## Statut
`proposee` le 19/09/2026, au DoD de US-009 (issue #10).
