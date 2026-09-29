# bookparking-bo

Le back-office : la console de modération de Bookparking, servie à part sur
`admin.bookparking.fr`. Vite 7 + React 19 + Redux Toolkit 2 + redux-observable 3, dans le style
du front (`createReducer`, effets de bord dans les epics, registres tenus à la main dans
`src/store/`). Deux contextes seulement : `src/app/auth/` (la connexion de la console) et
`src/app/back-office/` (tableau de bord, listes, quatre actions de modération).

Sept sections, une adresse chacune : `/` (aperçu), `/reclamations`, `/comptes`, `/annonces`,
`/demandes`, `/reglages` et `/journal`, plus `/connexion`. Toute autre adresse ramène à `/`.

## Ce qui vient du front, et ce qui n'en vient pas

L'app n'a pas de design system à elle : elle importe du front, par l'alias `@front/*`, les
composants (`components/ui/*`, `Notice`, `EmptyState`, `MetricTile`, `ParkingMark`), `lib/cn`,
`lib/format`, `lib/http/*`, `store/CommonState`, les types générés `api/schema`, le prédicat
`isAcceptableEmail`/`isAcceptablePassword` de `app/account`, et l'hexagone de session
(`Session`, `SessionGateway`, `SessionStore`, `BookparkingRxSessionGateway`,
`LocalStorageSessionStore`). `src/index.css` importe la feuille du front telle quelle.

Ce qui lui est propre : l'hexagone `back-office` entier, ses écrans, ses traductions (`admin`,
plus un `auth` et un `common` réduits), et ses propres epics de connexion — ceux du front sont
typés sur l'`AppState` du front et ne se branchent pas sur ce store.

## Things that will bite you

- **Ne jamais importer du front un fichier qui importe `@front/lib/i18n`.** Les schémas de
  formulaire du front (`pages/*Schema.ts`) le font : l'importer ici initialiserait une seconde
  instance d'i18next, et `initReactI18next` remplacerait l'instance globale de react-i18next —
  les écrans afficheraient les clés du site, pas celles de la console. D'où `pages/signInSchema.ts`
  recopié ici, qui ne reprend que les deux prédicats du domaine.

- **`react`, `react-dom` et leurs types sont épinglés sur les versions du front (`^19.3.0`).**
  Avec `^19.2.0`, pnpm réutilise le `react@19.2.3` d'Expo (`apps/mobile`) tout en résolvant
  `react-dom@19.3.0` : la page reste blanche, et la console dit « Incompatible React versions ».
  Les composants empruntés au front résolvent leurs paquets depuis `apps/front/node_modules` ;
  `resolve.dedupe` de `vite.config.ts` n'y ramène que les singletons, il ne rattrape pas deux
  versions différentes.

- **Tailwind lit les composants du front par `@source`.** Sans la ligne de `src/index.css`, les
  classes qui ne vivent que dans `apps/front/src/components` ne sont pas générées, et les boutons
  s'affichent nus.

- **L'image Docker installe aussi le front** (`--filter bookparking-front...`) : sans ses
  `node_modules`, `tsc -b` ne trouve pas les types des fichiers empruntés. Pour la même raison,
  `railway.json` redéploie la console quand `apps/front/src/**` change.

- **La connexion vérifie le droit avant d'ouvrir la session.** `POST /session` ouvre une session à
  n'importe quel compte ; `signInEpic` enchaîne `GET /admin/access` et efface la session si la
  sonde échoue, 403 comme panne. La session est écrite *avant* la sonde parce que
  `FetchHttpClient` lit son jeton dans le stockage. Sur un 403, l'écran remplace le message de
  l'api (« action réservée ») par `auth:signIn.notAdmin`, qui parle du compte.

- **L'api ne dit nulle part qu'un compte administre le site.**
  Le seul signal est `GET /admin/access`, qui répond 204 ou 403 sans corps — `AdminGuard` relit
  `back_office_admins` à chaque appel, si bien qu'une révocation prend effet immédiatement.
  `RealBackOfficeGateway` traduit le statut HTTP en `BackOfficeError` porteuse d'un `kind`, et
  `BackOfficeSlice` fait basculer `access` en `denied` sur `forbidden` — jamais sur une panne
  réseau, qui laisse `unknown` : un câble débranché ne doit pas conclure qu'un administrateur
  n'en est pas un. Ne pas mettre ce droit dans le jeton pour économiser un appel : ce serait
  exactement le sursis que l'api refuse.

