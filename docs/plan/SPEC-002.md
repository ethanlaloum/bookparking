---
spec: SPEC-002
statut: valide
revision: 4
valide_le: 2026-09-20
valide_par: JP
derive_de: SPEC-002@cd56f5e83c7e23e4008c5bd864b63789988566e2
apps: [api]
cas: 43
stories: 12
---

# SPEC-002 · Plan

## Couverture par barreau

| Barreau | api | Cas | Exemples |
|---|---|---|---|
| unit | 26 | 26 | 26 |
| int-repo | 1 | 1 | 1 |
| int-http | 13 | 13 | 13 |
| journey | 0 | 0 | 0 |
| **total** | **40** | **40** | 40 exemples, 0 sans cas |

**Écarts avec la suggestion de la spec**

Aucun. Les 40 barreaux planifiés reprennent, exemple par exemple, la suggestion `barreau` du
bloc `jp-way:ex` de la spec — la table de décision (`plan.md` §2) et les sept tie-breakers ne
déplacent aucun exemple.

**Découpage — 3,6 exemples/story, deux stories courtes irréductibles**

- US-021 (2 exemples) ne fusionne qu'avec US-020, son seul candidat de fusion dans la même app :
  mais US-020 porte la demande d'une place (agrégat `rental`) et US-021 porte la publication et
  la lecture d'une annonce (agrégat `listing`) — aucun cas d'usage ni agrégat commun, donc pas
  de fusion (§4 étape 4).
- Toute autre paire de groupes de même app franchirait le plafond de 5 exemples ou une arête
  `depend_de` : US-013 + US-014 feraient 9 exemples, US-015 + US-016 en feraient 6, US-017 +
  US-018 en feraient 7 — et US-014, US-016, US-018 dépendent déjà chacune de la story qu'elles
  complètent, ce qui interdirait la fusion même si le plafond ne le faisait pas.
- US-013 ne porte que `int-http` : le refus d'une adresse ou d'un mot de passe mal formés ne
  s'observe qu'à la frontière HTTP, où le schéma de la requête décode le corps — ces exemples de
  RG-01 et RG-07 n'ont aucune ligne `Alors` observable plus bas (T1). Ce n'est pas une coupe
  horizontale : US-013 reste une tranche verticale complète pour son cas d'usage, elle n'a
  simplement besoin que d'un seul barreau pour l'observer.

## Cas

| EX | Barreau | App | Story | Fichier | Titre |
|---|---|---|---|---|---|
| EX-01 | unit | api | US-011 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | creates an account for a new email address |
| EX-08 | unit | api | US-011 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | converts a repository failure into an unknown error |
| EX-10 | unit | api | US-011 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | accepts a long password with accents and emoji |
| EX-03 | int-repo | api | US-011 | `apps/api/src/user-management/adapters/repositories/account/KnexAccountRepository.int.spec.ts` | keeps a single account when the same address is written twice |
| EX-02 | unit | api | US-012 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | refuses an email address that already has an account |
| EX-07 | unit | api | US-012 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | treats a differently cased and spaced address as the same account |
| EX-39 | unit | api | US-012 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | normalises an accented address to a single account |
| EX-04 | int-http | api | US-012 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | responds 409 when the email address already has an account |
| EX-05 | int-http | api | US-013 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses a password shorter than eight characters |
| EX-06 | int-http | api | US-013 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | accepts a password of exactly eight characters |
| EX-09 | int-http | api | US-013 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses an empty password |
| EX-34 | int-http | api | US-013 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses an address with no at sign |
| EX-38 | int-http | api | US-013 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses an empty address |
| EX-35 | unit | api | US-014 | `apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts` | makes the account usable without sending any email |
| EX-36 | int-http | api | US-014 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses an address of 255 characters |
| EX-37 | int-http | api | US-014 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | accepts an address of 254 characters |
| EX-40 | int-http | api | US-014 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | refuses an address carrying a quote and a comment marker |
| EX-39 | int-http | api | US-014 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | accepts an accented address at the HTTP boundary |
| EX-41 | int-http | api | US-022 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | keeps a mistyped password out of the validation response |
| EX-42 | int-http | api | US-022 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | keeps a non-object request body out of the validation response |
| EX-14 | unit | api | US-015 | `apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts` | issues a token valid for seven days |
| EX-17 | unit | api | US-015 | `apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts` | refuses a wrong password without saying the account exists |
| EX-18 | unit | api | US-015 | `apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts` | refuses an unknown address with the same error as a wrong password |
| EX-15 | unit | api | US-016 | `apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts` | extends the token when it is used before it expires |
| EX-16 | unit | api | US-016 | `apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts` | refuses a token left unused for seven days |
| EX-19 | unit | api | US-016 | `apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts` | refuses a token 168 hours old though the local clock shows less than seven days |
| EX-22 | unit | api | US-017 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | delays the third consecutive failure by one second |
| EX-23 | unit | api | US-017 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | caps the delay at thirty seconds |
| EX-24 | unit | api | US-017 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | resets the failure counter after a successful sign-in |
| EX-25 | unit | api | US-017 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | never locks the account out |
| EX-26 | unit | api | US-018 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | delays an origin that tries several accounts |
| EX-27 | unit | api | US-018 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | resets the failure counter after fifteen minutes without an attempt |
| EX-28 | unit | api | US-018 | `apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts` | counts two simultaneous attempts as two failures |
| EX-29 | unit | api | US-019 | `apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts` | invalidates the former password after a change |
| EX-30 | unit | api | US-019 | `apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts` | refuses a password change without the current password |
| EX-32 | unit | api | US-019 | `apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts` | refuses a new password shorter than eight characters |
| EX-33 | unit | api | US-019 | `apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts` | keeps a token issued before the password change valid |
| EX-31 | int-http | api | US-019 | `apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts` | responds 401 to a password change with no token |
| EX-20 | unit | api | US-020 | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` | records a rental request for an account that already publishes |
| EX-12 | int-http | api | US-020 | `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts` | refuses a rental request from a visitor with no account |
| EX-13 | int-http | api | US-020 | `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts` | records the rental request for the authenticated account whatever the body names |
| EX-21 | unit | api | US-021 | `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` | publishes a listing for an account that never published |
| EX-11 | int-http | api | US-021 | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` | serves a listing to a visitor with no account |

