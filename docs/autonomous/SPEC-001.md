---
spec: SPEC-001
mode: autonomous
statut: en-cours
demarre_le: 2026-09-17T01:34:49Z
termine_le: null
decisions: 7
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

## Écarts majeurs livrés

- AUTO-03 · conventions `ECARTS MAJEURS` · `ListingController` et le jeton `AccessTokenVerifier` ne sont liés à aucun module ; `POST /listing` n'est atteignable par aucune application. Preuve : `find apps/api/src -iname '*.module.ts' -o -iname main.ts` → vide. Rollback : sans objet. PR US-002.
- AUTO-04 · conventions `ECARTS MAJEURS` · le test int-repo `@EX-001-19` passe par `PublishListing`, pas par un appel isolé au dépôt. Preuve : `KnexListingRepository.sut.ts:29,59`. Rollback : reclasser en `journey`. PR US-002.
- AUTO-05 · conformité RGPD `ECARTS MAJEURS` · aucune durée de conservation ni purge pour `listings`. Preuve : `docs/adr/` vide, spec §8. Rollback : sans objet. PR US-002.

## Résultat livré

- US-001 (#2) fusionnée (PR #12) avant ce run.
- US-002 (#3) : DoD complet, PR #13 prête (`status:in-review`), **non fusionnée**. Barreaux : unit `Tests: 7 passed, 7 total` · int `Tests: 4 passed, 4 total` · build exit 0 · eslint exit 0, sur `3b561ad`. Exemples prouvés : EX-18, EX-19, EX-04, EX-36, EX-37. Revues tour 2 : conventions ECARTS MAJEURS · sécurité ECARTS MINEURS · conformité ECARTS MAJEURS.
- Arrêt §9-1 (impossibilité externe) : `gh pr merge 13 --squash --delete-branch` refusé par le mode de permissions de la session (classifieur auto mode), le 17/09/2026. US-003 à US-010 construisent sur le code de US-002 et démarrent après sa fusion : aucune story sûre ne reste éligible.
- Restent : US-003 à US-010, `status:todo`.
- Dernier audit : non relancé après l'arrêt (27 exemples de stories futures non couverts, attendu).

## À relire au retour

- Reprise le 17/09/2026 : `/jp-way:build SPEC-001` relancé après ajout de la règle `Bash(gh pr merge:*)` ; l'arrêt sur la fusion de la PR #13 est levé.

- AUTO-01 : quel mécanisme d'authentification alimente `AccessTokenVerifier` ?
- AUTO-03 : stockage de photos et base de production au premier démarrage de l'api.
- AUTO-05 : durée de conservation d'une annonce dépubliée (écart RGPD livré).
- AUTO-06 : bornes de saisie et refus des prix négatifs.
- AUTO-07 : ajouter EX-38 (jeton inconnu refusé).
