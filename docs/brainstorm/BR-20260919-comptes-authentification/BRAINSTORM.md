---
id: BR-20260919-comptes-authentification
titre: Comptes et authentification des loueurs et conducteurs
date: 2026-09-19
statut: valide
revision: 1
valide_le: 2026-09-19
valide_par: JP
langue: fr
code_sha: { api: 1a97115 }
session: { questions: 10, duree_min: 463 }
---

# Comptes et authentification des loueurs et conducteurs — BR-20260919-comptes-authentification

## 1. Problème

SPEC-001 suppose déjà un loueur identifié et un jeton que la garde vérifie : un exemple de
SPEC-001 pose « compte créé le 09/09/2026 » (`docs/specs/SPEC-001-publier-une-place.md:492`), et la garde
d'authentification délègue à un vérificateur de jeton sans implémentation, refusant tout
aujourd'hui (`apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:15`). Rien, dans
le dépôt, ne crée un compte, ne connecte quelqu'un, ni ne délivre le jeton que cette garde
attend. SPEC-001 a explicitement placé le compte hors de son périmètre. Toute route
authentifiée reste donc inatteignable : publier une annonce le suppose déjà, demander une
place n'a aujourd'hui aucun compte vérifié derrière elle
(`apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:16`), et le démarrage de
l'api comme le parcours de bout en bout en dépendent tous les deux.

## 2. Ce qu'on veut obtenir

### 2.1 Objectif

Les routes authentifiées de SPEC-001 passent de 0 atteignable à toutes, parce qu'un loueur et
un conducteur peuvent créer un compte, se connecter et obtenir un jeton que la garde accepte.

### 2.2 Acteurs

| Acteur | Ce qu'il fait aujourd'hui | Ce qu'il veut |
|---|---|---|
| Loueur | publie une annonce en étant lu comme déjà connecté (`apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.ts:55`), alors que rien ne crée aujourd'hui le compte que SPEC-001 suppose déjà exister (`docs/specs/SPEC-001-publier-une-place.md:492`) | s'inscrire par e-mail et mot de passe, se connecter, obtenir un jeton que la garde accepte |
| Conducteur | demande une place avec un `renterId` libre, sans qu'aucun compte ne soit vérifié (`apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:16`) | avoir un compte pour que sa demande soit enregistrée (D-01) |
| Visiteur | consulte une annonce sans compte (`docs/specs/SPEC-001-publier-une-place.md:321`) | rien de nouveau — la lecture reste sans compte |

### 2.3 Signes de réussite

aucun — la séance n'a pas produit de signal observable distinct de l'objectif ; le pré-mortem
(T10) a été écourté à la demande de JP avant que le Closer ne pose la question.

## 3. Ce qui existe déjà — ancré dans le code

| Constat | Preuve | Conséquence pour ce sujet |
|---|---|---|
| La garde d'authentification existe déjà mais délègue à un vérificateur de jeton sans implémentation ; elle refuse tout aujourd'hui. | `apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:15` | ce sujet doit fournir l'implémentation du port que la garde attend déjà. |
| Le seul contrat existant côté comptes est le port `AccessTokenVerifier`, sans implémentation. | `apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1` | l'authentification à construire doit produire un jeton que ce port sait vérifier, sans changer son contrat. |
| Publier une annonce lit déjà le loueur sur le compte authentifié, jamais dans le corps de la requête. | `apps/api/src/listing/adapters/rest/controllers/listing/listing.controller.ts:55` | l'identité du loueur que ce sujet doit produire est celle que la publication consomme déjà. |
| Demander une place prend un `renterId` en paramètre libre ; rien ne dit aujourd'hui si ce conducteur a un compte. | `apps/api/src/rental/domain/usecases/request-rental/RequestRental.ts:16` | D-01 transforme ce `renterId` libre en identifiant du compte connecté. |
| La lecture d'une annonce ne dépend d'aucun compte, connecté ou non — un exemple pose une utilisatrice connectée, un autre un visiteur. | `docs/specs/SPEC-001-publier-une-place.md:314` et `docs/specs/SPEC-001-publier-une-place.md:321` | ce sujet ne doit pas exiger de compte pour lire une annonce. |
| Le compte du loueur est déjà supposé exister par SPEC-001, sans que rien ne le crée. | `docs/specs/SPEC-001-publier-une-place.md:492` | ce sujet doit fournir le mécanisme de création de compte que SPEC-001 présuppose. |
| La garde rejette déjà toute requête sans jeton valide. | `apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:24` | la durée de vie du jeton (D-04) est portée par le jeton lui-même, la garde n'a pas à changer. |
| La table des annonces porte `owner_id` et celle des demandes porte `renter_id`, sans qu'aucune des deux ne sache ce que devient sa ligne quand la personne s'en va. | `apps/api/src/infra/migrations/20260917120000_create_listings.ts:6` | la suppression de compte (D-07) doit traiter ces deux colonnes. |

