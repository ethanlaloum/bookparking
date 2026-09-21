---
id: ADR-006
titre: Le mot de passe est haché avec scrypt de node:crypto, jamais avec une dépendance bcrypt ou argon2
date: 2026-09-21
statut: acceptee
spec: SPEC-002
remplace: null
remplacee_par: null
---

# ADR-006 · Le mot de passe est haché avec scrypt de node:crypto, jamais avec une dépendance bcrypt ou argon2

## Contexte

EX-01 exige qu'un mot de passe enregistré ne soit pas celui saisi. `ScryptPasswordHasher`
(`apps/api/src/user-management/adapters/services/password-hasher/ScryptPasswordHasher.ts`) implémente le
port `PasswordHasher` avec `scryptSync`, `randomBytes` et `timingSafeEqual`, les trois importés de
`node:crypto` : aucun paquet n'est ajouté par ce diff (`git diff origin/main...HEAD --stat` ne touche
aucun `package.json`).

## Décision

Le hachage du mot de passe passe par `scrypt`, tel qu'exposé par `node:crypto`, jamais par une
bibliothèque tierce.

## Alternatives écartées

- **`bcrypt`** — écartée : le paquet le plus répandu pour ce besoin dans l'écosystème Node ajoute un
  module natif compilé à l'installation, une dépendance que ce diff n'introduit pas.
- **`argon2`** — écartée pour la même raison : un binding natif supplémentaire, quand `node:crypto`
  fournit déjà `scrypt` sans rien installer.

## Conséquences

Le format stocké (`scrypt$<sel>$<clé>`, `ScryptPasswordHasher.ts:14-16`) encode l'algorithme dans la
valeur elle-même, et `verify()` renvoie `false` dès que le préfixe n'est pas `scrypt`
(`ScryptPasswordHasher.ts:20-21`) : un futur changement d'algorithme ne pourrait pas vérifier les
hachages déjà stockés sans réécrire `verify()` pour reconnaître plusieurs formats. Rien dans ce diff
n'écrit de chemin de réinitialisation de mot de passe : sans lui, la seule autre option serait
d'invalider tous les comptes déjà inscrits. La revue sécurité de US-011 est CONFORME, 0 signalement —
elle ne remet pas en cause ce choix.

## Réversibilité

Revenir en arrière coûte plus cher que réécrire cette story (524 lignes, 14 fichiers — `git diff
origin/main...HEAD --stat`) : il faudrait étendre `verify()` pour accepter plusieurs formats et rehacher
au prochain succès de connexion, ou invalider tous les comptes déjà inscrits faute de chemin de
réinitialisation dans le code livré à ce jour.

## Signaux de remise en cause

Une contrainte de conformité ou un audit de sécurité imposant nommément un autre algorithme (par exemple
`argon2id`) forcerait à revenir sur ce choix.

## Statut
`proposee` le 21/09/2026, au DoD de US-011 (issue #25).
