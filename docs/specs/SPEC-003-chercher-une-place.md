---
id: SPEC-003
titre: Chercher une place sur la page d'accueil
slug: chercher-une-place
statut: valide
revision: 1
derive_de: null
amont: absent
langue: fr
valide_le: 2026-09-22
valide_par: JP
apps: [api]
code_sha: { api: bc0ba0d }
ux: absent
regles: 2
exemples: 10
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-003 · Chercher une place sur la page d'accueil

## 1. Sujet

Pour un conducteur qui arrive sur le site, voir les places disponibles près de l'endroit et aux dates
qui l'intéressent, afin de ne pas avoir à parcourir toutes les annonces du pays.

## 2. Périmètre

**Dedans** — filtrer la liste des annonces actives par lieu et par période, et la rendre page par page.

**Dehors** — exclure les dates déjà louées : cela demande de croiser les demandes confirmées dans la
même requête, et personne n'a encore tranché ce qu'une place partiellement libre doit afficher. Une
annonce dont la période de disponibilité couvre les dates demandées apparaît, même si quelqu'un l'a
déjà réservée sur ce créneau.

**Dehors** — trier autrement que par date de publication, chercher par prix, par distance ou sur une
carte.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Lieu | le fragment de texte cherché dans l'adresse d'une annonce. Jamais « ville » : l'adresse est une seule chaîne, il n'existe pas de champ ville. |
| Période demandée | le couple de jours que le conducteur veut louer. Jamais « disponibilité », qui désigne ce que le loueur a ouvert. |
| Page | une tranche de la liste, de taille fixe. La première page porte le numéro `1`. |

## 4. Règles et exemples

### RG-01 · la liste ne rend que les annonces dont l'adresse contient le lieu cherché et dont la disponibilité couvre entièrement la période demandée

#### EX-01 · un lieu en minuscules trouve une adresse en capitales

Étant donné une annonce au `12 rue Barla, 06300 NICE` et une autre au `3 avenue Malausséna, 06000 Nice`
Quand la liste est demandée avec le lieu `nice`
Alors les deux annonces sont rendues

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"9aa45344"} -->

#### EX-02 · un lieu sans accent trouve une adresse accentuée

Étant donné une annonce au `3 avenue Malausséna, 06000 Nice`
Quand la liste est demandée avec le lieu `malaussena`
Alors cette annonce est rendue

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"768be14f"} -->

#### EX-03 · un lieu absent ne rend rien

Étant donné une annonce au `12 rue Barla, 06300 Nice`
Quand la liste est demandée avec le lieu `marseille`
Alors aucune annonce n'est rendue

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"56d47521"} -->

#### EX-04 · une disponibilité qui couvre la période demandée est rendue

Étant donné une annonce disponible du `01/10/2026` au `31/10/2026`
Quand la liste est demandée pour la période du `05/10/2026` au `07/10/2026`
Alors cette annonce est rendue

