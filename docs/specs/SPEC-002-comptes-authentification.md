---
id: SPEC-002
titre: Comptes et authentification des loueurs et conducteurs
slug: comptes-authentification
statut: brouillon
revision: 1
derive_de: BR-20260919-comptes-authentification@3839b9c
amont: present
langue: fr
apps: [api]
code_sha: { api: f7900eb }
regles: 0
exemples: 0
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-002 · Comptes et authentification des loueurs et conducteurs

## Récolte (session)

<!-- bloc append-only, remplacé par example-mapper à la rédaction -->

- [pré-vol] apps en périmètre : `api` seule (distillat §Impacts). Aucune carte de code n'existe pour `api` : les ancrages viennent de scouts, jamais d'une carte.
- [pré-vol] amont : `docs/brainstorm/BR-20260919-comptes-authentification/BRAINSTORM.md@3839b9c`, statut `valide`.
- [pré-vol] 9 décisions (D-01…D-09), 8 règles candidates et 1 arbitrage ouvert (Q-01) entrent en séance depuis le distillat.

### Scouts (étape 0)

- [scout] garde · `AuthGuard.canActivate` (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:21-39`) : header absent, non-`Bearer`, jeton vide après trim, `verify()` à `null`, ou `payload.id` non-string → `UnauthorizedException` → 401. En succès attache `request.user = { id: payload.id }` et rien d'autre (l.37).
- [scout] port · `AccessTokenVerifier.verify(token): Promise<{ id: string } | null>` (`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1-7`), injecté par le token `'AccessTokenVerifier'` (`auth.guard.ts:17`). Aucune implémentation.
- [scout] doublure · `TestAuthGuard` (`apps/api/src/shared/test/http/TestAuthGuard.ts:11-28`) remplace toujours `AuthGuard` en test : aucun test n'exerce la vraie garde aujourd'hui.
- [scout] persistance · aucune table de comptes. 5 migrations, toutes sur `listings` et `rental_requests`. `user-management/` ne contient que 3 fichiers. Aucune dépendance `bcrypt` / `argon2` / `jsonwebtoken` / `@nestjs/jwt` / `passport` dans `apps/api/package.json`.
- [scout] demande · `RequestRental` prend `renterId: string` en champ libre (`apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:15-22`) ; union d'erreurs `DatesAlreadyRentedError | InvalidRequestedPeriodError | ListingNotPublishedError | NoPriceForRequestedPeriodError | RequestedPeriodTooLongError | UnknownError` (l.29-34). **Aucun contrôleur ni module ne le monte.**
- [scout] dépublication · `ListingStatus { ACTIVE, UNPUBLISHED }` (`apps/api/src/listing/domain/entities/Listing.ts:8`), `Listing.unpublish({ownerId})` (l.100), `UnpublishListing.execute` idempotent (`apps/api/src/listing/domain/usecases/unpublish-listing/UnpublishListing.ts:24`). Données personnelles : `listings.owner_id` et `listings.access_description` (`20260917120000_create_listings.ts:6,9`), `rental_requests.renter_id` (`20260918120000_create_rental_requests.ts:15`).

### Décisions de séance

- [décision] (jp) la carte sujet tient : « Pour un loueur et un conducteur, disposer d'un compte et d'une connexion par e-mail et mot de passe, afin que les routes que la garde protège déjà deviennent atteignables. »
- [décision] (jp) découpage : SPEC-002 porte le compte, la connexion, le jeton et le ralentissement. **La suppression de compte part en SPEC-003**, avec la dette #18 dans la même spec — c'est la parade de R-07.
- [décision] (jp) Q-01 devient RG-07 : l'adresse doit être syntaxiquement valide, et aucune vérification par e-mail n'a lieu en v1.
- [discrétion] (claude) mot de passe d'au moins 8 caractères, aucune règle de composition.
- [discrétion] (claude) ralentissement : à partir du 3ᵉ échec, 1 s, doublement à chaque échec, plafond 30 s ; compteur remis à zéro par un succès ou par 15 minutes sans essai.
- [discrétion] (claude) changer son mot de passe exige l'ancien.
- [discrétion] (claude) un jeton émis avant un changement de mot de passe **reste valable** jusqu'à son expiration — conséquence directe de D-04 (jeton sans état, rien à révoquer). Risque à inscrire.

### Règles

- RG-01 — s'inscrire demande une adresse e-mail et un mot de passe d'au moins 8 caractères ; l'adresse identifie le compte et ne peut pas être portée par deux comptes.
- RG-02 — lire une annonce ne demande aucun compte ; publier et demander en demandent un, et l'identité vient du jeton, jamais du corps de la requête.
- RG-03 — une connexion réussie délivre un jeton valable 7 jours, prolongé à chaque usage ; une connexion échouée ne dit jamais si c'est l'adresse ou le mot de passe qui est faux.
- RG-04 — un même compte publie et demande sans changer d'état ni de rôle.
- RG-05 — une série d'échecs de connexion ralentit les essais suivants sans jamais rendre un compte inaccessible.
- RG-06 — un compte connecté peut changer son mot de passe sans repasser par un e-mail.
- RG-07 — une adresse doit être syntaxiquement valide pour créer un compte ; aucune vérification par e-mail n'a lieu en v1.

### Exemples

Valeurs canoniques : `Marc D.` loueur, `marc.d@example.com`, mot de passe `Barla2026!` ; `Léa T.` conductrice, `lea.t@example.com`, mot de passe `Promenade06!` ; la place `12 rue Barla, 06300 Nice`, `box 12` ; horloge `Europe/Paris`.

**RG-01**
- EX-01 · unit · une inscription crée un compte — Étant donné aucun compte pour `marc.d@example.com` · Quand `Marc D.` s'inscrit avec `marc.d@example.com` et `Barla2026!` le `01/10/2026 à 09:00` · Alors un compte est créé, identifié par `marc.d@example.com` · Et le mot de passe enregistré n'est pas `Barla2026!` · Et aucun e-mail n'est envoyé.
- EX-02 · unit · une adresse déjà utilisée est refusée — Étant donné le compte de `Marc D.` sur `marc.d@example.com` · Quand quelqu'un s'inscrit avec `marc.d@example.com` et `Autre2026!` · Alors l'inscription est refusée avec `EmailAlreadyUsedError` · Et le compte existant n'est pas modifié.
- EX-03 · int-repo · la même adresse écrite deux fois laisse un seul compte — Étant donné une base vide · Quand deux inscriptions pour `marc.d@example.com` sont écrites à la suite · Alors la table des comptes porte une seule ligne pour cette adresse · Et la seconde écriture remonte `EmailAlreadyUsedError`.
- EX-04 · int-http · l'adresse déjà prise répond 409 — Étant donné le compte de `Marc D.` · Quand `POST /account` porte `marc.d@example.com` et `Autre2026!` · Alors la réponse est `409` · Et le corps ne dit pas quel compte existe déjà.
- EX-05 · int-http · un mot de passe de 7 caractères est refusé — Quand `POST /account` porte `lea.t@example.com` et `Prom06!` (7 caractères) · Alors la réponse est `400` · Et aucun compte n'est créé.
- EX-06 · int-http · un mot de passe de 8 caractères est accepté — Quand `POST /account` porte `lea.t@example.com` et `Prom06!!` (8 caractères) · Alors la réponse est `201` · Et le compte de `lea.t@example.com` existe.
- EX-07 · unit · casse et espaces ne font pas deux comptes — Étant donné le compte de `Marc D.` sur `marc.d@example.com` · Quand quelqu'un s'inscrit avec ` Marc.D@Example.COM ` · Alors l'inscription est refusée avec `EmailAlreadyUsedError`.
- EX-08 · unit · la base tombe pendant l'inscription — Étant donné un dépôt de comptes qui échoue à l'écriture · Quand `Marc D.` s'inscrit avec `marc.d@example.com` et `Barla2026!` · Alors l'inscription est refusée avec `UnknownError` · Et aucun compte n'est créé.
- EX-09 · int-http · un mot de passe vide est refusé — Quand `POST /account` porte `lea.t@example.com` et `` · Alors la réponse est `400` · Et aucun compte n'est créé.
- EX-10 · unit · un mot de passe long avec accents et emoji est accepté — Quand `Léa T.` s'inscrit avec `lea.t@example.com` et un mot de passe de 200 caractères contenant `é`, `ü` et `🚗` · Alors le compte est créé · Et la connexion avec ce même mot de passe réussit.

**RG-02**
- EX-11 · int-http · un visiteur non connecté consulte l'annonce — Étant donné l'annonce active de `Marc D.` pour le `box 12` du `12 rue Barla, 06300 Nice` · Quand `GET /listing/{id}` est appelé sans en-tête `Authorization` · Alors la réponse est `200` · Et elle porte l'adresse, le box, les photos et la grille tarifaire.
- EX-12 · int-http · un visiteur non connecté ne peut pas demander la place — Étant donné la même annonce active · Quand `POST /rental-request` est appelé sans en-tête `Authorization` · Alors la réponse est `401` · Et aucune ligne n'est écrite dans `rental_requests`.
- EX-13 · int-http · l'identité vient du jeton, jamais du corps — Étant donné `Léa T.` connectée avec un jeton valide · Quand `POST /rental-request` porte dans son corps `renterId` valant le compte de `Marc D.` · Alors la demande est enregistrée avec le compte de `Léa T.` · Et la valeur du corps est ignorée.

**RG-03**
- EX-14 · unit · une connexion réussie délivre un jeton — Étant donné le compte de `Marc D.` sur `marc.d@example.com` avec `Barla2026!` · Quand il se connecte le `01/10/2026 à 09:00` · Alors un jeton est délivré, valable jusqu'au `08/10/2026 à 09:00`.
- EX-15 · unit · un jeton utilisé juste avant la borne est prolongé — Étant donné un jeton délivré le `01/10/2026 à 09:00` · Quand il est présenté le `08/10/2026 à 08:59` · Alors il est accepté · Et sa validité court désormais jusqu'au `15/10/2026 à 08:59`.
- EX-16 · unit · un jeton inutilisé sept jours est refusé — Étant donné un jeton délivré le `01/10/2026 à 09:00` et jamais présenté depuis · Quand il est présenté le `08/10/2026 à 09:01` · Alors la vérification renvoie `null` · Et aucun prolongement n'a lieu.
- EX-17 · unit · un mot de passe faux ne dit pas que le compte existe — Étant donné le compte de `Marc D.` · Quand il se connecte avec `marc.d@example.com` et `Mauvais2026!` · Alors la connexion est refusée avec `InvalidCredentialsError` · Et aucun jeton n'est délivré.
- EX-18 · unit · une adresse inconnue produit le même refus — Quand quelqu'un se connecte avec `inconnu@example.com` et `Barla2026!` · Alors la connexion est refusée avec `InvalidCredentialsError`, la même erreur qu'à EX-17.
- EX-19 · unit · le changement d'heure ne raccourcit pas la validité — Étant donné un jeton délivré le `25/10/2026 à 09:00` (veille du passage à l'heure d'hiver) · Quand il est présenté le `01/11/2026 à 08:30` · Alors il est accepté, la validité étant comptée en heures et non en dates locales.

**RG-04**
- EX-20 · unit · le même compte publie puis demande — Étant donné `Marc D.` qui a publié son annonce du `box 12` · Quand il demande la place de `Léa T.` au `3 avenue Malausséna, 06000 Nice`, `box 4` · Alors la demande est enregistrée avec son compte · Et son compte n'est modifié en rien.
- EX-21 · unit · un compte qui n'a jamais publié publie sans étape supplémentaire — Étant donné `Léa T.`, inscrite et connectée, qui n'a jamais publié · Quand elle publie une annonce pour le `3 avenue Malausséna, 06000 Nice`, `box 4` · Alors l'annonce est publiée · Et aucune activation ni changement de rôle n'a été nécessaire.

**RG-05**
- EX-22 · unit · le troisième échec consécutif est retardé d'une seconde — Étant donné deux échecs de connexion sur `marc.d@example.com` · Quand un troisième échec survient · Alors la réponse est rendue après `1 s` · Et l'erreur reste `InvalidCredentialsError`.
- EX-23 · unit · le délai plafonne à trente secondes — Étant donné huit échecs consécutifs sur `marc.d@example.com` · Quand un neuvième échec survient · Alors la réponse est rendue après `30 s`, et non `128 s`.
- EX-24 · unit · une connexion réussie remet le compteur à zéro — Étant donné cinq échecs sur `marc.d@example.com` · Quand la connexion réussit avec `Barla2026!` · Alors le compteur d'échecs retombe à `0` · Et l'essai suivant n'est pas retardé.
- EX-25 · unit · le compte n'est jamais verrouillé — Étant donné vingt échecs consécutifs sur `marc.d@example.com` · Quand `Marc D.` se connecte avec `Barla2026!` · Alors la connexion réussit et un jeton est délivré.
- EX-26 · unit · une même origine essayant plusieurs comptes est ralentie — Étant donné l'adresse `203.0.113.7` ayant échoué une fois sur chacun de cinq comptes différents · Quand elle tente un sixième compte · Alors la réponse est retardée, alors qu'aucun de ces comptes n'a atteint trois échecs.
- EX-27 · unit · le compteur retombe après quinze minutes sans essai — Étant donné cinq échecs sur `marc.d@example.com` dont le dernier le `01/10/2026 à 09:00` · Quand un échec survient le `01/10/2026 à 09:16` · Alors il compte pour un premier échec et n'est pas retardé.
- EX-28 · unit · deux essais simultanés comptent pour deux échecs — Étant donné deux échecs déjà enregistrés sur `marc.d@example.com` · Quand deux essais faux arrivent en même temps · Alors le compteur passe à `4` et non à `3`.

**RG-06**
- EX-29 · unit · changer son mot de passe invalide l'ancien — Étant donné `Marc D.` connecté, mot de passe `Barla2026!` · Quand il le remplace par `Barla2027#` · Alors la connexion avec `Barla2026!` est refusée · Et la connexion avec `Barla2027#` réussit.
- EX-30 · unit · le changement exige l'ancien mot de passe — Étant donné `Marc D.` connecté · Quand il demande le remplacement en donnant `Mauvais2026!` comme mot de passe actuel · Alors la demande est refusée avec `InvalidCredentialsError` · Et le mot de passe reste `Barla2026!`.
- EX-31 · int-http · un visiteur non connecté ne change aucun mot de passe — Quand `POST /account/password` est appelé sans en-tête `Authorization` · Alors la réponse est `401` · Et aucun mot de passe n'est modifié.
- EX-32 · unit · un nouveau mot de passe de 7 caractères est refusé — Étant donné `Marc D.` connecté · Quand il demande `Prom06!` comme nouveau mot de passe · Alors la demande est refusée · Et le mot de passe reste `Barla2026!`.
- EX-33 · unit · un jeton émis avant le changement reste valable — Étant donné `Marc D.` connecté le `01/10/2026 à 09:00` · Quand il change son mot de passe le `02/10/2026 à 10:00` · Alors le jeton délivré le `01/10` est toujours accepté le `02/10/2026 à 10:01`.

**RG-07**
- EX-34 · int-http · une adresse sans `@` est refusée — Quand `POST /account` porte `marc.d` et `Barla2026!` · Alors la réponse est `400` · Et aucun compte n'est créé.
- EX-35 · unit · aucune vérification d'adresse n'a lieu — Quand `Marc D.` s'inscrit avec `marc.d@example.com` · Alors le compte est immédiatement utilisable pour publier · Et aucun e-mail n'est envoyé, aucun jeton de vérification n'est écrit.
- EX-36 · int-http · une adresse de 255 caractères est refusée — Quand `POST /account` porte une adresse de 255 caractères · Alors la réponse est `400`.
- EX-37 · int-http · une adresse de 254 caractères est acceptée — Quand `POST /account` porte une adresse de 254 caractères, syntaxiquement valide · Alors la réponse est `201`.
- EX-38 · int-http · une adresse vide est refusée — Quand `POST /account` porte `` comme adresse · Alors la réponse est `400`.
- EX-39 · unit · une adresse accentuée est acceptée et normalisée — Quand `Léa T.` s'inscrit avec `Léa.T@Exemple.fr` · Alors le compte est créé sur la forme normalisée · Et une seconde inscription avec `léa.t@exemple.fr` est refusée avec `EmailAlreadyUsedError`.
- EX-40 · int-http · une tentative d'injection est refusée — Quand `POST /account` porte `marc'--@example.com` · Alors la réponse est `400` · Et aucun compte n'est créé.

### Sonde de couverture — 70 intersections, aucune case vide

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-05 EX-06 | EX-09 | écarté¹ | filet² | écarté³ | EX-02 | écarté⁴ | écarté⁵ | EX-08 | EX-10 |
| RG-02 | écarté⁶ | EX-12 | filet⁷ | écarté⁸ | EX-13 | EX-11 | écarté⁴ | écarté⁵ | écarté⁹ | filet¹⁰ |
| RG-03 | EX-15 | filet¹¹ | EX-19 | écarté¹² | EX-17 EX-18 | EX-16 | écarté⁴ | écarté⁵ | écarté⁹ | filet¹³ |
| RG-04 | écarté⁶ | EX-21 | écarté¹ | écarté¹⁴ | filet¹⁵ | EX-20 | écarté⁴ | écarté⁵ | écarté⁹ | écarté¹⁶ |
| RG-05 | EX-22 EX-23 | écarté¹⁷ | EX-27 | EX-28 | écarté¹⁸ | EX-24 EX-25 | écarté⁴ | EX-26 | écarté⁹ | écarté¹⁶ |
| RG-06 | EX-32 | écarté¹⁹ | écarté¹ | écarté²⁰ | EX-30 EX-31 | EX-29 EX-33 | écarté⁴ | écarté⁵ | écarté⁹ | filet²¹ |
| RG-07 | EX-36 EX-37 | EX-38 | écarté¹ | écarté²² | écarté²³ | écarté²⁴ | écarté⁴ | écarté⁵ | écarté²⁵ | EX-39 EX-40 |

¹ la règle ne lit aucune donnée temporelle.
² contrainte d'unicité en base sur l'adresse normalisée — même mécanisme que `listings_active_place_key_unique` (`apps/api/src/infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts`).
³ s'inscrire est ouvert à tout visiteur : aucune autorisation ne s'applique par construction.
⁴ aucun montant, aucune devise, aucune unité n'entre dans ce chemin.
⁵ la règle porte sur un compte à la fois ; aucune liste n'est lue ni rendue.
⁶ la règle est binaire — compte ou pas de compte — et ne porte aucune borne numérique.
⁷ l'expiration est portée par RG-03 et vérifiée par la garde (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
⁸ la règle ne lit ni n'écrit d'état partagé ; deux requêtes simultanées suivent chacune le même chemin.
⁹ aucun appel à un tiers dans ce chemin — aucun fournisseur d'e-mails n'existe en v1.
¹⁰ un jeton malformé fait renvoyer `null` par le vérificateur et la garde répond 401 (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
¹¹ jeton absent ou vide : la garde répond 401 avant toute vérification (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:27-31`).
¹² le jeton est sans état côté serveur : deux usages simultanés ne partagent aucune ligne.
¹³ un jeton tronqué ou modifié échoue à la vérification et renvoie `null` (`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1-7`).
¹⁴ publier et demander écrivent dans deux tables distinctes, `listings` et `rental_requests`.
¹⁵ la garde fournit le même `request.user.id` quelle que soit l'action (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:37`).
¹⁶ la règle n'introduit aucune saisie libre.
¹⁷ un compteur d'échecs à zéro est le cas nominal, déjà couvert par EX-14.
¹⁸ le ralentissement s'applique avant toute authentification : il ne dépend d'aucun droit.
¹⁹ un champ absent produit le même refus de validation qu'un champ trop court, déjà EX-32.
²⁰ deux changements simultanés : le dernier écrit gagne, aucune règle ne dépend de l'ordre.
²¹ le mot de passe n'apparaît dans aucune réponse ni aucun journal — contrainte non fonctionnelle §8.
²² la validation syntaxique est locale à la requête et ne lit aucun état partagé.
²³ la validation s'applique avant toute authentification.
²⁴ la validité syntaxique d'une adresse ne dépend d'aucun état du compte.
²⁵ aucun envoi d'e-mail n'a lieu en v1 : c'est précisément ce que la règle assume.

