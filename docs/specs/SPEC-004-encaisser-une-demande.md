---
id: SPEC-004
titre: Encaisser une demande de location par empreinte bancaire, et rendre l'argent au conducteur
slug: encaisser-une-demande
statut: valide
revision: 4
derive_de: BR-20260910-reserver-et-louer-une-place
amont: present
langue: fr
valide_le: 2026-09-23
valide_par: JP
apps: [api, front, e2e]
code_sha: { api: 6afdc8a, front: 82c55bd, e2e: 82c55bd }
ux: absent
regles: 10
exemples: 51
questions_ouvertes: 0
milestone: null
epic: null
---

# SPEC-004 · Encaisser une demande de location par empreinte bancaire, et rendre l'argent au conducteur

## 1. Sujet

Pour un conducteur, garantir sa demande en posant une empreinte bancaire sur sa carte, qui n'est prélevée que si le loueur confirme, et lui rendre tout ce qui lui revient sans qu'il ait à le réclamer. Pour le loueur, ne recevoir que des demandes dont l'argent est déjà garanti.

Cette spec reprend deux blocs du brainstorm du 10/09 que SPEC-001 avait numérotés SPEC-003 et SPEC-004, avant que SPEC-002 ne réattribue SPEC-003 à la suppression de compte. Elle couvre l'**encaissement** et le **retour de l'argent au conducteur**. Le reversement au loueur et la commission de l'exploitant (Stripe Connect) feront l'objet d'une spec ultérieure, tout comme les réclamations.

Décisions de séance reprises telles quelles : D-10 (l'application encaisse le conducteur), D-24 (le conducteur est engagé dès sa demande, l'argent est bloqué jusqu'à la confirmation du loueur et rendu s'il ne confirme pas), D-23 étendu à l'exploitant (une annulation rend tout au conducteur). Décisions prises par JP le 23/09/2026, avant la rédaction :
- le prestataire est **Stripe** et la page de paiement est **Stripe Checkout**, hébergée par Stripe ;
- le « blocage » de D-24 est une **empreinte bancaire** (autorisation sans prélèvement), et non un débit suivi d'un remboursement. Une demande ignorée par le loueur ne coûte ainsi ni frais à l'exploitant ni délai de remboursement au conducteur ;
- ce lot s'arrête à l'encaissement et au retour de l'argent : l'argent prélevé reste sur le compte de l'exploitant.

## 2. Périmètre

**Dedans.** L'ouverture d'une page de paiement Stripe au montant que l'api a figé pour la demande. L'état « en attente de paiement » d'une demande, qui bloque ses dates sans la montrer au loueur. Le constat de l'empreinte par un événement signé de Stripe, qui seul fait passer la demande au loueur. L'abandon d'un paiement, par le conducteur ou par expiration. Le prélèvement de l'empreinte au moment où le loueur confirme. La levée de l'empreinte quand la demande expire sans confirmation. Le retour de l'argent quand l'exploitant annule. La reprise de ces opérations quand Stripe est indisponible, sans jamais doubler un prélèvement ni un remboursement. L'état de son argent que le conducteur lit sur chacune de ses demandes. Le balayage périodique qui rend l'expiration indépendante de l'arrivée d'une nouvelle demande.

**Dehors.** L'identifiant d'intention sur les autres actions : confirmer, abandonner, annuler et recevoir un événement de Stripe sont déjà idempotents par l'état qu'ils quittent (EX-12, EX-22, RG-08). Le reversement au loueur, la vérification de son identité et la commission de l'exploitant, qui passeront par Stripe Connect dans une spec ultérieure. L'annulation par le conducteur et son délai (D-12). L'annulation par le loueur d'une location confirmée (D-23 côté loueur), qui n'a aucune route aujourd'hui. La confirmation d'arrivée, le délai de libération et les réclamations (D-17, D-20, D-22). Les factures et reçus émis par bookparking. Les remboursements partiels. Toute autre devise que l'euro. Les moyens de paiement autres que la carte.

## 3. Glossaire

| Terme | Sens retenu, et à n'écrire que comme ça |
|---|---|
| Demande | l'intention de location d'un conducteur sur une place et une période, au sens de SPEC-001. Elle porte son prix, figé par l'api au moment où elle est faite. |
| Empreinte | l'autorisation posée sur la carte du conducteur pour le prix de la demande : l'argent est réservé sur son compte, pas prélevé. Jamais « pré-autorisation » ni « caution » dans la prose produit. |
| Prélèvement | la transformation de l'empreinte en paiement effectif, au moment où le loueur confirme. Jamais « capture » dans la prose produit, jamais « débit » avant la confirmation. |
| Levée | l'annulation d'une empreinte : l'argent réservé redevient disponible pour le conducteur, sans que rien n'ait été prélevé. Jamais « remboursement ». |
| Remboursement | le retour d'un argent déjà prélevé. N'existe qu'après une confirmation. |
| Rendre l'argent | lever l'empreinte ou rembourser, selon que l'argent a été prélevé ou non. |
| Page de paiement | la page Stripe Checkout où le conducteur saisit sa carte. Elle vit sur le domaine de Stripe, jamais sur celui de bookparking. |
| En attente de paiement | l'état d'une demande dont la page de paiement est ouverte mais dont l'empreinte n'est pas constatée. Statut `AWAITING_PAYMENT`. |
| Abandon | la fin d'une demande restée en attente de paiement : le conducteur a quitté la page, ou elle a expiré. Statut `ABANDONED`. Rien n'a été réservé sur la carte. |
| Événement Stripe | une notification envoyée par Stripe à l'api, signée avec le secret du webhook. La seule source qui fait foi sur l'état d'un paiement. |
| Balayage | la tâche périodique de l'api qui expire, abandonne et rend l'argent dû. |
| Clé d'idempotence | l'identifiant joint à une opération Stripe pour qu'une seconde tentative rende le résultat de la première au lieu de la refaire. |
| Identifiant d'intention | l'identifiant que le front attache à une intention de demande — une place et une période — et envoie dans l'en-tête `Idempotency-Key`. Il reste le même tant que l'intention ne change pas. Jamais « jeton », jamais « nonce ». |

## 4. Règles et exemples

Valeurs canoniques de cette spec : `Marc D.` loueur, `marc.d@example.com` ; `Léa T.` conductrice, `lea.t@example.com` ; `Paul R.` conducteur, `paul.r@example.com` ; la place `12 rue Barla, 06300 Nice`, `box 12`, au tarif de `15,00 €` la journée ; la période du `10/10/2026` au `12/10/2026`, soit trois jours à `45,00 €` ; horloge `Europe/Paris`. Sauf mention contraire, Léa fait sa demande le `01/10/2026 à 09:00` et son empreinte est constatée à `09:05`.