## 4. Décisions prises

| # | Décision | Alternatives écartées | Pourquoi | Solidité |
|---|---|---|---|---|
| D-01 | un conducteur doit avoir un compte pour demander une place | aucune — tranché directement, sans options mises en séance | le `renterId` libre devient l'identifiant du compte connecté, comme le loueur l'est déjà côté publication ; répond au croisement autorisation laissé ouvert par AUTO-18 de SPEC-001 | ferme |
| D-02 | connexion par e-mail et mot de passe | lien magique par e-mail (recommandé : rien de secret stocké), code par SMS (aucun fournisseur SMS), Google/Apple | aucune raison consignée — retenu contre l'option recommandée | ferme |
| D-03 | pas de parcours « mot de passe oublié » dans la première version | aucune mise en options | assumé à la main quelques semaines ; suppose de toute façon un fournisseur d'e-mails, qui n'existe pas | à revalider quand le nombre d'utilisateurs monte |
| D-04 | jeton valable 7 jours, prolongé à chaque usage | 30 jours fixes, court + rafraîchi (seule option révocable, coûte une table de sessions et une route), sans expiration | un seul jeton, rien à stocker, aucun rafraîchissement à écrire | ferme |
| D-05 | une personne, un compte ; publier et demander sont des actions, pas des types de comptes | deux comptes distincts, un compte avec un rôle choisi à l'inscription | le rôle découle de l'action, rien à stocker | ferme |
| D-06 | la suppression de compte fait partie de la première version | aucune mise en options | le RGPD impose de répondre à une demande d'effacement sous un mois, quel que soit le choix | ferme |
| D-07 | à la suppression d'un compte, ses annonces sont dépubliées et ses données personnelles effacées des lignes qui subsistent | refuser tant qu'une location court, tout supprimer | réutilise l'état dépublié de US-007, libère la place, garde les locations passées sans nom | ferme |
| D-09 | les essais de connexion sont ralentis progressivement, sur le compte visé comme sur l'adresse qui essaie ; aucun compte n'est jamais verrouillé | bloquer quinze minutes, bloquer définitivement, rien en v1 | personne n'est enfermé dehors, ce qui compte tant qu'il n'y a pas de « mot de passe oublié » | ferme |

### Discrétion Claude

| # | Décision | Alternatives écartées | Pourquoi | Solidité |
|---|---|---|---|---|
| D-08 | l'adresse e-mail identifie le compte et ne peut pas être portée par deux comptes | aucune — pas mise en options | conséquence directe de la connexion par e-mail et mot de passe (D-02) | ferme |

## 5. Règles candidates

| Règle candidate | Origine | Solidité |
|---|---|---|
| une demande de location n'est enregistrée que pour un conducteur qui a un compte | T2, issue de D-01 | ferme |
| lire une annonce ne demande aucun compte, publier et demander en demandent un | T2, confrontation entre `docs/specs/SPEC-001-publier-une-place.md:321` et D-01 | ferme |
| une connexion inutilisée pendant sept jours cesse d'être valable et l'utilisateur doit ressaisir son mot de passe | T5, issue de D-04 | ferme |
| le même compte peut publier une place et demander celle d'un autre, sans changement d'état ni de rôle | T6, issue de D-05 | ferme |
| supprimer un compte dépublie toutes ses annonces actives | T8, issue de D-07 | ferme |
| une location passée subsiste après la suppression du compte, sans donnée personnelle | T8, issue de D-07 | ferme |
| une série d'échecs de connexion ralentit les essais suivants sans jamais rendre un compte inaccessible | T9, issue de D-09 | ferme |
| un compte connecté peut changer son mot de passe sans repasser par un e-mail | T11, MoSCoW Should | à revalider |

## 6. Arbitrages ouverts

