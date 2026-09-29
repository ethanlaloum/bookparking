---
spec: SPEC-006
langue: fr
entrees:
  - { us: US-040, date: null, titre: "Un e-mail de bienvenue à l'inscription" }
---

# Envoyer des e-mails — ce qui change pour toi

## Un e-mail de bienvenue à l'inscription

**Ce qui change** — Quand quelqu'un crée un compte, Bookparking lui envoie un e-mail « Bienvenue sur
Bookparking » qui rappelle l'adresse du compte et mène au site. Il part dans la minute ; si Resend est
momentanément indisponible, il repart tout seul un peu plus tard.

**Pour qui** — Toute personne qui s'inscrit.

**Ce que tu vois maintenant** — Rien de nouveau à l'écran : l'inscription se passe comme avant, et le
compte est utilisable tout de suite. L'e-mail arrive à côté.

**Ce qu'il faut faire différemment** — Pour l'exploitant : renseigner `RESEND_API_KEY` et `MAIL_FROM`
dans le `.env` de l'api, sur un domaine vérifié chez Resend. Sans eux, l'api ne démarre pas.

**Depuis le** — pas encore : en attente de la clé Resend.

<!-- jp-way:journal {"spec":"SPEC-006","story":"US-040","ex":["EX-01","EX-02","EX-03","EX-04","EX-05","EX-06"],"pr":null} -->