### RG-01 · le montant de l'empreinte est le prix que l'api a figé pour la demande, en euros et en centimes ; rien de ce que le conducteur envoie ne le modifie

#### EX-01 · le prix figé ouvre une empreinte de 45 €

Étant donné la place de `Marc D.` publiée à `15,00 €` la journée
Quand `Léa T.` demande la période du `10/10/2026` au `12/10/2026`
Alors une page de paiement est ouverte pour `4500` centimes, en `eur`, en empreinte sans prélèvement
Et elle porte l'identifiant de la demande de `Léa T.`

<!-- jp-way:ex {"id":"EX-01","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"fd03e3a6"} -->

#### EX-02 · un montant glissé dans la requête est ignoré

Quand `POST /rental-request` porte la période du `10/10/2026` au `12/10/2026` et un champ `priceInCents` à `1`
Alors la réponse est `201`
Et la page de paiement ouverte porte `4500` centimes

<!-- jp-way:ex {"id":"EX-02","regle":"RG-01","origine":"mapping","barreau":"int-http","empreinte":"0419d26f"} -->

#### EX-03 · une période qu'aucun tarif ne couvre n'ouvre aucun paiement

Étant donné la place de `Marc D.` publiée au seul tarif hebdomadaire
Quand `Léa T.` demande la période du `10/10/2026` au `12/10/2026`
Alors la demande est refusée avec `NoPriceForRequestedPeriodError`
Et aucune page de paiement n'est ouverte

<!-- jp-way:ex {"id":"EX-03","regle":"RG-01","origine":"mapping","barreau":"unit","empreinte":"f350c1c9"} -->

### RG-02 · tant que son empreinte n'est pas constatée, une demande attend son paiement : elle bloque ses dates, le loueur ne la voit pas et ne peut pas la confirmer, et sa page de paiement expire au bout de trente minutes

#### EX-04 · demander rend l'identifiant de la demande et l'adresse de la page de paiement

Quand `POST /rental-request` porte la période du `10/10/2026` au `12/10/2026` pour `Léa T.`
Alors la réponse est `201`
Et le corps porte l'identifiant de la demande et l'adresse de la page de paiement
Et la demande est en attente de paiement

<!-- jp-way:ex {"id":"EX-04","regle":"RG-02","origine":"mapping","barreau":"int-http","empreinte":"b724d69a"} -->

#### EX-05 · le loueur ne voit pas une demande en attente de paiement

Étant donné la demande de `Léa T.` en attente de paiement
Quand `Marc D.` liste les demandes reçues
Alors la liste est vide

<!-- jp-way:ex {"id":"EX-05","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"d16dc5ed"} -->

#### EX-06 · le loueur ne peut pas confirmer une demande en attente de paiement

Étant donné la demande de `Léa T.` en attente de paiement
Quand `Marc D.` la confirme
Alors la confirmation est refusée avec `RentalRequestNotFoundError`
Et rien n'est prélevé

<!-- jp-way:ex {"id":"EX-06","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"63799892"} -->

#### EX-07 · deux conducteurs ne peuvent pas payer les mêmes dates

Étant donné la demande de `Léa T.` en attente de paiement, du `10/10/2026` au `12/10/2026`
Quand la demande de `Paul R.` du `11/10/2026` au `13/10/2026` est écrite sur la même place
Alors l'écriture est refusée avec `DatesAlreadyRentedError`
Et la table des demandes ne porte que la demande de `Léa T.` sur cette place

<!-- jp-way:ex {"id":"EX-07","regle":"RG-02","origine":"mapping","barreau":"int-repo","empreinte":"9f71f794"} -->

#### EX-08 · la page de paiement vaut trente minutes

Quand `Léa T.` fait sa demande le `01/10/2026 à 09:00`
Alors la page de paiement ouverte expire le `01/10/2026 à 09:30`

<!-- jp-way:ex {"id":"EX-08","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"08857b44"} -->

#### EX-09 · Stripe indisponible : les dates ne restent pas bloquées

Étant donné Stripe qui ne répond pas
Quand `Léa T.` demande la période du `10/10/2026` au `12/10/2026`
Alors la demande est refusée avec `PaymentUnavailableError`
Et la demande est abandonnée
Et `Paul R.` peut demander la même période

<!-- jp-way:ex {"id":"EX-09","regle":"RG-02","origine":"mapping","barreau":"unit","empreinte":"bd89c335"} -->

### RG-03 · seul un événement signé de Stripe constate l'empreinte ; il fait passer la demande au loueur, et les 48 heures du loueur courent à partir de lui

#### EX-10 · l'empreinte constatée fait apparaître la demande au loueur

Étant donné la demande de `Léa T.` en attente de paiement
Quand Stripe annonce l'empreinte de `4500` centimes le `01/10/2026 à 09:05`
Alors la demande attend le loueur, avec une empreinte posée le `01/10/2026 à 09:05`
Et `Marc D.` la voit parmi ses demandes reçues

<!-- jp-way:ex {"id":"EX-10","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"3df86839"} -->

#### EX-11 · un événement mal signé ne change rien

Étant donné la demande de `Léa T.` en attente de paiement
Quand l'api reçoit une annonce d'empreinte pour cette demande, signée avec un autre secret que celui du webhook
Alors la réponse est `400`
Et la demande reste en attente de paiement

<!-- jp-way:ex {"id":"EX-11","regle":"RG-03","origine":"mapping","barreau":"int-http","empreinte":"120d0f1f"} -->

#### EX-12 · un même événement reçu deux fois ne compte qu'une fois

Étant donné l'empreinte de `Léa T.` constatée le `01/10/2026 à 09:05`
Quand Stripe renvoie la même annonce le `01/10/2026 à 09:40`
Alors aucune erreur n'est remontée
Et l'empreinte reste datée du `01/10/2026 à 09:05`

<!-- jp-way:ex {"id":"EX-12","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"af084591"} -->

#### EX-13 · un événement qui ne désigne aucune demande est accusé sans effet

Quand l'api reçoit une annonce d'empreinte bien signée, pour un paiement qu'aucune demande ne porte
Alors la réponse est `200`
Et aucune demande n'est modifiée

<!-- jp-way:ex {"id":"EX-13","regle":"RG-03","origine":"mapping","barreau":"int-http","empreinte":"3063ae25"} -->

#### EX-14 · les 48 heures courent depuis l'empreinte, pas depuis la demande

Étant donné la demande de `Léa T.` faite le `01/10/2026 à 09:00`, son empreinte constatée à `09:25`
Quand le balayage passe le `03/10/2026 à 09:10`
Alors la demande attend toujours le loueur
Et l'empreinte n'est pas levée

<!-- jp-way:ex {"id":"EX-14","regle":"RG-03","origine":"mapping","barreau":"unit","empreinte":"0919eaa3"} -->

### RG-04 · un paiement abandonné libère les dates sans rien réserver sur la carte ; une empreinte qui arrive malgré tout après l'abandon est levée ; un conducteur n'est jamais bloqué par sa propre demande impayée

#### EX-15 · la page de paiement expirée libère les dates

Étant donné la demande de `Léa T.` en attente de paiement
Quand Stripe annonce que sa page de paiement a expiré
Alors la demande est abandonnée
Et `Paul R.` peut demander la période du `10/10/2026` au `12/10/2026`

<!-- jp-way:ex {"id":"EX-15","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"972a25c0"} -->

#### EX-16 · revenir de Stripe sans payer libère aussitôt les dates

Étant donné la demande de `Léa T.` en attente de paiement
Quand `Léa T.` abandonne sa demande
Alors sa page de paiement est fermée chez Stripe
Et la demande est abandonnée

<!-- jp-way:ex {"id":"EX-16","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"297ad7b4"} -->

#### EX-17 · on n'abandonne pas la demande d'un autre

Étant donné la demande de `Léa T.` en attente de paiement
Quand `Paul R.` abandonne cette demande
Alors l'abandon est refusé avec `RentalRequestNotFoundError`
Et la demande reste en attente de paiement

<!-- jp-way:ex {"id":"EX-17","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"fe579ab3"} -->

#### EX-18 · sans nouvelles de Stripe, la demande est abandonnée au bout de deux heures

Étant donné la demande de `Léa T.` faite le `01/10/2026 à 09:00`, restée en attente de paiement sans aucun événement de Stripe
Quand le balayage passe le `01/10/2026 à 10:59`
Alors la demande reste en attente de paiement
Quand le balayage passe le `01/10/2026 à 11:00`
Alors la demande est abandonnée

<!-- jp-way:ex {"id":"EX-18","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"2dfe9692"} -->

#### EX-19 · une empreinte constatée après l'abandon est levée

Étant donné la demande de `Léa T.` abandonnée par le balayage le `01/10/2026 à 11:00`
Quand Stripe annonce l'empreinte de cette demande le `01/10/2026 à 11:03`
Alors l'empreinte de `4500` centimes est levée
Et la demande reste abandonnée

<!-- jp-way:ex {"id":"EX-19","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"d16c26bb"} -->

#### EX-20 · abandonner une demande dont l'empreinte est posée est refusé

Étant donné l'empreinte de `Léa T.` constatée le `01/10/2026 à 09:05`
Quand `Léa T.` abandonne sa demande à `09:06`
Alors l'abandon est refusé avec `RentalRequestAlreadyPaidError`
Et la demande attend toujours le loueur

<!-- jp-way:ex {"id":"EX-20","regle":"RG-04","origine":"mapping","barreau":"unit","empreinte":"382d1537"} -->

#### EX-50 · redemander la même place remplace sa propre demande impayée

Étant donné la demande de `Léa T.` en attente de paiement, du `10/10/2026` au `12/10/2026`, sa page de paiement laissée ouverte
Et sa demande en attente de paiement sur la même place du `20/10/2026` au `22/10/2026`
Quand elle redemande la même place du `11/10/2026` au `13/10/2026`, sous un autre identifiant d'intention
Alors sa demande du `10/10/2026` au `12/10/2026` est abandonnée et sa page de paiement fermée
Et sa demande du `20/10/2026` au `22/10/2026`, qui ne chevauche pas, attend toujours son paiement
Et la nouvelle demande attend son paiement

<!-- jp-way:ex {"id":"EX-50","regle":"RG-04","origine":"bug","barreau":"unit","empreinte":"a3645412"} -->

#### EX-51 · la demande impayée d'un autre conducteur n'est jamais abandonnée à sa place

Étant donné la demande de `Paul R.` en attente de paiement, du `10/10/2026` au `12/10/2026`
Quand `Léa T.` demande la même place du `11/10/2026` au `13/10/2026`
Alors la demande de `Léa T.` est refusée avec `DatesAlreadyRentedError`
Et la demande de `Paul R.` attend toujours son paiement

<!-- jp-way:ex {"id":"EX-51","regle":"RG-04","origine":"bug","barreau":"int-repo","empreinte":"5475d7a1"} -->

### RG-05 · le conducteur n'est prélevé qu'au moment où le loueur confirme ; si le prélèvement échoue, la confirmation échoue avec lui

#### EX-21 · confirmer prélève 45 €

Étant donné l'empreinte de `Léa T.` constatée le `01/10/2026 à 09:05`
Quand `Marc D.` confirme la demande le `02/10/2026 à 18:00`
Alors l'empreinte de `4500` centimes est prélevée
Et la demande est confirmée le `02/10/2026 à 18:00`

<!-- jp-way:ex {"id":"EX-21","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"1196fb76"} -->

#### EX-22 · confirmer deux fois ne prélève qu'une fois

Étant donné la demande de `Léa T.` confirmée et prélevée le `02/10/2026 à 18:00`
Quand `Marc D.` la confirme de nouveau à `18:01`
Alors aucune erreur n'est remontée
Et un seul prélèvement a été demandé à Stripe

<!-- jp-way:ex {"id":"EX-22","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"3af213fa"} -->

#### EX-23 · Stripe indisponible : la confirmation échoue et rien ne change

Étant donné l'empreinte de `Léa T.` constatée, et Stripe qui ne répond pas
Quand `Marc D.` confirme la demande
Alors la confirmation est refusée avec `PaymentUnavailableError`
Et la demande attend toujours le loueur, son empreinte posée

<!-- jp-way:ex {"id":"EX-23","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"74499889"} -->

#### EX-24 · une empreinte que la banque refuse de prélever fait échouer la confirmation et libère les dates

Étant donné l'empreinte de `Léa T.` constatée, et sa banque qui refuse le prélèvement
Quand `Marc D.` confirme la demande
Alors la confirmation est refusée avec `RentalRequestPaymentFailedError`
Et la demande est marquée paiement refusé
Et `Paul R.` peut demander la période du `10/10/2026` au `12/10/2026`

<!-- jp-way:ex {"id":"EX-24","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"bba70aa5"} -->

#### EX-25 · un prélèvement que la base n'a pas enregistré vaut confirmation

Étant donné l'empreinte de `Léa T.` prélevée chez Stripe le `02/10/2026 à 18:00`, sans que la demande ait été enregistrée confirmée
Quand le balayage tente de lever l'empreinte le `03/10/2026 à 09:05`
Alors Stripe répond que le paiement est déjà prélevé
Et la demande est enregistrée confirmée
Et rien n'est remboursé

<!-- jp-way:ex {"id":"EX-25","regle":"RG-05","origine":"mapping","barreau":"unit","empreinte":"f95ef40e"} -->

### RG-06 · une demande que le loueur n'a pas confirmée 48 heures après l'empreinte expire, et son empreinte est levée : rien n'est prélevé

#### EX-26 · 48 heures après l'empreinte, la demande expire et l'empreinte est levée

Étant donné l'empreinte de `Léa T.` constatée le `01/10/2026 à 09:05`
Quand le balayage passe le `03/10/2026 à 09:05`
Alors la demande est expirée
Et l'empreinte de `4500` centimes est levée
Et rien n'est prélevé

<!-- jp-way:ex {"id":"EX-26","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"2adf9028"} -->

#### EX-27 · une minute avant, rien ne bouge

Étant donné l'empreinte de `Léa T.` constatée le `01/10/2026 à 09:05`
Quand le balayage passe le `03/10/2026 à 09:04`
Alors la demande attend toujours le loueur
Et l'empreinte n'est pas levée

<!-- jp-way:ex {"id":"EX-27","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"eb4d3521"} -->

#### EX-28 · une demande confirmée n'expire jamais

Étant donné la demande de `Léa T.` confirmée et prélevée le `02/10/2026 à 18:00`
Quand le balayage passe le `05/10/2026 à 09:05`
Alors la demande est toujours confirmée
Et rien n'est levé ni remboursé

<!-- jp-way:ex {"id":"EX-28","regle":"RG-06","origine":"mapping","barreau":"unit","empreinte":"a9ca313c"} -->

#### EX-29 · l'expiration n'attend pas qu'une autre demande arrive

Étant donné l'api démarrée, et une demande dont l'empreinte a été constatée plus de 48 heures auparavant
Et aucune autre demande faite sur aucune place
Quand le balayage périodique passe
Alors la demande est expirée et son empreinte levée

<!-- jp-way:ex {"id":"EX-29","regle":"RG-06","origine":"mapping","barreau":"journey","empreinte":"0b6bd5c8"} -->

### RG-07 · une annulation par l'exploitant rend au conducteur tout son argent : l'empreinte est levée si la demande attendait le loueur, le prélèvement remboursé en totalité si elle était confirmée ; une demande faite avant l'encaissement n'a rien à rendre

#### EX-30 · annuler une demande confirmée rembourse 45 €

Étant donné la demande de `Léa T.` confirmée et prélevée de `4500` centimes
Quand l'exploitant l'annule avec le motif « place inaccessible »
Alors la demande est annulée
Et `4500` centimes sont remboursés à `Léa T.`

<!-- jp-way:ex {"id":"EX-30","regle":"RG-07","origine":"mapping","barreau":"unit","empreinte":"57bb7901"} -->

#### EX-31 · annuler une demande qui attend le loueur lève l'empreinte

Étant donné l'empreinte de `Léa T.` constatée, la demande attendant le loueur
Quand l'exploitant l'annule avec le motif « annonce frauduleuse »
Alors la demande est annulée
Et l'empreinte de `4500` centimes est levée
Et rien n'est remboursé

<!-- jp-way:ex {"id":"EX-31","regle":"RG-07","origine":"mapping","barreau":"unit","empreinte":"751bcdf9"} -->

#### EX-32 · une demande faite avant l'encaissement s'annule sans rien rendre

Étant donné une demande de `Léa T.` confirmée avant la mise en service de l'encaissement, sans aucun paiement
Quand l'exploitant l'annule
Alors la demande est annulée
Et aucune opération n'est demandée à Stripe

<!-- jp-way:ex {"id":"EX-32","regle":"RG-07","origine":"mapping","barreau":"unit","empreinte":"cc889a7e"} -->

#### EX-41 · une annulation sur un prélèvement que la base ignorait rembourse, et ne confirme rien

Étant donné l'empreinte de `Léa T.` prélevée chez Stripe, sans que la demande ait été enregistrée confirmée
Et l'exploitant qui annule la demande, la croyant en attente du loueur
Quand le balayage tente de lever l'empreinte
Alors Stripe répond que le paiement est déjà prélevé
Et `4500` centimes sont remboursés à `Léa T.`
Et la demande reste annulée

<!-- jp-way:ex {"id":"EX-41","regle":"RG-07","origine":"construction","barreau":"unit","empreinte":"7cb1d6df"} -->

### RG-08 · rendre l'argent se demande une seule fois par demande, se redemande tant que Stripe ne l'a pas accepté, et ne se fait jamais en double

#### EX-33 · Stripe indisponible : la levée reste due et repart au balayage suivant

Étant donné la demande de `Léa T.` expirée le `03/10/2026 à 09:05`, et Stripe qui ne répond pas
Quand la levée de l'empreinte est tentée
Alors la demande reste expirée, sa levée due
Quand le balayage suivant passe, Stripe répondant de nouveau
Alors l'empreinte est levée

<!-- jp-way:ex {"id":"EX-33","regle":"RG-08","origine":"mapping","barreau":"unit","empreinte":"c6ed9321"} -->

#### EX-34 · deux tentatives portent la même clé d'idempotence

Étant donné la demande de `Léa T.` expirée, dont une première levée n'a pas reçu de réponse
Quand la levée est tentée une seconde fois
Alors les deux tentatives portent la même clé d'idempotence, propre à cette demande

<!-- jp-way:ex {"id":"EX-34","regle":"RG-08","origine":"mapping","barreau":"unit","empreinte":"009abef6"} -->

#### EX-35 · l'état de la demande et la dette envers le conducteur s'écrivent ensemble

Étant donné la demande de `Léa T.` attendant le loueur, son empreinte posée
Quand son expiration est écrite
Alors la même ligne porte à la fois le statut expiré et une levée due
Et aucune lecture ne peut trouver l'un sans l'autre

<!-- jp-way:ex {"id":"EX-35","regle":"RG-08","origine":"mapping","barreau":"int-repo","empreinte":"4149a4f3"} -->

#### EX-36 · un argent rendu ne se rend jamais deux fois

Étant donné la demande de `Léa T.` annulée, ses `4500` centimes remboursés
Quand le balayage passe
Alors aucune opération n'est demandée à Stripe pour cette demande

<!-- jp-way:ex {"id":"EX-36","regle":"RG-08","origine":"mapping","barreau":"unit","empreinte":"1e7aa0b6"} -->

### RG-09 · le conducteur lit, sur chacune de ses demandes, où en est son argent

#### EX-37 · chaque état de l'argent a son libellé

Étant donné les demandes de `Léa T.` à `4500` centimes
Quand elle les liste
Alors une demande en attente de paiement se lit « Paiement en cours de vérification »
Et une demande qui attend le loueur se lit « Empreinte de 45,00 € · en attente du loueur »
Et une demande confirmée se lit « Confirmée · 45,00 € prélevés »
Et une demande expirée dont l'empreinte est levée se lit « Expirée · rien n'a été prélevé »
Et une demande annulée remboursée se lit « Annulée · 45,00 € remboursés »
Et une demande dont l'argent est dû se lit « Annulée · remboursement en cours » ou « Expirée · empreinte en cours de levée »
Et une demande abandonnée se lit « Paiement abandonné »
Et une demande dont le prélèvement a été refusé se lit « Paiement refusé par la banque »

<!-- jp-way:ex {"id":"EX-37","regle":"RG-09","origine":"mapping","barreau":"unit","empreinte":"088d53d9"} -->

#### EX-38 · demander conduit à la page de paiement Stripe, au bon montant

Étant donné `Léa T.` connectée, sur la fiche de la place de `Marc D.`
Quand elle choisit la période du `10/10/2026` au `12/10/2026` et continue vers le paiement
Alors son navigateur arrive sur la page de paiement de Stripe
Et cette page affiche `45,00 €`

<!-- jp-way:ex {"id":"EX-38","regle":"RG-09","origine":"mapping","barreau":"e2e","empreinte":"ea290957"} -->

#### EX-39 · revenir de Stripe sans payer libère les dates

Étant donné `Léa T.` sur la page de paiement de Stripe pour la période du `10/10/2026` au `12/10/2026`
Quand elle revient sur bookparking sans payer
Alors la fiche dit que rien n'a été réservé sur sa carte
Et elle peut redemander la même période

<!-- jp-way:ex {"id":"EX-39","regle":"RG-09","origine":"mapping","barreau":"e2e","empreinte":"bfea5102"} -->

#### EX-40 · une fois l'empreinte posée, le conducteur est rassuré et le loueur voit la demande

Étant donné `Léa T.` sur la page de paiement de Stripe pour la période du `10/10/2026` au `12/10/2026`
Quand elle paie avec la carte de test `4242 4242 4242 4242`
Alors elle revient sur bookparking, qui affiche « Empreinte de 45,00 € · en attente du loueur »
Et `Marc D.` voit la demande de `Léa T.` sur son tableau de bord

<!-- jp-way:ex {"id":"EX-40","regle":"RG-09","origine":"mapping","barreau":"e2e","empreinte":"97903df4"} -->

### RG-10 · une même intention de demande, envoyée plusieurs fois, ne crée qu'une demande et n'ouvre qu'une page de paiement ; l'identifiant d'intention appartient au compte qui l'envoie

Valeurs de cette règle : l'identifiant d'intention `K1` ; la seconde place `3 avenue Malausséna, 06000 Nice`, `box 4`, au tarif de `15,00 €` la journée.

#### EX-42 · la même intention envoyée deux fois rend la même demande

Étant donné `Léa T.` qui a demandé la période du `10/10/2026` au `12/10/2026` sous l'identifiant `K1`
Quand elle renvoie la même demande sous `K1`
Alors une seule demande est enregistrée
Et une seule page de paiement est ouverte
Et les deux réponses portent la même demande et la même adresse de paiement

<!-- jp-way:ex {"id":"EX-42","regle":"RG-10","origine":"demande","barreau":"unit","empreinte":"445f6b0f"} -->

#### EX-43 · un identifiant réutilisé pour une autre période ou une autre place est refusé

Étant donné la demande de `Léa T.` sur la place `12 rue Barla`, `box 12`, du `10/10/2026` au `12/10/2026`, sous `K1`
Quand elle demande la période du `20/10/2026` au `22/10/2026` sous `K1`
Alors la demande est refusée avec `IdempotencyKeyReusedError`
Quand elle demande la place `3 avenue Malausséna`, `box 4`, du `10/10/2026` au `12/10/2026`, sous `K1`
Alors la demande est refusée avec `IdempotencyKeyReusedError`
Et aucune nouvelle demande n'est enregistrée

<!-- jp-way:ex {"id":"EX-43","regle":"RG-10","origine":"demande","barreau":"unit","empreinte":"8995bb61"} -->

#### EX-44 · l'identifiant d'un autre compte ne rend jamais sa demande

Étant donné la demande de `Léa T.` sur la place `12 rue Barla`, `box 12`, sous `K1`
Quand `Paul R.` demande la place `3 avenue Malausséna`, `box 4`, sous `K1`
Alors une nouvelle demande est enregistrée pour `Paul R.`
Et la réponse ne porte ni la demande ni la page de paiement de `Léa T.`

<!-- jp-way:ex {"id":"EX-44","regle":"RG-10","origine":"demande","barreau":"unit","empreinte":"7107f523"} -->

#### EX-45 · une tentative que Stripe n'a pas pu ouvrir ne consomme pas l'identifiant

Étant donné Stripe qui ne répond pas, et `Léa T.` dont la demande sous `K1` est refusée avec `PaymentUnavailableError`
Quand Stripe répond de nouveau et qu'elle renvoie la même demande sous `K1`
Alors une page de paiement est ouverte
Et la nouvelle demande attend son paiement

<!-- jp-way:ex {"id":"EX-45","regle":"RG-10","origine":"demande","barreau":"unit","empreinte":"91aab2d5"} -->

#### EX-46 · deux écritures simultanées sous le même identifiant laissent une seule ligne

Étant donné le même compte et le même identifiant `K1`
Quand deux demandes sous `K1` sont écrites en même temps
Alors la table des demandes ne porte qu'une ligne sous `K1` pour ce compte

<!-- jp-way:ex {"id":"EX-46","regle":"RG-10","origine":"demande","barreau":"int-repo","empreinte":"29b72289"} -->

#### EX-47 · une demande sans identifiant d'intention est refusée

Quand `POST /rental-request` arrive sans en-tête `Idempotency-Key`, ou avec un en-tête qui n'est pas un UUID
Alors la réponse est `400`
Et aucune demande n'est tentée

<!-- jp-way:ex {"id":"EX-47","regle":"RG-10","origine":"demande","barreau":"int-http","empreinte":"81f29067"} -->

#### EX-48 · l'identifiant suit l'intention, pas le clic

Étant donné `Léa T.` sur la fiche de la place, la période du `10/10/2026` au `12/10/2026` choisie
Quand elle clique deux fois sur « Continuer vers le paiement »
Alors les deux envois portent le même identifiant
Quand elle choisit ensuite la période du `20/10/2026` au `22/10/2026`
Alors l'envoi suivant porte un autre identifiant

<!-- jp-way:ex {"id":"EX-48","regle":"RG-10","origine":"demande","barreau":"unit","empreinte":"e483649f"} -->

#### EX-49 · un double clic ne laisse qu'une demande

Étant donné `Léa T.` connectée, sur la fiche de la place de `Marc D.`, la période du `10/10/2026` au `12/10/2026` choisie
Quand elle double-clique sur « Continuer vers le paiement »
Alors son navigateur arrive sur la page de paiement de Stripe
Et elle n'a qu'une demande

<!-- jp-way:ex {"id":"EX-49","regle":"RG-10","origine":"demande","barreau":"e2e","empreinte":"97148f5e"} -->

## 5. Sonde de couverture

Dix règles croisées avec les dix dimensions : 100 intersections, toutes résolues — 40 cases portées par un exemple, 13 par un filet structurel, 37 écartées avec leur raison.

| Règle | Limites | Vide | Temps | Concurrence | Autorisation | État | Argent | Volume | Panne | Données |
|---|---|---|---|---|---|---|---|---|---|---|
| RG-01 | EX-03 | écarté¹ | écarté² | écarté³ | filet⁴ | écarté⁵ | EX-01 | écarté⁶ | EX-09 | EX-02 |
| RG-02 | EX-08 | EX-05 | EX-08 | EX-07 | EX-06 | EX-04 | écarté⁷ | écarté⁶ | EX-09 | filet⁸ |
| RG-03 | écarté⁹ | EX-13 | EX-14 | EX-12 | EX-11 | EX-10 | filet¹⁰ | écarté⁶ | filet¹¹ | EX-11 |
| RG-04 | EX-18 | écarté¹² | EX-18 | EX-19 EX-20 | EX-17 | EX-15 EX-16 | EX-19 | écarté⁶ | EX-18 | écarté¹³ |
| RG-05 | écarté⁹ | écarté¹² | écarté¹⁴ | EX-22 | filet¹⁵ | EX-21 | EX-21 | écarté⁶ | EX-23 EX-24 EX-25 | écarté¹³ |
| RG-06 | EX-26 EX-27 | écarté¹² | EX-26 EX-29 | filet¹⁶ | écarté¹⁷ | EX-28 | EX-26 | filet¹⁸ | filet¹⁹ | écarté¹³ |
| RG-07 | écarté⁹ | EX-32 | écarté² | filet²⁰ | filet²¹ | EX-30 EX-31 EX-41 | EX-30 EX-31 EX-41 | écarté⁶ | filet¹⁹ | écarté¹³ |
| RG-08 | écarté⁹ | écarté¹² | écarté² | EX-34 | écarté¹⁷ | EX-36 | EX-36 | filet¹⁸ | EX-33 EX-35 | écarté¹³ |
| RG-09 | écarté⁹ | filet²² | écarté² | écarté³ | filet²³ | EX-37 | EX-38 | écarté⁶ | EX-39 | EX-40 |
| RG-10 | écarté⁹ | EX-47 | écarté² | EX-46 EX-49 | EX-44 | EX-42 EX-48 | EX-42 | écarté⁶ | EX-45 | EX-43 |

¹ une demande sans période est refusée par le schéma de la requête avant toute ouverture de paiement, comportement de SPEC-001 que cette spec ne change pas.
² la règle ne lit aucune heure : ce sont RG-02, RG-03, RG-04 et RG-06 qui portent les délais.
³ chaque demande ouvre sa propre page de paiement ; deux demandes simultanées ne partagent rien avant l'écriture, que tranche la contrainte d'exclusion (EX-07).
⁴ l'identité du conducteur vient du jeton, jamais du corps de la requête (SPEC-002 RG-02, `apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.ts:81-82`).
⁵ le montant ne dépend d'aucun état de la demande : il est figé à sa création.
⁶ la règle porte sur une demande à la fois.
⁷ aucun argent ne bouge tant que la demande attend son paiement : c'est ce que la règle affirme.
⁸ l'adresse de la page de paiement est construite par l'api à partir de `FRONT_BASE_URL`, jamais d'un en-tête de la requête — contrainte non fonctionnelle `## 8`.
⁹ la règle ne porte aucune borne numérique propre.
¹⁰ l'api ne relit pas le montant annoncé par Stripe : elle a fixé celui de la page de paiement (RG-01), et Stripe n'autorise pas un autre montant sur cette page.
¹¹ Stripe renvoie un événement non accusé pendant trois jours ; le balayage d'abandon (EX-18) et la levée tardive (EX-19) couvrent un événement qui n'arrive jamais ou arrive trop tard.
¹² aucune donnée optionnelle n'entre dans ce chemin.
¹³ la règle n'introduit aucune saisie libre.
¹⁴ confirmer après l'expiration est déjà refusé par `RentalRequestExpiredError` (`apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.ts:52-53`), et la levée suit son cours (RG-06).
¹⁵ seul le propriétaire de l'annonce confirme ; une autre personne reçoit `RentalRequestNotFoundError` (`apps/api/src/rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest.ts:41-45`).
¹⁶ le balayage ne choisit que des lignes dont la levée est due, et chaque levée porte sa clé d'idempotence (EX-34) : deux balayages simultanés rendent un seul résultat chez Stripe.
¹⁷ le balayage n'agit pour le compte de personne.
¹⁸ le balayage traite toutes les lignes dues, par lots ; aucune borne produit n'est fixée — contrainte non fonctionnelle `## 8`.
¹⁹ l'échec de Stripe à rendre l'argent est porté par RG-08 (EX-33).
²⁰ l'annulation ne s'applique qu'à une demande en attente du loueur ou confirmée, et une seconde annulation ne trouve plus rien à annuler (`apps/api/src/back-office/adapters/repositories/back-office/KnexBackOfficeRepository.ts:274-287`).
²¹ seul un compte administrateur annule, sous `AdminGuard`, avec un motif journalisé.
²² un conducteur sans demande voit l'état vide existant de « Mes demandes ».
²³ `GET /rental-request` ne rend que les demandes du compte connecté (`apps/api/src/rental/adapters/rest/controllers/rental-request/rental-request.controller.ts:38-39`).

## 6. Écrans

Aucune maquette n'est produite (`ux: absent`). Les noms accessibles ci-dessous sont un contrat : les page objects de l'e2e les sélectionnent caractère pour caractère.

- **Fiche d'une place, carte de réservation.** Le bouton « Demander la réservation » devient « Continuer vers le paiement ». Sous l'estimation, une phrase remplace l'aide actuelle : « Ce montant est réservé sur votre carte, et prélevé seulement si le propriétaire confirme. » Au clic, le navigateur part vers la page de paiement de Stripe.
- **Retour sans paiement.** Stripe renvoie sur la fiche avec l'identifiant de la demande ; le front abandonne cette demande (RG-04) puis affiche une notice : « Paiement abandonné : rien n'a été réservé sur votre carte. »
- **Retour après paiement — `/demande/:id/paiement`.** Écran nouveau, réservé au conducteur de la demande. Tant que l'empreinte n'est pas constatée (l'événement Stripe peut arriver après le navigateur) : « Paiement en cours de vérification », la page relit la demande toutes les deux secondes pendant une minute au plus. Ensuite : le titre « Demande envoyée », le libellé de RG-09, et la phrase « Le propriétaire a 48 heures pour confirmer. Sans réponse, l'empreinte est levée et rien n'est prélevé. »
- **Mes demandes (tableau de bord, onglet conducteur).** Chaque ligne porte le libellé de RG-09.
- **Administration, modale d'annulation d'une demande.** Le texte « aucun remboursement n'est émis » disparaît ; il devient « Le conducteur récupère tout son argent : l'empreinte est levée, ou le paiement remboursé s'il a été prélevé. »

## 7. Questions

#### Q-01 · comment « bloquer » l'argent du conducteur entre sa demande et la confirmation du loueur ?

Statut : résolue — tranché par JP le 23/09/2026 : empreinte bancaire, prélevée à la confirmation.
Conséquence appliquée : D-24 est tenu dans son intention (l'argent est bloqué, jamais versé avant la confirmation) sans son mot « débité ». Une demande ignorée ne coûte aucun frais à l'exploitant ; le remboursement n'existe qu'après une confirmation (RG-07). La contrepartie — une empreinte peut être refusée au prélèvement — est portée par EX-24.

#### Q-02 · faut-il reverser les loueurs dans ce lot ?

Statut : résolue — tranché par JP le 23/09/2026 : non, ce lot s'arrête à l'encaissement et au retour de l'argent.
Conséquence appliquée : le reversement, la vérification d'identité et la commission sortent en `## 10`. Le risque réglementaire qui en découle est porté en `## 11`, en gravité forte.

## 8. Contraintes non fonctionnelles

- **Aucune donnée de carte chez bookparking.** La carte est saisie sur Stripe Checkout, sur le domaine de Stripe. L'api ne stocke que des identifiants Stripe : la page de paiement, le paiement, le remboursement. Aucun script de Stripe n'est chargé sur le domaine de bookparking : le bandeau de consentement (`apps/front/CLAUDE.md`, « Le consentement ») ne gagne aucune finalité.
- **Secrets.** `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` sont exigées au démarrage de l'api, sans valeur de repli, comme `ACCESS_TOKEN_SECRET` (`apps/api/src/infra/config/environment.ts`). Elles ne sont jamais journalisées ni renvoyées. Les clés de test (`sk_test_…`) seules sont admises tant que la contrainte « Mise en production » ci-dessous n'est pas levée.
- **Adresses de retour.** Les adresses de retour de la page de paiement sont construites à partir de `FRONT_BASE_URL`, exigée au démarrage, jamais d'un en-tête de la requête : sans quoi un en-tête `Host` forgé ferait de la page de paiement une redirection ouverte. Le front ne suit qu'une adresse de paiement qui commence par `https://checkout.stripe.com/`.
- **Webhook.** La route qui reçoit les événements de Stripe n'a pas de garde de jeton : elle vérifie la signature sur le corps **brut** de la requête, ce qui impose à l'api de conserver ce corps avant tout décodage JSON. Elle répond `200` à tout événement bien signé, même sans effet, pour que Stripe cesse de le renvoyer.
- **Idempotence.** Toute opération Stripe qui engage de l'argent — ouvrir une page de paiement, prélever, lever, rembourser — porte une clé d'idempotence dérivée de l'identifiant de la demande et de l'opération. Rejouée, elle rend le résultat de la première.
- **Balayage.** Un balayage passe toutes les cinq minutes dans le processus de l'api. Un argent dû est donc rendu au plus cinq minutes après l'échéance, et la levée d'une empreinte peut demander quelques jours de plus à la banque du conducteur pour apparaître sur son compte. Il n'y a qu'un processus d'api : le balayage n'a pas à se coordonner avec un autre.
- **Montants.** Entiers, en centimes d'euro, jamais en virgule flottante. La devise est `eur`, écrite par l'api.
- **Moyens de paiement.** La carte seule. Un moyen de paiement différé (virement, prélèvement SEPA) ne pose pas d'empreinte, et romprait RG-03.
- **Conformité RGPD.** Stripe devient sous-traitant de données financières (`quality.compliance.dataClasses: financial`). L'adresse e-mail du conducteur n'est pas transmise à Stripe par l'api : c'est la page de paiement qui la demande au conducteur. La durée de conservation des identifiants Stripe suit celle de la demande (SPEC-001, « Rétention des demandes »).
- **Mise en production.** Aucune clé de production (`sk_live_…`) ne doit être posée avant la spec du reversement : sans Stripe Connect, l'exploitant encaisserait sur son propre compte de l'argent dû à des tiers (`## 11`).
- **Langue.** Tout ce qu'un loueur ou un conducteur lit est en français ; la page de paiement de Stripe est ouverte en français.

## 9. Impacts par app

| App | Ce qui bouge | Ce qui ne bouge pas |
|---|---|---|
| api | une migration de `rental_requests` : deux statuts (`AWAITING_PAYMENT`, `ABANDONED`, plus `PAYMENT_FAILED`), les colonnes de paiement (identifiants Stripe, instant de l'empreinte, état de l'argent, identifiant du remboursement), la contrainte d'exclusion qui ignore désormais `ABANDONED` et `PAYMENT_FAILED` comme elle ignore `EXPIRED` et `CANCELLED` ; un port `PaymentGateway`, son adaptateur Stripe et son double `InMemory` ; `RequestRental`, qui ouvre la page de paiement et rend l'identifiant de la demande (`POST /rental-request` passe de `201` sans corps à `201` avec corps) ; `ConfirmRentalRequest`, qui prélève ; `CancelRentalRequest` du back-office, qui rend l'argent ; trois cas d'usage neufs (constater un événement Stripe, abandonner sa demande, balayer) ; la route du webhook et le corps brut ; les trois variables d'environnement ; le contrat OpenAPI de `docs/api/openapi.json`, dont le front tire ses types. | la grille tarifaire et le calcul du prix, la publication d'une annonce, la garde de jeton, l'expiration à 48 heures dans son principe. |
| front | la carte de réservation de la fiche, l'écran `/demande/:id/paiement`, la notice d'abandon, les libellés de « Mes demandes », le texte de la modale d'annulation de l'administration, les types régénérés depuis le contrat. | le bandeau de consentement, la recherche, la carte, la publication. |
| e2e | le parcours `request-a-rental`, qui s'arrête aujourd'hui à « Demande envoyée » ; le tableau de bord du loueur, dont les demandes amorcées par `POST /rental-request` resteront en attente de paiement, donc invisibles, tant qu'aucune empreinte n'est posée. Amorcer une demande payée passe par une vraie page de paiement de Stripe en mode test, et par `stripe listen` pour acheminer ses événements jusqu'à l'api locale. | les parcours de consentement, de carte, de recherche et de publication. |

Les demandes déjà en base ont été faites avant l'encaissement : elles n'ont aucun paiement, et leur état de l'argent vaut « aucun ». Leur délai de 48 heures continue de courir depuis leur création. Rien ne leur est jamais rendu, puisque rien n'a été pris (EX-32).

## 10. Hors sujet

- **Le reversement au loueur, la vérification de son identité et la commission** — Stripe Connect, dans une spec ultérieure, par décision de JP du 23/09/2026 (Q-02).
- **L'annulation par le conducteur et son délai** (D-12) — aucune route n'existe ; le délai d'annulation est un réglage de back-office qui n'existe pas non plus.
- **L'annulation par le loueur d'une location confirmée** (D-23 côté loueur) — aucune route ; RG-07 couvre l'exploitant seul.
- **La confirmation d'arrivée, le délai de libération, les réclamations** (D-17, D-20, D-22) — n'ont de sens qu'avec le reversement.
- **Les factures et reçus** — Stripe envoie son propre reçu ; bookparking n'en émet aucun.
- **Les remboursements partiels, les autres devises, les autres moyens de paiement.**

## 11. Risques

- **Encaisser pour le compte de tiers sans cadre réglementaire.** Sans Stripe Connect, l'argent prélevé à la confirmation arrive sur le compte de l'exploitant alors qu'il revient au loueur. Encaisser des fonds pour le compte de tiers est une activité réglementée. · Signal précoce : la première clé `sk_live_…` posée. · Parade : mode test seulement jusqu'à la spec du reversement (`## 8`). · Gravité : forte.
- **Une empreinte peut être refusée au prélèvement** (fonds retirés, carte opposée). Le loueur qui confirme apprend alors que la location n'aura pas lieu (EX-24). · Signal précoce : la part de confirmations refusées. · Parade : aucune dans ce lot ; le conducteur peut redemander. · Gravité : moyenne.
- **La validité d'une empreinte est limitée par les réseaux de cartes** — plusieurs jours, sept pour la plupart des cartes. Les 48 heures du loueur y tiennent ; un délai d'expiration allongé au-delà ne tiendrait plus. · Signal précoce : `RENTAL_REQUEST_EXPIRY_IN_HOURS` porté au-delà de 96. · Parade : le signaler dans `apps/api/CLAUDE.md`. · Gravité : moyenne.
- **Un remboursement coûte les frais du paiement initial**, que Stripe ne rend pas. Il n'arrive qu'après une confirmation (RG-07). · Signal précoce : le nombre d'annulations par l'exploitant. · Parade : l'empreinte, qui a déjà supprimé ce coût pour les demandes ignorées. · Gravité : faible.
- **Le balayage vit dans le processus de l'api.** Une api arrêtée ne rend plus l'argent dû ; il est rendu au redémarrage. · Signal précoce : des levées dues plus anciennes que dix minutes. · Parade : aucune dans ce lot. · Gravité : moyenne.
- **L'e2e dépend désormais de Stripe en mode test et de la CLI Stripe** pour tout parcours qui a besoin d'une demande payée. · Signal précoce : des parcours rouges quand la CLI manque. · Parade : les exemples qui n'ont pas besoin d'un événement (EX-38, EX-39) n'en dépendent pas. · Gravité : moyenne.

## 12. Journal des révisions

| Révision | Date | Ce qui a changé |
|---|---|---|
| 1 | 23/09/2026 | Création, à partir des décisions D-10, D-23 et D-24 du brainstorm du 10/09 et de trois décisions de JP du jour : Stripe Checkout, empreinte bancaire, reversement hors de ce lot. Neuf règles, quarante exemples. Validée par JP le 23/09/2026, sans correction. |
| 2 | 23/09/2026 | EX-41 ajouté sous RG-07, `origine: construction`. En écrivant le règlement de l'argent dû, un cas est apparu que la spec ne tranchait pas : une empreinte prélevée chez Stripe sans que la base le sache — le loueur a confirmé, l'écriture a échoué — puis annulée par l'exploitant. Lever l'empreinte échoue alors sur « déjà prélevé », et EX-25 relirait la demande comme confirmée ; or l'exploitant l'a annulée. Seule une demande *expirée* sur ce malentendu est relue confirmée ; toute autre est remboursée. La sonde gagne EX-41 dans les cases `RG-07 × État` et `RG-07 × Argent`. À relire par JP. |
| 3 | 23/09/2026 | RG-10 ajoutée, `origine: demande`, sur demande de JP : « il faut que tu mettes en place l'idempotence, pour pas que des actions se répètent, par exemple en mettant un id dans le bouton ». Constat déclencheur : trois clics sur « Continuer vers le paiement », contre une api restée sur le code d'avant SPEC-004, ont laissé trois demandes sans paiement. Le front attache désormais un identifiant d'intention à chaque demande, et l'api rend la demande déjà créée sous cet identifiant. Huit exemples, EX-42 à EX-49. Les autres actions ne changent pas : elles sont déjà idempotentes par leur état, et le §2 le dit. |
| 4 | 23/09/2026 | EX-50 et EX-51 ajoutés sous RG-04, `origine: bug`, et RG-04 complétée : un conducteur n'est jamais bloqué par sa propre demande impayée. Constaté par JP en s'en servant : « Ces dates sont déjà louées » sur des dates qu'il avait lui-même demandées sans payer. Le cas immédiat venait de trois demandes créées par une api périmée ; mais le même blocage survient avec le code de SPEC-004 dès que le conducteur quitte la page de Stripe autrement que par son lien de retour, puis redemande. Redemander la même place abandonne désormais sa propre demande impayée qui chevauche, et jamais celle d'un autre (EX-51). |

