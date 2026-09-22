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
GET  /listing            lister les annonces actives · ?place= ?from= ?to= ?page= ?size=
GET  /listing/:id        lire UNE annonce, par son identifiant
POST /rental-request     demander une place
```

Conséquences concrètes en testant :

- **La recherche ne connaît que le lieu et les dates.** `GET /listing` accepte `place` (cherché dans
  l'adresse, insensible à la casse et aux accents), `from` et `to` (`AAAA-MM-JJ`, la disponibilité doit
  couvrir entièrement la période, bornes comprises), `page` et `size` (20 par défaut, 100 au plus).
  Aucun tri autre que la date de publication, aucune recherche par prix ni par distance.
- **Une place déjà louée sur les dates demandées apparaît quand même.** L'exclure demanderait de croiser
  les demandes confirmées ; c'est explicitement hors périmètre (`docs/specs/SPEC-003-chercher-une-place.md`, §2).
- **La réponse de `GET /listing` est une enveloppe**, pas un tableau :
  `{ "listings": [...], "total": 42, "page": 1, "size": 20 }`.
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
site affichera ; son filtrage et sa pagination sont depuis décrits par `SPEC-003` (10 exemples, tous au
barreau `unit`). Elle est testée par 14 tests unitaires, 1 `int-repo` et 6 `int-http` — mais ces six-là
ne portent aucun `@EX` : aucun exemple ne décrit la route elle-même, seulement la liste qu'elle rend.
Le tri reste à spécifier.

Le reste des manques est dans le même cas — rien dans les deux specs ne décrit une recherche, un
retour d'identifiant à la publication, ou une route de dépublication.

## Un détail qui surprend
Les requêtes d'inscription créent de vraies lignes. Rejouer `parcours` deux fois donne un `409` à
la deuxième inscription — c'est le comportement correct. Pour repartir de zéro :

```bash
docker exec bp psql -U bp -d bookparking -c \
  "truncate rental_requests, listings, accounts cascade"
```
