---
id: BR-20260910-reserver-et-louer-une-place
titre: Location de places de parking entre particuliers à Nice
date: 2026-09-10
statut: valide
revision: 1
valide_le: 2026-09-16
valide_par: JP
langue: fr
code_sha: { api: 32f4557, front: 32f4557, e2e: 32f4557 }
session: { questions: 23, duree_min: null }
---

# Brainstorm — BR-20260910-reserver-et-louer-une-place

## 1. Problème

À Nice, se garer est un problème majeur de la ville : trouver une place est très compliqué pour un conducteur. Dans le même temps, des centaines de places de parking privées restent aujourd'hui inutilisées par leurs propriétaires. La seule alternative existante pour mettre en relation une place inoccupée et un conducteur qui cherche à se garer est leboncoin, un site généraliste de petites annonces jugé mal adapté par JP (« c'est pas ouf, c'est pas fait pour louer des parkings »). Le sujet vient d'un client du projet — une entreprise qui n'exploite elle-même aucune place — et non d'un produit interne : le propriétaire des réponses métier n'est donc pas nécessairement présent en séance.

## 2. Ce qu'on veut obtenir

### 2.1 Objectif

Le nombre de places de parking publiées par des loueurs à Nice passe de 0 aujourd'hui à plusieurs centaines.

*(Formulation mesurable proposée par Claude à partir de D-25 « des centaines de places disponibles sur l'application » — à confirmer à la porte, JP ne l'a pas reformulée lui-même sous cette forme précise.)*

### 2.2 Acteurs

| Acteur | Ce qu'il fait aujourd'hui | Ce qu'il veut |
|---|---|---|
| Loueur | Passe par leboncoin, mal adapté, ou ne fait rien de sa place inutilisée | Publier sa place, fixer sa propre grille tarifaire, être payé sans risque et sans démarche complexe à l'inscription (R-05) |
| Conducteur | À Nice, trouver une place à louer est très compliqué ; passe par leboncoin si une offre existe | Trouver et réserver une place fiable, être remboursé si elle n'est pas disponible à son arrivée |
| Exploitant (admin) | N'existe pas encore — acteur et surface nommés pendant la séance (D-13) | Suivre réservations et clients, encaisser sa commission, régler marge et délais, traiter litiges et fraudes |

### 2.3 Signes de réussite

- Le nombre de places publiées à Nice passe de 0 à plusieurs centaines (D-25).
- Le nombre de recherches sans résultat diminue rapporté au nombre de places publiées (signal de R-07).
- La part des loueurs qui commencent une annonce et la publient jusqu'au bout augmente (signal inverse de R-05).

## 3. Ce qui existe déjà — ancré dans le code

Aucun ancrage code n'est possible pour ce sujet. `jp-way.config.json` déclare trois apps (`apps/api`, `apps/front`, `apps/e2e`), mais aucun des trois répertoires n'existe sur le disque : le dépôt a été initialisé au commit `99e18a5` et ne porte pas une seule ligne de code. Cette absence est vraie pour toute la séance et le restera jusqu'à la première ligne écrite ; ce n'est pas une lacune de recherche.

| Constat | Preuve | Conséquence pour ce sujet |
|---|---|---|
| Des centaines de places de parking à Nice restent aujourd'hui inutilisées par leurs propriétaires | Déclaration de JP (séance, T20) | C'est le gisement que vise l'objectif D-25 ; c'est aussi le fondement du risque R-07 (l'offre, pas la demande, est le point dur) |
| L'alternative existante pour louer un parking est leboncoin, jugé inadapté par JP (« c'est pas fait pour louer des parkings ») | Déclaration de JP (séance, T20) | Confirme qu'aucune solution dédiée n'existe aujourd'hui sur ce marché ; ne dit rien des raisons précises de l'inadaptation |

## 4. Décisions prises

