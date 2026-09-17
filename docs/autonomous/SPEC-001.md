---
spec: SPEC-001
mode: autonomous
statut: en-cours
demarre_le: 2026-09-17T01:34:49Z
termine_le: null
decisions: 13
ecarts_majeurs: 3
---

# Registre autonome — SPEC-001

## Autorisation et portée

- Commande : `/jp-way:build SPEC-001`, tapée par ethanlaloum le 17/09/2026.
- Config : `workflow.build.mode: autonomous`, `workflow.gates.perStory: false` (commit `9695c65` sur `main`).
- Cible : SPEC-001 « Publier une place de parking en location », plan `docs/plan/SPEC-001.md` révision 2.
- Qualité : conventions, sécurité, conformité (RGPD · pii, financial), documentation développeur + utilisateur + ADR ; OpenAPI désactivé.
- Exclusions : aucune autre spec ; aucune action sur une base de production ; aucun `pnpm install`.
- Consigne de l'humain avant de partir : suivre la recommandation donnée pour US-002 — retirer `ownerName`, ajouter à la spec les exemples de sécurité, ne pas brancher la route sans authentification.
- Reprise : US-002 (#3) était `status:in-progress`, trois barreaux verts, revues ④⑤⑥ rendues `ECARTS MAJEURS`, aucune PR.

## Décisions prises

### AUTO-01 · Le loueur est désigné par son compte connecté, jamais par un nom saisi
- Déclencheur : revue sécurité US-002, constats majeurs 1 et 2 (`listing.controller.ts:20` sans garde, `listing.controller.ts:33` lit `ownerName` du corps) ; revue conformité, constat majeur 1 (`owner_name` stocké sans règle qui le requiert).
- Choix : la route exige un appelant authentifié (401 sinon) ; le loueur est l'identifiant du compte porté par la requête authentifiée ; le corps ne porte plus aucun champ loueur ; l'annonce stocke `owner_id` et plus `owner_name`. La spec gagne EX-36 (visiteur non connecté) et EX-37 (le corps désigne un autre loueur), rattachés à RG-02 au barreau `int-http`, ajoutés à US-002. La vérification réelle du jeton reste derrière un port sans implémentation : le mécanisme d'authentification (session, JWT, fournisseur) n'appartient pas à SPEC-001.
- Alternatives : (a) garder `ownerName` et reporter toute la sécurité — écarté, consigne explicite de l'humain et constat d'autorisation jamais mineur ; (b) construire l'authentification complète (JWT, secret, comptes) — écarté, hors périmètre de SPEC-001 §2 et nouvelle dépendance ; (c) retirer tout loueur de l'annonce — écarté, RG-07 (dépublier sa propre annonce) et EX-14 ont besoin d'un propriétaire.
- Preuve : `docs/specs/SPEC-001-publier-une-place.md` note ⁸ (« garde d'authentification sur la route ») ; `backend-conventions/rest.md` §3 « The guard proves authentication. The use-case proves ownership. »
- Impact : spec révision 2 (+2 exemples), plan révision 3 (+2 cas), US-002 porte 5 exemples ; renommage `ownerName` → `ownerId` dans le domaine et la migration non encore livrée.
- Coût : un barreau int-http supplémentaire, un garde et sa doublure de test.
- Risque : la route reste inutilisable en production tant qu'aucun vérificateur de jeton n'existe — voulu (échec fermé).
- Rollback : revert de la PR US-002 ; la migration n'est pas encore appliquée ailleurs qu'en test.
- Traçabilité : RG-02 · EX-001-36 · EX-001-37 · US-002 · PR (à venir)
- Confiance : haute — les deux revues convergent et la consigne humaine est explicite.
- Question humaine au retour : quel mécanisme d'authentification (session, JWT, fournisseur externe) doit alimenter le port de vérification du jeton ?

### AUTO-02 · Corriger les écarts de conventions sans nouvel exemple
- Déclencheur : revue conventions US-002, constats majeurs 1 (`PublishListing.ts:39-58` sans capture des erreurs imprévues), 2 partiel (pas de `controllerErrorHandler` dans le contrôleur) et 3 (`KnexListingRepository.ts:12-33` sans `trx?`).
- Choix : corriger les trois dans US-002, par leur agent de couche, comme refactor sans changement de comportement spécifié ; les suites existantes doivent rester vertes.
- Alternatives : livrer en écart majeur — écarté, correction mécanique et bon marché.
- Preuve : `backend-conventions/domain.md` §3.1, `rest.md` §4, `data-and-events.md` §6.
- Impact : aucun exemple nouveau ; ces branches ne sont couvertes par aucun exemple (refus imprévus).
- Coût : trois dispatchs d'agents.
- Risque : faible.
- Rollback : revert des commits de refactor.
- Traçabilité : RG-02 · US-002
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-03 · Le contrôleur n'est enregistré dans aucun module
- Déclencheur : revue conventions US-002 constat majeur 2 (aucun module, ni `AppModule` ni `main.ts`) ; revue sécurité, correctif proposé « n'enregistrer ListingController dans aucun module tant qu'aucun guard n'existe ».
- Choix : ne pas créer `AppModule`, `main.ts` ni module listing dans US-002. Brancher l'application exige une connexion de production, un stockage de photos réel et un vérificateur de jeton, trois choix d'infrastructure qu'aucun exemple de SPEC-001 ne porte. Écart majeur livré tel quel.
- Alternatives : (a) créer le module avec des doublures en mémoire — écarté, doublures de test en production ; (b) choisir un fournisseur de stockage et une configuration de base — écarté, aucune règle ni exemple ne l'éclaire et le coût d'un mauvais choix dépasse cette story.
- Preuve : `find apps/api/src -name '*.module.ts' -o -name main.ts` → aucun résultat.
- Impact : `POST /listing` n'est atteignable par aucune application en cours d'exécution.
- Coût : nul maintenant ; reporté sur la première story qui démarre l'api (au plus tard US-010).
- Risque : moyen — une story future pourrait brancher le module sans le garde ; atténué par AUTO-01 (le garde est déclaré sur la route elle-même).
- Rollback : sans objet.
- Traçabilité : RG-02 · US-002 · US-010
- Confiance : moyenne — le report est sûr, mais rien dans le plan ne porte encore le démarrage de l'api.
- Question humaine au retour : quel stockage de photos et quelle base de production cibler au premier démarrage de l'api ?

### AUTO-04 · Le test int-repo d'EX-19 passe par le cas d'usage
- Déclencheur : revue conventions US-002 constat majeur 4 (`KnexListingRepository.sut.ts:32-49` appelle `PublishListing.execute`, pas un seul appel au dépôt).
- Choix : garder ce cadre. La ligne `Et` d'EX-19 (« aucune annonce, même incomplète, n'existe ») est une garantie d'orchestration contre une vraie base : un appel direct au dépôt ne peut pas exprimer l'`Étant donné` « le stockage des photos répond une erreur ». Écart majeur livré tel quel.
- Alternatives : (a) réécrire le SUT pour appeler `create` seul — écarté, le cadre ne dirait plus EX-19 (cadre relâché) ; (b) supprimer le cas int-repo — écarté, le dépôt Knex perdrait son seul test contre Postgres ; (c) le reclasser en `journey` — écarté pour l'instant, aucun `AppModule` (AUTO-03).
- Preuve : mutation vérifiée le 17/09/2026 — créer l'annonce avant le stockage des photos fait échouer `@EX-001-19` int-repo.
- Impact : `testing.md` §5 non respecté sur ce fichier.
- Coût : nul.
- Risque : faible.
- Rollback : reclasser le cas en `journey` quand l'api démarre.
- Traçabilité : RG-02 · EX-001-19 · US-002
- Confiance : moyenne
- Question humaine au retour : faut-il reclasser EX-19 en `journey` quand l'api aura un `AppModule` ?

### AUTO-05 · La durée de conservation des annonces n'est pas tranchée dans US-002
- Déclencheur : revue conformité US-002 constat majeur 2 (`listings` créée sans durée de conservation, `docs/adr/` vide).
- Choix : ne pas inventer de durée légale. Aucune annonce ne peut être dépubliée avant US-007 et aucune route n'est exposée (AUTO-03) : aucune donnée réelle n'est collectée. Écart majeur livré tel quel, à reprendre à US-007.
- Alternatives : (a) fixer une durée arbitraire et un mécanisme de purge — écarté, décision juridique sans preuve dans le dépôt ; (b) ajouter `deleted_at` par précaution — écarté, colonne sans exemple.
- Preuve : spec §8 « Aucune durée de conservation d'une annonce dépubliée n'a été fixée en séance. »
- Impact : RGPD non documenté pour `listings`.
- Coût : nul maintenant.
- Risque : moyen si l'api est mise en production avant la décision.
- Rollback : sans objet.
- Traçabilité : RG-07 · US-002 · US-007
- Confiance : moyenne
- Question humaine au retour : combien de temps garder une annonce dépubliée, et faut-il la supprimer ou l'anonymiser ?

### AUTO-06 · Bornes de saisie et horloge livrées en écarts mineurs
- Déclencheur : revue sécurité US-002 constats mineurs 3 (`PublishListingSchema.ts:4`, aucune longueur ni nombre maximal) et 4 (`PublishListingSchema.ts:10`, prix négatifs acceptés) ; revue conventions constat mineur 5 (`listing.controller.ts:29`, `new Date()` sans port d'horloge).
- Choix : ne pas corriger dans US-002. Les valeurs maximales ne figurent pas dans la spec ; un prix négatif touche RG-04, portée par US-004 ; le port d'horloge n'a aucun exemple int-http qui en dépende.
- Alternatives : fixer des bornes arbitraires — écarté, non mécanique.
- Preuve : spec notes ¹¹ et ¹² renvoient les bornes au schéma sans valeurs ; Q-01 « aucune borne ».
- Impact : écarts mineurs listés dans la PR.
- Coût : nul.
- Risque : faible tant que la route n'est pas exposée (AUTO-03).
- Rollback : sans objet.
- Traçabilité : RG-02 · RG-04 · US-002 · US-004
- Confiance : haute
- Question humaine au retour : quelles bornes (longueurs, nombre et taille des photos) et un prix négatif doit-il être refusé ?

### AUTO-07 · Le vrai garde d'authentification reste sans test propre
- Déclencheur : revue sécurité US-002 tour 2, constat mineur 1 (`apps/api/src/shared/test/http/createControllerTestApp.ts:12` remplace `AuthGuard` par `TestAuthGuard` ; une régression dans `auth.guard.ts:34` laisserait EX-36 vert).
- Choix : livrer en écart mineur. Tester le garde réel demande un exemple nouveau (EX-38 proposé : « un jeton que le vérificateur ne reconnaît pas est refusé ») et un vérificateur en mémoire, alors qu'aucun vérificateur réel n'existe : la story qui implémente `AccessTokenVerifier` portera ce test contre l'implémentation réelle.
- Alternatives : ajouter EX-38 maintenant — écarté, non mécanique et prouverait le garde contre une doublure seulement.
- Preuve : revue sécurité tour 2, « Correctif majeur 1 (garde) tient » ; `find apps/api/src -name '*.module.ts'` → aucun résultat.
- Impact : garde correct mais non prouvé par un test.
- Coût : nul maintenant.
- Risque : faible tant que la route n'est pas montée (AUTO-03).
- Rollback : sans objet.
- Traçabilité : RG-02 · EX-001-36 · US-002
- Confiance : moyenne
- Question humaine au retour : faut-il ajouter EX-38 dès maintenant, ou dans la story qui branche l'authentification ?

### AUTO-08 · Une clé de place unique, calculée par le domaine et contrainte par la base
- Déclencheur : revue sécurité US-003, constats majeurs 1 (`KnexListingRepository.ts:52`, normalisation SQL différente de `normalizeAddress`, index unique sur l'adresse brute) et 2 (`Listing.ts:61`, box jamais normalisé) ; revue conventions US-003, constat majeur 3 (filet ² de la sonde qui ne couvre pas la normalisation, requête Knex jamais exécutée contre Postgres).
- Choix : le domaine calcule une seule clé de place (adresse et box normalisés de la même façon : Unicode NFKC, espaces de toute sorte réduits et rognés, minuscules) ; l'annonce stocke cette clé dans une colonne `place_key` écrite par le dépôt ; une nouvelle migration remplace l'index unique par `(place_key) WHERE status = 'ACTIVE'` ; la recherche lit `place_key` sans normalisation SQL ; une violation de cet index est traduite en `ListingAlreadyActiveError`. La spec gagne EX-38 (un box écrit avec une espace) au barreau `unit` et EX-39 (deux publications concurrentes de la même place écrite autrement) au barreau `int-repo`, rattachés à RG-01 et ajoutés à US-003, qui passe à 7 exemples.
- Alternatives : (a) index sur expression SQL — écarté, deux normalisations (JS et SQL) divergent, c'est le défaut constaté ; (b) une story séparée pour ces refus — écarté, livrerait US-003 avec un contournement connu de EX-14 ; (c) rester à 5 exemples en reportant EX-38/EX-39 — même raison.
- Preuve : revue sécurité US-003 (exploit « 12 » suivi d'une espace, retour à la ligne, espace insécable) ; `apps/api/src/infra/migrations/20260917120000_create_listings.ts:31`.
- Impact : spec révision 3, plan révision 4 ; US-003 dépasse le plafond de 5 exemples par story (plan.md §4), dépassement assumé pour ne pas livrer un contournement.
- Coût : une migration, un barreau int-repo de plus dans US-003.
- Risque : faible — aucune donnée réelle, la route n'est montée nulle part (AUTO-03).
- Rollback : revert de la PR US-003 et de sa migration.
- Traçabilité : RG-01 · EX-001-16 · EX-001-38 · EX-001-39 · US-003
- Confiance : haute
- Question humaine au retour : « Box 12 », « n°12 » et « 12 » doivent-ils désigner le même box ? (la normalisation retenue ne les confond pas)
- Note : l'identifiant EX-38 proposé dans AUTO-07 n'a jamais été inscrit dans la spec ; il est attribué ici. La proposition d'AUTO-07 recevra le prochain numéro libre si elle est retenue.

### AUTO-09 · Le refus « place déjà annoncée » répond 409
- Déclencheur : revue conventions US-003, constat majeur 1 (`listing.controller.ts:54-71`, `ListingAlreadyActiveError` tombe dans le 500).
- Choix : ajouter la branche `ListingAlreadyActiveError → 409` à l'échelle du contrôleur, sans nouvel exemple int-http (même traitement que `UnknownError` en AUTO-02).
- Alternatives : un exemple int-http du 409 — écarté, le refus est déjà prouvé en unit par EX-02/14/16 et la route n'est pas montée.
- Preuve : `backend-conventions/rest.md` §6.
- Impact : branche du contrôleur sans test dédié.
- Coût : faible. Risque : faible. Rollback : revert.
- Traçabilité : RG-01 · US-003
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-10 · La ligne « la location n'est pas touchée » d'EX-15 n'est pas encore observable
- Déclencheur : revue conventions US-003, constat majeur 2 (`PublishListing.sut.ts:121-124,235-238`, `thenRentalIsUnchanged` relit l'état qu'il vient d'écrire).
- Choix : retirer cette assertion tautologique du cadre EX-15 ; le refus et « l'annonce existante reste la seule active » restent assérés. La dernière ligne `Et` sera observée quand un dépôt de locations existera (stories de `rental/`).
- Alternatives : (a) garder l'assertion — écarté, elle ne peut jamais échouer ; (b) créer un dépôt de locations maintenant — écarté, empiète sur US-005 à US-008.
- Preuve : revue conventions US-003 constat 2.
- Impact : une ligne `Et` d'EX-15 sans preuve jusqu'aux stories de location.
- Coût : nul. Risque : faible. Rollback : rétablir l'assertion sur un vrai dépôt.
- Traçabilité : RG-01 · EX-001-15 · US-003
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-11 · Le remplissage de `place_key` est calculé en JavaScript, pas en SQL
- Déclencheur : revue conventions US-003 tour 2, constat majeur 1 (`apps/api/src/infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts:8-14`, normalisation SQL divergente de `Listing.placeKeyOf`).
- Choix : la migration lit les lignes et calcule la clé avec une copie figée, en JavaScript, de la normalisation du domaine ; elle n'importe pas le domaine, pour qu'une évolution future du code ne réécrive pas une migration déjà jouée. Seconde approche sur ce constat de fond (la première était l'index sur expression, écarté en AUTO-08).
- Alternatives : (a) garder le SQL et restreindre la garantie aux nouvelles écritures — écarté, la migration livrerait la divergence ; (b) importer `Listing.placeKeyOf` dans la migration — écarté, couplage d'une migration à du code vivant.
- Preuve : revue conventions US-003 tour 2 ; vérification ponctuelle de l'égalité octet par octet rapportée par backend-data.
- Impact : aucun sur les écritures ; le remplissage des lignes antérieures suit la même règle qu'aujourd'hui.
- Coût : faible. Risque : faible. Rollback : revert de la migration avant qu'elle ne tourne sur une base réelle.
- Traçabilité : RG-01 · EX-001-39 · US-003
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-12 · Les caractères invisibles ne sont pas retirés de la clé de place
- Déclencheur : revue sécurité US-003 tour 2, constat mineur 1 (`apps/api/src/listing/domain/entities/Listing.ts:22`, U+200B, U+00AD, U+2060 laissés dans la clé : deux annonces actives visuellement identiques restent possibles).
- Choix : livrer en écart mineur. Retirer les points de code ignorables demande un exemple nouveau (EX-40 proposé par la revue) et un nouveau tour de spec ; la route n'est montée nulle part (AUTO-03).
- Alternatives : corriger maintenant — reporté, non mécanique (nouvel exemple).
- Preuve : revue sécurité US-003 tour 2 (ZWSP, SHY, WJ donnent une clé différente).
- Impact : contournement invisible de RG-01 possible dès que la route sera montée.
- Coût : nul maintenant. Risque : moyen à la mise en ligne. Rollback : sans objet.
- Traçabilité : RG-01 · US-003
- Confiance : moyenne
- Question humaine au retour : faut-il ajouter l'exemple « un box écrit avec un caractère invisible est le même box » avant de monter la route ?

### AUTO-13 · Une durée de la grille peut être absente, jusque dans la base et la requête
- Déclencheur : US-004 (EX-06, EX-07, EX-24, EX-25). La grille actuelle impose un prix pour chaque durée (`ListingPricing` à trois nombres, colonnes `*_price_in_cents NOT NULL`, schéma HTTP `Schema.Int` requis) : « une grille qui ne porte que le mois » est inexprimable. Le corps de l'issue #4 interdit pourtant `adapters/**` et toute migration.
- Choix : une durée absente vaut `null` du domaine à la base. US-004 franchit donc les couches interdites par son issue, au strict nécessaire : une nouvelle migration rend les trois colonnes nullables, le dépôt Knex lit et écrit `null`, le schéma HTTP accepte une durée absente, et le contrôleur répond 400 sur `IncompletePricingError`. Ces changements d'adaptateurs n'ont pas d'exemple propre : ils suivent le type du domaine. `UpdateListingPricing` identifie l'annonce par son loueur et sa place (clé de place, US-003), faute d'identifiant d'annonce (reporté à US-009), et le dépôt gagne `save(listing, trx?)`. Message de refus retenu : « La grille tarifaire est incomplète ».
- Alternatives : (a) représenter une durée absente par `0` — écarté, EX-25 publie une grille à `0,00 €` qui doit rester distincte d'une absence ; (b) respecter les couches interdites et ne livrer que le domaine — écarté, le build et le dépôt Knex ne compileraient plus ; (c) introduire l'identifiant d'annonce maintenant — écarté, décision antérieure de le poser à US-009.
- Preuve : `apps/api/src/infra/migrations/20260917120000_create_listings.ts:11-13` ; `apps/api/src/listing/adapters/rest/dtos/PublishListingSchema.ts:9-11`.
- Impact : barreaux int-repo et int-http touchés sans nouvel exemple ; `save` et la lecture des durées nulles ne sont prouvés que par les suites existantes.
- Coût : trois dispatchs d'agents. Risque : faible (route non montée, AUTO-03). Rollback : revert de la PR US-004 et de sa migration.
- Traçabilité : RG-04 · EX-001-06 · EX-001-07 · EX-001-24 · EX-001-25 · US-004
- Confiance : moyenne — le texte « la grille tarifaire est signalée comme incomplète » ne fixe pas le message exact.
- Question humaine au retour : quel message exact afficher pour une grille sans durée ?

## Écarts majeurs livrés

- AUTO-03 · conventions `ECARTS MAJEURS` · `ListingController` et le jeton `AccessTokenVerifier` ne sont liés à aucun module ; `POST /listing` n'est atteignable par aucune application. Preuve : `find apps/api/src -iname '*.module.ts' -o -iname main.ts` → vide. Rollback : sans objet. PR US-002.
- AUTO-04 · conventions `ECARTS MAJEURS` · le test int-repo `@EX-001-19` passe par `PublishListing`, pas par un appel isolé au dépôt. Preuve : `KnexListingRepository.sut.ts:29,59`. Rollback : reclasser en `journey`. PR US-002.
- AUTO-05 · conformité RGPD `ECARTS MAJEURS` · aucune durée de conservation ni purge pour `listings`. Preuve : `docs/adr/` vide, spec §8. Rollback : sans objet. PR US-002.

## Résultat livré

- US-001 (#2) fusionnée (PR #12) avant ce run.
- US-002 (#3) fusionnée : PR #13, `7b61cc6`. Unit 7 passed · int 4 passed · build 0. Revues : conventions ECARTS MAJEURS (AUTO-03, AUTO-04 livrés) · sécurité ECARTS MINEURS · conformité ECARTS MAJEURS (AUTO-05 livré).
- US-003 (#4) fusionnée : PR #14, `ba1f945`. Unit 13 passed · int 5 passed · build 0. Revues : conventions CONFORME · sécurité ECARTS MINEURS (AUTO-12) · conformité CONFORME.
- Restent : US-004 à US-010.

## À relire au retour


- AUTO-01 : quel mécanisme d'authentification alimente `AccessTokenVerifier` ?
- AUTO-03 : stockage de photos et base de production au premier démarrage de l'api.
- AUTO-05 : durée de conservation d'une annonce dépubliée (écart RGPD livré).
- AUTO-06 : bornes de saisie et refus des prix négatifs.
- AUTO-07 : ajouter un exemple « jeton inconnu refusé » (numéro à attribuer, EX-38 ayant servi en AUTO-08).
- AUTO-08 : « Box 12 », « n°12 » et « 12 » désignent-ils le même box ?
- AUTO-12 : exemple « caractère invisible dans le box ou l'adresse » avant de monter la route.
