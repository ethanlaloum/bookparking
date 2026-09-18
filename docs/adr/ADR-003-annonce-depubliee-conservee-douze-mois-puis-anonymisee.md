---
id: ADR-003
titre: Une annonce dépubliée est conservée douze mois puis anonymisée, jamais supprimée ni gardée sans limite
date: 2026-09-18
statut: acceptee
spec: SPEC-001
remplace: null
remplacee_par: null
---

# ADR-003 · Une annonce dépubliée est conservée douze mois puis anonymisée, jamais supprimée ni gardée sans limite

## Contexte

La revue de conformité de US-002 avait déjà signalé que la table `listings` était créée sans durée de
conservation (`docs/autonomous/SPEC-001.md`, AUTO-05) ; la décision avait été reportée à US-007, seule
story qui introduit un état dépublié. La revue de conformité de US-007 a repris ce constat en majeur : ce
diff crée l'état `UNPUBLISHED` sans qu'aucune règle ne dise combien de temps une annonce dépubliée reste
en base ni ce qu'elle devient (AUTO-20). Une location confirmée référence l'annonce même après sa
dépublication (RG-07, EX-11, EX-33) : la ligne ne peut pas simplement disparaître tant que des locations
passées s'y rattachent.

## Décision

Une annonce dépubliée est conservée **douze mois** à compter de sa dépublication, puis **anonymisée** :
l'adresse, le numéro de box, la description de l'accès et les photos sont effacés, et la ligne subsiste
sans donnée personnelle parce que les locations passées continuent de la référencer. La règle est portée
par `docs/specs/SPEC-001-publier-une-place.md` §8 « Rétention ». Le mécanisme qui l'applique (tâche
planifiée d'anonymisation, et sa preuve) n'appartient pas au périmètre de SPEC-001 (§2 : la spec s'arrête
à la publication) et reste une dette tracée, issue #18.

## Alternatives écartées

- **Supprimer la ligne à la dépublication** — écartée : les locations déjà confirmées la référencent
  (RG-07, EX-11, EX-33) ; la supprimer casserait leur lecture.
- **La conserver sans limite** — écartée : c'est exactement le constat de conformité RGPD (AUTO-05,
  AUTO-20) — aucune durée n'est alors opposable.
- **Implémenter la purge dans US-007** — écartée : ni règle ni exemple de la spec ne décrivent le
  mécanisme d'anonymisation ; la story livrerait du code que rien ne prouve.

## Conséquences

La règle est écrite avant que le mécanisme qui l'applique existe : tant que l'issue #18 n'est pas
traitée, une annonce dépubliée depuis plus de douze mois n'est anonymisée par rien, et la spec décrit un
engagement que le code ne tient pas encore. Aucune colonne n'enregistre l'instant de la dépublication —
`updated_at` est repoussé par toute écriture ultérieure sur la ligne (`KnexListingRepository.ts:52`) et
ne peut donc pas servir d'ancre — si bien que l'issue #18 doit trancher cette ancre (une colonne
`unpublished_at` ou un autre mécanisme) avant de pouvoir calculer une échéance. Le risque documenté ici
reste faible tant qu'aucune donnée réelle n'existe : la route de publication n'est montée dans aucune
application (`apps/api/CLAUDE.md`, « `POST /listing` n'est monté dans aucune application »).

## Réversibilité

Changer la durée de douze mois est un simple changement de spec et de ce document. Revenir sur
l'anonymisation au profit d'une suppression coûte davantage une fois le mécanisme de l'issue #18 écrit :
il faudrait alors traiter les locations passées qui référencent encore la ligne (RG-07), ce que
l'anonymisation évite en gardant la ligne vivante.

## Signaux de remise en cause

Si l'issue #18 ne parvient pas à ancrer l'échéance sur un événement fiable (aucune colonne dédiée
n'existe à ce jour), ou si un conseil juridique fixe une durée différente de douze mois, cette décision
devra être remplacée par une nouvelle ADR plutôt que corrigée sur place.

## Statut
`proposee` le 18/09/2026, au DoD de US-007 (issue #8).