- **Un compte révoqué en cours de route voit « Accès retiré », pas une liste vide.** Son jeton
  reste valide ; c'est le 403 de la lecture suivante qui passe `access` en `denied`, et
  `ConsoleLayout` remplace alors la section par l'avis et un bouton de déconnexion.

- **La session de la console n'est pas celle du site.** Même clé `bookparking.session`, mais
  `localStorage` est propre à chaque origine : `admin.bookparking.fr` et `bookparking.fr` (en
  local, les ports 5174 et 5173) ont chacun la leur. Se déconnecter d'un côté ne touche pas
  l'autre.

- **`DELETE /admin/accounts/:id/suspension` porte un corps.**
  Lever une suspension est une action de modération comme les trois autres, et l'api lui
  demande le même motif. C'est la seule raison pour laquelle `HttpClient.delete` du front prend
  un `body` : le retirer rendrait 400 sur la seule action qui lève une sanction.

- **Les quatre epics de modération sont en `concatMap`, et c'est délibéré.**
  `exhaustMap` — le défaut partout ailleurs — laisserait tomber la seconde dépublication sans
  rien dire, alors qu'elle porte sur une autre annonce. Prouvé par
  `unpublishListingEpic.unit.spec.ts` (« honore deux dépublications de suite »).

- **Chaque action de modération relit sa liste *et* le tableau de bord.**
  L'api répond 204 sans corps : rien ne revient qu'on puisse insérer. Suspendre un compte
  change `suspendedAccounts` autant que la ligne du tableau. Oublier `readOverviewRequested`
  donnerait un aperçu qui ment jusqu'au prochain F5.

- **Trois prédicats sont des reports ligne à ligne de `attentionOverview` côté api.**
  `hasNoActivity` (`AdminAccount.ts`), `hasNoPrice` (`AdminListing.ts`) et `hasWaitedOverADay`
  (`AdminRentalRequest.ts`) rejouent en TypeScript les trois sous-requêtes de
  `KnexBackOfficeRepository.attentionOverview`. L'aperçu affiche les compteurs de l'api, les
  listes marquent les lignes avec ces prédicats : ils doivent dire la même chose. Si le barème
  gagne un palier, ou si le seuil des vingt-quatre heures bouge, les deux côtés changent
  ensemble.

- **`hasWaitedOverADay` compare à un instant figé pour le rendu.**
  L'api compare à l'instant de la requête, l'écran à l'instant du rendu : les deux peuvent
  différer d'une demande pendant la minute où elle franchit le seuil, et c'est la seule
  divergence acceptable. `AdminRequestsPanel` gèle `now` dans un `useMemo` — sans cela, chaque
  ligne lirait une horloge légèrement différente.

- **Un bouton n'est offert que là où l'api accepterait l'action.**
  `unpublishListing` filtre sur `status = 'ACTIVE'`, `cancelRentalRequest` sur
  `PENDING | CONFIRMED` : les deux rendent `false` ailleurs, ce que le cas d'usage traduit en
  404. `isActive` et `isCancellable` reproduisent ces filtres, et les colonnes « Action »
  restent vides pour les autres lignes.

- **La modale de modération se ferme par dérivation, jamais par un `setState` dans un `useEffect`.**
  `react-hooks/set-state-in-effect` refuse le second. `useModeration` compare le succès du store
  à l'identifiant de la cible ouverte, et la remise à zéro appartient aux deux gestes de
  l'utilisateur — ouvrir une autre modale, ou fermer celle-ci.

- **Un 401 déconnecte une fois, pas quatre.**
  Une section tire parfois plusieurs lectures d'un coup ; un jeton expiré les renvoie toutes en
  401. `dropExpiredSessionEpic` écoute le `kind: 'session-expired'` porté par n'importe quelle
  action d'échec et dispatche `logoutRequested` ; `RequireSession` ramène alors à `/connexion`.

- **Annuler une demande confirmée n'émet aucun remboursement**, parce que le produit ne sait
  pas encore encaisser. `admin:moderation.cancelRequest.body` le dit à celui qui annule.