| # | Question | Options | Qui tranche | Quelle règle candidate ça bloque |
|---|---|---|---|---|
| Q-01 | sans envoi d'e-mail en v1, l'adresse saisie à l'inscription n'est vérifiée par personne : un loueur injoignable peut publier | non formalisées en séance | JP | la règle candidate sur l'unicité et la validité de l'adresse |

## 7. Périmètre

### 7.1 Dedans

- s'inscrire par e-mail et mot de passe
- se connecter et obtenir un jeton
- implémenter `AccessTokenVerifier` derrière la garde existante
- le conducteur authentifié sur `RequestRental`
- supprimer son compte (dépublication + anonymisation)
- ralentissement des essais de connexion
- changer son mot de passe en étant connecté (à revalider)
- journaliser les échecs de connexion (à revalider)
- longueur minimale du mot de passe (à revalider)

### 7.2 Dehors — et pourquoi

- mot de passe oublié — écarté par D-03 : assumé à la main quelques semaines, suppose de toute façon un fournisseur d'e-mails qui n'existe pas
- vérification d'adresse e-mail — hors v1 : aucun envoi d'e-mail prévu en v1 (Q-01 reste ouverte)
- connexion par SMS — écartée en T3 : aucun fournisseur SMS
- connexion par Google/Apple — écartée en T3 au profit du mot de passe (D-02), sans raison distincte consignée
- rôle déclaré à l'inscription — écarté avec D-05 : la donnée serait fausse dès qu'un conducteur publie
- révocation de session et table de sessions — écartée avec D-04 : coûte une table de sessions et une route
- se déconnecter — différé : le jeton étant sans état, la déconnexion reste côté client tant qu'aucune table de sessions n'existe

## 8. Idées différées

