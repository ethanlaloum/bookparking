---
spec: SPEC-001
mode: autonomous
statut: en-cours
demarre_le: 2026-09-17T01:34:49Z
termine_le: null
decisions: 27
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

### AUTO-14 · Erreurs partagées dans `domain/errors/` et écriture `save` en mise à jour seule
- Déclencheur : revue conventions US-004, constats majeurs 1 (`Listing.ts:3`, `IncompletePricingError` rangée sous `publish-listing/errors/` alors que deux cas d'usage et l'entité l'utilisent ; même motif pour `ListingNotOwnedError`) et 2 (`KnexListingRepository.save` insère quand aucune ligne active ne correspond, `InMemoryListingRepository.save` ne fait rien).
- Choix : (1) déplacer vers `apps/api/src/listing/domain/errors/` les erreurs levées par l'entité (`IncompletePricingError`, `ListingNotOwnedError`) ; (2) `save` ne crée jamais d'annonce : il met à jour la ligne active de la même clé de place et lève `ActiveListingNotFoundError` si aucune ne correspond, à l'identique dans les deux dépôts. La publication reste le seul chemin de création.
- Alternatives : `insert … onConflict(place_key).merge()` comme proposé par la revue — écarté, l'index unique est partiel (`WHERE status = 'ACTIVE'`) et un upsert créerait des annonces hors de `PublishListing`.
- Preuve : revue conventions US-004 ; `backend-conventions/domain.md` (erreurs réutilisées), `data-and-events.md` §13.5 (sémantique miroir).
- Impact : chemins d'import modifiés dans les cadres unit (les chemins d'erreur ne sont pas des assertions) ; aucun comportement d'exemple changé.
- Coût : deux dispatchs. Risque : faible. Rollback : revert des commits.
- Traçabilité : RG-04 · EX-001-07 · EX-001-24 · US-004
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-15 · Ce que « couvre » un palier : pavage exact de la période, mois calendaire
- Déclencheur : US-005 (EX-05, EX-20, EX-21, EX-23). La spec ne définit ni la longueur d'un mois ni ce que « couvrir » veut dire ; EX-21 refuse sept jours avec une grille au seul mois, ce qui exclut qu'un mois « couvre » une période plus courte.
- Choix : la période va du premier au dernier jour inclus ; un prix est une combinaison de paliers qui pave exactement la période, sans chevauchement ni reste — jour = 1 jour, semaine = 7 jours consécutifs, mois = du jour J au jour J−1 du mois suivant (le 01/10 au 31/10) ; on retient la combinaison la moins chère ; aucune combinaison possible → pas de prix. Les montants restent en centimes entiers, additionnés sans arrondi. La fonction reçoit une grille `{ dayInCents, weekInCents, monthInCents }` aux durées éventuellement `null` (US-004) et rend `{ amountInCents }` ou `null`.
- Alternatives : (a) un mois = 30 jours — écarté, EX-05 (octobre, 31 jours) vaudrait 30 jours + 1 ; (b) un palier plus long peut couvrir une période plus courte — écarté, contredit EX-21.
- Preuve : EX-05 (01/10–31/10 = un mois), EX-20 (dix jours = une semaine + trois jours), EX-21 (sept jours, grille au mois seul, pas de prix).
- Impact : fonction pure de `rental/domain/services/`, sans dépendance à `listing/`.
- Coût : faible. Risque : moyen — un mois commençant le 31 est ambigu (31/01 → 28/02 ?) et n'est couvert par aucun exemple. Rollback : revert.
- Traçabilité : RG-03 · EX-001-05 · EX-001-20 · EX-001-21 · EX-001-23 · US-005
- Confiance : moyenne
- Question humaine au retour : comment compter un mois qui commence un 29, 30 ou 31 ?

