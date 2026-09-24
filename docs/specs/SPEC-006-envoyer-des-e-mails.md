---
id: SPEC-006
titre: Envoyer des e-mails, d'abord la bienvenue à l'inscription
slug: envoyer-des-e-mails
statut: valide
revision: 1
derive_de: null
amont: absent
langue: fr
valide_le: 2026-09-24
valide_par: JP
apps: [api, e2e]
code_sha: { api: ef7ed75, e2e: ef7ed75 }
ux: absent
regles: 5
exemples: 24
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-006 · Envoyer des e-mails, d'abord la bienvenue à l'inscription

## 1. Sujet

Pour une personne qui vient de s'inscrire, recevoir un e-mail de bienvenue qui lui confirme que son compte existe et la ramène sur le site. Pour l'exploitant, disposer d'un mécanisme d'envoi par Resend qui ne perd pas un e-mail quand Resend tombe, n'en envoie jamais deux, et servira aux autres moments clés (demande reçue, location confirmée, annulation…), chacun dans sa propre spec.

Demande de JP le 24/09/2026 : « un système d'envoi de mails à l'inscription et à d'autres moments clés, mais d'abord à l'inscription ». Décisions prises par JP le 24/09/2026 :
- l'e-mail d'inscription est un **e-mail de bienvenue**, pas une vérification d'adresse : le compte reste utilisable immédiatement (SPEC-002 RG-07 tient toujours) ;
- l'envoi passe par une **file en base** : le compte et l'e-mail à envoyer s'écrivent dans la même transaction, un balayage les envoie ensuite ;
- le fournisseur est **Resend**, avec un domaine d'expédition vérifié ; la clé est posée par JP dans un `.env`.

Le reste est à la discrétion de Claude, à relire par JP : Q-01 à Q-03.

## 2. Périmètre

**Dedans.** La mise en file d'un e-mail de bienvenue à chaque inscription réussie, dans la même écriture que le compte. Le balayage qui envoie la file par Resend, une seule fois par e-mail. Les nouvelles tentatives quand Resend est indisponible, l'abandon quand il refuse ou que l'e-mail attend depuis trop longtemps. Le contenu de l'e-mail de bienvenue. Les réglages de l'api (clé, expéditeur, désactivation), et le chargement d'un `.env` au démarrage.

**Dehors.** Les e-mails des autres moments clés : chacun viendra avec sa spec, sur ce même mécanisme. La vérification de l'adresse, le parcours « mot de passe oublié » (SPEC-002 D-03). Les préférences de notification et le désabonnement : l'e-mail de bienvenue est transactionnel. Le suivi des rebonds et des plaintes (webhooks de Resend). La purge des e-mails envoyés, portée par SPEC-003 avec l'effacement du compte. Tout écran.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| E-mail en file | un e-mail que l'api doit envoyer et n'a pas encore envoyé. Statut `PENDING`. Jamais « notification ». |
| Mise en file | l'écriture d'un e-mail en file, dans la même transaction que le changement qui le motive. |
| Balayage des e-mails | le passage, toutes les 30 secondes, qui envoie les e-mails en file. |
| E-mail envoyé | un e-mail que Resend a accepté. Statut `SENT`. Ce qu'il advient ensuite (remise, rebond) n'est pas suivi. |
| E-mail abandonné | un e-mail que l'api n'essaiera plus d'envoyer. Statut `FAILED`. |
| Indisponible | Resend n'a pas pris l'e-mail pour une raison qui peut passer : panne, limite de débit, réseau, clé refusée. |
| Refusé | Resend a jugé l'e-mail lui-même invalide (`400`, `422`) : le renvoyer tel quel ne changerait rien. |

## 4. Règles et exemples

Valeurs canoniques : `Marc D.`, `marc.d@example.com`, mot de passe `Barla2026!`, inscrit le `01/10/2026 à 09:00` ; le site `https://bookparking.fr` ; l'expéditeur `Bookparking <bonjour@bookparking.fr>` ; horloge `Europe/Paris`.

### RG-01 · une inscription réussie met en file un e-mail de bienvenue pour l'adresse du compte, dans la même écriture que le compte ; une inscription refusée n'en met aucun

#### EX-01 · une inscription met en file la bienvenue

Étant donné aucun compte pour `marc.d@example.com`
Quand `Marc D.` s'inscrit avec `marc.d@example.com` et `Barla2026!` le `01/10/2026 à 09:00`
Alors un e-mail de bienvenue est en file pour `marc.d@example.com`, mis en file le `01/10/2026 à 09:00`
Et rien de ce qui est en file ne contient `Barla2026!`

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"cf8cc838"} -->