| # | Décision | Alternatives écartées | Pourquoi | Solidité (ferme \| à revalider) |
|---|---|---|---|---|
| D-01 | Place de marché entre particuliers ; le client n'exploite lui-même aucune place | Aucune alternative nommée pendant la séance | Répond à Q-01 : détermine à lui seul les acteurs, le vocabulaire et les règles d'encaissement/reversement | ferme |
| D-02 | Location à l'heure, moteur de réservation sur créneaux plutôt qu'un catalogue au mois | — | Le produit devait être un moteur de réservation, pas un catalogue d'annonces au mois | **caduque — révisée par D-06 (T5)**, raison donnée : « c'est trop galère à l'heure » |
| D-03 | Le loueur fixe lui-même sa grille tarifaire ; l'application n'impose pas le prix | Aucune alternative nommée | Cohérent avec le statut de place de marché entre particuliers (D-01) | ferme |
| D-04 | La réservation n'est pas instantanée : le loueur reçoit une alerte et doit accepter ou décliner | La réservation instantanée sans confirmation (implicite) | Laisse au loueur la maîtrise de qui accède à sa place privée | ferme |
| D-05 | L'accès au parking n'est pas un mécanisme de la plateforme ; le loueur l'explique lui-même, sans champ structuré imposé | Trois options écartées (T4) : code de portail révélé pendant le créneau, remise en main propre de la télécommande, boîtier connecté sur le portail | Aucune des trois n'a convenu ; JP a répondu en texte libre plutôt que de choisir parmi elles | ferme |
| D-06 | Révision de D-02 : la location se fait à la journée, à la semaine ou au mois, plus à l'heure | D-02 (location à l'heure seule), rendue caduque | « C'est trop galère à l'heure » | ferme |
| D-07 | La confirmation du loueur reste obligatoire malgré le changement de durée | Aucune alternative nommée | D-04 survit à la révision de durée | ferme |
| D-08 | Le loueur peut proposer, place par place, de la location à dates fixes et de la location qui se reconduit | Un seul mode imposé pour toute la plateforme (implicite) | Laisse le choix du mode au loueur plutôt qu'à la plateforme | ferme |
| D-09 | Les dates fixes sont livrées en premier ; la reconduction est reportée à une mise à jour ultérieure | Livrer la reconduction en premier | Réponse à Q-07 (lentille Simplificateur) : une version plus petite a été acceptée | ferme |
| D-10 | L'application encaisse le conducteur, prélève la commission de l'exploitant, reverse le solde au loueur | Mise en relation seule, sans encaissement (T8) | Seule forme où la commission est certaine, et seul levier réel sur l'annulation et le no-show | ferme |
| D-11 | Le loueur est payé au début de la location | Aucune alternative nommée au moment de la décision | Réponse à Q-08 | **caduque — révisée par D-20 (T16)** : la panne étudiée en T15 montre qu'on ne peut pas récupérer l'argent chez un particulier une fois versé |
| D-12 | L'éligibilité au remboursement dépend d'un délai avant le début de la location, réglé par l'exploitant | Aucune alternative nommée | Laisse le réglage à l'exploitant plutôt que de figer une valeur dans le produit | ferme |
| D-13 | Un troisième acteur existe, l'admin (l'exploitant), avec une surface propre : le back-office | Aucune alternative nommée | Nécessaire dès lors que le délai d'annulation (D-12) doit être réglé par quelqu'un, quelque part | ferme |
| D-14 | Le back-office porte : consultation des réservations, consultation des clients, statistiques, revenus, réglage de la marge, réglage du délai d'annulation | Aucune alternative nommée | Contenu minimal explicitement listé par JP | ferme |
| D-15 | JP délègue le reste du contenu du back-office | Aucune alternative nommée — délégation explicite | « Fais ce qui te semble utile, je ne vais pas tout te lister » | ferme — contenu délégué détaillé en Discrétion Claude |
| D-16 | Le découpage proposé pour le back-office (D-15, dedans et dehors) est validé tel quel | Aucune alternative nommée | « On apportera des améliorations au fil du temps » | ferme |
| D-17 | Le conducteur dépose une réclamation, accompagnée d'une preuve | Aucune alternative nommée | Réponse à Q-10 (place occupée à l'arrivée) | ferme |
| D-18 | L'issue d'une réclamation est décidée par l'admin, au cas par cas ; rien n'est automatique | Un mécanisme automatique de résolution (implicite) | Chaque réclamation est particulière | ferme |
| D-19 | Il existe une messagerie d'assistance entre l'utilisateur et le back-office | Aucune alternative nommée | Ne contredit pas l'exclusion de messagerie loueur-conducteur (D-15) : ici les interlocuteurs sont l'utilisateur et l'exploitant | ferme |
| D-20 | Révision de D-11 : le loueur est payé seulement une fois que le conducteur a confirmé son arrivée | D-11 (paiement au début de la location), rendue caduque | La panne étudiée en T15 montre qu'on ne peut pas récupérer l'argent chez un particulier une fois versé | ferme |
| D-21 | JP délègue la forme exacte du mécanisme de libération du versement | Aucune alternative nommée — délégation explicite | « Qu'est-ce qui te semble le plus logique pour qu'il y ait le moins de problème » | ferme — mécanisme détaillé en Discrétion Claude |
| D-22 | Mécanisme de libération validé : retenue depuis la réservation, libération au premier de deux événements (confirmation d'arrivée, ou expiration d'un délai après le début), réclamation ouverte avant libération gelant la somme | Aucune alternative nommée — la recommandation de Claude (D-21) est acceptée telle quelle | Neutralise R-06 et R-08 : la plateforme n'a jamais à récupérer de l'argent déjà versé | ferme |
| D-23 | Si le loueur annule une location confirmée, le conducteur est intégralement remboursé, sans pénalité ni contrepartie | Aucune alternative nommée | « Et basta » — décision assumée par JP malgré le risque nommé en retour (R-09) | ferme |
| D-24 | Le conducteur est débité au moment où il fait sa demande ; l'argent est bloqué jusqu'à la confirmation du loueur, puis rendu si le loueur ne confirme pas | Aucune alternative nommée | Cohérent avec le principe déjà posé (D-04/D-07) qu'une demande n'est pas encore une réservation | ferme |
| D-25 | Objectif de la séance : des centaines de places de parking disponibles sur l'application | Aucune alternative nommée | Réponse du Closer à « à quoi on voit dans six mois que ce n'était pas pour rien » | ferme |
| D-26 | La mise en location d'une place se fait par un formulaire en plusieurs étapes, pas en un seul écran | Un formulaire en un seul écran (décision d'interface, écartée implicitement) | Décision d'interface, pas une règle métier : ce qui devient règle, ce sont les champs obligatoires (Q-19) | ferme |

