# Requêtes HTTP — Bookparking

Fichiers `.http`, lisibles par deux outils :

| Outil | Comment |
|---|---|
| **IntelliJ / WebStorm** | HTTP Client intégré (Ultimate). En Community, installer le plugin *HTTP Client*. Choisir l'environnement `local` en haut à droite du fichier. |
| **VS Code** | Extension **REST Client** (`humao.rest-client`), de Huachao Mao. Un lien `Send Request` apparaît au-dessus de chaque requête. |

## Avant de lancer

Depuis la racine du dépôt, sur la base de développement `bookparking-dev-db` (port 55440) :

```bash
docker start bookparking-dev-db
export DATABASE_URL='postgres://bookparking:bookparking@localhost:55440/bookparking'
pnpm --filter bookparking-api build && pnpm --filter bookparking-api migrate

set -a && . ./.env.stripe.local && set +a
STRIPE_WEBHOOK_SECRET="$(STRIPE_API_KEY="$STRIPE_SECRET_KEY" stripe listen --print-secret)"
export STRIPE_WEBHOOK_SECRET
ACCESS_TOKEN_SECRET='secret-de-dev-local-uniquement-32chars' \
FRONT_BASE_URL=http://localhost:5173 PORT=3000 \
pnpm --filter bookparking-api start
```

`start` lit le `.env` de la racine (`RESEND_API_KEY`, `MAIL_FROM`) ; sans lui, poser
`EMAIL_SENDING=disabled`. Pour qu'une demande payée passe `PENDING`, relayer les événements de
Stripe dans un second terminal :

```bash
STRIPE_API_KEY="$STRIPE_SECRET_KEY" stripe listen \
  --events payment_intent.amount_capturable_updated,checkout.session.expired \
  --forward-to localhost:3000/payment/stripe-webhook
```

## Quel fichier ouvrir

- `parcours.intellij.http` — le parcours complet, de l'inscription à l'annulation (IntelliJ).
  Ses scripts résolvent le défi anti-robot et capturent jeton, annonce et demandes : rien à copier.
- `parcours.vscode.http` — le même, syntaxe REST Client (VS Code).
- `refus.http` — les refus attendus : 400, 401, 404, 409. **Identique dans les deux outils.**
- `human-proof.mjs` — résout le défi anti-robot, pour les deux fichiers qui ne savent pas le faire.

Chaque requête porte en commentaire le code attendu et, quand il y en a un, l'exemple de la spec
qu'elle exerce.

### La preuve anti-robot

`POST /account` exige une preuve de travail tirée de `GET /account/human-challenge` (SPEC-007) :
trouver le nombre dont le SHA-256 redonne le défi. REST Client ne sait pas la calculer, d'où
l'utilitaire, qui rend une ligne `@nom = {…}` par nom demandé :

```bash
node apps/api/http/human-proof.mjs                      # une preuve, pour parcours.vscode.http
node apps/api/http/human-proof.mjs preuveA preuveB      # une par nom, pour refus.http
BASE_URL=http://localhost:3100 node apps/api/http/human-proof.mjs
```

Coller chaque ligne à la place de la ligne `@…` du même nom en tête du fichier. Une preuve ne sert
qu'une fois et vaut 20 minutes. L'api garde en mémoire les preuves déjà servies : un redémarrage
les oublie.

### Les adresses

Les inscriptions visent `delivered+…@resend.dev`, adresses de test de Resend : l'e-mail de
bienvenue est simulé, sans rebond qui abîmerait la réputation du domaine d'expédition. Les deux
parcours tirent une adresse neuve à chaque passage. Dans `refus.http`, les inscriptions 15 et 17
répondent `201` au premier passage et `409` ensuite, et c'est voulu : les refus 16 et 18 ont besoin
d'une adresse déjà prise.

### Le paiement

Les étapes 16 à 18 des parcours (demandes reçues, confirmation, annulation) supposent que la
demande de l'étape 14 a été payée : ouvrir sa page de paiement dans le navigateur, avec la carte de
test `4242 4242 4242 4242`, `stripe listen` tournant (voir plus haut). Sans paiement, elles
répondent une liste vide, `404`, puis `409`.

## Les routes