- **`count` est un mot réservé d'i18next.** Passé en interpolation, il déclenche la recherche
  des clés plurielles `_one` / `_other` et rend la clé brute quand elles n'existent pas. Les
  sous-titres des trois listes interpolent donc `total`.

- **Dans `createReducer`, tout `addCase` doit précéder le premier `addMatcher`.**
  Le builder de RTK le refuse à l'exécution, et l'erreur ne sort qu'au premier dispatch — pas
  à la compilation. `BackOfficeSlice` groupe ses quatre actions de modération derrière trois
  `isAnyOf`, placés en dernier.

- **`TableShell` est le seul élément autorisé à déborder horizontalement**, et il le fait dans
  son propre conteneur. Ses cellules sont en `px-3` et non `px-4` : mesuré à l'écran, la table
  des demandes — huit colonnes — atteignait 1360 px pour 1338 px de conteneur, et son dernier
  en-tête « Action » sortait du cadre.

- **Aucune police de Google.** Le site ne les charge qu'avec l'accord du visiteur ; la console
  n'a pas de bandeau, elle tombe donc sur les polices système des piles `--font-*`.

- **La console ne se laisse pas indexer** : `<meta name="robots">` dans `index.html` et
  `X-Robots-Tag` dans le `Caddyfile`.

## Réglages et journal

- **Le formulaire des réglages ne recopie aucune borne.** `GET /admin/settings` rend les valeurs en
  vigueur *et* les bornes que l'api fait respecter ; `settingsSchemaFor` construit le schéma zod depuis
  elles, et `isWithinBounds` rejoue `checkPlatformSettings`. L'api reste le juge : son refus en 400
  s'affiche tel quel.
- **Le formulaire est remonté par une clé à chaque version relue** (`key={JSON.stringify(settings)}`) :
  ses valeurs par défaut redeviennent celles en vigueur et le motif se vide, sans `setState` dans un
  effet. Le bouton reste inactif tant qu'aucune valeur n'a changé — l'api refuserait de toute façon.
- **`POST /admin/settings`, pas `PUT`** : le `HttpClient` partagé n'a pas de `put`, et chaque
  changement crée une version. Un succès relit les réglages *et* le journal.
- **Le journal vient trié de l'api** (le plus récent d'abord) ; le filtre Tout / Modération / Réglages
  ne réordonne rien (`selectJournal`). Un changement de réglages n'affiche que les valeurs qui ont
  bougé (`settingChangesOf`) ; la toute première version, qui ne remplaçait rien, les montre toutes.

## Réclamations

- **Les ouvertes d'abord**, dans l'ordre de l'api. Trois décisions, chacune derrière une fenêtre qui
  dit ce qu'elle fait de l'argent et demande le motif ; le remboursement partiel demande aussi un
  montant, borné à la part du loueur moins un centime (`isAcceptablePartialRefund`, report de
  `ResolveRentalIssue.resolutionOf`). Un succès relit les réclamations, l'aperçu (qui compte les
  ouvertes, tuile « Réclamations ouvertes ») et le journal.
- **La fenêtre est remontée par une clé** (`issue.id` + décision), comme le formulaire des réglages :
  le montant et le motif ne passent pas d'une réclamation à l'autre.

## Déploiement

Troisième service Railway, sur le même modèle que le site : répertoire racine du dépôt, fichier
de config `/apps/bo/railway.json`, variable `API_INTERNAL_URL` (l'api sur le réseau privé, que
Caddy relaie sous `/api`), domaine personnalisé `admin.bookparking.fr`.

## Commandes (formes sûres pour un agent)

| Intention | Commande |
|---|---|
| typecheck | `pnpm --filter bookparking-bo exec tsc -b` |
| build | `pnpm --filter bookparking-bo build` |
| rung `unit` | `pnpm --filter bookparking-bo exec vitest run` |
| lint (lecture seule) | `pnpm --filter bookparking-bo exec eslint src` |
| serveur de dev (port 5174, proxy `/api` → 3000) | `nohup pnpm --filter bookparking-bo exec vite &` |

Jamais de runner en veille : `vitest` nu, `tsc -b -w`, `vite` sans `nohup`.

Le périmètre de vitest est celui du front : domaine, epics, reducers, sélecteurs ; jamais ce qui
se rend. Les doubles de session viennent de `@front/store/testing/InMemoryDependencies`, ceux du
back-office vivent dans `src/store/testing/`.