**Conséquences et notes déduites par Claude, à revalider sauf mention contraire :**

- Conséquence de D-01 (Q-01) : un encaissement pour compte de tiers est le mode par défaut d'une place de marché ; s'il est retenu, il entraîne identité vérifiée, reversement et un cadre réglementaire. · à revalider
- R-01 et R-02 tombent avec D-06 : une explication d'accès est proportionnée à une location d'au moins une journée, un délai de réponse de quelques heures est sans conséquence pour une location qui commence le lendemain. · ferme
- Conséquences de D-09 : le paiement récurrent, le préavis, la résiliation et l'échec de prélèvement sortent du périmètre de la première livraison. · à revalider
- Conséquence de D-11 avant sa révision par D-20 : une annulation avant le début de la location était un remboursement, une annulation après le début une créance sur le loueur — deux mécaniques distinctes, à réexaminer sous D-20/D-22. · à revalider
- La marge de la plateforme est un réglage du back-office, pas une constante — même forme que le délai d'annulation ; Q-13 s'étend donc à la marge. · à revalider
- L'argent du conducteur traverse trois états successifs : bloqué à la demande (D-24), retenu après confirmation, libéré à l'arrivée (D-22) — chaque transition a sa règle et chaque sortie son remboursement. · à revalider
- Formulation mesurable proposée pour D-25, à valider à la porte : le nombre de places publiées à Nice passe de 0 à plusieurs centaines ; l'objectif porte sur l'offre, pas sur la demande ni sur le chiffre d'affaires. · à revalider
- L'objectif de JP (D-25) et le risque R-07 disent la même chose par deux chemins : le succès se mesure du côté des places publiées, pas du côté des conducteurs. · ferme
- D-26 est une décision d'interface, pas une règle métier : un concurrent pourrait publier une annonce en un seul écran et livrer le même produit. · ferme
- Action à mener après la porte, jamais pendant cette phase : réactiver `quality.compliance` dans `jp-way.config.json` (frameworks et dataClasses), le déclencheur posé à l'init étant la première spec qui touche l'identité ou le paiement. · ferme
- Conséquence du pré-mortem refusé (T22) : `## 9. Risques` n'est alimenté par aucun risque venant de JP ; les onze risques de la table sont tous de Claude, et les angles morts de JP n'ont pas été sondés. · ferme
- La synthèse en deux temps n'a eu que son premier temps : JP a clos sur « c'est bon, écris » sans répondre à « qu'est-ce que tu vois là-dedans » ; le second temps (les liens qu'il aurait manqués) a de fait été livré dans le même message que les révisions D-06/D-20. · ferme
- Production lancée : `product-writer` dispatché en mode brainstorm sur le seul chemin du journal et les compteurs, sans résumé de conversation. · ferme

