---
id: SPEC-007
titre: Une inscription plus sûre — mot de passe confirmé, robuste, et preuve anti-robot
slug: inscription-plus-sure
statut: valide
revision: 1
derive_de: null
amont: absent
langue: fr
valide_le: 2026-09-24
valide_par: JP
apps: [api, front, mobile, e2e]
code_sha: { api: ef7ed75, front: ef7ed75, mobile: ef7ed75, e2e: ef7ed75 }
ux: absent
regles: 3
exemples: 20
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-007 · Une inscription plus sûre — mot de passe confirmé, robuste, et preuve anti-robot

## 1. Sujet

Pour une personne qui s'inscrit, ne pas se tromper de mot de passe, savoir pendant la saisie s'il est assez robuste, et ne rien avoir à cocher pour prouver qu'elle n'est pas un robot. Pour l'exploitant, que l'inscription ne soit plus ouverte aux robots ni aux mots de passe faibles.

Demande de JP le 24/09/2026 : « l'inscription est trop vide : taper deux fois le mot de passe, vérifier s'il est assez robuste avec une jauge qui change de couleur, et une vérification être humain ». Décisions prises par JP le 24/09/2026 :
- la vérification est **invisible et maison** : le navigateur résout un calcul que l'api a signé (preuve de travail, à la manière d'ALTCHA), sans compte ni service tiers ;
- la jauge est **bloquante** : un mot de passe jugé faible est refusé, par le site et par l'api.

Le reste est à la discrétion de Claude, à relire par JP : Q-01 à Q-03.

## 2. Périmètre

**Dedans.** La confirmation du mot de passe à l'inscription. La robustesse d'un mot de passe, sa jauge, et son refus quand il est faible — à l'inscription et au changement de mot de passe, sans quoi la règle se contournerait en deux gestes. La preuve anti-robot de l'inscription, sur le site et dans l'app iPhone.

**Dehors.** Les comptes existants : leurs mots de passe ne sont pas réévalués. La connexion, qui garde le ralentissement de SPEC-002 RG-05. Une preuve anti-robot ailleurs que sur l'inscription. La jauge sur l'écran de changement de mot de passe : le refus y vient de l'api.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Robustesse | l'un de quatre niveaux : trop court, faible, moyen, fort. Seuls moyen et fort sont acceptés. |
| Sortes de caractères | minuscules, majuscules, chiffres, et tout le reste (symboles, espaces, émojis). |
| Preuve anti-robot | le nombre que le navigateur a trouvé pour le défi signé par l'api. Jamais « captcha ». |
| Défi | ce que l'api envoie : un condensé SHA-256 à retrouver, son sel daté et sa signature. |

## 4. Règles et exemples

Valeurs canoniques : `Marc D.`, `marc.d@example.com`, `Barla2026!` ; horloge `Europe/Paris`.

### RG-01 · à l'inscription, le mot de passe se tape deux fois, à l'identique

#### EX-01 · deux saisies différentes sont refusées

Quand `Marc D.` tape `Barla2026!` puis `Barla2062!` en confirmation
Alors le formulaire refuse la confirmation : « Les deux mots de passe ne correspondent pas »

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"a4519b9c"} -->

### RG-02 · un mot de passe est trop court (moins de 8 caractères), faible, moyen ou fort ; trop court et faible sont refusés, à l'inscription comme au changement de mot de passe

Un point par sorte de caractères présente, un de plus dès 12 caractères, un de plus dès 16 : 2 points ou moins, faible ; 3, moyen ; 4 ou plus, fort. Un mot de passe de la liste des plus courants est faible quoi qu'il compte.

#### EX-02 · deux sortes sous douze caractères sont faibles

Quand la robustesse de `boxparking7` est évaluée — minuscules et chiffres, onze caractères, deux points
Alors elle est faible