<!-- jp-way:ex {"id":"EX-04","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"f10d7a8c"} -->

#### EX-05 · une disponibilité qui commence trop tard est écartée

Étant donné une annonce disponible du `10/10/2026` au `31/10/2026`
Quand la liste est demandée pour la période du `05/10/2026` au `07/10/2026`
Alors aucune annonce n'est rendue

<!-- jp-way:ex {"id":"EX-05","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"02f1189f"} -->

#### EX-06 · une disponibilité qui finit trop tôt est écartée

Étant donné une annonce disponible du `01/10/2026` au `06/10/2026`
Quand la liste est demandée pour la période du `05/10/2026` au `07/10/2026`
Alors aucune annonce n'est rendue

<!-- jp-way:ex {"id":"EX-06","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"65a205a5"} -->

#### EX-07 · les bornes exactes sont couvrantes

Étant donné une annonce disponible du `05/10/2026` au `07/10/2026`
Quand la liste est demandée pour la période du `05/10/2026` au `07/10/2026`
Alors cette annonce est rendue

<!-- jp-way:ex {"id":"EX-07","regle":"RG-01","origine":"sonde","barreau":"unit","empreinte":"ef6337c8"} -->

### RG-02 · la liste est rendue par pages de 20 annonces au plus, et dit toujours combien il y en a en tout

#### EX-08 · la première page porte vingt annonces sur vingt-cinq

Étant donné `25` annonces actives
Quand la première page est demandée
Alors `20` annonces sont rendues
Et le total annoncé est `25`

<!-- jp-way:ex {"id":"EX-08","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"fffef5a9"} -->

#### EX-09 · la deuxième page porte les cinq restantes

Étant donné `25` annonces actives
Quand la deuxième page est demandée
Alors `5` annonces sont rendues
Et le total annoncé est toujours `25`

<!-- jp-way:ex {"id":"EX-09","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"9516221d"} -->

#### EX-10 · une taille de page démesurée est ramenée à cent

Étant donné `25` annonces actives
Quand une page de `5000` annonces est demandée
Alors la taille retenue est `100`, et les `25` annonces sont rendues

<!-- jp-way:ex {"id":"EX-10","regle":"RG-02","origine":"sonde","barreau":"unit","empreinte":"1d3d1a57"} -->

## 5. Sonde de couverture

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-05 EX-06 EX-07 | EX-03 | EX-04 | écarté¹ | écarté² | filet³ | écarté⁴ | EX-08 | écarté⁵ | EX-01 EX-02 |
| RG-02 | EX-08 EX-09 EX-10 | écarté⁶ | écarté⁷ | écarté¹ | écarté² | écarté⁷ | écarté⁴ | EX-08 EX-09 | écarté⁵ | écarté⁸ |

¹ la lecture ne modifie aucun état partagé ; deux requêtes simultanées suivent le même chemin.
² lire une annonce ne demande aucun compte (SPEC-002, RG-02) : la liste est publique par construction.
³ seules les annonces `ACTIVE` sont lues, filet posé par `findAllActive` et prouvé par SPEC-001.
⁴ aucun montant n'entre dans le filtrage ni dans la pagination.
⁵ aucun appel à un tiers dans ce chemin.
⁶ une liste vide est déjà couverte par EX-03.
⁷ la pagination ne lit aucune donnée temporelle ni aucun état d'entité.
⁸ la taille et le numéro de page sont des nombres, jamais du texte libre.

## 6. Écrans

Aucun. Le dépôt ne contient aucune application front. Le jour où la page d'accueil existera, cette
section gagnera ses `UX-nn` et la spec une révision.

## 7. Questions

aucune.

## 8. Contraintes non fonctionnelles

- **Volume.** Sans pagination, la réponse grossit avec le nombre d'annonces. La taille par défaut est
  `20` et le maximum `100` : une requête ne peut pas ramener toute la base.
- **Adresse publique.** L'adresse exacte apparaît dans la liste, comme sur la lecture unitaire
  (SPEC-001, RG-05). L'exposer sur plusieurs annonces à la fois n'a pas été réexaminé.
- **Description d'accès.** Jamais rendue, ici comme ailleurs (`ADR-005`).

## 9. Impacts par app

| App | Nature | Ampleur estimée | Ordre |
|---|---|---|---|
| api | `ListActiveListings` gagne des critères et une pagination ; `GET /listing` gagne ses paramètres | non chiffrée | 1 |

## 10. Hors sujet

- Exclure les dates déjà louées — croiser les demandes confirmées est une décision à part.
- Trier par prix, chercher par distance, afficher une carte.

## 11. Risques

| Risque | Signal précoce | Parade | Gravité |
|---|---|---|---|
| Une annonce apparaît disponible alors qu'elle est déjà louée sur ces dates | un conducteur qui demande et reçoit `DatesAlreadyRentedError` | aucune en v1, décision assumée au §2 | moyenne |
| Le filtre sur l'adresse parcourt toutes les lignes actives | des temps de réponse qui montent avec le nombre d'annonces | aucune en v1, aucun index sur l'adresse | moyenne |

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 22/09/2026 | Création, à la demande, sans séance de phase 1 — `amont: absent`. Deux règles, dix exemples : filtrer par lieu et par période, paginer. L'exclusion des dates déjà louées est explicitement hors sujet. |