### Discrétion Claude

- **D-15 — contenu du back-office laissé au jugement de Claude.**
  - Ajouté, parce que sans cela le produit ne tient pas debout : retirer une annonce frauduleuse ou non conforme ; suspendre un compte ; traiter un litige et déclencher un remboursement manuel, y compris après le versement au loueur (seule parade connue à R-06) ; voir l'état de la vérification d'identité d'un loueur, puisqu'aucun reversement n'est possible sans elle.
  - Laissé dehors de la première livraison, avec sa raison (reprise en §7.2) : un système de rôles et permissions fin ; l'édition par l'admin des prix des loueurs ; l'export comptable et la facturation automatique ; une messagerie intégrée loueur-conducteur ; des gabarits de notification éditables.
  - Validé sans changement par JP en D-16.
- **D-21 — mécanisme exact de libération du versement laissé au jugement de Claude.**
  - Recommandation posée (T16) : l'argent est retenu par la plateforme depuis la réservation jusqu'à une libération, qui survient au premier des deux événements — confirmation d'arrivée par le conducteur, ou expiration d'un délai après le début de la location. Une réclamation ouverte avant la libération gèle la somme : l'admin tranche avec l'argent encore en main. Ce délai devient un réglage du back-office, comme le délai d'annulation et la marge.
  - Validé sans changement par JP en D-22.
- **Ordre des étapes du formulaire de publication (T21), recommandation non redemandée à JP.**
  - L'ordre des étapes est un levier direct sur l'objectif D-25 et sur les risques R-05/R-07 : demander pièce d'identité et IBAN pour publier ferait perdre le loueur avant la première place. Recommandation : publier d'abord, ne déclencher la vérification d'identité et l'IBAN qu'avant le premier versement, donc après la première location confirmée.

## 5. Règles candidates

> Ni numérotée, ni exemplifiée : la séance de mapping les découpe, les renomme ou les rejette.

| Règle candidate | Origine | Solidité |
|---|---|---|
| Le prix d'une réservation est calculé à partir de la grille du loueur, jamais d'un tarif fixé par la plateforme | D-03 | à confirmer |
| Une place n'est réservée qu'après acceptation explicite du loueur ; une demande non acceptée ne vaut pas réservation | D-04, D-07 | à confirmer |
| Le loueur peut décliner une demande, sans avoir à se justifier | D-04 | à confirmer |
| Une annonce porte son mode de location, choisi par le loueur ; un conducteur ne peut demander que dans le mode proposé | D-08 | à confirmer |
| La commission de l'exploitant est prélevée sur chaque location payée ; aucune location payée n'échappe à la commission | D-10 | à confirmer |
| Entre la confirmation du loueur et le début de la location, l'argent du conducteur est détenu par la plateforme et n'appartient encore à personne | D-11 (à relire à la lumière de D-20/D-22) | à confirmer |
| Une annulation ouvre droit à remboursement si elle intervient plus tôt que le délai fixé par l'exploitant avant le début de la location | D-12 | à confirmer |
| Le prix est réglé par le loueur, place par place ; le délai d'annulation est réglé par l'exploitant, pour toute la plateforme — deux réglages, deux acteurs | D-03, D-12 | à confirmer |
| La marge prélevée par la plateforme sur une transaction est celle réglée par l'exploitant au moment où la transaction a lieu | T12 (réglage back-office) | à confirmer |
| Une réclamation porte sur une location et ne peut être déposée que par une des deux parties de cette location | D-17 | à confirmer |
| Une réclamation n'est recevable qu'accompagnée d'une preuve | D-17 | à confirmer |
| Aucune réclamation ne se solde d'elle-même ; son issue est toujours une décision de l'exploitant | D-18 | à confirmer |
| Une somme gelée par une réclamation n'est versée à personne tant que l'exploitant n'a pas tranché | D-22 | à confirmer |
| La confirmation d'arrivée appartient au conducteur seul ; personne ne peut confirmer à sa place | D-20, D-22 | à confirmer |
| Le loueur est payé au premier des deux événements — confirmation d'arrivée du conducteur, ou expiration du délai de libération après le début de la location | D-22 | à confirmer |
| Trois paramètres d'exploitation vivent au même endroit et appartiennent au même acteur — marge, délai d'annulation, délai de libération | T17 (D-14, D-22) | à confirmer |
| Un loueur peut annuler une location confirmée à tout moment ; le conducteur est alors intégralement remboursé | D-23 | à confirmer |
| Une demande de location est payée d'avance ; tant qu'elle n'est pas confirmée, la somme est bloquée et n'appartient à personne | D-24 | à confirmer |
| Une demande non confirmée par le loueur est remboursée intégralement au conducteur | D-24 | à confirmer |