37 routes. « Jeton » : `Authorization: Bearer <token>`, rendu par `POST /session`. « Admin » : jeton
**et** compte inscrit dans `back_office_admins`. Le détail de chaque route (corps, réponses, erreurs)
est dans `docs/api/openapi.json`.

### Compte et session

| Route | Accès | Rôle |
|---|---|---|
| `GET /account/human-challenge` | public | Obtenir un défi anti-robot |
| `POST /account` | public | Inscrire un compte |
| `POST /session` | public | Ouvrir une session |
| `GET /account` | jeton | Lire son propre compte |
| `PATCH /account/avatar` | jeton | Changer d'avatar |
| `POST /account/password` | jeton | Changer son mot de passe |

### Annonces

| Route | Accès | Rôle |
|---|---|---|
| `GET /listing` | public | Lister les annonces actives |
| `GET /listing/:id` | public | Lire une annonce |
| `GET /listing/mine` | jeton | Lister ses propres annonces |
| `POST /listing` | jeton | Publier une annonce |
| `PATCH /listing/:id/pricing` | jeton | Changer la grille tarifaire d'une annonce |
| `DELETE /listing/:id` | jeton | Dépublier une annonce |

### Demandes de location et paiement

| Route | Accès | Rôle |
|---|---|---|
| `POST /rental-request` | jeton + `Idempotency-Key` | Demander une location (rend la page de paiement) |
| `GET /rental-request` | jeton | Lister les demandes que l'on a faites |
| `GET /rental-request/received` | jeton | Lister les demandes reçues sur ses places |
| `POST /rental-request/:id/abandonment` | jeton | Abandonner sa demande avant de payer |
| `POST /rental-request/:id/confirmation` | jeton | Confirmer une demande (le loueur) |
| `POST /rental-request/:id/cancellation` | jeton | Annuler une réservation (conducteur ou loueur) |
| `POST /rental-request/:id/arrival` | jeton | Confirmer son arrivée (le conducteur) |
| `POST /payment/stripe-webhook` | signature Stripe | Recevoir un événement de Stripe |

### Notifications

| Route | Accès | Rôle |
|---|---|---|
| `GET /notification` | jeton | Lire ses notifications |
| `POST /notification/read` | jeton | Marquer ses notifications comme lues |
| `POST /notification/:id/read` | jeton | Marquer une notification comme lue |
| `POST /notification/push-device` | jeton | Enregistrer son téléphone |
| `POST /notification/push-device/removal` | public | Oublier un téléphone |

### Versements au loueur

| Route | Accès | Rôle |
|---|---|---|
| `GET /payout` | jeton | Lire ses versements |
| `POST /payout/onboarding` | jeton | Saisir ses coordonnées bancaires chez Stripe |
| `POST /payout/dashboard` | jeton | Ouvrir son espace Stripe |

### Back-office

| Route | Accès | Rôle |
|---|---|---|
| `GET /admin/access` | admin | Savoir si ce compte administre le site (204 ou 403) |
| `GET /admin/overview` | admin | Lire le tableau de bord d'administration |
| `GET /admin/accounts` | admin | Lister tous les comptes |
| `GET /admin/listings` | admin | Lister toutes les annonces |
| `GET /admin/rental-requests` | admin | Lister toutes les demandes de location |
| `POST /admin/listings/:id/unpublish` | admin | Dépublier l'annonce de quelqu'un d'autre |
| `POST /admin/accounts/:id/suspension` | admin | Suspendre un compte |
| `DELETE /admin/accounts/:id/suspension` | admin | Lever la suspension d'un compte |
| `POST /admin/rental-requests/:id/cancellation` | admin | Annuler une demande de location |

## Ce que l'API ne sait toujours pas faire

- **Aucune recherche côté api.** `GET /listing` rend toutes les annonces actives, sans filtre ni
  pagination : la proximité, le véhicule et la durée sont jugés par le site.
- **Seuls les tarifs se modifient.** Dates, consignes d'accès et véhicules acceptés n'ont pas de
  route : il faut dépublier puis republier.
- **Ni mot de passe oublié, ni suppression de compte, ni réclamation.**

## Un détail qui surprend

Les requêtes créent de vraies lignes, dans la même base que le site : chaque parcours y laisse un
compte et une annonce dépubliée. Ne pas vider les tables pour faire place nette : la base de
développement porte les comptes et les annonces de démonstration.