- parcours « mot de passe oublié » (T4, D-03) — assumé à la main, pas de fournisseur d'e-mails
- rôle déclaré à l'inscription (T6, écarté avec D-05) — la donnée serait fausse dès qu'un conducteur publie
- se déconnecter (T11, Could) — le jeton étant sans état, reste côté client tant qu'aucune table de sessions n'existe
- vérification d'adresse e-mail (T11, Won't, cf. Q-01)
- connexion par SMS, Google, Apple (T11, Won't, cf. T3)
- révocation de session et table de sessions (T11, Won't, cf. D-04)

## 9. Risques (pre-mortem)

| Risque | Signal précoce | Parade | Gravité |
|---|---|---|---|
| R-01 — un utilisateur enfermé dehors doit passer par une réinitialisation manuelle en base | les messages de demande de réinitialisation | aucune en v1, D-03 à revalider | moyenne |
| R-02 — un jeton volé reste utilisable jusqu'à sept jours, aucune révocation à distance n'est possible | aucun aujourd'hui, rien ne journalise les connexions | aucune en v1, à revoir quand SPEC-003 fera entrer l'argent | moyenne |
| R-03 — une location en cours se retrouve sans loueur joignable après suppression | un conducteur qui signale ne plus pouvoir joindre le loueur | aucune en v1, l'option « refus tant qu'une location court » a été écartée | moyenne |
| R-04 — une attaque lente et répartie passe sous le ralentissement | aucun aujourd'hui, rien ne journalise les échecs de connexion | partielle, le ralentissement seul | moyenne |
| R-05 — sans vérification d'adresse en v1 (Q-01), un loueur injoignable publie et un conducteur attend une réponse qui n'arrivera jamais | des demandes de location sans réponse du loueur | aucune en v1 | moyenne |
| R-06 — l'adresse identifie le compte (D-08) mais n'est vérifiée par personne (Q-01) et il n'existe aucun recours (D-03) : quiconque saisit l'adresse d'un autre la lui confisque définitivement | « mon adresse est déjà prise » au support | aucune en v1, lève Q-01 ou D-03 | forte |
| R-07 — la suppression de compte (D-07) et la purge de la dette #18 (`docs/autonomous/SPEC-001.md`, AUTO-20 et AUTO-24) anonymisent les mêmes tables par deux chemins écrits séparément | une ligne anonymisée d'un côté et intacte de l'autre | traiter #18 dans la même spec que la suppression | moyenne |

## 10. Contraintes

| Contrainte | Origine | Ce qu'elle interdit |
|---|---|---|
| aucune carte de code n'existe (`docs/cartes/` vide) | pré-vol de séance | s'appuyer sur une carte pour un ancrage plutôt que sur une lecture directe du dépôt |
| SPEC-001 §2 place le compte hors de son périmètre | SPEC-001 §2 | laisser le compte hors du périmètre de ce sujet |
| le sujet est le point de blocage de tout le reste : publier exige un loueur authentifié, l'api ne démarre pas sans vérificateur de jeton, le parcours de bout en bout a besoin d'une connexion | JP, T1 | séquencer ce sujet après le démarrage de l'api ou le front |
| `apps/api/src/user-management/adapters/rest/guards/auth.guard.ts:15` et `apps/api/src/user-management/domain/ports/AccessTokenVerifier.ts:1` restent inchangés | code existant, T3 | changer le contrat de la garde ou du port pour accommoder le mot de passe |
| v1 sans envoi d'e-mail du tout : ni vérification d'adresse, ni réinitialisation | T4 | tout envoi d'e-mail en v1 |
| le RGPD impose de répondre à une demande d'effacement sous un mois, quel que soit le choix | RGPD | ignorer ou retarder au-delà d'un mois une demande d'effacement |
| dette #18 (`docs/autonomous/SPEC-001.md`, AUTO-20 et AUTO-24) couvre la conservation des annonces dépubliées et des demandes sans suite, jamais la suppression d'un compte | dette technique SPEC-001, T7 | traiter la suppression de compte sans se raccorder à ce mécanisme existant |
| `apps/api/src/infra/migrations/20260917130000_enforce_unique_active_listing_place_key.ts` interdit deux annonces actives sur une même place | schéma existant, T8 | laisser active l'annonce d'un compte effacé — elle bloquerait la place pour toujours |
| aucune limitation de débit n'existe dans le dépôt, et le point rejoint AUTO-30 de SPEC-001 (aucune limite sur la première route publique) | absence constatée, T9 | s'appuyer sur une limitation de débit déjà existante — il n'y en a aucune à réutiliser |
| la durée journalisée est du temps d'horloge (11h10 → 18h53), pauses comprises, pas du temps de séance | T11 | confondre durée d'horloge et durée de session active |

## 11. Impacts par app

| App | Nature | Ampleur estimée | Ordre |
|---|---|---|---|
| api | comptes, authentification, jeton, suppression de compte, ralentissement des essais | non chiffrée en séance | 1er des trois chantiers — avant « démarrage de l'api » et « front » (T1) |

## 12. Glossaire

| Terme | Définition | Ne pas confondre avec |
|---|---|---|
| Compte | identité unique d'une personne, identifiée par son adresse e-mail (D-08), qui peut publier une annonce ou demander une place sans changer de type (D-05) | « loueur » ou « conducteur », qui sont des actions du compte, pas des types de comptes |
| Loueur | action de publier une annonce, exercée par un compte | un type de compte distinct |
| Conducteur | action de demander une place, exercée par un compte, qui doit avoir un compte pour que sa demande soit enregistrée (D-01) | un type de compte distinct |
| Jeton | preuve de connexion délivrée après authentification par e-mail et mot de passe, valable 7 jours glissants, prolongée à chaque usage (D-04) | une session révocable côté serveur (écartée, T11 Won't) |
| Garde (AuthGuard) | composant existant qui refuse toute requête sans jeton valide et délègue la vérification à `AccessTokenVerifier` | le mécanisme d'émission du jeton, que ce sujet doit construire |
| AccessTokenVerifier | port existant sans implémentation, seul contrat côté comptes avant ce sujet | la garde elle-même, qui l'appelle |
| Ralentissement | réponse progressive à une série d'échecs de connexion, sur le compte visé comme sur l'adresse qui essaie, sans jamais verrouiller un compte (D-09) | un blocage temporaire ou définitif (écarté, T9) |
| Dépublication | statut qu'une annonce prend quand elle sort d'usage (SPEC-001), réutilisé par D-07 quand un compte est supprimé | la suppression de l'annonce elle-même |

## 13. Suite

La séance de mapping (`/jp-way:spec BR-20260919-comptes-authentification`) part des 8 règles
candidates du §5 et du vocabulaire du §12. Q-01 reste ouverte et doit être tranchée par JP
avant que la spec puisse être validée — aucune `Q-nn` ne peut rester ouverte à la porte de
phase 2. Le séquencement validé en T1 place ce sujet avant « démarrage de l'api » et « front ».
