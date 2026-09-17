---
spec: SPEC-001
langue: fr
entrees:
  - { us: US-003, date: null, titre: "Une même place ne peut plus recevoir deux annonces actives" }
  - { us: US-002, date: null, titre: "Une annonce incomplète ou usurpée n'est plus publiée" }
---

# Publier une place — ce qui change pour toi

## Une même place ne peut plus recevoir deux annonces actives

**Ce qui change** — Une place, identifiée par son adresse et son numéro de box, ne peut plus porter
qu'une seule annonce active à la fois. Que ce soit toi qui republies, ou un autre loueur qui publie sur
le même box, la seconde publication est refusée — même quand l'adresse ou le numéro de box sont écrits
autrement (majuscules, espace en trop).

**Pour qui** — Les loueurs qui publient une annonce.

**Ce que tu vois maintenant** — Si la place que tu publies porte déjà une annonce active, ta publication
est refusée avec le message « Cette place a déjà une annonce active », et l'annonce déjà active pour
cette place n'est pas modifiée. Publier un autre box à la même adresse fonctionne normalement : les deux
annonces restent actives, une par box.

**Ce qu'il faut faire différemment** — Rien, tant que tu publies une seule annonce par place. Si tu veux
republier la même place, dépublie d'abord l'annonce active existante.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-003","ex":["EX-02","EX-14","EX-15","EX-16","EX-35","EX-38","EX-39"],"pr":null} -->

## Une annonce incomplète ou usurpée n'est plus publiée

**Ce qui change** — Une annonce ne peut plus être publiée si sa période de disponibilité est déjà
entièrement passée, si l'enregistrement d'une de ses photos échoue, ou si elle ne porte aucune photo.
Publier une annonce demande d'être connecté, et l'annonce est toujours publiée en ton nom, jamais au nom
de quelqu'un d'autre.

**Pour qui** — Les loueurs qui publient une place.

**Ce que tu vois maintenant** — Si tu choisis une période déjà passée, la publication est refusée avec
le message « La période de disponibilité est déjà passée ». Si l'enregistrement d'une photo échoue, tu
vois « Impossible d'enregistrer les photos » et aucune annonce, même incomplète, n'apparaît. Si tu ne
mets aucune photo, la publication est refusée et l'absence de photo t'est signalée. Si tu n'es pas
connecté, une connexion t'est demandée. Et même si tu indiques un autre loueur dans le formulaire,
l'annonce reste publiée sous ton propre compte.

**Ce qu'il faut faire différemment** — Vérifie que ta période de disponibilité n'est pas déjà terminée
et que tes photos sont bien envoyées avant de publier. Connecte-toi avant de publier une annonce.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-001","story":"US-002","ex":["EX-18","EX-19","EX-04","EX-36","EX-37"],"pr":13} -->