### Matière pour les sections 8 à 11

- [nfr] le mot de passe n'est jamais stocké en clair, jamais journalisé, jamais renvoyé dans une réponse.
- [nfr] une connexion échouée ne distingue jamais une adresse inconnue d'un mot de passe faux, ni par le message ni par le délai.
- [nfr] RGPD — l'adresse e-mail est une donnée personnelle (`quality.compliance.dataClasses: pii`). Sa conservation suit celle du compte ; l'effacement est porté par SPEC-003, pas ici.
- [nfr] aucun envoi d'e-mail en v1, donc aucun sous-traitant destinataire de données personnelles à déclarer pour ce périmètre.
- [nfr] aucune limitation de débit générale n'existe dans le dépôt (SPEC-001, AUTO-30) : le ralentissement de RG-05 est le premier mécanisme du genre et ne couvre que la connexion.
- [impact] api — nouveau contexte de comptes (entité, dépôt, migration), implémentation de `AccessTokenVerifier`, routes d'inscription, de connexion et de changement de mot de passe, ralentissement des essais, et le passage de `renterId` sur le compte connecté dans `RequestRental`. Ne bougent pas : le contrat de `AuthGuard` et celui de `AccessTokenVerifier`, la publication d'annonce, la lecture publique d'une annonce.
- [impact] front, bo, e2e — aucune : `apps/front`, `apps/bo` et `apps/e2e` n'existent pas dans le dépôt.
- [hors-sujet] la suppression de compte et l'effacement des données — partent en SPEC-003 avec la dette #18, décision de séance ; les deux chemins d'anonymisation doivent être écrits ensemble.
- [hors-sujet] le parcours « mot de passe oublié » — écarté par D-03 : suppose un fournisseur d'e-mails qui n'existe pas.
- [hors-sujet] la vérification de l'adresse e-mail — assumée par RG-07 : aucune vérification en v1.
- [hors-sujet] connexion par SMS, Google ou Apple — écartées en séance de phase 1 au profit du mot de passe.
- [hors-sujet] rôle déclaré à l'inscription — écarté par D-05 : la donnée serait fausse dès qu'un conducteur publie.
- [hors-sujet] révocation de session, table de sessions, déconnexion côté serveur — écartées par D-04 : le jeton est sans état.
- [risque] un jeton volé reste utilisable jusqu'à sept jours, sans révocation possible · signal : aucun aujourd'hui, rien ne journalise les connexions · gravité : moyenne.
- [risque] un jeton émis avant un changement de mot de passe reste valable jusqu'à son expiration (EX-33) : changer son mot de passe ne coupe pas un accès déjà ouvert · signal : un utilisateur qui change son mot de passe après un vol et reste compromis · gravité : moyenne.
- [risque] l'adresse identifie le compte sans être vérifiée (RG-07) et aucun recours n'existe (D-03) : quiconque saisit l'adresse d'un autre la lui confisque · signal : « mon adresse est déjà prise » au support · gravité : forte.
- [risque] une attaque lente et répartie passe sous le ralentissement de RG-05 · signal : aucun aujourd'hui, rien ne journalise les échecs · gravité : moyenne.
- [risque] un utilisateur enfermé dehors doit passer par une réinitialisation manuelle en base · signal : les demandes de réinitialisation · gravité : moyenne.
- [risque] aucun test n'exerce la vraie garde aujourd'hui, `TestAuthGuard` la remplace toujours (`apps/api/src/shared/test/http/TestAuthGuard.ts:11-28`) : l'implémentation de `AccessTokenVerifier` doit venir avec un test qui passe par la vraie garde · signal : une régression de la garde qu'aucun test ne voit · gravité : moyenne.
