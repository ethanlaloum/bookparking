---
spec: SPEC-004
langue: fr
entrees:
  - { us: US-029, date: null, titre: "Une annulation par l'exploitant te rend tout ton argent" }
  - { us: US-028, date: null, titre: "Sans réponse du propriétaire, ton empreinte est levée" }
  - { us: US-027, date: null, titre: "Tu n'es prélevé qu'au moment où le propriétaire confirme" }
  - { us: US-024, date: null, titre: "Demander une place passe par une empreinte bancaire" }
---

# Encaisser une demande — ce qui change pour toi

## Une annulation par l'exploitant te rend tout ton argent

**Ce qui change** — Quand l'exploitant annule ta demande, tu récupères tout ce que tu as engagé : l'empreinte
est levée si le propriétaire n'avait pas encore confirmé, et ton paiement est remboursé en totalité s'il
avait déjà été prélevé.

**Pour qui** — Les conducteurs.

**Ce que tu vois maintenant** — Dans « Mes demandes », ta demande se lit « Annulée · remboursement en cours »,
puis « Annulée · 45,00 € remboursés » ; ou « Annulée · rien n'a été prélevé » si l'empreinte n'avait pas été
prélevée. Un remboursement peut mettre quelques jours à apparaître sur ton compte bancaire.

**Ce qu'il faut faire différemment** — Rien : tu n'as rien à réclamer.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-004","story":"US-029","ex":["EX-30","EX-31","EX-32","EX-41"],"pr":null} -->

## Sans réponse du propriétaire, ton empreinte est levée

**Ce qui change** — Le propriétaire a 48 heures, à partir de ton empreinte, pour confirmer ta demande. Sans
réponse, la demande expire et l'empreinte est levée : rien n'est prélevé.

**Pour qui** — Les conducteurs.

**Ce que tu vois maintenant** — Ta demande se lit « Expirée · empreinte en cours de levée », puis
« Expirée · rien n'a été prélevé ». La levée est faite dans les cinq minutes qui suivent l'échéance ; ta
banque peut mettre quelques jours à libérer la somme sur ton compte.

**Ce qu'il faut faire différemment** — Rien.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-004","story":"US-028","ex":["EX-14","EX-18","EX-25","EX-26","EX-27","EX-28","EX-29","EX-33","EX-34","EX-36","EX-41"],"pr":null} -->

## Tu n'es prélevé qu'au moment où le propriétaire confirme

**Ce qui change** — Pour les propriétaires : confirmer une demande prélève le conducteur. Si sa banque refuse
le prélèvement, la confirmation échoue et les dates redeviennent libres.

**Pour qui** — Les propriétaires, et les conducteurs dont la demande est confirmée.

**Ce que tu vois maintenant** — Côté conducteur : « Confirmée · 45,00 € prélevés ». Côté propriétaire, si la
banque refuse : un message qui dit que la location ne peut pas être confirmée.

**Ce qu'il faut faire différemment** — Rien.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-004","story":"US-027","ex":["EX-06","EX-21","EX-22","EX-23","EX-24"],"pr":null} -->

## Demander une place passe par une empreinte bancaire

**Ce qui change** — Pour demander une place, tu passes par la page de paiement sécurisée de Stripe et tu
poses une empreinte : le montant est réservé sur ta carte, pas prélevé. Ta demande n'arrive chez le
propriétaire qu'une fois l'empreinte posée.

**Pour qui** — Les conducteurs.

**Ce que tu vois maintenant** — Le bouton de la fiche s'appelle « Continuer vers le paiement ». Après avoir
payé, bookparking affiche « Empreinte de 45,00 € · en attente du loueur ». Si tu reviens sans payer, la
fiche te dit « Paiement abandonné : rien n'a été réservé sur votre carte. » et tu peux redemander les
mêmes dates tout de suite. Une page de paiement laissée ouverte expire au bout de trente minutes.

**Ce qu'il faut faire différemment** — Garde ta carte sous la main au moment de demander : sans empreinte,
le propriétaire ne voit pas ta demande.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-004","story":"US-024","ex":["EX-01","EX-02","EX-03","EX-04","EX-05","EX-08","EX-09","EX-38","EX-39","EX-40"],"pr":null} -->