<!-- jp-way:cas {"ex":"EX-01","barreau":"unit","app":"api","story":"US-011","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"creates an account for a new email address","empreinte":"5011e387"} -->
<!-- jp-way:cas {"ex":"EX-08","barreau":"unit","app":"api","story":"US-011","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"converts a repository failure into an unknown error","empreinte":"0eff5431"} -->
<!-- jp-way:cas {"ex":"EX-10","barreau":"unit","app":"api","story":"US-011","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"accepts a long password with accents and emoji","empreinte":"aa12f003"} -->
<!-- jp-way:cas {"ex":"EX-03","barreau":"int-repo","app":"api","story":"US-011","chemin":"apps/api/src/user-management/adapters/repositories/account/KnexAccountRepository.int.spec.ts","titre":"keeps a single account when the same address is written twice","empreinte":"a3a932d6"} -->
<!-- jp-way:cas {"ex":"EX-02","barreau":"unit","app":"api","story":"US-012","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"refuses an email address that already has an account","empreinte":"1dc5d233"} -->
<!-- jp-way:cas {"ex":"EX-07","barreau":"unit","app":"api","story":"US-012","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"treats a differently cased and spaced address as the same account","empreinte":"010fa706"} -->
<!-- jp-way:cas {"ex":"EX-39","barreau":"unit","app":"api","story":"US-012","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"normalises an accented address to a single account","empreinte":"4930b02c"} -->
<!-- jp-way:cas {"ex":"EX-04","barreau":"int-http","app":"api","story":"US-012","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"responds 409 when the email address already has an account","empreinte":"22f94914"} -->
<!-- jp-way:cas {"ex":"EX-05","barreau":"int-http","app":"api","story":"US-013","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses a password shorter than eight characters","empreinte":"bc3457cd"} -->
<!-- jp-way:cas {"ex":"EX-06","barreau":"int-http","app":"api","story":"US-013","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"accepts a password of exactly eight characters","empreinte":"e65772f2"} -->
<!-- jp-way:cas {"ex":"EX-09","barreau":"int-http","app":"api","story":"US-013","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses an empty password","empreinte":"c94a0d4b"} -->
<!-- jp-way:cas {"ex":"EX-34","barreau":"int-http","app":"api","story":"US-013","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses an address with no at sign","empreinte":"e127673b"} -->
<!-- jp-way:cas {"ex":"EX-38","barreau":"int-http","app":"api","story":"US-013","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses an empty address","empreinte":"3b73fc29"} -->
<!-- jp-way:cas {"ex":"EX-35","barreau":"unit","app":"api","story":"US-014","chemin":"apps/api/src/user-management/domain/usecases/register-account/RegisterAccount.unit.spec.ts","titre":"makes the account usable without sending any email","empreinte":"9a7c1934"} -->
<!-- jp-way:cas {"ex":"EX-36","barreau":"int-http","app":"api","story":"US-014","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses an address of 255 characters","empreinte":"0dcb1c44"} -->
<!-- jp-way:cas {"ex":"EX-37","barreau":"int-http","app":"api","story":"US-014","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"accepts an address of 254 characters","empreinte":"f1ed5a6d"} -->
<!-- jp-way:cas {"ex":"EX-40","barreau":"int-http","app":"api","story":"US-014","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"refuses an address carrying a quote and a comment marker","empreinte":"60a9b317"} -->
<!-- jp-way:cas {"ex": "EX-39", "barreau": "int-http", "app": "api", "story": "US-014", "chemin": "apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts", "titre": "accepts an accented address at the HTTP boundary", "empreinte": "4930b02c"} -->
<!-- jp-way:cas {"ex": "EX-41", "barreau": "int-http", "app": "api", "story": "US-022", "chemin": "apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts", "titre": "keeps a mistyped password out of the validation response", "empreinte": "248d6a55"} -->
<!-- jp-way:cas {"ex": "EX-42", "barreau": "int-http", "app": "api", "story": "US-022", "chemin": "apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts", "titre": "keeps a non-object request body out of the validation response", "empreinte": "3bde4c88"} -->
<!-- jp-way:cas {"ex":"EX-14","barreau":"unit","app":"api","story":"US-015","chemin":"apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts","titre":"issues a token valid for seven days","empreinte":"e62194d6"} -->
<!-- jp-way:cas {"ex":"EX-17","barreau":"unit","app":"api","story":"US-015","chemin":"apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts","titre":"refuses a wrong password without saying the account exists","empreinte":"2377fa7e"} -->
<!-- jp-way:cas {"ex":"EX-18","barreau":"unit","app":"api","story":"US-015","chemin":"apps/api/src/user-management/domain/usecases/sign-in/SignIn.unit.spec.ts","titre":"refuses an unknown address with the same error as a wrong password","empreinte":"c93f0dcb"} -->
<!-- jp-way:cas {"ex":"EX-15","barreau":"unit","app":"api","story":"US-016","chemin":"apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts","titre":"extends the token when it is used before it expires","empreinte":"b140c8eb"} -->
<!-- jp-way:cas {"ex":"EX-16","barreau":"unit","app":"api","story":"US-016","chemin":"apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts","titre":"refuses a token left unused for seven days","empreinte":"6ca2359a"} -->
<!-- jp-way:cas {"ex":"EX-19","barreau":"unit","app":"api","story":"US-016","chemin":"apps/api/src/user-management/domain/services/slidingAccessToken.unit.spec.ts","titre":"refuses a token 168 hours old though the local clock shows less than seven days","empreinte":"55b7ef5d"} -->
<!-- jp-way:cas {"ex":"EX-22","barreau":"unit","app":"api","story":"US-017","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"delays the third consecutive failure by one second","empreinte":"6a649579"} -->
<!-- jp-way:cas {"ex":"EX-23","barreau":"unit","app":"api","story":"US-017","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"caps the delay at thirty seconds","empreinte":"1fd21004"} -->
<!-- jp-way:cas {"ex":"EX-24","barreau":"unit","app":"api","story":"US-017","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"resets the failure counter after a successful sign-in","empreinte":"2597ce70"} -->
<!-- jp-way:cas {"ex":"EX-25","barreau":"unit","app":"api","story":"US-017","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"never locks the account out","empreinte":"5e7b34c8"} -->
<!-- jp-way:cas {"ex":"EX-26","barreau":"unit","app":"api","story":"US-018","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"delays an origin that tries several accounts","empreinte":"a241e755"} -->
<!-- jp-way:cas {"ex":"EX-27","barreau":"unit","app":"api","story":"US-018","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"resets the failure counter after fifteen minutes without an attempt","empreinte":"94d5d460"} -->
<!-- jp-way:cas {"ex":"EX-28","barreau":"unit","app":"api","story":"US-018","chemin":"apps/api/src/user-management/domain/services/signInThrottle.unit.spec.ts","titre":"counts two simultaneous attempts as two failures","empreinte":"73484439"} -->
<!-- jp-way:cas {"ex":"EX-29","barreau":"unit","app":"api","story":"US-019","chemin":"apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts","titre":"invalidates the former password after a change","empreinte":"c4858640"} -->
<!-- jp-way:cas {"ex":"EX-30","barreau":"unit","app":"api","story":"US-019","chemin":"apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts","titre":"refuses a password change without the current password","empreinte":"a3db9b63"} -->
<!-- jp-way:cas {"ex":"EX-32","barreau":"unit","app":"api","story":"US-019","chemin":"apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts","titre":"refuses a new password shorter than eight characters","empreinte":"3d3d0cdd"} -->
<!-- jp-way:cas {"ex":"EX-33","barreau":"unit","app":"api","story":"US-019","chemin":"apps/api/src/user-management/domain/usecases/change-password/ChangePassword.unit.spec.ts","titre":"keeps a token issued before the password change valid","empreinte":"aa74f913"} -->
<!-- jp-way:cas {"ex":"EX-31","barreau":"int-http","app":"api","story":"US-019","chemin":"apps/api/src/user-management/adapters/rest/controllers/account/account.controller.int.spec.ts","titre":"responds 401 to a password change with no token","empreinte":"4d04fdb5"} -->
<!-- jp-way:cas {"ex":"EX-20","barreau":"unit","app":"api","story":"US-020","chemin":"apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts","titre":"records a rental request for an account that already publishes","empreinte":"179b7ad1"} -->
<!-- jp-way:cas {"ex":"EX-12","barreau":"int-http","app":"api","story":"US-020","chemin":"apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts","titre":"refuses a rental request from a visitor with no account","empreinte":"0824f80d"} -->
<!-- jp-way:cas {"ex":"EX-13","barreau":"int-http","app":"api","story":"US-020","chemin":"apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.int.spec.ts","titre":"records the rental request for the authenticated account whatever the body names","empreinte":"99c06490"} -->
<!-- jp-way:cas {"ex":"EX-21","barreau":"unit","app":"api","story":"US-021","chemin":"apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts","titre":"publishes a listing for an account that never published","empreinte":"7fe6f4ff"} -->
<!-- jp-way:cas {"ex":"EX-11","barreau":"int-http","app":"api","story":"US-021","chemin":"apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts","titre":"serves a listing to a visitor with no account","empreinte":"8b52e94a"} -->

## Stories

| Ordre | Story | Titre | App | Barreaux | Exemples | Issue |
|---|---|---|---|---|---|---|
| 1 | US-011 | Créer un compte | api | unit int-repo | EX-01 EX-03 EX-08 EX-10 | #25 |
| 2 | US-012 | Refuser une adresse déjà utilisée | api | unit int-http | EX-02 EX-04 EX-07 EX-39 | #26 |
| 3 | US-013 | Valider l'adresse et le mot de passe à l'inscription | api | int-http | EX-05 EX-06 EX-09 EX-34 EX-38 | #24 |
| 4 | US-014 | Borner et assainir l'adresse | api | unit int-http | EX-35 EX-36 EX-37 EX-39 EX-40 | #27 |
| 5 | US-015 | Se connecter et obtenir un jeton | api | unit | EX-14 EX-17 EX-18 | #28 |
| 6 | US-016 | Prolonger et expirer le jeton | api | unit | EX-15 EX-16 EX-19 | #29 |
| 7 | US-017 | Ralentir les essais de connexion | api | unit | EX-22 EX-23 EX-24 EX-25 | #30 |
| 8 | US-018 | Ralentir par origine et par fenêtre | api | unit | EX-26 EX-27 EX-28 | #31 |
| 9 | US-019 | Changer son mot de passe | api | unit int-http | EX-29 EX-30 EX-31 EX-32 EX-33 | #32 |
| 10 | US-020 | Exiger un compte pour demander une place | api | unit int-http | EX-12 EX-13 EX-20 | #33 |
| 11 | US-021 | Publier avec un compte, lire sans | api | unit int-http | EX-11 EX-21 | #34 |
| 12 | US-022 | Ne jamais renvoyer la valeur soumise dans un refus de validation | api | int-http | EX-41 EX-42 | #39 |

## Dépendances

| Story | Dépend de | Nature |
|---|---|---|
| US-012 | US-011 | schéma — la table des comptes et son dépôt |
| US-013 | US-012 | contrat — la route d'inscription et son décodage |
| US-014 | US-012 | contrat — la route d'inscription et son décodage |
| US-015 | US-011 | schéma — la table des comptes et son dépôt |
| US-016 | US-015 | contrat — le jeton délivré par la connexion |
| US-017 | US-015 | contrat — la connexion et son erreur de refus |
| US-018 | US-017 | contrat — le compteur d'échecs et son délai |
| US-019 | US-015 | contrat — la connexion, qui prouve l'ancien et le nouveau |

Graphe acyclique, vérifié. Aucune dépendance de confort. US-011, US-020 et US-021 ne dépendent
d'aucune autre story : US-011 crée le compte que les autres story consomment ensuite par schéma
ou par contrat ; US-020 et US-021 étendent des routes déjà en place dans SPEC-001 et observent
une garde dont le contrat ne bouge pas dans cette spec.

## Ce qui n'est pas testé, et pourquoi

**Filets structurels (7)**

- RG-01 × Concurrence — filet² : contrainte d'unicité en base sur l'adresse normalisée, même
  mécanisme que `listings_active_place_key_unique`
  (`apps/api/src/infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts`).
- RG-02 × Temps — filet⁷ : l'expiration du jeton est portée par RG-03 et vérifiée par la garde
  (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
- RG-02 × Données — filet¹⁰ : un jeton malformé fait renvoyer `null` par le vérificateur et la
  garde répond `401` (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:33-35`).
- RG-03 × Vide — filet¹¹ : jeton absent ou vide, la garde répond `401` avant toute vérification
  (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:27-31`).
- RG-03 × Données — filet¹³ : un jeton tronqué ou modifié échoue à la vérification et renvoie
  `null` (`apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1-7`).
- RG-04 × Autorisation — filet¹⁵ : la garde fournit le même `request.user.id` quelle que soit
  l'action (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:37`).
- RG-06 × Données — filet²¹ : le mot de passe n'apparaît dans aucune réponse ni aucun journal,
  contrainte non fonctionnelle `## 8` de la spec.

**Cellules écartées (38), groupées par raison**

- Temps — RG-01, RG-04, RG-06, RG-07 : la règle ne lit aucune donnée temporelle (écarté¹).
- Autorisation — RG-01 : s'inscrire est ouvert à tout visiteur, aucune autorisation ne s'applique
  par construction (écarté³).
- Argent — RG-01 à RG-07 : aucun montant, aucune devise, aucune unité n'entre dans ce chemin
  (écarté⁴).
- Volume — RG-01, RG-02, RG-03, RG-04, RG-06, RG-07 : la règle porte sur un compte à la fois,
  aucune liste n'est lue ni rendue (écarté⁵).
- Limites — RG-02, RG-04 : la règle est binaire, compte ou pas de compte, aucune borne numérique
  (écarté⁶).
- Concurrence — RG-02 : la règle ne lit ni n'écrit d'état partagé, deux requêtes simultanées
  suivent chacune le même chemin (écarté⁸).
- Panne — RG-02, RG-03, RG-04, RG-05, RG-06 : aucun appel à un tiers dans ce chemin, aucun
  fournisseur d'e-mails n'existe en v1 (écarté⁹).
- Concurrence — RG-03 : le jeton est sans état côté serveur, deux usages simultanés ne partagent
  aucune ligne (écarté¹²).
- Concurrence — RG-04 : publier et demander écrivent dans deux tables distinctes, `listings` et
  `rental_requests` (écarté¹⁴).
- Données — RG-04, RG-05 : la règle n'introduit aucune saisie libre (écarté¹⁶).
- Vide — RG-05 : un compteur d'échecs à zéro est le cas nominal, déjà couvert par EX-14
  (écarté¹⁷).
- Autorisation — RG-05 : le ralentissement s'applique avant toute authentification, il ne dépend
  d'aucun droit (écarté¹⁸).
- Vide — RG-06 : un champ absent produit le même refus de validation qu'un champ trop court, déjà
  EX-32 (écarté¹⁹).
- Concurrence — RG-06 : deux changements simultanés, le dernier écrit gagne, aucune règle ne
  dépend de l'ordre (écarté²⁰).
- Concurrence — RG-07 : la validation syntaxique est locale à la requête et ne lit aucun état
  partagé (écarté²²).
- Autorisation — RG-07 : la validation s'applique avant toute authentification (écarté²³).
- État — RG-07 : la validité syntaxique d'une adresse ne dépend d'aucun état du compte
  (écarté²⁴).
- Panne — RG-07 : aucun envoi d'e-mail n'a lieu en v1, c'est précisément ce que la règle assume
  (écarté²⁵).

**Trois faits complémentaires**

- Aucun cas `journey` et aucun cas `e2e` : la spec ne mint aucun exemple pour ces barreaux (T2 —
  le plan n'en invente jamais), et le dépôt ne porte aucune app `apps/e2e`.
- L'unique cas `int-repo` (EX-03) exige Docker — sans Docker, `/jp-way:build` refuse ce barreau.
- Trois cas s'ajoutent à des fichiers qui existent déjà et portent `@SPEC-001` : un second
  `describe` portant `@SPEC-002`, jamais un fichier parallèle —
  `apps/api/src/rental/domain/usecases/request-rental/RequestRental.unit.spec.ts` (EX-20),
  `apps/api/src/listing/domain/usecases/publish-listing/PublishListing.unit.spec.ts` (EX-21),
  `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.int.spec.ts` (EX-11).
