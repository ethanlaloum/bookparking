---
id: SPEC-001
titre: Publier une place de parking en location
slug: publier-une-place
statut: brouillon
revision: 1
derive_de: BR-20260910-reserver-et-louer-une-place@d3bf33b
amont: present
langue: fr
apps: [api, front, e2e]
code_sha: { api: d3bf33b, front: d3bf33b, e2e: d3bf33b }
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
