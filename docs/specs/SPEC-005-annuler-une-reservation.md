---
id: SPEC-005
titre: Annuler une réservation, par le conducteur ou par le loueur
slug: annuler-une-reservation
statut: valide
revision: 1
derive_de: BR-20260910-reserver-et-louer-une-place
amont: present
langue: fr
valide_le: 2026-09-23
valide_par: JP
apps: [api, front, e2e]
code_sha: { api: a91d6ee, front: a91d6ee, e2e: a91d6ee }
ux: absent
regles: 5
exemples: 18
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-005 · Annuler une réservation, par le conducteur ou par le loueur

## 1. Sujet

Pour un conducteur, pouvoir annuler sa demande ou sa location avant qu'elle commence, en sachant avant de confirmer ce qu'il récupère. Pour un loueur, pouvoir annuler une demande ou une location sur sa place, sans que le conducteur y perde rien.

Constat déclencheur, le 23/09/2026 : JP, conducteur d'une location confirmée et prélevée deux mois avant son début, ne trouvait aucun moyen de l'annuler. SPEC-004 avait laissé l'annulation par le conducteur et par le loueur hors de son périmètre, faute de délai tranché.

Décisions de séance reprises : D-12 (l'éligibilité au remboursement dépend d'un délai avant le début de la location, réglé par l'exploitant), D-23 (si le loueur annule une location confirmée, le conducteur est intégralement remboursé, sans pénalité). Décisions prises par JP le 23/09/2026 :
- le délai d'annulation gratuite est de **24 heures** avant le début de la location, réglable ;
- passé ce délai, le conducteur peut **toujours annuler, sans remboursement** : les dates redeviennent libres, l'argent prélevé est gardé ;
- l'annulation par le **loueur** est dans le périmètre ;
- Q-13 du brainstorm est tranchée : l'échéance d'une réservation est **figée au moment où elle est faite** ; un changement de délai ne vaut que pour les réservations suivantes.

## 2. Périmètre

**Dedans.** L'annulation, par le conducteur, d'une demande qui attend le loueur ou d'une location confirmée, tant qu'elle n'a pas commencé. L'échéance d'annulation gratuite, figée à la demande. Le remboursement intégral avant l'échéance, l'annulation sans remboursement après. L'annulation par le loueur d'une demande ou d'une location sur sa place, tant qu'elle n'a pas commencé, avec retour intégral de l'argent au conducteur. Ce que chacun lit avant de confirmer l'annulation, et après.

**Dehors.** L'annulation d'une location commencée, qui relève des réclamations (D-17). Le reversement au loueur de l'argent gardé après une annulation tardive, qui attend la spec du reversement (Stripe Connect). Les remboursements partiels. Le réglage du délai depuis le back-office : il est réglable par l'environnement de l'api, comme le délai d'expiration des demandes, en attendant l'écran de réglages de D-14. Le motif d'annulation. La notification du conducteur ou du loueur par e-mail.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Réservation | dans la prose produit, une demande qui attend le loueur ou une location confirmée. Jamais une demande en attente de paiement. |
| Annulation | la fin, voulue par le conducteur ou le loueur, d'une réservation qui n'a pas commencé. Statut `CANCELLED`, comme l'annulation par l'exploitant. |
| Début de la location | le premier instant du premier jour demandé, heure de Paris. |
| Échéance d'annulation gratuite | l'instant jusqu'auquel le conducteur qui annule est remboursé : le début de la location moins le délai en vigueur au moment de la demande. Figée avec la demande. |
| Annulation tardive | une annulation par le conducteur après l'échéance : les dates sont rendues, l'argent prélevé est gardé. |

## 4. Règles et exemples

Valeurs canoniques : celles de SPEC-004 — `Marc D.` loueur, `Léa T.` conductrice, `Paul R.` conducteur, la place `12 rue Barla, 06300 Nice`, `box 12`, la période du `10/10/2026` au `12/10/2026` à `45,00 €`, horloge `Europe/Paris`. La location commence le `10/10/2026 à 00:00` ; avec le délai par défaut de 24 heures, l'échéance d'annulation gratuite est le `09/10/2026 à 00:00`.

### RG-01 · le conducteur peut annuler sa réservation tant qu'elle n'a pas commencé ; personne d'autre que lui et le loueur ne le peut

#### EX-01 · annuler une demande qui attend le loueur lève l'empreinte

Étant donné l'empreinte de `Léa T.` constatée, la demande attendant le loueur
Quand `Léa T.` annule le `09/10/2026 à 12:00`, après l'échéance
Alors la demande est annulée
Et l'empreinte de `4500` centimes est levée : rien n'avait été prélevé

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"384d9de1"} -->

#### EX-02 · une location commencée ne s'annule plus