## 6. Arbitrages ouverts

Résolus pendant la séance et retirés de cette liste : Q-01 (→ D-01), Q-02 (→ D-10), Q-03 (→ D-02/D-06), Q-07 (→ D-09), Q-08 (→ D-11 puis D-20), Q-09 (→ D-12 + D-23), Q-10 (→ D-17), Q-15 (→ D-22, le mécanisme de libération dissout la question). Ce qui reste ouvert :

| # | Question | Options | Qui tranche | Quelle règle candidate ça bloque |
|---|---|---|---|---|
| Q-04 (révisée) | La grille tarifaire porte trois durées (jour, semaine, mois) : la semaine vaut-elle moins que sept jours, le mois moins que quatre semaines ? | Grille dégressive par palier · grille non dégressive (chaque durée valorisée indépendamment) | JP | Le calcul du prix d'une réservation |
| Q-05 (révisée) | Vocabulaire loueur / conducteur, en pratique déjà utilisé depuis le T6 mais jamais formellement reconfirmé au Closer | Loueur / conducteur (usage constant depuis T6) · un autre couple de termes | JP | Tout le glossaire, donc toutes les règles |
| Q-06 | Le mode « reconduction » (D-08) : comment s'arrête-t-il — résiliation, préavis ? | Reporté tel quel à une mise à jour ultérieure (mécanique non définie) · version intermédiaire proposée par Claude : renouvellement par nouvelle demande, sans prélèvement récurrent ni préavis | JP (ou son client) | Le paiement récurrent, la résiliation, le préavis |
| Q-11 | Le back-office est-il une app de plus ? `jp-way.config.json` ne déclare aucune app d'administration | Quatrième app dédiée · module intégré à une app existante | JP | `## 11. Impacts par app` |
| Q-12 | La tension « react native » se résout-elle par un découpage à deux natures : app mobile React Native pour loueur et conducteur, back-office web pour l'admin ? | Deux apps front de natures différentes · une seule app front | JP | Le découpage des apps |
| Q-13 | Si l'exploitant change le délai d'annulation (ou la marge), que deviennent les réservations déjà confirmées sous l'ancien réglage ? | Le nouveau réglage s'applique aux réservations en cours · seules les nouvelles réservations sont concernées | JP | La règle de remboursement, la règle de marge |
| Q-14 | Combien de places doivent exister dans un quartier pour qu'une recherche ait une chance d'aboutir ? | Aucune option chiffrée énumérée | JP (ou son client) | Ne bloque aucune règle — décide le réalisme du lancement |
| Q-16 | Sous quel délai après la fin d'une location une réclamation est-elle encore recevable ? | Aucune option énumérée | JP | La règle de recevabilité |
| Q-17 | « Client » a trois sens chez JP (conducteur, ensemble des utilisateurs vus du back-office, commanditaire du projet) : quels mots distincts adopter ? | Réserver « client » à un seul sens et nommer les deux autres · trois mots entièrement nouveaux | JP | Le glossaire |
| Q-18 | Au bout de combien de temps une demande non confirmée par le loueur est-elle abandonnée et remboursée ? | Aucune valeur énumérée — probable quatrième réglage du back-office | JP | La règle d'expiration d'une demande |
| Q-19 | Que doit contenir une annonce pour être publiable : adresse, type d'accès, dimensions, photos, disponibilités, grille tarifaire ? | Chaque champ cité est candidat, aucun tranché | JP | Les règles de publication — volontairement laissé à récolter en phase 2 |

