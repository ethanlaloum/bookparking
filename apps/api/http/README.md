# Requêtes HTTP — Bookparking

Fichiers `.http`, lisibles par deux outils :

| Outil | Comment |
|---|---|
| **IntelliJ / WebStorm** | HTTP Client intégré (Ultimate). En Community, installer le plugin *HTTP Client*. Choisir l'environnement `local` en haut à droite du fichier. |
| **VS Code** | Extension **REST Client** (`humao.rest-client`), de Huachao Mao. Un lien `Send Request` apparaît au-dessus de chaque requête. |

## Avant de lancer

```bash
docker run -d --rm --name bp -e POSTGRES_PASSWORD=bp -e POSTGRES_USER=bp \
  -e POSTGRES_DB=bookparking -p 55432:5432 postgres:15

cd apps/api
DATABASE_URL="postgres://bp:bp@localhost:55432/bookparking" pnpm migrate

ACCESS_TOKEN_SECRET="2zhNIzWjIiReQyN9Wyob1RXqTun98SBhjtGzbPIbPos" \
DATABASE_URL="postgres://bp:bp@localhost:55432/bookparking" \
PORT=3000 pnpm start
```

## Quel fichier ouvrir

- `parcours.intellij.http` — le parcours complet, jeton capturé automatiquement (IntelliJ)
- `parcours.vscode.http` — le même, syntaxe REST Client (VS Code)
- `refus.http` — tous les refus attendus : 400, 401, 409. **Identique dans les deux outils.**

Chaque requête porte en commentaire le code attendu et, quand il y en a un, l'exemple de la spec
qu'elle exerce.

## ⚠ Ce que l'API ne sait pas faire

Il n'existe que **six routes**, et aucune ne liste quoi que ce soit :

```
POST /account            créer un compte
POST /account/password   changer son mot de passe
POST /session            se connecter
POST /listing            publier une annonce
GET  /listing            lister toutes les annonces actives
GET  /listing/:id        lire UNE annonce, par son identifiant
POST /rental-request     demander une place
```

Conséquences concrètes en testant :

- **Aucune recherche.** `GET /listing` rend *toutes* les annonces actives, sans filtre : ni par ville,
  ni par adresse, ni par dates. Sans pagination non plus — la liste grossit sans limite.
- **`POST /listing` ne rend pas l'identifiant** de l'annonce créée : il répond `201` sans corps. Pour
  relire ce qu'on vient de publier, il faut aller le chercher en base :

  ```bash
  docker exec bp psql -U bp -d bookparking -tAc "select id from listings limit 1"
  ```
- **On ne peut pas lister ses propres annonces ni ses demandes.** Rien ne permet à un loueur de voir
  ce qu'il a publié, ni à un conducteur de voir ce qu'il a demandé.
- **On ne peut pas dépublier par l'API.** `UnpublishListing` existe et est testé, mais aucune route
  ne le monte.

`GET /listing` a été ajoutée **hors spec**, à la demande, parce que c'est la première chose que le
site affichera. Elle est testée (4 unit, 1 int-repo, 3 int-http) mais aucun exemple de SPEC-001 ni de
SPEC-002 ne la décrit : le filtrage, le tri et la pagination restent à spécifier.

Le reste des manques est dans le même cas — rien dans les deux specs ne décrit une recherche, un
retour d'identifiant à la publication, ou une route de dépublication.

## Un détail qui surprend
Les requêtes d'inscription créent de vraies lignes. Rejouer `parcours` deux fois donne un `409` à
la deuxième inscription — c'est le comportement correct. Pour repartir de zéro :

```bash
docker exec bp psql -U bp -d bookparking -c \
  "truncate rental_requests, listings, accounts cascade"
```
