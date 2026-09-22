---
id: ADR-008
titre: Adresse e-mail refusée par liste noire ciblée, jamais par une liste blanche ASCII
date: 2026-09-22
statut: acceptee
spec: SPEC-002
remplace: null
remplacee_par: null
---

# ADR-008 · Adresse e-mail refusée par liste noire ciblée, jamais par une liste blanche ASCII

## Contexte

RG-07 exige qu'une adresse soit syntaxiquement valide pour créer un compte
(`docs/specs/SPEC-002-comptes-authentification.md`, RG-07), sans fixer l'alphabet autorisé. EX-39 exige
qu'une adresse accentuée — `Léa.T@Exemple.fr` — soit acceptée, et à deux endroits : le cas `unit`
(US-012) qui prouve que le domaine la normalise, et le cas `int-http` que cette story ajoute, qui prouve
que la frontière HTTP ne la refuse pas (`docs/plan/SPEC-002.md`, note T7 — « EX-39 est le seul exemple à
porter un cas à deux barreaux »). EX-40 exige que `marc'--@example.com` soit refusée.

## Décision

`RegisterAccountSchema` refuse une adresse dont la partie locale porte `'`, `"`, `\` ou `;`, et accepte
tout le reste, accents compris
(`apps/api/src/user-management/adapters/rest/dtos/RegisterAccountSchema.ts:3` —
`EMAIL_PATTERN = /^[^\s@'"\\;]+@[^\s@]+\.[^\s@]+$/u`).

## Alternatives écartées

| Alternative | Pourquoi écartée / ce qu'elle aurait coûté |
|---|---|
| Liste blanche ASCII (`[A-Za-z0-9._+-]+@…`), effectivement en place dans cette branche avant d'être remplacée | Une classe de caractères ASCII n'accepte aucun accent : `Léa.T@Exemple.fr` (EX-39) y échoue. Le cas `unit` d'EX-39 (US-012) appelle `RegisterAccount` directement, sans traverser `RegisterAccountSchema` (`RegisterAccount.unit.spec.ts`) : il resterait vert pendant que le cas `int-http` d'EX-39, seul, passerait au rouge — une régression que la note T7 du plan qualifie explicitement de silencieuse à un seul barreau. |

## Conséquences

Une adresse dont la partie locale porte une apostrophe — `o'brien@example.com` — ne peut pas s'inscrire,
même syntaxiquement valide. Le refus porte sur quatre caractères précis, pas sur un alphabet fermé : le
prochain élargissement de RG-07 (un caractère de plus à accepter ou à refuser) doit composer avec cette
liste noire, pas avec une liste blanche parallèle qui la contredirait sans le dire.

## Réversibilité

Revenir à une liste blanche est un changement d'une ligne
(`RegisterAccountSchema.ts:3`), mais refait échouer EX-39 à la frontière HTTP sans faire échouer son cas
`unit` : le seul signal de régression serait ce cas `int-http` précis.

## Signaux de remise en cause

Une inscription légitime refusée pour un caractère autre que `'`, `"`, `\`, `;` — observable dans les
réponses `400` de `POST /account`.

## Statut

`acceptee` le 22/09/2026, au DoD de US-014 (issue #27).
