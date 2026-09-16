---
id: SPEC-001
titre: Publier une place de parking en location
slug: publier-une-place
statut: brouillon
revision: 1
derive_de: BR-20260910-reserver-et-louer-une-place@d3bf33b
amont: present
langue: fr
apps: [api, mobile, e2e]
code_sha: { api: d3bf33b, mobile: d3bf33b, e2e: d3bf33b }
regles: 0
exemples: 0
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-001 · Publier une place de parking en location

## Récolte (session)

_Bloc append-only. Remplacé par les douze sections à la rédaction._

### Étape 0 — ancrage
- aucun `code-scout` dépêché : aucune ligne de code, aucune carte. Toutes les règles de cette séance sont écrites contre le vide.

### Étape 1 — carte sujet
- validée par JP : « Pour un loueur niçois qui a une place de parking inutilisée, publier cette place en location à dates fixes — journée, semaine ou mois — avec sa propre grille tarifaire, afin qu'un conducteur puisse la trouver et la demander. »
- découpage annoncé : les trois autres blocs du brainstorm (demander et confirmer · circuit de l'argent · annulation et réclamation) deviendront SPEC-002, 003, 004.

### Étape 2 — récolte des règles, en largeur
- (jp) une place ne peut avoir qu'une seule annonce active.
- (jp) « le reste c'est toi qui vois ce qui te semble logique et juste » — délégation explicite. Les règles ci-dessous sont proposées par Claude et attendent validation ; elles ne sont pas des réponses de JP.
- (claude, proposé) une annonce n'est publiable que si elle porte une adresse, une description de l'accès, au moins une photo, une grille tarifaire et une période de disponibilité.
- (claude, proposé) le prix d'une location est calculé à partir de la grille du loueur ; la plateforme n'impose aucun tarif.
- (claude, proposé) une grille tarifaire propose au moins une durée ; le loueur choisit lesquelles parmi jour, semaine et mois.
- (claude, proposé) l'adresse exacte d'une place n'est visible qu'après confirmation d'une location ; avant, seul un secteur approximatif est public.
- (claude, proposé) une annonce reste publiée pendant une location ; les dates déjà louées ne sont plus demandables.
- (claude, proposé) un loueur peut dépublier son annonce à tout moment, sans effet sur les locations déjà confirmées.
- (claude, proposé) publier une annonce n'exige ni identité vérifiée ni IBAN ; ils ne sont exigés qu'avant le premier versement.
- (claude) Q-01 — existe-t-il un prix plancher ou plafond par durée ? Non décidé seul : conséquence directe sur le revenu de l'exploitant et sur la crédibilité des annonces. · tranché par JP
- (claude) Q-02 — l'app de publication appartient à quelle app du dépôt ? `apps/front` est déclaré `role: frontend` (web) et le sujet parle de React Native. · tranché par JP
- (claude) Q-03 — `quality.compliance` est éteint alors que la plateforme encaissera et vérifiera des identités. · tranché par JP

### Étape 2 — validation de la liste
- (jp) RG-05 refusée et inversée : **l'adresse exacte est visible sur l'annonce**, avant toute réservation. Les sept autres règles sont validées telles quelles.
- (claude) risque à porter en `## 11` : une annonce publique portant l'adresse exacte et des dates de disponibilité indique qu'un box précis est vide à des dates précises. · signal : signalements de loueurs, ou places dégradées/squattées entre deux locations · parade : aucune, par décision de JP · gravité : moyenne

### Étape 2 — seconde passe
- (jp) « je ne sais pas, on verra plus tard » — seconde passe non réalisée. La récolte s'arrête à huit règles, dont sept proposées par Claude et une de JP.
- (claude) conséquence : les règles que la seconde passe fait habituellement sortir (celles qu'on découvre en imaginant un utilisateur mécontent) manqueront. La sonde de couverture est désormais le seul filet de la séance.

### Étape 3 — exemples
- (claude) aucune valeur réelle disponible : ni prix, ni adresse, ni durée observée. Une valeur inventée ici deviendrait un test, puis une vérité. Valeurs demandées à JP avant d'écrire le premier exemple.
- (jp) valeurs de référence : place au **12 rue Barla, Nice**, louée **du 01/10/2026 au 31/10/2026** pour **180,00 €**.
- (claude, dérivé de JP, à confirmer) grille du loueur : **12,00 € la journée · 60,00 € la semaine · 180,00 € le mois**. Seul le mois vient de JP ; le jour et la semaine sont déduits et attendent confirmation.
- (claude) loueur de référence : Marc D. · conducteur de référence : Léa T.

#### RG-01 — une place ne peut avoir qu'une seule annonce active
- EX-01 nominal · Marc publie sa place du 12 rue Barla, aucune annonce active n'existe pour cette place → l'annonce devient active.
- EX-02 refus · Marc publie une seconde annonce pour cette même place alors que la première est active → la publication est refusée, la première annonce reste la seule active.

#### RG-02 — champs obligatoires
- EX-03 nominal · annonce portant adresse, description d'accès, une photo, grille et disponibilité du 01/10 au 31/10/2026 → publiée.
- EX-04 refus · même annonce sans aucune photo → la publication est refusée et l'annonce reste non publiée.

#### RG-03 — le prix vient de la grille du loueur
- EX-05 nominal · Léa demande la place du 01/10/2026 au 31/10/2026, la grille porte 180,00 € le mois → le prix de la demande est 180,00 €.

#### RG-04 — une grille propose au moins une durée
- EX-06 nominal · grille ne portant que le mois à 180,00 €, ni jour ni semaine → l'annonce est publiable.
- EX-07 refus · grille ne portant aucune durée → la publication est refusée.

#### RG-05 — l'adresse exacte est visible sur l'annonce
- EX-08 nominal · Léa consulte l'annonce sans avoir réservé → elle voit « 12 rue Barla, 06300 Nice ».

#### RG-06 — l'annonce reste publiée pendant une location, les dates louées ne sont plus demandables
- EX-09 nominal · la place est louée du 01/10 au 31/10/2026, Léa demande du 05/11 au 12/11/2026 → la demande est recevable.
- EX-10 refus · Léa demande du 15/10 au 20/10/2026 → la demande est refusée, ces dates sont déjà louées.

#### RG-07 — dépublication sans effet sur les locations confirmées
- EX-11 nominal · Marc dépublie son annonce le 10/10/2026 alors que la location du 01/10 au 31/10 est confirmée → l'annonce n'est plus visible et la location d'octobre reste confirmée.

#### RG-08 — publier n'exige ni identité vérifiée ni IBAN
- EX-12 nominal · Marc n'a fourni ni pièce d'identité ni IBAN → il publie son annonce et elle devient active.

### Étape 4 — sonde de couverture (80 intersections)

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-01 EX-02 | écarté¹ | EX-13 | filet² | EX-14 | EX-15 | écarté³ | écarté⁴ | écarté⁵ | EX-16 |
| RG-02 | EX-17 | EX-04 filet⁶ | EX-18 | écarté⁷ | filet⁸ | écarté⁹ | écarté¹⁰ | filet¹¹ | EX-19 | filet¹² |
| RG-03 | EX-20 | EX-21 | EX-22 | écarté¹³ | écarté¹⁴ | écarté¹⁵ | EX-23 | écarté¹⁶ | écarté⁵ | écarté¹⁷ |
| RG-04 | EX-06 EX-07 | EX-07 | écarté¹⁸ | écarté¹³ | filet⁸ | EX-24 | EX-25 | écarté¹⁶ | écarté⁵ | écarté¹⁷ |
| RG-05 | écarté¹⁹ | écarté²⁰ | écarté¹⁸ | écarté¹³ | EX-26 | EX-27 | écarté³ | écarté⁴ | écarté⁵ | écarté¹⁷ |
| RG-06 | EX-28 | EX-09 | EX-29 | EX-30 | filet⁸ | EX-31 | écarté³ | filet²¹ | écarté⁵ | écarté¹⁷ |
| RG-07 | écarté¹⁹ | EX-11 | écarté²² | EX-32 | filet²³ | EX-33 | écarté³ | écarté⁴ | écarté⁵ | écarté¹⁷ |
| RG-08 | écarté¹⁹ | EX-12 | écarté¹⁸ | écarté¹³ | écarté²⁴ | EX-34 | écarté²⁵ | écarté⁴ | écarté⁵ | écarté¹⁷ |

¹ l'absence d'annonce pour une place est le cas nominal, déjà porté par EX-01.
² contrainte d'unicité en base sur l'identifiant de place restreinte aux annonces actives — à créer dans la migration de cette spec.
³ cette règle ne porte sur aucun montant.
⁴ la règle porte sur une place unique, jamais sur une liste.
⁵ aucun appel à un tiers dans ce chemin.
⁶ l'absence d'un champ obligatoire est refusée par la validation de la requête ; EX-04 en est le représentant testé.
⁷ deux publications concurrentes pour la même place relèvent de RG-01, pas de RG-02.
⁸ garde d'authentification sur la route, et vérification que le loueur agit sur sa propre annonce.
⁹ publier une annonce déjà publiée relève de RG-01.
¹⁰ le contenu de la grille relève de RG-04, pas de la complétude de l'annonce.
¹¹ nombre et taille des fichiers bornés par la validation à la frontière HTTP.
¹² longueur maximale et jeu de caractères portés par le schéma de la requête.
¹³ le calcul comme la publication sont des opérations uniques, sans état partagé concurrent.
¹⁴ le calcul du prix ne dépend d'aucun rôle.
¹⁵ le calcul ne dépend pas de l'état de l'annonce.
¹⁶ une demande porte sur une seule place.
¹⁷ aucune saisie libre n'entre dans ce chemin.
¹⁸ cette règle ne lit aucune donnée temporelle.
¹⁹ cette règle n'a pas de borne numérique.
²⁰ l'adresse est un champ obligatoire, son absence relève de RG-02.
²¹ index sur les dates de location et pagination de l'historique d'une annonce.
²² la règle ne dépend pas de l'instant de la dépublication.
²³ vérification que le loueur est propriétaire de l'annonce qu'il dépublie.
²⁴ la règle énonce précisément qu'aucune vérification n'est exigée pour publier.
²⁵ publier ne déclenche aucun mouvement d'argent.

#### Exemples nés de la sonde (origine: sonde)
- EX-13 · RG-01 · Marc dépublie son annonce le 10/10/2026 puis en publie une nouvelle pour la même place le 12/10/2026 → la nouvelle annonce devient active.
- EX-14 · RG-01 · un autre loueur publie une annonce pour le 12 rue Barla alors que celle de Marc est active → la publication est refusée.
- EX-15 · RG-01 · Marc publie une annonce pour sa place alors qu'une location du 01/10 au 31/10/2026 est en cours → la publication est refusée, l'annonce existante reste la seule active.
- EX-16 · RG-01 · Marc publie « 12 Rue Barla » alors qu'une annonce active porte « 12 rue barla » → la publication est refusée, les deux adresses désignent la même place.
- EX-17 · RG-02 · annonce portant exactement une photo → publiée.
- EX-18 · RG-02 · annonce dont la disponibilité va du 01/10/2025 au 31/10/2025, entièrement dans le passé → la publication est refusée.
- EX-19 · RG-02 · le stockage des photos répond une erreur pendant la publication → la publication est refusée et aucune annonce partielle n'est créée.
- EX-20 · RG-03 · Léa demande du 01/10 au 10/10/2026, soit 10 jours, la grille porte 12,00 € le jour, 60,00 € la semaine et 180,00 € le mois → [À CLARIFIER: Q-05].
- EX-21 · RG-03 · Léa demande 7 jours alors que la grille ne porte que le mois à 180,00 € → la demande est refusée, aucune durée proposée ne couvre la période.
- EX-22 · RG-03 · Marc change sa grille de 180,00 € à 200,00 € le 02/10/2026 après une demande faite le 01/10/2026 à 180,00 € → la demande reste à 180,00 €.
- EX-23 · RG-03 · le prix d'une durée composite tombe sur un montant non entier → le montant est arrondi au centime.
- EX-24 · RG-04 · Marc retire la dernière durée de la grille d'une annonce active → la modification est refusée.
- EX-25 · RG-04 · Marc publie une grille à 0,00 € le mois → [À CLARIFIER: Q-01].
- EX-26 · RG-05 · un visiteur non connecté consulte l'annonce → il voit « 12 rue Barla, 06300 Nice ».
- EX-27 · RG-05 · Léa ouvre le lien d'une annonce dépubliée → l'annonce n'est plus consultable et l'adresse n'est plus visible.
- EX-28 · RG-06 · une location court jusqu'au 31/10/2026, Léa demande du 31/10 au 05/11/2026 → la demande est refusée, le 31/10 est déjà loué.
- EX-29 · RG-06 · Léa demande une journée le 15/10/2026 depuis un fuseau différent → la journée est bornée sur Europe/Paris.
- EX-30 · RG-06 · Léa et un autre conducteur demandent tous deux du 05/11 au 12/11/2026 au même instant → une seule demande est enregistrée, l'autre est refusée pour dates indisponibles.
- EX-31 · RG-06 · Léa demande des dates sur une annonce dépubliée → la demande est refusée.
- EX-32 · RG-07 · Marc dépublie son annonce à l'instant où une demande arrive → la demande est refusée, la dépublication est effective.
- EX-33 · RG-07 · Marc dépublie une annonce déjà dépubliée → l'annonce reste dépubliée, aucune erreur visible.
- EX-34 · RG-08 · Marc a commencé une vérification d'identité sans la terminer → il publie quand même son annonce.

#### Questions nées de la sonde
- (claude) Q-04 — qu'est-ce qui identifie « une place » pour RG-01 : l'adresse seule, ou l'adresse plus un identifiant de box ? Deux voisins d'un même immeuble ont deux places à la même adresse. · tranché par JP · bloque RG-01, EX-14 et EX-16.
- (claude) Q-05 — comment est facturée une durée qui ne tombe sur aucun palier, par exemple 10 jours ? · tranché par JP · bloque RG-03 et EX-20.

### Étape 4 — validation de la sonde, et Q-04 tranchée
- (jp) la grille est validée telle quelle : aucun « écarté » ne devient exemple.
- (jp) Q-04 **résolue** — une place est identifiée par **son adresse et son numéro de box**.
- (claude) conséquences de la résolution de Q-04, à appliquer à la rédaction :
  - RG-01 se lit désormais : une place, identifiée par son adresse et son numéro de box, ne peut avoir qu'une seule annonce active.
  - RG-02 gagne un champ obligatoire : le numéro de box.
  - EX-14 est révisé : un autre loueur publiant le **même box** à la même adresse est refusé ; publier un **autre box** à la même adresse est autorisé.
  - EX-16 est révisé : la normalisation porte sur le couple adresse + numéro de box, pas sur l'adresse seule.
- (claude) EX-35 · RG-01 · le voisin de Marc publie le box 14 au 12 rue Barla alors que l'annonce de Marc porte le box 12 → la publication est acceptée, les deux annonces coexistent.

### Étape 6 — fermeture des questions
- (jp) Q-05 **résolue** — le prix d'une durée est la **meilleure combinaison des paliers** de la grille, au plus avantageux pour le conducteur. 10 jours avec 12,00 €/jour, 60,00 €/semaine et 180,00 €/mois valent donc **96,00 €** (une semaine + trois jours).
- (claude) conséquences : RG-03 se précise — le prix est la combinaison la moins chère des paliers proposés par la grille. EX-20 n'est plus `[À CLARIFIER]` et vaut 96,00 €. EX-21 (aucun palier ne couvre la période) tient toujours : une grille ne portant que le mois ne peut pas composer 7 jours.
- (jp) Q-01 **résolue** — aucune borne : ni prix plancher, ni prix plafond. Le loueur met ce qu'il veut.
- (claude) conséquences : EX-25 n'est plus `[À CLARIFIER]` — une grille à 0,00 € le mois est publiée. Conséquence assumée à porter en risque : une location à 0,00 € ne produit aucune commission pour l'exploitant.
- (jp) Q-02 **résolue** — deux apps ajoutées à `jp-way.config.json` : `mobile` (React Native, loueur et conducteur) et `bo` (back-office web). `front` est supprimée, rien n'existait sur le disque. `apps[]` vaut désormais api · mobile · bo · e2e.
- (jp) Q-03 **résolue** — `quality.compliance` rallumé : frameworks [RGPD], dataClasses [pii, financial], avec un paragraphe de notes recopié dans le brief du relecteur.
- (claude) la frontmatter de cette spec passe donc à `apps: [api, mobile, e2e]` — `bo` n'est pas concernée par SPEC-001, qui ne touche aucun écran d'administration.
