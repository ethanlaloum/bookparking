---
spec: SPEC-005
langue: fr
entrees:
  - { us: US-038, date: null, titre: "Le propriétaire peut annuler, et tu récupères tout" }
  - { us: US-035, date: null, titre: "Tu peux annuler ta réservation avant qu'elle commence" }
---

# Annuler une réservation — ce qui change pour toi

## Le propriétaire peut annuler, et tu récupères tout

**Ce qui change** — Un propriétaire peut annuler une demande ou une location sur sa place tant qu'elle n'a pas
commencé. Le conducteur récupère alors tout son argent, quelle que soit la date.

**Pour qui** — Les propriétaires, et les conducteurs dont la réservation est annulée.

**Ce que tu vois maintenant** — Dans « Demandes reçues », chaque réservation qui n'a pas commencé porte un
bouton « Annuler ». La fenêtre qui s'ouvre dit : « Le conducteur récupérera tout son argent. »

**Ce qu'il faut faire différemment** — Rien.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-005","story":"US-038","ex":["EX-12","EX-13","EX-14"],"pr":null} -->

## Tu peux annuler ta réservation avant qu'elle commence

**Ce qui change** — Tu peux annuler une réservation tant qu'elle n'a pas commencé. Jusqu'à 24 heures avant son
début, tu es remboursé en totalité ; après, tu peux toujours annuler, mais l'argent prélevé n'est pas
remboursé. Si le propriétaire n'avait pas encore confirmé, rien n'a été prélevé et l'empreinte est levée.

**Pour qui** — Les conducteurs.

**Ce que tu vois maintenant** — Dans « Mes réservations », un bouton « Annuler ». Avant de confirmer, la fenêtre
te dit ce que tu récupères : « Vous serez remboursé de 45,00 €. », ou que l'échéance est passée. Ensuite, la
ligne se lit « Annulée · 45,00 € remboursés », ou « Annulée · 45,00 € non remboursés ». Un remboursement peut
mettre quelques jours à apparaître sur ton compte bancaire.

**Ce qu'il faut faire différemment** — Annule au plus tard la veille de ta location, à la même heure que son
début, pour être remboursé.

**Depuis le** — pas encore : l'encaissement ne tourne qu'en mode test.

<!-- jp-way:journal {"spec":"SPEC-005","story":"US-035","ex":["EX-01","EX-02","EX-03","EX-04","EX-05","EX-06","EX-07","EX-08","EX-10","EX-15","EX-16","EX-18"],"pr":null} -->