Étant donné la location de `Léa T.` confirmée et prélevée
Quand `Léa T.` annule le `10/10/2026 à 08:00`
Alors l'annulation est refusée avec `RentalAlreadyStartedError`
Et la location reste confirmée

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"d5289c11"} -->

#### EX-03 · annuler deux fois ne rembourse qu'une fois

Étant donné la location de `Léa T.` annulée le `01/10/2026 à 10:00`, remboursée
Quand `Léa T.` l'annule de nouveau
Alors aucune erreur n'est remontée
Et un seul remboursement a été demandé à Stripe

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"f6979fda"} -->

#### EX-04 · un autre compte ne peut pas annuler

Étant donné la location de `Léa T.` confirmée
Quand `Paul R.` l'annule
Alors l'annulation est refusée avec `RentalRequestNotFoundError`
Et la location reste confirmée

<!-- jp-way:ex {"id":"EX-04","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"83a6612f"} -->

#### EX-05 · une demande en attente de paiement ne s'annule pas, elle s'abandonne

Étant donné la demande de `Léa T.` en attente de paiement
Quand `Léa T.` l'annule
Alors l'annulation est refusée avec `RentalNotCancellableError`
Et la demande reste en attente de paiement

<!-- jp-way:ex {"id":"EX-05","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"5a6cb151"} -->

### RG-02 · une location confirmée que le conducteur annule jusqu'à l'échéance est remboursée en totalité ; après, elle est annulée sans remboursement

#### EX-06 · annulée cinq jours avant, remboursée en totalité

Étant donné la location de `Léa T.` confirmée et prélevée de `4500` centimes
Quand `Léa T.` annule le `05/10/2026 à 10:00`
Alors la location est annulée
Et `4500` centimes sont remboursés à `Léa T.`

<!-- jp-way:ex {"id":"EX-06","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"af2df1e7"} -->

#### EX-07 · annulée à l'échéance même, remboursée

Étant donné la location de `Léa T.` confirmée et prélevée de `4500` centimes
Quand `Léa T.` annule le `09/10/2026 à 00:00`
Alors `4500` centimes sont remboursés à `Léa T.`

<!-- jp-way:ex {"id":"EX-07","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"16b92a9b"} -->

#### EX-08 · annulée une minute après l'échéance, rien n'est remboursé

Étant donné la location de `Léa T.` confirmée et prélevée de `4500` centimes
Quand `Léa T.` annule le `09/10/2026 à 00:01`
Alors la location est annulée
Et rien n'est remboursé : les `4500` centimes prélevés sont gardés

<!-- jp-way:ex {"id":"EX-08","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"d06f4d4d"} -->

#### EX-09 · une annulation tardive rend quand même les dates

Étant donné la location de `Léa T.` annulée sans remboursement
Quand `Paul R.` demande la même place du `10/10/2026` au `12/10/2026`
Alors sa demande est acceptée

<!-- jp-way:ex {"id":"EX-09","regle":"RG-02","origine":"mapping","barreau":"int-repo","empreinte":"a7329428"} -->

### RG-03 · l'échéance d'annulation gratuite est figée au moment de la demande : le début de la location moins le délai en vigueur, 24 heures par défaut

#### EX-10 · un délai allongé après la demande ne change pas son échéance

Étant donné la demande de `Léa T.` faite avec un délai de 24 heures, puis confirmée et prélevée
Et le délai porté ensuite à 48 heures par l'exploitant
Quand `Léa T.` annule le `08/10/2026 à 18:00`, 30 heures avant le début
Alors `4500` centimes sont remboursés à `Léa T.`

<!-- jp-way:ex {"id":"EX-10","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"5989b778"} -->

#### EX-11 · l'échéance est écrite avec la demande

Quand `Léa T.` demande la période du `10/10/2026` au `12/10/2026`, le délai étant de 24 heures
Alors la ligne de la demande porte l'échéance du `09/10/2026 à 00:00`, heure de Paris

<!-- jp-way:ex {"id":"EX-11","regle":"RG-03","origine":"mapping","barreau":"int-repo","empreinte":"baa9fff9"} -->

### RG-04 · le loueur peut annuler, tant qu'elle n'a pas commencé, une réservation sur sa place ; le conducteur récupère alors tout son argent, quelle que soit l'échéance

#### EX-12 · le loueur annule une location après l'échéance du conducteur : remboursée en totalité

Étant donné la location de `Léa T.` confirmée et prélevée de `4500` centimes
Quand `Marc D.` l'annule le `09/10/2026 à 12:00`
Alors la location est annulée
Et `4500` centimes sont remboursés à `Léa T.`

<!-- jp-way:ex {"id":"EX-12","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"56e2c07d"} -->

#### EX-13 · le loueur annule une demande qui l'attend : l'empreinte est levée

Étant donné l'empreinte de `Léa T.` constatée, la demande attendant `Marc D.`
Quand `Marc D.` l'annule
Alors la demande est annulée
Et l'empreinte de `4500` centimes est levée

<!-- jp-way:ex {"id":"EX-13","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"3bf78e9d"} -->

#### EX-14 · le loueur n'annule pas une demande qu'il ne voit pas

Étant donné la demande de `Léa T.` en attente de paiement sur la place de `Marc D.`
Quand `Marc D.` l'annule
Alors l'annulation est refusée avec `RentalRequestNotFoundError`

<!-- jp-way:ex {"id":"EX-14","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"7b244bc8"} -->

### RG-05 · chacun sait, avant de confirmer, ce que l'annulation lui coûte, et lit ensuite ce qu'elle a produit

#### EX-15 · les conditions d'annulation se lisent avant de confirmer

Étant donné les réservations de `Léa T.` à `4500` centimes, la location commençant le `10/10/2026`
Quand elle envisage d'annuler
Alors une location confirmée annulable à temps se lit « Vous serez remboursé de 45,00 €. »
Et une location confirmée passée l'échéance se lit « L'échéance d'annulation gratuite est passée : les 45,00 € prélevés ne seront pas remboursés. »
Et une demande qui attend le loueur se lit « L'empreinte de 45,00 € sera levée : rien n'a été prélevé. »
Et une location commencée ne propose aucune annulation
Et, côté loueur, toute réservation annulable se lit « Le conducteur récupérera tout son argent. »

<!-- jp-way:ex {"id":"EX-15","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"6419efd0"} -->

#### EX-16 · une annulation tardive se lit comme telle

Étant donné la location de `Léa T.` annulée sans remboursement
Quand elle liste ses demandes
Alors la location se lit « Annulée · 45,00 € non remboursés »

<!-- jp-way:ex {"id":"EX-16","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"5c8c7bcd"} -->

#### EX-17 · la route d'annulation rend l'effet sur l'argent

Quand `POST /rental-request/{id}/cancellation` est appelé par `Léa T.` sur sa location, cinq jours avant
Alors la réponse est `200` et porte `REFUNDED`
Et un identifiant mal formé répond `404`, une location commencée `409`

<!-- jp-way:ex {"id":"EX-17","regle":"RG-05","origine":"mapping","barreau":"int-http","empreinte":"54c4fd77"} -->

#### EX-18 · le conducteur annule dans un vrai navigateur et voit son remboursement

Étant donné la location de `Léa T.` payée avec la carte de test et confirmée par `Marc D.`, deux mois avant son début
Quand `Léa T.` l'annule depuis « Mes réservations », après avoir lu qu'elle sera remboursée
Alors sa demande se lit « Annulée · 30,00 € remboursés »

<!-- jp-way:ex {"id":"EX-18","regle":"RG-05","origine":"mapping","barreau":"e2e","empreinte":"e147f8a8"} -->

## 5. Sonde de couverture

Cinq règles croisées avec les dix dimensions : 50 intersections, toutes résolues.

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-02 | écarté¹ | EX-02 | EX-03 | EX-04 | EX-05 | EX-01 | écarté² | filet³ | EX-17 |
| RG-02 | EX-07 EX-08 | écarté¹ | EX-06 EX-08 | filet⁴ | écarté⁵ | EX-09 | EX-06 EX-08 | écarté² | filet³ | écarté⁶ |
| RG-03 | EX-11 | filet⁷ | EX-10 | écarté⁸ | écarté⁵ | écarté⁹ | EX-10 | écarté² | écarté¹⁰ | EX-11 |
| RG-04 | écarté¹¹ | écarté¹ | EX-12 | filet⁴ | EX-14 | EX-13 | EX-12 EX-13 | écarté² | filet³ | écarté⁶ |
| RG-05 | EX-15 | filet¹² | EX-15 | écarté⁸ | filet¹³ | EX-16 | EX-15 EX-16 | écarté² | EX-18 | écarté⁶ |

¹ une annulation ne porte aucune donnée optionnelle : elle désigne une demande par son identifiant.
² la règle porte sur une réservation à la fois.
³ un remboursement ou une levée que Stripe n'accepte pas reste dû et repart au balayage — SPEC-004 RG-08.
⁴ l'annulation filtre sur les statuts qu'elle quitte (`PENDING`, `CONFIRMED`) : deux annulations simultanées n'en écrivent qu'une, et la dette envers le conducteur ne naît qu'une fois.
⁵ l'autorisation est portée par RG-01 (EX-04) et RG-04 (EX-14).
⁶ la règle n'introduit aucune saisie libre.
⁷ une demande faite avant cette spec reçoit, par la migration, l'échéance du délai par défaut.
⁸ l'échéance est une valeur figée, lue en même temps que la ligne.
⁹ l'échéance ne dépend d'aucun état de la demande.
¹⁰ le délai vient de l'environnement de l'api, exigé valide au démarrage.
¹¹ le loueur n'a pas d'échéance : seul le début de la location borne son annulation, déjà EX-02.
¹² un conducteur sans réservation voit l'état vide existant de « Mes demandes ».
¹³ `GET /rental-request` et `GET /rental-request/received` ne rendent que les réservations du compte connecté.

## 6. Écrans

- **« Mes réservations » (conducteur).** Chaque réservation annulable porte un bouton « Annuler ». Il ouvre une fenêtre qui dit les conditions de RG-05 (EX-15) et se confirme par « Annuler la réservation » ; « Garder ma réservation » la ferme sans rien faire.
- **« Demandes reçues » (loueur).** Chaque réservation annulable porte un bouton « Annuler » à côté de « Confirmer » ; la fenêtre dit « Le conducteur récupérera tout son argent. »
- Après l'annulation, la ligne porte le libellé d'argent de SPEC-004 RG-09, complété de « Annulée · 45,00 € non remboursés » (EX-16).

## 7. Questions

#### Q-01 · quel délai d'annulation gratuite, et que se passe-t-il après ?

Statut : résolue — tranché par JP le 23/09/2026 : 24 heures avant le début ; après, annulation possible sans remboursement.

#### Q-02 · un changement de délai s'applique-t-il aux réservations déjà faites ? (Q-13 du brainstorm)

Statut : résolue — tranché par JP le 23/09/2026 : non, l'échéance est figée à la demande.

#### Q-03 · jusqu'à quand peut-on annuler ?

Statut : résolue — discrétion de Claude, à relire par JP : jusqu'au début de la location, pour le conducteur comme pour le loueur. Une location commencée qui tourne mal relève des réclamations (D-17), hors de cette spec.

## 8. Contraintes non fonctionnelles

- **Délai.** `FREE_CANCELLATION_HOURS_BEFORE_START`, 24 par défaut, lu au démarrage de l'api. L'échéance se calcule en heures depuis le début de la location, pas en jours locaux : un changement d'heure entre les deux la décale d'une heure sur l'horloge murale.
- **Argent.** L'annulation n'appelle Stripe qu'à travers la dette de SPEC-004 (levée ou remboursement dû, idempotent, repris par le balayage). Elle tente de la régler aussitôt ; à défaut, le balayage le fait dans les cinq minutes.
- **Argent gardé.** Après une annulation tardive, l'argent prélevé reste sur le compte de l'exploitant, comme tout argent de ce lot (SPEC-004 §11). Il ne compte pas dans les revenus du loueur tant que le reversement n'existe pas.
- **Langue.** Tout ce qu'un loueur ou un conducteur lit est en français.

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | une migration (échéance, instant et auteur de l'annulation) ; `RequestRental`, qui fige l'échéance ; un cas d'usage `CancelRental` et sa route ; le résumé d'une demande, qui porte son début et son échéance ; les vues, qui les rendent au front. | l'annulation par l'exploitant, le balayage, le webhook. |
| front | les boutons « Annuler » de « Mes demandes » et « Demandes reçues », la fenêtre de confirmation, un libellé d'argent. | le parcours de paiement. |
| e2e | un parcours d'annulation par le conducteur, contre le vrai Stripe. | les autres parcours. |

## 10. Hors sujet

- **L'annulation d'une location commencée** — réclamations, D-17.
- **Le reversement au loueur de l'argent gardé** — spec du reversement.
- **Le réglage du délai depuis le back-office** — D-14, en attente de l'écran de réglages.
- **Les remboursements partiels, le motif d'annulation, les notifications.**

## 11. Risques

- **Une annulation tardive garde l'argent sur le compte de l'exploitant, sans loueur à qui le reverser.** · Signal précoce : le nombre d'annulations tardives. · Parade : la spec du reversement. · Gravité : moyenne.
- **Le loueur peut annuler sans pénalité jusqu'au dernier moment (R-09 du brainstorm, assumé par JP).** · Signal précoce : le taux d'annulation par les loueurs. · Parade : aucune dans ce lot. · Gravité : moyenne.
- **Un remboursement coûte les frais du paiement initial**, que Stripe ne rend pas (SPEC-004 §11). · Gravité : faible.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 23/09/2026 | Création, sur quatre décisions de JP du jour (délai de 24 heures ; annulation tardive sans remboursement ; annulation par le loueur incluse ; échéance figée, Q-13 tranchée) et sur D-12 et D-23 du brainstorm. Cinq règles, dix-huit exemples. Q-03 tranchée par Claude, à relire. |
