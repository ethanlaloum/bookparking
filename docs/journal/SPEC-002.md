---
spec: SPEC-002
langue: fr
entrees:
  - { us: US-013, date: null, titre: "Ton mot de passe et ton adresse sont vérifiés avant la création de ton compte" }
  - { us: US-012, date: null, titre: "Une adresse déjà utilisée est refusée à l'inscription" }
  - { us: US-011, date: null, titre: "Créer un compte avec une adresse e-mail et un mot de passe" }
---

# Comptes et authentification — ce qui change pour toi

## Ton mot de passe et ton adresse sont vérifiés avant la création de ton compte

**Ce qui change** — Pour créer un compte, ton mot de passe doit désormais compter au moins 8 caractères,
et ton adresse e-mail doit être écrite sous une forme valide.

**Pour qui** — Les loueurs et les conducteurs qui créent un compte.

**Ce que tu vois maintenant** — Si tu proposes un mot de passe de 7 caractères ou moins, ou si tu le
laisses vide, ton inscription est refusée et aucun compte n'est créé ; à partir de 8 caractères, elle
passe normalement. Si ton adresse ne contient pas de `@`, ou si tu la laisses vide, ton inscription est
refusée de la même façon et aucun compte n'est créé.

**Ce qu'il faut faire différemment** — Choisis un mot de passe d'au moins 8 caractères, et une adresse
e-mail complète avec un `@` et un domaine.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-002","story":"US-013","ex":["EX-05","EX-06","EX-09","EX-34","EX-38"],"pr":40} -->

## Une adresse déjà utilisée est refusée à l'inscription

**Ce qui change** — Une adresse e-mail déjà utilisée par un compte ne peut plus servir à en créer un
second. Une adresse tapée avec une autre casse, des espaces en trop ou des accents différents compte
comme la même adresse.

**Pour qui** — Les loueurs et les conducteurs qui créent un compte.

**Ce que tu vois maintenant** — Si tu t'inscris avec une adresse déjà utilisée, ton inscription est
refusée et le compte existant n'est pas modifié. Même écrite avec des majuscules, des espaces en trop
ou des accents différents, la même adresse est reconnue et refusée de la même façon : aucun second
compte n'est créé pour elle. La réponse ne dit jamais quel compte existe déjà avec cette adresse.

**Ce qu'il faut faire différemment** — Rien : si ton adresse est déjà prise, utilise une autre adresse
pour créer ton compte.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-002","story":"US-012","ex":["EX-02","EX-04","EX-07","EX-39"],"pr":38} -->

## Créer un compte avec une adresse e-mail et un mot de passe

**Ce qui change** — Tu peux désormais créer un compte avec une adresse e-mail et un mot de passe.
Ton mot de passe n'est jamais enregistré tel quel, et aucun e-mail ne t'est envoyé à l'inscription.

**Pour qui** — Les loueurs et les conducteurs qui créent un compte.

**Ce que tu vois maintenant** — Ton inscription crée un compte identifié par ton adresse e-mail ; le mot
de passe que tu as tapé n'est jamais celui qui est enregistré. Ton mot de passe peut être long et
contenir des accents ou des emoji, il est accepté normalement. Si deux inscriptions arrivent coup sur
coup avec la même adresse, une seule crée un compte : la seconde est refusée. Si l'enregistrement
échoue, ton inscription est refusée et aucun compte n'est créé.

**Ce qu'il faut faire différemment** — Rien : il n'y a rien à faire de ton côté pour l'instant.

**Depuis le** — pas encore : cette règle n'est accessible depuis aucune application publiée pour
l'instant.

<!-- jp-way:journal {"spec":"SPEC-002","story":"US-011","ex":["EX-01","EX-08","EX-10","EX-03"],"pr":36} -->
