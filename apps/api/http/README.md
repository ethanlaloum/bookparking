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

## Un détail qui surprend
Les requêtes d'inscription créent de vraies lignes. Rejouer `parcours` deux fois donne un `409` à
la deuxième inscription — c'est le comportement correct. Pour repartir de zéro :

```bash
docker exec bp psql -U bp -d bookparking -c \
  "truncate rental_requests, listings, accounts cascade"
```