## 7. Périmètre

### 7.1 Dedans

- Place de marché entre particuliers à Nice (D-01).
- Location à la journée, à la semaine ou au mois, à dates fixes (D-06, D-09).
- Grille tarifaire fixée par le loueur, par place (D-03).
- Demande de location soumise à confirmation explicite du loueur (D-04, D-07).
- Accès au parking expliqué librement par le loueur, hors plateforme (D-05).
- Paiement encaissé par l'application, commission prélevée, solde reversé au loueur (D-10).
- Mécanisme de libération du versement au loueur, à la confirmation d'arrivée ou à l'expiration d'un délai (D-20, D-22).
- Remboursement du conducteur si annulation avant le délai fixé par l'exploitant (D-12), ou si le loueur annule à tout moment (D-23).
- Réclamation avec preuve, tranchée par l'admin au cas par cas (D-17, D-18).
- Messagerie d'assistance entre l'utilisateur et le back-office (D-19).
- Back-office : réservations, clients, statistiques, revenus, réglages de marge, de délai d'annulation et de délai de libération (D-14, D-22).
- Formulaire de mise en location en plusieurs étapes (D-26).
- Vérification d'identité et IBAN du loueur avant le premier versement (T21, discrétion Claude).

### 7.2 Dehors — et pourquoi

- Location qui se reconduit automatiquement jusqu'à résiliation — reportée à une mise à jour ultérieure, pas abandonnée (D-08 reste vraie sur le fond ; D-09, différé T7).
- Location à l'heure — abandonnée : « c'est trop galère à l'heure » (D-02 rendue caduque par D-06).
- Boîtier d'accès connecté sur le portail — écarté au profit d'un accès expliqué librement par le loueur, pour ne pas imposer de matériel ni un accord de copropriété par immeuble (D-05).
- Système de rôles et permissions fin dans le back-office — un seul rôle admin suffit tant qu'il n'y a qu'un seul exploitant (D-15/D-16).
- Édition par l'admin des prix fixés par les loueurs — contredirait D-03 (D-15/D-16).
- Export comptable et facturation automatique — personne ne l'a demandé, et ça se rattrape à la main longtemps (D-15/D-16).
- Messagerie intégrée loueur-conducteur — sujet entier à part, distinct de la messagerie d'assistance (D-15/D-16, D-19).
- Gabarits de notification éditables — figés en dur tant qu'un seul exploitant les utilise (D-15/D-16).

## 8. Idées différées

- Location qui se reconduit jusqu'à résiliation — reportée à une mise à jour, pas abandonnée : D-08 reste vraie sur le fond, seule la séquence de livraison l'a reportée (D-09).

## 9. Risques (pre-mortem)

