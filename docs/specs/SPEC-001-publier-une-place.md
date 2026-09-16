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