<!-- jp-way:ex {"id":"EX-02","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"47cb17fa"} -->

#### EX-03 · un mot de passe courant est faible, quoi qu'il compte

Quand la robustesse de `Azerty123` est évaluée
Alors elle est faible

<!-- jp-way:ex {"id":"EX-03","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"816ad8bc"} -->

#### EX-04 · deux sortes et douze caractères sont moyens, et acceptés

Quand la robustesse de `motdepasse12` est évaluée
Alors elle est moyenne, et le mot de passe est accepté

<!-- jp-way:ex {"id":"EX-04","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"c083b441"} -->

#### EX-05 · quatre sortes sont fortes

Quand la robustesse de `Barla2026!` est évaluée
Alors elle est forte

<!-- jp-way:ex {"id":"EX-05","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"3ec7c88c"} -->

#### EX-06 · sept caractères sont trop courts, même variés

Quand la robustesse de `Barl26!` est évaluée
Alors elle est trop courte

<!-- jp-way:ex {"id":"EX-06","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"bb1bed09"} -->

#### EX-07 · un long mot de passe accentué et d'émojis est fort

Quand la robustesse de 66 `é`, 67 `ü` et 67 `🚗` est évaluée
Alors elle est forte — SPEC-002 EX-10 reste vrai

<!-- jp-way:ex {"id":"EX-07","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"24e04da1"} -->

#### EX-08 · le site et l'api jugent pareil

Étant donné les mots de passe de EX-02 à EX-07
Quand le site évalue leur robustesse
Alors il rend exactement les niveaux de l'api

<!-- jp-way:ex {"id":"EX-08","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"1539021a"} -->

#### EX-09 · la jauge passe du rouge à l'orange puis au vert

Quand la jauge montre un mot de passe trop court, faible, moyen puis fort
Alors elle remplit un, un, deux puis trois segments, en rouge, rouge, orange puis vert

<!-- jp-way:ex {"id":"EX-09","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"dff58eea"} -->

#### EX-10 · l'api refuse une inscription au mot de passe faible

Quand `Marc D.` s'inscrit avec `motdepasse` et une preuve anti-robot valide
Alors l'inscription est refusée avec `WeakPasswordError`
Et aucun compte n'est créé, aucun e-mail n'est en file

<!-- jp-way:ex {"id":"EX-10","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"8d47732a"} -->

#### EX-11 · l'api refuse un changement vers un mot de passe faible

Étant donné `Marc D.` inscrit avec `Barla2026!`
Quand il change son mot de passe pour `motdepasse`
Alors le changement est refusé avec `WeakPasswordError`
Et `Barla2026!` reste son mot de passe

<!-- jp-way:ex {"id":"EX-11","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"e59efd25"} -->

### RG-03 · une inscription exige une preuve anti-robot : le nombre qui redonne le condensé d'un défi signé par l'api, dans les 20 minutes, une seule fois

#### EX-12 · une preuve juste, dans les temps, est acceptée

Étant donné un défi émis le `01/10/2026 à 09:00`
Quand sa preuve est présentée à `09:05`
Alors elle est acceptée

<!-- jp-way:ex {"id":"EX-12","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"542fbe5b"} -->

#### EX-13 · une preuve ne sert qu'une fois

Étant donné la preuve de EX-12, acceptée à `09:05`
Quand elle est présentée de nouveau à `09:06`
Alors elle est refusée

<!-- jp-way:ex {"id":"EX-13","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"7affe75e"} -->

#### EX-14 · une preuve présentée 20 minutes après son défi est refusée

Étant donné un défi émis le `01/10/2026 à 09:00`
Quand sa preuve est présentée à `09:20`
Alors elle est refusée

<!-- jp-way:ex {"id":"EX-14","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"05c80cf7"} -->

#### EX-15 · un mauvais nombre est refusé

Étant donné un défi émis à `09:00`
Quand une preuve porte un autre nombre que celui qui redonne son condensé
Alors elle est refusée

<!-- jp-way:ex {"id":"EX-15","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"9c6d4f5d"} -->

#### EX-16 · un défi que l'api n'a pas signé est refusé

Quand une preuve porte un défi fabriqué hors de l'api, avec son bon nombre
Alors elle est refusée

<!-- jp-way:ex {"id":"EX-16","regle":"RG-03","origine":"sonde","barreau":"unit","empreinte":"c22eeb36"} -->

#### EX-17 · sans preuve acceptée, l'inscription est refusée

Quand `Marc D.` s'inscrit avec une preuve refusée
Alors l'inscription est refusée avec `HumanProofRejectedError`
Et aucun compte n'est créé, aucun e-mail n'est en file

<!-- jp-way:ex {"id":"EX-17","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"f0ba67fd"} -->

#### EX-18 · la route d'inscription demande la preuve et la route du défi la donne

Quand `GET /account/human-challenge` est appelé
Alors la réponse est `200` et porte l'algorithme, le condensé, le sel, le plus grand nombre et la signature
Et quand `POST /account` ne porte pas de preuve, la réponse est `400`

<!-- jp-way:ex {"id":"EX-18","regle":"RG-03","origine":"mapping","barreau":"int-http","empreinte":"b69a0d02"} -->

#### EX-19 · le site trouve le nombre, et redemande un défi après un refus

Étant donné un défi dont le nombre est `1234`
Quand l'écran d'inscription demande sa preuve
Alors la preuve porte `1234` et l'inscription peut partir
Et après une inscription refusée, un nouveau défi est demandé — la preuve a été dépensée

<!-- jp-way:ex {"id":"EX-19","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"862ca21b"} -->

#### EX-20 · s'inscrire depuis l'écran, avec confirmation, jauge et preuve

Quand une personne ouvre « Créer un compte », tape une adresse, `motdepasse-e2e-123` deux fois
Alors la jauge dit « Fort », l'écran dit qu'elle n'est pas un robot
Et « Créer mon compte » la connecte

<!-- jp-way:ex {"id":"EX-20","regle":"RG-03","origine":"mapping","barreau":"e2e","empreinte":"c99cb226"} -->

## 5. Sonde de couverture

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | écarté¹ | filet² | écarté³ | écarté⁴ | écarté⁵ | écarté⁶ | écarté⁷ | écarté⁸ | écarté⁹ | EX-01 |
| RG-02 | EX-04 EX-06 | filet² | écarté³ | écarté⁴ | écarté⁵ | EX-11 | écarté⁷ | EX-07 | écarté⁹ | EX-02 EX-03 EX-05 EX-08 EX-09 EX-10 |
| RG-03 | EX-14 | EX-18 | EX-12 EX-14 | EX-13 | écarté⁵ | EX-13 EX-19 | écarté⁷ | filet¹⁰ | filet¹¹ | EX-15 EX-16 EX-17 EX-20 |

¹ égal ou différent, sans borne.
² un champ vide est un mot de passe trop court, déjà EX-06, et SPEC-002 EX-09.
³ la robustesse ne dépend pas de l'instant.
⁴ la règle est locale à une saisie.
⁵ l'inscription est ouverte à tous ; le changement de mot de passe garde sa garde (SPEC-002 RG-06).
⁶ la confirmation ne lit aucun état.
⁷ aucun montant.
⁸ un mot de passe à la fois ; EX-07 porte le plus long.
⁹ la robustesse est pure, sans tiers.
¹⁰ la difficulté du calcul est fixée par l'api (50 000 essais au plus) : un robot paie ce prix à chaque inscription.
¹¹ si le défi ne vient pas, l'écran le dit et le bouton reste désactivé ; recharger la page en redemande un.

## 6. Écrans

- **« Créer un compte » (site et app).** Sous « Mot de passe », une jauge de trois segments et son libellé (« Trop court », « Faible », « Moyen », « Fort »). Un champ « Confirmer le mot de passe ». Au-dessus du bouton, une ligne d'état : « Vérification anti-robot… » puis « Vérifié : vous n'êtes pas un robot ». « Créer mon compte » reste désactivé tant que la preuve n'est pas prête.

## 7. Questions

#### Q-01 · comment juger la robustesse ?

Statut : résolue — discrétion de Claude, à relire par JP : sortes de caractères, longueur, et une courte liste de mots de passe courants, identiques dans le site et l'api (EX-08). Une bibliothèque comme zxcvbn jugerait mieux, au prix de plusieurs centaines de kilo-octets dans le site et l'app.

#### Q-02 · quelle difficulté pour le calcul anti-robot ?

Statut : résolue — discrétion de Claude, à relire par JP : 50 000 essais au plus, soit une fraction de seconde dans un navigateur, un peu plus sur un iPhone ancien. Le défi vaut 20 minutes, le temps de remplir le formulaire.

#### Q-03 · où garder les preuves déjà servies ?

Statut : résolue — discrétion de Claude, à relire par JP : en mémoire, dans un seul fournisseur, comme le journal des échecs de connexion (SPEC-002 RG-05). Une seconde instance de l'api ou un redémarrage permettraient de rejouer une preuve pendant ses 20 minutes.

## 8. Contraintes non fonctionnelles

- **Secret.** La clé qui signe les défis dérive de `ACCESS_TOKEN_SECRET` ; aucune variable nouvelle. Un refus de preuve ne dit pas pourquoi.
- **Sans tiers.** Aucun script externe, aucun cookie : rien à ajouter au bandeau d'accord.
- **Indistinction.** Une preuve est dépensée dès qu'elle est présentée, avant de juger l'adresse : une preuve ne sert pas à sonder plusieurs adresses.
- **Langue.** Tout ce que l'écran dit est en français et en anglais (`fr`, `en-US`).

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | `passwordStrength` ; `RegisterAccount` et `ChangePassword`, qui refusent un mot de passe faible ; le port `HumanProof`, son adaptateur, `GET /account/human-challenge`, et la preuve exigée par `POST /account`. | la connexion, les comptes existants. |
| front | la même `passwordStrength`, la jauge, la confirmation, la résolution du défi et son epic, la page d'inscription, `openapi.json` et les types générés. | le changement de mot de passe. |
| mobile | l'écran d'inscription : confirmation, jauge, preuve. | le reste. |
| e2e | le parcours d'inscription et la création de comptes par l'api, qui résolvent le défi. | les autres parcours. |

## 10. Hors sujet

- **La réévaluation des mots de passe existants.**
- **Une preuve anti-robot sur la connexion ou ailleurs.**

## 11. Risques

- **Une preuve de travail freine un robot sans l'arrêter** : elle rend chaque inscription coûteuse en calcul, pas impossible. · Signal précoce : un pic d'inscriptions. · Parade : monter la difficulté, ou passer à un service tiers. · Gravité : moyenne.
- **Les preuves servies vivent en mémoire** (Q-03). · Gravité : faible.
- **Deux copies de `passwordStrength`**, dans l'api et le site : les faire évoluer ensemble, EX-08 le rappelle. · Gravité : moyenne.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 24/09/2026 | Création, à la demande de JP. |