### AUTO-16 · La demande de location lit l'annonce par ses propres ports, et fige son prix
- Déclencheur : US-006 (EX-09, EX-10, EX-22, EX-28, EX-29). Le cas d'usage a besoin de la grille de l'annonce et des locations confirmées, alors que l'issue interdit `apps/api/src/listing/**` et que le stockage des demandes appartient à US-008.
- Choix : le contexte `rental` déclare ses propres ports dans `apps/api/src/rental/domain/ports/` — un lecteur d'annonce publiée (place → grille, publiée ou non) et un dépôt de locations et demandes — avec leurs doublures en mémoire ; aucun import de `listing/`. Le prix est calculé par `computeRentalPrice` (US-005) au moment de la demande et figé dans l'entité `RentalRequest` : un changement de grille ultérieur ne le modifie pas (EX-22). Une journée demandée est bornée sur le calendrier `Europe/Paris` (EX-29), converti sans dépendance nouvelle (`Intl.DateTimeFormat`). Les dates déjà louées sont refusées dès qu'elles se chevauchent, dernier jour compris (EX-10, EX-28).
- Alternatives : (a) importer `ListingRepository` depuis `listing/` — écarté, couplage entre contextes et couche interdite par l'issue ; (b) recalculer le prix à l'acceptation — écarté, EX-22 fige le prix à la demande.
- Preuve : corps de l'issue #7 (« Couches interdites : `apps/api/src/listing/**` ») ; EX-22 et EX-29 de la spec.
- Impact : `rental/domain/ports/` s'ajoute aux couches autorisées par l'issue, qui ne listait que `usecases/request-rental/**` et `entities/**`. Deux branches d'erreur du cas d'usage ne sont couvertes par aucun exemple ni aucun test de cette story : `ListingNotPublishedError` (le lecteur d'annonce rend `null`), dont l'exemple EX-31 est planifié en US-007, et `NoPriceForRequestedPeriodError` (aucune combinaison de paliers ne couvre la période), prouvé au niveau du service par EX-21 mais jamais remonté au cas d'usage.
- Coût : deux ports et leurs doublures. Risque : faible, rien n'est monté. Rollback : revert.
- Traçabilité : RG-03 · RG-06 · EX-001-09 · EX-001-10 · EX-001-22 · EX-001-28 · EX-001-29 · US-006
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-17 · Une demande ne dépasse pas 366 jours, et porte l'adresse de l'annonce
- Déclencheur : revue sécurité US-006, constat majeur 1 (`RentalRequest.ts:45-48`, aucune borne de durée : une demande de plusieurs millions de jours bloque la boucle d'événements) et constat mineur 2 (`RentalRequest.ts:55-56`, la demande garde l'orthographe du demandeur au lieu de celle de l'annonce).
- Choix : (1) une période demandée porte au plus **366 jours**, bornes comprises ; au-delà, la demande est refusée avec `RequestedPeriodTooLongError` avant tout calcul de prix. La spec gagne EX-40 (RG-06, barreau `unit`), rattaché à US-006, qui passe à 6 exemples. (2) la demande est construite avec l'adresse et le box de l'annonce publiée, jamais avec ceux du demandeur.
- Alternatives : (a) borner seulement à la frontière HTTP — écarté, le cas d'usage doit tenir seul et la route n'existe pas encore ; (b) une durée maximale plus courte (par exemple 90 jours) — écarté faute de règle produit ; 366 jours couvre une location à l'année sans laisser passer d'abus.
- Preuve : revue sécurité US-006 (exploit `2026-01-01` → `+275760-09-13`).
- Impact : spec révision 4, plan révision 5 ; une durée maximale de location apparaît sans que la spec l'ait discutée.
- Coût : un exemple et une garde. Risque : faible. Rollback : revert.
- Traçabilité : RG-06 · EX-001-40 · US-006
- Confiance : moyenne — le plafond de 366 jours est un choix, pas une règle validée.
- Question humaine au retour : quelle durée maximale de location retenir ?

### AUTO-18 · Trois trous de sonde relevés sur RG-06, laissés ouverts
- Déclencheur : revue sécurité US-006, section Couverture — RG-06 × Données est marquée « écarté, aucune saisie libre », ce qui est faux depuis que la demande reçoit une adresse, un box et deux dates saisis ; RG-06 × Volume ne couvre que la lecture ; RG-06 × Autorisation ne parle que du loueur, pas du conducteur.
- Choix : ne corriger que ce que US-006 peut prouver (EX-40, AUTO-17). Les dates invalides et l'identité du demandeur lue depuis le jeton appartiennent à la story qui monte la route (US-008) : la spec les recevra à ce moment-là, avec un barreau où elles sont observables.
- Alternatives : tout ajouter maintenant — écarté, aucun exemple int-http n'a de route à interroger dans cette story.
- Preuve : revue sécurité US-006, exemples proposés EX-41 (dates invalides) et EX-42 (`renterId` lu dans le corps).
- Impact : la sonde de RG-06 reste fausse sur trois cellules jusqu'à US-008.
- Coût : nul maintenant. Risque : moyen si US-008 monte la route sans reprendre ces exemples. Rollback : sans objet.
- Traçabilité : RG-06 · US-006 · US-008
- Confiance : moyenne
- Question humaine au retour : valider les exemples EX-41 et EX-42 au moment de monter la route de demande.

### AUTO-19 · Une date impossible est refusée par le domaine, pas seulement par la requête
- Déclencheur : revue sécurité US-006 tour 2, constat mineur 3 (`RentalRequest.ts:52`) : un jour non analysable (`2026-13-45`) donne un compte de jours `NaN`, qui passe la borne des 366 jours, échappe au contrôle des dates louées (`overlaps` compare des `NaN`) et produit une demande au prix `undefined`.
- Choix : refuser dans l'entité tout compte de jours non fini, avec `InvalidRequestedPeriodError`, avant la borne et avant tout calcul de prix. La spec gagne EX-41 (RG-06, barreau `unit`), rattaché à US-006, qui passe à 7 exemples. La proposition initiale de la revue plaçait EX-41 au barreau `int-http` ; elle est reclassée `unit`, barreau le plus bas qui observe le défaut.
- Alternatives : (a) ne valider qu'au schéma de la future route — écarté, le défaut est dans le domaine que tout appelant traverse ; (b) livrer en écart mineur — écarté, une demande sans prix qui échappe au contrôle des dates louées est une réservation gratuite dès qu'une route existe.
- Preuve : revue sécurité US-006 tour 2, constat 3.
- Impact : spec révision 5, plan révision 6. La note ¹⁷ de la sonde (« aucune saisie libre n'entre dans ce chemin ») reste fausse pour RG-06 × Données : corrigée avec la story qui monte la route (AUTO-18).
- Coût : un exemple, une garde. Risque : faible. Rollback : revert.
- Traçabilité : RG-06 · EX-001-41 · US-006
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-20 · Une annonce dépubliée est anonymisée au bout de 12 mois
- Déclencheur : revue conformité US-007, constat majeur (RGPD) : ce diff crée l'état dépublié sans durée de conservation, alors qu'AUTO-05 avait justement reporté cette décision à US-007.
- Choix : une annonce dépubliée est conservée **12 mois** à compter de sa dépublication, puis **anonymisée** — l'adresse, le numéro de box, la description d'accès et les photos sont effacés ; la ligne survit sans donnée personnelle, parce que les locations passées la référencent et que leur suivi comptable appartient à SPEC-003. La règle est écrite dans la spec §8 et dans l'ADR-003. Le mécanisme qui l'applique (tâche planifiée et sa preuve) n'appartient pas à SPEC-001, dont le périmètre §2 s'arrête à la publication : il est ouvert comme dette tracée, et l'issue correspondante est créée dans ce run.
- Alternatives : (a) supprimer la ligne — écarté, les locations confirmées la référencent ; (b) conserver sans limite — écarté, c'est le constat RGPD ; (c) implémenter la purge dans US-007 — écarté, ni règle ni exemple ne la décrivent et la story livrerait du code que rien ne prouve.
- Preuve : spec §8 « Rétention » (phrase constatant l'absence de décision, remplacée dans ce commit) ; revue conformité US-007.
- Impact : spec révision 6 ; ADR-003 ; une issue `kind:dette` porte le mécanisme.
- Coût : nul dans cette story. Risque : la règle est écrite mais rien ne l'applique tant que la dette n'est pas traitée — et aucune donnée réelle n'existe (AUTO-03). Rollback : revert du commit de spec.
- Traçabilité : RG-07 · US-007
- Confiance : moyenne — 12 mois est un choix de la construction autonome, pas une durée validée par un juriste.
- Question humaine au retour : 12 mois est-il la bonne durée, et l'anonymisation suffit-elle par rapport à une suppression ?
- Complément (revue sécurité US-007, tour 2, constat mineur 5) : aucune colonne n'enregistre l'instant de la dépublication, et `updated_at` est repoussé par toute écriture ultérieure. L'échéance des douze mois n'a donc aucune ancre calculable : la dette #18 porte désormais explicitement le choix de cette ancre (colonne `unpublished_at` ou autre) avant toute anonymisation.

### AUTO-21 · La base doit accepter le statut dépublié, et la propriété doit être prouvée
- Déclencheur : revue sécurité US-007, constats majeurs 1 (`20260917120000_create_listings.ts:25-26`, `CHECK (status IN ('ACTIVE'))` : contre la vraie base, `save` d'une annonce dépubliée viole la contrainte, l'erreur devient `UnknownError` et l'annonce reste consultable et louable — RG-07 entier inerte) et 2 (`Listing.ts:85-93`, le refus de dépublier l'annonce d'autrui n'est porté par aucun exemple ni aucun test).
- Choix : la spec gagne EX-42 (RG-07, barreau `int-repo`) — la dépublication est observée sur une vraie ligne — et EX-43 (RG-07, barreau `unit`) — la dépublication par un autre loueur est refusée, ce qui remplace le filet ²³ de RG-07 × Autorisation. Une nouvelle migration remplace la contrainte par `CHECK (status IN ('ACTIVE','UNPUBLISHED'))`. US-007 passe à 6 exemples et gagne le barreau `int-repo`.
- Alternatives : (a) livrer et corriger plus tard — écarté, la règle entière ne tient pas contre la seule base réelle ; (b) supprimer la contrainte — écarté, elle protège d'un statut inventé.
- Preuve : revue sécurité US-007, constats 1 et 2.
- Impact : spec révision 7, plan révision 7.
- Coût : une migration, deux exemples. Risque : faible. Rollback : revert.
- Traçabilité : RG-07 · EX-001-42 · EX-001-43 · US-007
- Confiance : haute
- Question humaine au retour : aucune

### AUTO-22 · Après dépublication, n'importe quel loueur peut publier la place
- Déclencheur : revue sécurité US-007, constat mineur 3 : la dépublication libère la clé de place ; un autre loueur peut alors publier la même place, y compris pendant une location confirmée du loueur précédent.
- Choix : laisser le comportement tel quel et le documenter, sans nouvel exemple. RG-01 ne connaît que l'annonce active, RG-08 pose qu'aucune vérification n'est exigée pour publier, et EX-14 tranche déjà le premier arrivé entre deux loueurs. Rien dans la spec ne rattache une place à un loueur : l'y rattacher serait une règle nouvelle, pas une correction.
- Alternatives : (a) réserver la place à son dernier loueur pendant la location confirmée — écarté, règle absente de la spec, qui demanderait une séance produit ; (b) refuser la republication pendant une location confirmée — même raison.
- Preuve : RG-01, RG-08, EX-14 ; revue sécurité US-007 constat 3.
- Impact : un loueur peut publier une place dont un autre porte encore une location confirmée.
- Coût : nul. Risque : moyen, sans exploitation possible tant qu'aucune route n'existe (AUTO-03). Rollback : sans objet.
- Traçabilité : RG-01 · RG-08 · US-007
- Confiance : moyenne
- Question humaine au retour : une place doit-elle rester réservée à son dernier loueur tant qu'une location confirmée court ?

### AUTO-23 · Ce que la base garantit quand une demande croise une dépublication
- Déclencheur : US-008 (EX-30, EX-32). EX-30 — deux demandes au même instant sur les mêmes dates — se prouve par une contrainte d'exclusion. EX-32 — une demande à l'instant de la dépublication — ne peut pas, lui, dépendre de qui gagne la course : si la demande passait avant, une ligne survivrait sur une annonce dépubliée, ce que la ligne `Et` de l'exemple interdit.
- Choix : la garantie portée par la base est **l'état final**, pas l'ordre d'arrivée — après la collision, l'annonce est dépubliée et aucune demande n'existe sur elle. La demande lit l'annonce avec un verrou de ligne puis vérifie son état avant d'écrire, si bien qu'elle ne peut jamais s'insérer sur une annonce déjà dépubliée ; le test rend l'entrelacement explicite plutôt que de dépendre d'un hasard d'ordonnancement, et le dit dans son SUT. EX-30 s'appuie sur une contrainte d'exclusion sur (place, période) qui rend la seconde insertion impossible, jamais sur une lecture préalable.
- Alternatives : (a) laisser l'ordre décider — écarté, le test serait instable et l'exemple faux une fois sur deux ; (b) faire annuler par la dépublication les demandes en attente — écarté, ce serait une règle produit nouvelle, absente de RG-07 ; (c) sérialiser toute l'application — écarté, hors de proportion.
- Preuve : EX-30 et EX-32 de la spec ; corps de l'issue #9 (« garanties de concurrence que seule une vraie base peut prouver »).
- Impact : une migration crée la table des demandes avec sa contrainte d'exclusion ; le dépôt Knex des demandes et le lecteur d'annonce publiée réel apparaissent.
- Coût : une migration, deux adaptateurs. Risque : moyen — la contrainte d'exclusion demande l'extension `btree_gist`. Rollback : revert de la PR et de sa migration.
- Traçabilité : RG-06 · RG-07 · EX-001-30 · EX-001-32 · US-008
- Confiance : moyenne — l'entrelacement explicite du test est un choix d'écriture, pas une garantie de la base.
- Question humaine au retour : une dépublication doit-elle annuler les demandes en attente sur l'annonce ?

### AUTO-24 · La demande ne recopie pas la place, et se conserve douze mois
- Déclencheur : revue conformité US-008, constat majeur (RGPD) : `rental_requests` est la première table portant des données d'un conducteur (compte, adresse et box recopiés, période, prix) ; aucune durée de conservation ne la couvre, et l'anonymisation d'ADR-003 ne vise que `listings`, donc jamais cette copie.
- Choix : (1) **minimisation** — la table ne recopie plus l'adresse ni le numéro de box : la place est désignée par l'annonce référencée et par la clé de place, qui suffisent à la contrainte d'exclusion comme aux lectures ; (2) **conservation** — une demande restée sans suite est supprimée douze mois après la fin de la période demandée ; une demande devenue une location confirmée relève du circuit de l'argent, donc de SPEC-003, et sort du périmètre de SPEC-001. La règle est écrite dans la spec §8 ; le mécanisme rejoint la dette #18, déjà ouverte pour l'anonymisation des annonces.
- Alternatives : (a) garder l'adresse et le box pour la lisibilité des lignes — écarté, c'est une seconde copie de données personnelles qu'aucune purge n'atteindrait ; (b) fixer une durée différente de celle des annonces — écarté, deux horloges pour un même dossier compliquent la purge sans raison ; (c) trancher aussi le sort des demandes confirmées — écarté, elles appartiennent au circuit de l'argent de SPEC-003.
- Preuve : revue conformité US-008 ; `20260918120000_create_rental_requests.ts` (colonnes `address`, `box`) ; ADR-003 (périmètre `listings`).
- Impact : spec révision 8 ; la migration de cette story perd deux colonnes ; la dette #18 gagne un second jeu de données.
- Coût : une reprise de la migration et du dépôt. Risque : faible, aucune donnée réelle (AUTO-03). Rollback : revert de la PR.
- Traçabilité : RG-06 · RG-07 · US-008
- Confiance : moyenne — douze mois reprend la durée d'ADR-003, sans validation juridique.
- Question humaine au retour : douze mois après la fin de la période demandée est-il le bon repère pour une demande restée sans suite ?

### AUTO-25 · Ce que la base tient vraiment quand une demande croise une dépublication (corrige AUTO-23)
- Déclencheur : revue sécurité US-008, constat mineur 2. AUTO-23 affirmait qu'après la collision « l'annonce est dépubliée et aucune demande n'existe sur elle, quel que soit l'ordre ». C'est faux dans un sens : si la demande prend le verrou la première, elle s'insère et valide, puis la dépublication passe — une demande en attente subsiste alors sur une annonce dépubliée. Le test ne le voit pas, puisqu'il pilote lui-même l'entrelacement.
- Choix : corriger l'énoncé plutôt que le code. L'invariant réellement garanti est : **aucune demande n'est enregistrée après la dépublication**. Le sort d'une demande en attente au moment où le loueur dépublie — la laisser vivre, la refuser, l'annuler — est une règle produit que RG-07 ne porte pas : elle appartient à SPEC-002 (demander et confirmer), avec l'expiration des demandes. EX-32 reste vrai tel qu'il est écrit dans le sens que le test met en scène ; sa portée exacte est notée ici et dans la PR.
- Alternatives : (a) faire prendre à la dépublication le même verrou et trancher le sort des demandes en attente — écarté, règle produit nouvelle ; (b) laisser AUTO-23 tel quel — écarté, le registre affirmerait une garantie que le code ne tient pas.
- Preuve : revue sécurité US-008, constat mineur 2 (`KnexRentalRequestRepository.ts:82`, `UnpublishListing.ts:25` lit sans verrou).
- Impact : AUTO-23 est superseded sur ce point précis ; le reste (contrainte d'exclusion pour EX-30) tient.
- Coût : nul. Risque : moyen tant que le sort des demandes en attente n'est pas tranché. Rollback : sans objet.
- Traçabilité : RG-07 · EX-001-32 · US-008 · supersede AUTO-23
- Confiance : haute sur le constat, moyenne sur le report à SPEC-002.
- Question humaine au retour : que devient une demande en attente quand le loueur dépublie son annonce ?

### AUTO-26 · Une demande en attente gèle la place jusqu'à la fin de sa période
- Déclencheur : revue sécurité US-008, constat mineur 1 : la contrainte d'exclusion ne distingue pas une demande en attente d'une location confirmée ; une demande jamais confirmée bloque la place sur toute la période demandée, jusqu'à 366 jours.
- Choix : livrer en écart mineur. L'expiration d'une demande est explicitement hors périmètre — la spec la renvoie à SPEC-002 (§10, « l'expiration d'une demande »). Poser une durée de validité ici reviendrait à inventer la règle que SPEC-002 doit écrire.
- Alternatives : ajouter une borne de validité et un exemple maintenant — écarté, même raison.
- Preuve : spec §10 (« Demander et confirmer une location … l'expiration d'une demande. Objet de SPEC-002 ») ; revue sécurité US-008 constat 1.
- Impact : une place peut rester gelée par une demande sans suite jusqu'à la fin de la période demandée.
- Coût : nul. Risque : moyen à l'ouverture des routes, nul aujourd'hui (AUTO-03). Rollback : sans objet.
- Traçabilité : RG-06 · US-008 · SPEC-002
- Confiance : haute
- Question humaine au retour : combien de temps une demande reste-t-elle valable avant d'expirer ? (à trancher dans SPEC-002)

### AUTO-27 · Le test de la collision a le droit de piloter les deux contextes
- Déclencheur : revue conventions US-008, constat majeur 1 : `KnexRentalRequestRepository.sut.ts` importe `UnpublishListing`, `ListingBuilder`, `ListingStatus` et `KnexListingRepository` du contexte « annonce », que l'issue #9 interdit et qu'AUTO-16 avait écarté pour le domaine `rental`.
- Choix : autoriser explicitement cet import, dans ce seul fichier de test. EX-32 met en scène une demande qui croise une dépublication : l'exemple est par nature à cheval sur les deux contextes, et le prouver en pilotant la vraie dépublication vaut mieux qu'un `UPDATE` écrit à la main, qui ne testerait plus le chemin réel. La règle reste entière pour le code livré : `apps/api/src/rental/domain/**` et les adaptateurs de production n'importent rien de `listing/` — le lecteur d'annonce publiée lit la table, pas les classes.
- Alternatives : (a) semer et dépublier par SQL brut dans le SUT — écarté, le test cesserait de prouver que la vraie dépublication et la vraie demande se sérialisent ; (b) déplacer EX-32 au barreau `journey` — écarté, aucun `AppModule` n'existe (AUTO-03).
- Preuve : revue conventions US-008 constat 1 ; `KnexRentalRequestRepository.sut.ts:4-8`.
- Impact : un fichier de test du contexte `rental` dépend de classes du contexte `listing` ; un renommage là-bas le casse. Exclu du build de production.
- Coût : nul. Risque : faible. Rollback : réécrire le SUT en SQL brut.
- Traçabilité : RG-07 · EX-001-32 · US-008
- Confiance : haute
- Question humaine au retour : aucune

## Écarts majeurs livrés

- AUTO-03 · conventions `ECARTS MAJEURS` · `ListingController` et le jeton `AccessTokenVerifier` ne sont liés à aucun module ; `POST /listing` n'est atteignable par aucune application. Preuve : `find apps/api/src -iname '*.module.ts' -o -iname main.ts` → vide. Rollback : sans objet. PR US-002.
- AUTO-04 · conventions `ECARTS MAJEURS` · le test int-repo `@EX-001-19` passe par `PublishListing`, pas par un appel isolé au dépôt. Preuve : `KnexListingRepository.sut.ts:29,59`. Rollback : reclasser en `journey`. PR US-002.
- AUTO-05 · conformité RGPD `ECARTS MAJEURS` · aucune durée de conservation ni purge pour `listings`. Preuve : `docs/adr/` vide, spec §8. Rollback : sans objet. PR US-002.

## Résultat livré

- US-001 (#2) fusionnée (PR #12) avant ce run.
- US-002 (#3) fusionnée : PR #13, `7b61cc6`. Unit 7 passed · int 4 passed · build 0. Revues : conventions ECARTS MAJEURS (AUTO-03, AUTO-04 livrés) · sécurité ECARTS MINEURS · conformité ECARTS MAJEURS (AUTO-05 livré).
- US-003 (#4) fusionnée : PR #14, `ba1f945`. Unit 13 passed · int 5 passed · build 0. Revues : conventions CONFORME · sécurité ECARTS MINEURS (AUTO-12) · conformité CONFORME.
- US-004 (#5) fusionnée : PR #15. Unit 17 passed · int 5 passed · build 0. Revues : conventions CONFORME · sécurité CONFORME · conformité CONFORME.
- US-005 (#6) fusionnée : PR #16. Unit 21 passed · int 5 passed · build 0. Revues : conventions CONFORME · sécurité SANS OBJET · conformité SANS OBJET.
- US-006 (#7) fusionnée : PR #17. Unit 28 passed · int 5 passed · build 0. Revues : conventions CONFORME · sécurité CONFORME (3 tours) · conformité SANS OBJET.
- US-007 (#8) fusionnée : PR #19. Unit 33 passed · int 6 passed · build 0. Revues : conventions ECARTS MINEURS (corrigé) · sécurité ECARTS MINEURS · conformité ECARTS MINEURS (règle de rétention écrite, ADR-003).
- US-008 (#9) fusionnée : PR #20. Unit 33 passed · int 8 passed · build 0. Revues : conventions CONFORME · sécurité ECARTS MINEURS · conformité ECARTS MINEURS.
- Restent : US-009 et US-010.

## À relire au retour


- AUTO-01 : quel mécanisme d'authentification alimente `AccessTokenVerifier` ?
- AUTO-03 : stockage de photos et base de production au premier démarrage de l'api.
- AUTO-05 : durée de conservation d'une annonce dépubliée (écart RGPD livré).
- AUTO-06 : bornes de saisie et refus des prix négatifs.
- AUTO-07 : ajouter un exemple « jeton inconnu refusé » (numéro à attribuer, EX-38 ayant servi en AUTO-08).
- AUTO-08 : « Box 12 », « n°12 » et « 12 » désignent-ils le même box ?
- AUTO-12 : exemple « caractère invisible dans le box ou l'adresse » avant de monter la route.
