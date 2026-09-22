# bookparking-front

Front hexagonal Vite 7 + React 19 + Redux Toolkit 2 + redux-observable 3, dans le style
jp-way : un hexagone par domaine sous `src/app/<domaine>/`, les effets de bord uniquement
dans les epics, `createReducer` et jamais `createSlice`, et les cinq registres de
`src/store/` tenus à la main.

## Les types viennent du contrat, pas de la main

`src/api/schema.d.ts` est **généré** depuis `docs/api/openapi.json` par
`pnpm --filter bookparking-front api:types`. Ne jamais l'éditer. Les entités et les charges
utiles des ports s'y réfèrent (`components['schemas']['Listing']`), si bien qu'une route qui
change côté api casse la compilation du front plutôt que sa production.

## Things that will bite you

- **`estimateRentalPriceInCents` est un report ligne à ligne de `computeRentalPrice` de l'api.**
  Le montant affiché au locataire avant l'envoi doit être celui que le back facturera ; un
  écart d'un centime, et l'écran promet un prix que `POST /rental-request` refusera. Les deux
  fonctions sont un plus court chemin sur les jours où chaque palier est une arête, et un
  palier ne peut jamais dépasser la fin de la période — c'est pourquoi trois jours couverts
  par un seul tarif hebdomadaire ne donnent **aucun** prix. Toute évolution du barème côté api
  doit être reportée ici, et `Listing.unit.spec.ts` est ce qui le rappellera.
  Voir `src/app/listing/domain/entities/Listing.ts` et
  `apps/api/src/rental/domain/services/computeRentalPrice.ts`.

- **Un palier tarifaire absent s'envoie absent, jamais `null`.**
  `PublishListingSchema` et `UpdateListingPricingSchema` acceptent une clé *omise*, et
  refusent `null` en 400 (`Expected number, actual null`). Or `GET /listing` **rend** `null`
  pour un palier vide : relire une annonce puis la republier telle quelle échoue. C'est
  pourquoi `centsFromInput()` rend `undefined` et non `null` — `JSON.stringify` omet alors la
  clé. Ne pas « normaliser » ce `undefined` en `null` en croyant aligner sur le DTO de lecture.

- **Trois routes ne rendent aucun identifiant, et l'UI est construite autour.**
  `POST /listing` et `POST /rental-request` répondent 201 sans corps, et aucune route ne liste
  les demandes de location. Conséquences assumées : `publishListingEpic` re-dispatche
  `listListingsRequested` faute de pouvoir insérer l'annonce créée ; `requestRentalEpic`
  conserve la charge soumise, seule trace exploitable ; et l'écran de confirmation
  (`/demande/:requestId/confirmation`) n'est atteignable que par lien profond, puisque le
  client n'apprend jamais l'identifiant d'une demande.

- **Le DTO `Listing` ne porte pas d'`ownerId`.** « Mes annonces » est donc infiltrable côté
  client. Les actions propriétaire (dépublier, modifier les tarifs) sont offertes à tout
  compte connecté et c'est l'api qui tranche en 403. Le texte `listing:detail.ownerHint` le
  dit à l'utilisateur plutôt que de faire semblant.

- **`src/store/redux.ts` est le seul fichier autorisé à importer `useDispatch`/`useSelector`.**
  Une règle `no-restricted-imports` bannit l'import brut partout ailleurs, avec une dérogation
  explicite sur ce fichier dans `eslint.config.js`. Passer par `useAppDispatch` /
  `useAppSelector`.

- **Cinq registres, tous à la main, à chaque nouveau cas d'usage.**
  `dependencies.interface.ts` · `buildDependencies.ts` · `coreReducer.ts` · `AppState.ts` ·
  `epics/<domaine>Epics.ts` et son étalement dans `epics/index.ts`. `tsc` en rattrape trois ;
  le tableau d'epics n'en fait pas partie, et l'oublier donne une fonctionnalité qui dispatche
  dans le vide, sans la moindre erreur.

- **Les revenus sont une fonction pure, jamais une route.**
  `confirmedRevenueInCents` somme les demandes `CONFIRMED` et elles seules, à partir de `priceInCents` —
  le montant que l'api a figé au moment de la demande. Le recalculer depuis la grille tarifaire actuelle
  mentirait sur toute place dont les tarifs ont changé depuis. Une demande `PENDING` n'est pas un revenu :
  elle a sa propre tuile. La règle vit dans `RentalRequestView.ts` et se prouve au rung `unit`, sans
  navigateur ni quatrième endpoint.

- **Une tuile de métrique porte `role="group"` et `aria-label`.**
  Sans eux, le libellé et la valeur ne sont que deux paragraphes voisins : ni un lecteur d'écran ni un
  test ne peuvent rapprocher un montant de ce qu'il mesure. Le défaut a été trouvé par le rung `e2e`,
  qui ne savait pas désigner la tuile — exactement ce que le handbook annonce.

- **Le libellé du DOM n'est pas celui de l'écran.** `uppercase` est une règle CSS : le DOM contient
  « Places publiées ». Écrire un locator depuis une capture d'écran donne un test qui ne trouve rien.

## Commandes (formes sûres pour un agent)

| Intention | Commande |
|---|---|
| typecheck | `pnpm --filter bookparking-front exec tsc -b` |
| build | `pnpm --filter bookparking-front build` |
| rung `unit` | `pnpm --filter bookparking-front exec vitest run` |
| un seul cas | `pnpm --filter bookparking-front exec vitest run <chemin> -t '<titre>'` |
| lint (lecture seule) | `pnpm --filter bookparking-front exec eslint src` |
| régénérer les types | `pnpm --filter bookparking-front api:types` |

Jamais de runner en veille : `vitest` nu, `tsc -b -w`, `vite` sans `nohup`. Le `run` de
`vitest run` n'est pas optionnel.

## Ce que vitest couvre, et ce qu'il ne couvrira pas

Dans le périmètre : entités et fonctions pures du domaine, epics, reducers, sélecteurs,
adapters de gateway contre `InMemoryHttpClient`. Hors périmètre, définitivement : tout ce qui
se rend — pages, composants, modales, garde de route, hooks. Aucune bibliothèque de mock :
les doubles sont des classes écrites à la main dans `src/store/testing/`, à l'image des
`InMemory*` de l'api.