Le pré-mortem a été posé une fois, dans les mots prévus (« On est six mois plus tard, cette feature est un échec. Qu'est-ce qui a foiré ? »), et refusé par JP : « on s'en fout là c'est pas le sujet » (T22). En conséquence, aucun risque de cette table ne vient de JP : les onze risques nommés au fil de la séance sont tous de Claude, et les angles morts de JP n'ont pas été sondés.

| Risque | Signal précoce | Parade | Gravité |
|---|---|---|---|
| R-01 — l'accès physique à une place louée à l'heure impose au conducteur d'entrer dans un parking privé, potentiellement pour plusieurs conducteurs différents par semaine | Réservations payées suivies d'un remboursement ou d'un litige « je n'ai pas pu entrer » | Inconnue à ce stade | forte — **neutralisé par D-06** (location à l'heure abandonnée) |
| R-02 — tension entre « à l'heure » et « sur demande » : un conducteur qui cherche une place pour maintenant ne peut pas attendre que le loueur se réveille | Délai médian entre demande et réponse, taux de demandes expirées sans réponse | Inconnue à ce stade | forte — **neutralisé par D-06** |
| R-03 — l'accès expliqué en texte libre par le loueur n'est ni vérifiable ni opposable en cas de litige | Litiges sur l'accès | Inconnue à ce stade | moyenne — actif |
| R-04 — « il faut que tout soit possible » double le produit : deux mécaniques de paiement, deux fins de vie, deux formes de grille tarifaire | Nombre d'exemples du mode reconduction comparé au mode dates fixes, à la fin du plan | Livrer un mode d'abord (D-09) | forte — parade appliquée |
| R-05 — la vérification d'identité des loueurs est un mur à l'inscription ; un particulier qui doit fournir une pièce d'identité et un IBAN pour publier abandonne souvent | Part des loueurs qui commencent une annonce et ne la publient jamais | Inconnue à ce stade — recommandation Claude T21 : vérification déclenchée seulement avant le premier versement | moyenne — actif |
| R-06 — le versement part le jour même où le conducteur arrive ; s'il ne peut pas se garer, la plateforme a déjà payé le loueur et doit récupérer l'argent | Réclamations le premier jour d'une location | Inconnue à ce stade | forte — **neutralisé par D-22** |
| R-07 — l'atout de distribution du client porte sur la demande, déjà acquise ; le côté difficile d'une place de marché est l'offre, et une app pleine de conducteurs et vide de places est une app morte | Nombre de places publiées rapporté au nombre de recherches sans résultat | Inconnue à ce stade | forte — actif, devenu la métrique de succès (D-25) |
| R-08 — symétrique de R-06, créé par D-20 : un conducteur qui n'a jamais confirmé bloque le loueur indéfiniment | Part des locations commencées et jamais confirmées, délai médian de versement | Libération automatique après délai (D-22) | forte — parade appliquée |
| R-09 — D-23 rend l'annulation gratuite pour le loueur alors qu'elle coûte cher au conducteur, sans solution de repli dans un marché où l'offre est rare | Taux d'annulation par les loueurs, part des conducteurs annulés qui ne réservent plus jamais | Aucune retenue, par décision assumée de JP | moyenne — actif, nommé et non contesté |

Deux occurrences supplémentaires, sans numéro ni signal/parade/gravité formulés : l'absence de réponse au « pourquoi maintenant » (aucune deadline, aucun déclencheur, aucun chiffre), signalée à deux reprises (T1, T2) comme un trou du Chercheur. Elle n'a trouvé une matière que tardivement, au T20, via les cas vécus et l'objectif D-25.

## 10. Contraintes

| Contrainte | Origine | Ce qu'elle interdit |
|---|---|---|
| `jp-way.config.json` déclare `apps/front` avec `role: frontend` (forme web du handbook frontend), le sujet dit « react native » | Claude, lecture de la config | D'assumer d'emblée une forme unique de front sans trancher — reprise par Q-12 |
| Projet pour un client externe, pas un produit interne | JP | De supposer que le propriétaire des réponses métier est toujours disponible en séance |
| Marché géographique : Nice | JP | De concevoir pour un marché national ou généraliste dès la première livraison |
| Le reversement à des tiers (D-10) impose un prestataire de paiement adapté | Claude, conséquence externe de D-10 | De reverser un loueur sans vérification d'identité avant le premier versement |
| L'atout du client est un réseau de distribution capable de faire connaître l'application | JP | N'interdit rien en soi, mais ne résout que la demande (R-07) — ne dispense pas de travailler l'offre séparément |
| Une réclamation « avec preuve » (D-17) implique l'envoi et le stockage d'un fichier depuis mobile | Claude, conséquence de D-17 | De traiter une réclamation sans mécanisme d'upload et de stockage de fichier |

## 11. Impacts par app

| App | Nature | Ampleur estimée | Ordre |
|---|---|---|---|
| api | Tout le domaine métier neuf : annonces, demandes, réservations, paiement/encaissement, libération du versement, réclamations, back-office | Forte — aucune ligne de code aujourd'hui, tout est à créer | 1 |
| front | Parcours loueur et conducteur ; nature exacte (web déclarée en config vs React Native annoncé dans le sujet) contingente de Q-12 | Forte — aucune ligne de code aujourd'hui | 2 |
| e2e | Parcours de bout en bout réservation / mise en location | À définir une fois les premiers parcours stabilisés | 3 |
| [À CLARIFIER] back-office admin | Q-11 et Q-12 encore ouvertes : app web dédiée non déclarée dans `jp-way.config.json`, ou module d'une app existante | Inconnue tant que Q-11/Q-12 ne sont pas tranchées | — |

## 12. Glossaire

> Vocabulaire canonique. Les phases 2 à 4 DOIVENT réutiliser ces termes tels quels.

| Terme | Définition | Ne pas confondre avec |
|---|---|---|
| Loueur | Le particulier qui met sa place de parking en location (Q-05 révisée, D-06 et suivants) | « Locataire » — un mot qui ne diffère que de deux lettres et qui désignerait naturellement celui qui loue, pas celui qui met en location (Q-05). Terme « locataire » évité dans tout le produit pour cette raison |
| Conducteur | Le particulier qui réserve une place et vient s'y garer (Q-05 révisée) | « Client », que JP utilise aussi pour désigner l'ensemble des utilisateurs vus du back-office, ou le commanditaire du projet (Q-17) |
| Client | Mot à trois sens distincts relevés par JP lui-même (Q-17) : (1) le conducteur qui réserve, (2) l'ensemble des utilisateurs vu depuis le back-office, (3) le commanditaire du projet | Chacun des trois sens l'un de l'autre — le mot seul ne doit jamais servir à formuler une règle |
| Exploitant / Admin | Le troisième acteur de la plateforme (D-13), qui opère le back-office et règle marge, délai d'annulation et délai de libération | Le « client » au sens 3 (le commanditaire) : ce n'est pas nécessairement la même personne |
| Back-office | La surface d'administration réservée à l'exploitant (D-13), distincte des apps loueur/conducteur | Un écran d'administration générique dans l'app mobile — le back-office est une surface à part, dont le découpage exact en app(s) reste ouvert (Q-11, Q-12) |
| Demande | Une intention de location soumise par un conducteur, pas encore acceptée par le loueur (D-04, D-07) | « Réservation » : une demande n'est une réservation qu'une fois acceptée explicitement par le loueur |
| Réservation | Une demande acceptée explicitement par le loueur (D-04, D-07) | « Demande », qui peut ne jamais devenir une réservation si le loueur décline ou ne répond pas |
| Grille tarifaire | Le barème de prix qu'un loueur fixe lui-même pour sa place, par durée — jour, semaine, mois (D-03, D-06) | Un tarif imposé par la plateforme : la grille appartient toujours au loueur, jamais à l'exploitant (D-03) |
| Libération | L'événement qui déclenche le versement au loueur : la confirmation d'arrivée par le conducteur, ou l'expiration du délai de libération, le premier des deux (D-20, D-22) | Le « versement » lui-même, qui est la conséquence de la libération, pas la libération elle-même |
| Réclamation | Un signalement déposé par une des deux parties d'une location, accompagné d'une preuve, tranché au cas par cas par l'exploitant (D-17, D-18) | La « messagerie d'assistance » (D-19), qui est le canal de contact utilisateur/back-office, alors que la réclamation est l'objet qu'on y traite |

## 13. Suite

- Porte de validation phase 1 : `Valider` / `Corriger` / `Arrêter`.
- Sur validation, action à mener après la porte et hors du répertoire de la séance : réactiver `quality.compliance` dans `jp-way.config.json` (frameworks et dataClasses), le déclencheur posé à l'init étant la première spec qui touche l'identité ou le paiement (D-10).
- Onze arbitrages restent ouverts (§6) et seront hérités par la séance de mapping plutôt que redécouverts : Q-04, Q-05, Q-06, Q-11, Q-12, Q-13, Q-14, Q-16, Q-17, Q-18, Q-19.
- Prochaine commande si validation : `/jp-way:spec BR-20260910-reserver-et-louer-une-place`.