#### EX-02 · la bienvenue part à l'adresse normalisée

Quand `Marc D.` s'inscrit avec ` Marc.D@Example.COM `
Alors l'e-mail de bienvenue en file est adressé à `marc.d@example.com`

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"701d12af"} -->

#### EX-03 · une inscription refusée ne met rien en file

Étant donné un compte pour `marc.d@example.com`
Quand quelqu'un s'inscrit de nouveau avec `marc.d@example.com`
Alors l'inscription est refusée avec `EmailAlreadyUsedError`
Et aucun e-mail n'est en file — le titulaire du compte n'en reçoit pas un second

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"c655d900"} -->

#### EX-04 · une file injoignable fait échouer l'inscription

Étant donné la file d'e-mails injoignable
Quand `Marc D.` s'inscrit
Alors l'inscription échoue avec `UnknownError`

<!-- jp-way:ex {"id":"EX-04","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"13d211cd"} -->

#### EX-05 · un e-mail mis en file dans une écriture qui échoue n'existe pas

Étant donné une transaction qui met en file la bienvenue de `marc.d@example.com`
Quand une écriture suivante de la même transaction échoue
Alors la table `outgoing_emails` ne contient aucune ligne

<!-- jp-way:ex {"id":"EX-05","regle":"RG-01","origine":"sonde","barreau":"int-repo","empreinte":"3f7b47a9"} -->

#### EX-06 · un e-mail mis en file est écrit en attente

Quand la bienvenue de `marc.d@example.com` est mise en file le `01/10/2026 à 09:00`
Alors la table `outgoing_emails` porte une ligne `WELCOME`, `PENDING`, pour `marc.d@example.com`, mise en file le `01/10/2026 à 09:00`, sans aucun essai

<!-- jp-way:ex {"id":"EX-06","regle":"RG-01","origine":"mapping","barreau":"int-repo","empreinte":"3ab5717e"} -->

### RG-02 · le balayage envoie par Resend chaque e-mail en file, du plus ancien au plus récent, et le marque envoyé ; un e-mail envoyé ne repart jamais

#### EX-07 · le balayage envoie la bienvenue et la marque envoyée

Étant donné la bienvenue de `marc.d@example.com` en file depuis le `01/10/2026 à 09:00`
Quand le balayage passe le `01/10/2026 à 09:00:30`
Alors Resend reçoit un e-mail pour `marc.d@example.com`, d'objet « Bienvenue sur Bookparking », avec pour clé d'idempotence l'identifiant de l'e-mail
Et l'e-mail est marqué envoyé le `01/10/2026 à 09:00:30`

<!-- jp-way:ex {"id":"EX-07","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"45266de6"} -->

#### EX-08 · un e-mail balayé deux fois ne part qu'une fois

Étant donné la bienvenue de `marc.d@example.com` en file
Quand le balayage passe à `09:00:30` puis à `09:01:00`
Alors Resend n'a reçu qu'un e-mail

<!-- jp-way:ex {"id":"EX-08","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"bde20713"} -->

#### EX-09 · la file ne rend que les e-mails en attente, les plus anciens d'abord

Étant donné trois e-mails en file mis en file à `09:02`, `09:00` — déjà essayé une fois, Resend indisponible — et `09:01`
Et deux e-mails plus anciens, mis en file à `08:58` et `08:59`, l'un envoyé, l'autre abandonné
Quand le balayage lit la file par lots de deux
Alors il lit l'e-mail de `09:00`, avec son essai, puis celui de `09:01`

<!-- jp-way:ex {"id":"EX-09","regle":"RG-02","origine":"mapping","barreau":"int-repo","empreinte":"76e4de3b"} -->

#### EX-10 · marquer envoyé un e-mail déjà envoyé ne change rien

Étant donné la bienvenue de `marc.d@example.com` marquée envoyée à `09:00:30`
Quand un second balayage la marque envoyée à `09:01:00`
Alors elle reste envoyée à `09:00:30`

<!-- jp-way:ex {"id":"EX-10","regle":"RG-02","origine":"sonde","barreau":"int-repo","empreinte":"7efdfe4f"} -->

#### EX-11 · l'envoi à Resend porte la clé, l'expéditeur et la clé d'idempotence

Étant donné la clé Resend `re_test_123` et l'expéditeur `Bookparking <bonjour@bookparking.fr>`
Quand l'e-mail `3f2c…` est envoyé à `marc.d@example.com` et que Resend répond `200`
Alors la requête part en `POST https://api.resend.com/emails`, avec `Authorization: Bearer re_test_123` et `Idempotency-Key: 3f2c…`
Et elle porte l'expéditeur, le destinataire, l'objet, la version HTML et la version texte
Et l'envoi est accepté

<!-- jp-way:ex {"id":"EX-11","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"fd81eca8"} -->

### RG-03 · un e-mail que Resend ne peut pas prendre reste en file et repart au balayage suivant, jusqu'à 24 heures après sa mise en file ; un e-mail que Resend refuse, ou qui échoue encore 24 heures après sa mise en file, est abandonné

#### EX-12 · Resend indisponible, l'e-mail part au balayage suivant

Étant donné la bienvenue de `marc.d@example.com` en file depuis `09:00`
Quand Resend est indisponible au balayage de `09:00:30` puis disponible à celui de `09:01:00`
Alors après `09:00:30` l'e-mail est toujours en file, avec un essai
Et il est marqué envoyé à `09:01:00`

<!-- jp-way:ex {"id":"EX-12","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"9923daaf"} -->

#### EX-13 · un e-mail que Resend refuse est abandonné aussitôt

Étant donné la bienvenue de `marc.d@example.com` en file
Quand Resend la refuse au balayage de `09:00:30`
Alors l'e-mail est abandonné le `01/10/2026 à 09:00:30`
Et le balayage de `09:01:00` ne le renvoie pas

<!-- jp-way:ex {"id":"EX-13","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"e4f29de2"} -->

#### EX-14 · un e-mail qui échoue juste avant 24 heures reste en file

Étant donné la bienvenue de `marc.d@example.com` en file depuis le `01/10/2026 à 09:00`
Quand Resend est indisponible au balayage du `02/10/2026 à 08:59:30`
Alors l'e-mail est toujours en file

<!-- jp-way:ex {"id":"EX-14","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"8a41a55b"} -->

#### EX-15 · un e-mail qui échoue encore 24 heures après sa mise en file est abandonné

Étant donné la bienvenue de `marc.d@example.com` en file depuis le `01/10/2026 à 09:00`
Quand Resend est indisponible au balayage du `02/10/2026 à 09:00`
Alors l'e-mail est abandonné le `02/10/2026 à 09:00`

<!-- jp-way:ex {"id":"EX-15","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"efa1e2de"} -->

#### EX-16 · la limite de débit de Resend rend l'envoi indisponible

Quand Resend répond `429` à un envoi
Alors l'envoi est indisponible, pas refusé

<!-- jp-way:ex {"id":"EX-16","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"a9778d8b"} -->

#### EX-17 · une coupure réseau rend l'envoi indisponible

Quand la requête vers Resend échoue avant toute réponse
Alors l'envoi est indisponible, et aucune exception ne remonte au balayage

<!-- jp-way:ex {"id":"EX-17","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"57eef0d3"} -->

#### EX-18 · une adresse que Resend juge invalide rend l'envoi refusé

Quand Resend répond `422` à un envoi
Alors l'envoi est refusé

<!-- jp-way:ex {"id":"EX-18","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"53df9d17"} -->

### RG-04 · l'e-mail de bienvenue, en français, s'intitule « Bienvenue sur Bookparking », rappelle l'adresse du compte et mène au site, en HTML et en texte

#### EX-19 · le contenu de la bienvenue

Étant donné le site `https://bookparking.fr`
Quand la bienvenue de `marc.d@example.com` est rédigée
Alors son objet est « Bienvenue sur Bookparking »
Et sa version texte cite `marc.d@example.com` et `https://bookparking.fr`
Et sa version HTML porte un lien vers `https://bookparking.fr`

<!-- jp-way:ex {"id":"EX-19","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"05fe58f7"} -->

#### EX-20 · une adresse qui porte du balisage est échappée dans la version HTML

Étant donné une inscription acceptée avec `a<b>&c@exemple.fr` — le motif de l'inscription admet `<`, `>` et `&`
Quand sa bienvenue est rédigée
Alors la version HTML porte `a&lt;b&gt;&amp;c@exemple.fr` et jamais `<b>`

<!-- jp-way:ex {"id":"EX-20","regle":"RG-04","origine":"sonde","barreau":"unit","empreinte":"de1d66cb"} -->

### RG-05 · sans clé Resend et sans expéditeur, l'api refuse de démarrer, sauf si l'envoi est explicitement désactivé ; désactivé, rien n'est balayé et les e-mails restent en file

#### EX-21 · sans clé Resend, le démarrage est refusé

Étant donné `MAIL_FROM` renseigné, `RESEND_API_KEY` vide et `EMAIL_SENDING` absent
Quand l'api lit ses réglages d'envoi
Alors le démarrage est refusé par un message qui nomme `RESEND_API_KEY`

<!-- jp-way:ex {"id":"EX-21","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"d7bc185d"} -->

#### EX-22 · désactivé, l'envoi ne demande ni clé ni expéditeur

Étant donné `EMAIL_SENDING=disabled`, sans `RESEND_API_KEY` ni `MAIL_FROM`
Quand l'api lit ses réglages d'envoi
Alors l'envoi est désactivé et le démarrage continue

<!-- jp-way:ex {"id":"EX-22","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"229ab0c5"} -->

#### EX-23 · un expéditeur sans adresse est refusé au démarrage

Étant donné `RESEND_API_KEY` renseignée et `MAIL_FROM=Bookparking`
Quand l'api lit ses réglages d'envoi
Alors le démarrage est refusé par un message qui nomme `MAIL_FROM`

<!-- jp-way:ex {"id":"EX-23","regle":"RG-05","origine":"sonde","barreau":"unit","empreinte":"ee9acaef"} -->

#### EX-24 · désactivé, le balayage ne passe jamais

Étant donné l'envoi désactivé et l'api démarrée le `01/10/2026 à 09:00`
Quand dix minutes passent
Alors aucun balayage des e-mails n'a eu lieu

<!-- jp-way:ex {"id":"EX-24","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"90cd1b53"} -->

## 5. Sonde de couverture

Cinq règles croisées avec les dix dimensions : 50 intersections, toutes résolues.

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | écarté¹ | filet² | EX-01 EX-06 | EX-05 | écarté³ | EX-03 | écarté⁴ | écarté⁵ | EX-04 EX-05 | EX-01 EX-02 |
| RG-02 | EX-09 | filet⁶ | EX-07 | EX-10 EX-11 | écarté³ | EX-08 EX-09 | écarté⁴ | EX-09 | filet⁷ | EX-11 |
| RG-03 | EX-14 EX-15 | écarté⁸ | EX-14 EX-15 | filet⁹ | filet¹⁰ | EX-13 | écarté⁴ | EX-16 | EX-12 EX-16 EX-17 | EX-18 |
| RG-04 | écarté¹¹ | écarté¹² | écarté¹³ | écarté¹⁴ | écarté³ | écarté¹⁵ | écarté⁴ | écarté⁵ | écarté¹⁶ | EX-19 EX-20 |
| RG-05 | écarté¹¹ | EX-21 | écarté¹³ | écarté¹⁴ | filet¹⁰ | EX-24 | écarté⁴ | écarté⁵ | EX-21 | EX-22 EX-23 |

¹ la règle est binaire : un e-mail est en file ou ne l'est pas, un réglage est valide ou ne l'est pas.
² une inscription sans adresse est refusée avant tout, SPEC-002 EX-34.
³ aucune route n'est ajoutée : la mise en file suit une inscription ouverte à tous, le balayage ne répond à personne.
⁴ aucun montant n'entre dans ce chemin.
⁵ un e-mail par inscription.
⁶ une file vide ne produit aucun appel à Resend : le balayage boucle sur une liste vide.
⁷ ce qui se passe quand Resend ne prend pas l'e-mail est la règle RG-03.
⁸ un e-mail en file porte toujours un destinataire et un type ; il n'y a pas de champ facultatif.
⁹ deux balayages simultanés (deux instances de l'api) envoient le même e-mail avec la même clé d'idempotence : Resend n'en expédie qu'un pendant 24 heures, d'où la borne de RG-03.
¹⁰ une clé refusée par Resend (`401`, `403`) rend l'envoi indisponible, pas refusé : c'est un défaut de réglage, et les e-mails repartent quand il est corrigé, dans les 24 heures.
¹¹ aucune borne numérique dans la règle.
¹² l'adresse est toujours présente : l'inscription l'exige.
¹³ le contenu ne dépend pas de l'instant.
¹⁴ la rédaction est pure, sans état partagé.
¹⁵ le contenu ne dépend pas de l'état du compte.
¹⁶ la rédaction ne parle à aucun tiers.

## 6. Écrans

Aucun. L'e-mail n'est pas un écran de l'application, et l'inscription garde ses écrans et ses messages.

## 7. Questions

#### Q-01 · combien de temps retenter un e-mail que Resend ne prend pas ?

Statut : résolue — discrétion de Claude, à relire par JP : 24 heures après sa mise en file. C'est la durée de vie d'une clé d'idempotence chez Resend : au-delà, un renvoi pourrait doubler un e-mail parti malgré une réponse perdue.

#### Q-02 · qu'est-ce qu'un refus définitif ?

Statut : résolue — discrétion de Claude, à relire par JP : seulement `400` et `422`, où Resend juge l'e-mail lui-même invalide. Une clé ou un domaine refusés (`401`, `403`) sont un défaut de réglage : abandonner chaque e-mail pour cela les perdrait tous, alors qu'ils repartent dès la correction.

#### Q-03 · que fait l'api quand elle démarre sans clé ?

Statut : résolue — discrétion de Claude, à relire par JP : elle refuse de démarrer, comme sans clé Stripe (aucune valeur de repli). Les parcours de bout en bout et le développement sans clé posent `EMAIL_SENDING=disabled` : les e-mails restent en file, rien ne part. Les parcours e2e s'inscrivent avec des adresses `@bookparking.test`, qui ne doivent jamais atteindre Resend.

## 8. Contraintes non fonctionnelles

- **Secret.** La clé Resend ne sort jamais du processus : ni journal, ni réponse, ni message d'erreur. Le mot de passe n'est jamais en file (EX-01).
- **Transaction.** La mise en file s'écrit dans la transaction du compte : un compte sans sa bienvenue, ou une bienvenue sans compte, n'existent pas.
- **Idempotence.** L'identifiant de l'e-mail est sa clé d'idempotence chez Resend ; le passage à `SENT` filtre sur `PENDING`.
- **Débit.** Un balayage lit au plus 50 e-mails. Une limite de débit de Resend (`429`) rend l'envoi indisponible et il repart au balayage suivant.
- **Réglages.** `RESEND_API_KEY` et `MAIL_FROM` obligatoires, sauf `EMAIL_SENDING=disabled` ; `EMAIL_SWEEP_INTERVAL_IN_SECONDS`, 30 par défaut. `pnpm --filter bookparking-api start` charge le `.env` à la racine du dépôt s'il existe ; ce fichier est ignoré par git.
- **Conformité RGPD.** Resend devient destinataire de l'adresse e-mail (`quality.compliance.dataClasses: pii`) : un sous-traitant à déclarer. La table `outgoing_emails` garde l'adresse de chaque e-mail envoyé ; son effacement suit celui du compte, porté par SPEC-003.
- **Langue.** L'e-mail est en français.

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | une migration (`outgoing_emails`) ; une unité de travail Knex ; la file d'e-mails dans le noyau partagé ; `RegisterAccount`, qui écrit le compte et la bienvenue dans une transaction ; un contexte `notification` (rédaction, balayage, adaptateur Resend) ; les réglages et le chargement du `.env`. | les routes, leurs réponses, la connexion, le changement de mot de passe. |
| e2e | la pile locale démarre l'api avec `EMAIL_SENDING=disabled`. | les parcours. |

`apps/front` et `apps/mobile` ne bougent pas : l'inscription garde ses écrans et ses réponses.

## 10. Hors sujet

- **Les autres moments clés** — une spec chacun, sur la même file.
- **La vérification d'adresse et le mot de passe oublié** — SPEC-002 D-03 et RG-07 tiennent.
- **Les rebonds, les plaintes, la remise effective** — rien ne suit l'e-mail après son acceptation par Resend.
- **La purge des e-mails envoyés** — SPEC-003.

## 11. Risques

- **Resend reçoit l'adresse de chaque inscrit.** · Signal précoce : aucun. · Parade : le déclarer comme sous-traitant dans les données personnelles du site. · Gravité : moyenne.
- **Une inscription faite avec l'adresse d'un autre lui envoie la bienvenue** (SPEC-002 R « l'adresse n'est pas vérifiée »). L'e-mail devient un signal pour le vrai titulaire, sans recours pour autant. · Gravité : faible.
- **Un parcours e2e lancé contre la pile de développement, avec une vraie clé, enverrait des e-mails vers `@bookparking.test`.** Ces rebonds abîment la réputation du domaine d'expédition. · Parade : la pile e2e locale désactive l'envoi ; la pile de développement doit le désactiver aussi quand un parcours la vise. · Gravité : moyenne.
- **Un e-mail est envoyé au plus une fois par clé d'idempotence, pendant 24 heures.** Une réponse perdue exactement à la borne pourrait doubler un e-mail. · Gravité : faible.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 24/09/2026 | Création, à la demande de JP : l'e-mail de bienvenue à l'inscription et le mécanisme d'envoi par Resend. Réécrit SPEC-002 EX-01 et EX-35, qui disaient qu'aucun e-mail n'est envoyé. |
