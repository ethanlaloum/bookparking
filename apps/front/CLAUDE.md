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

- **Bookparking ne couvre que Nice, et trois endroits en dépendent.**
  `NICE` et `NICE_INSEE_CODE` vivent dans `Coordinates.ts` : le géocodage restreint sa recherche à
  `citycode=06088`, le cadrage retombe sur la ville quand rien n'est situé, et les paliers de zoom sont
  calibrés à l'échelle d'une agglomération, pas d'un pays. Une adresse d'une autre commune ressort
  **non située**, ce qui est le comportement voulu et non un bug de géocodage.

- **La Base Adresse Nationale rend toujours un résultat, même pour une adresse qui n'existe pas.**
  Elle retombe sur la voie la plus proche et le dit par un score. « 12 rue des Lilas 75011 Paris »
  ressortait ainsi en « 12 Rue des Bluets » à 0,61. D'où deux seuils dans le domaine : en dessous de
  `MINIMUM_PLACEABLE_SCORE` (0,5) on ne place rien, en dessous de `EXACT_MATCH_SCORE` (0,9) on place
  en disant que la position est approximative — marqueur orange, et un bandeau qui l'explique. Ne
  jamais afficher un point sans porter cette nuance : ce serait mettre une voiture dans la mauvaise rue.

- **Le géocodage est fait dans le navigateur, et c'est une dette assumée.**
  `BanGeocodingGateway` est un adaptateur derrière un port : le jour où une annonce portera ses
  coordonnées, l'adaptateur disparaît et le reste ne bouge pas. En attendant, chaque ouverture de carte
  géocode les annonces qu'elle n'a pas encore situées, quatre requêtes en vol au maximum — la BAN est un
  service public gratuit. `exhaustMap` empêche qu'un second déclenchement relance la rafale.

- **Les tuiles viennent d'OpenStreetMap, pas de CARTO.**
  Les fonds CARTO exigent désormais une clé d'API et rendent sinon des tuiles barrées
  « API KEY REQUIRED » — constaté à l'écran pendant cette story. OSM n'ayant pas de variante sombre, le
  thème sombre passe par un filtre CSS posé sur la **seule couche de tuiles** (`.bookparking-dark-tiles`),
  jamais sur le conteneur : appliqué au conteneur, il inverserait aussi les marqueurs et les infobulles.

- **Le marqueur est un SVG en ligne, pas l'icône par défaut de Leaflet.**
  Celle-ci arrive par une URL que le bundler réécrit, et qui casse silencieusement en production.

- **`searchAddressEpic` est le seul `switchMap` de l'application, et c'est sa place.**
  Sur une frappe, la dernière requête gagne et la précédente ne vaut plus rien : l'annuler est
  exactement ce qu'on veut. `exhaustMap` — le défaut ailleurs — laisserait s'afficher les suggestions
  d'un préfixe déjà effacé. `debounceTime` vient **avant** `distinctUntilChanged` : on ne compare que
  les frappes qui ont survécu au silence, sinon un aller-retour sur la même chaîne relancerait une
  requête identique.

- **La recherche met en avant, elle ne masque jamais.** `selectMappedListingsFromSearch` classe par
  distance et marque celles à moins d'un kilomètre ; toutes restent sur la carte. Filtrer ferait croire
  qu'il n'y a pas de place là où il y en a une à 1,2 km.

- **La molette ne zoome pas la carte.** Elle occupe les deux tiers de la hauteur : un utilisateur qui
  fait défiler la page verrait son geste détourné dès que le curseur passe dessus — constaté en
  s'en servant. Les commandes `+`/`−` et le double-clic restent explicites.

- **Le combobox suit le motif ARIA à la lettre**, et pas seulement pour la forme : `aria-activedescendant`
  désigne l'option parcourue **sans** lui donner le focus, ce qui laisse la frappe continuer. C'est aussi
  ce qui permet au barreau `e2e` de désigner une suggestion par `getByRole('option')`, et un marqueur
  Leaflet par `getByRole('button')` — son `title` devient son nom accessible.

- **Ne jamais réinitialiser le surlignage dans un `useEffect` sur les suggestions.**
  Un `setState` synchrone dans un effet déclenche des rendus en cascade, et le linter React le refuse.
  Les suggestions ne changent qu'à la suite d'une frappe : la remise à zéro appartient au `onChange`.

- **L'URL est la seule mémoire d'une recherche.**
  `criteriaFromSearchParams` / `criteriaToSearchParams` sont des fonctions pures : la recherche survit
  au rechargement, se partage par lien et remonte dans l'historique. Un critère illisible est **ignoré**,
  jamais rejeté — une URL tronquée doit donner une recherche partielle, pas une page en erreur.
  Piège attrapé par un test en l'écrivant : `Number(null)` vaut `0` et `Number.isFinite(0)` est vrai,
  donc convertir avant d'avoir vérifié la présence plaçait une adresse sans coordonnées au point (0, 0),
  au large du golfe de Guinée, sans qu'aucune erreur ne le signale.

- **Le gabarit de véhicule ne filtre rien, et l'écran le dit.**
  Aucune annonce ne déclare la contenance qu'elle accepte : le contrat n'a pas ce champ, et la
  description d'accès n'est pas une donnée qu'on lit au motif. Le critère est retenu, affiché et
  transmis dans l'URL, avec un bandeau qui annonce qu'il ne filtre aucune place. Le jour où `listings`
  portera une contenance, `acceptsVehicle` se branche dans `SearchCriteria.ts` et rien d'autre ne bouge.
  Ne jamais faire semblant de filtrer là-dessus — ce serait mentir sur une disponibilité.

- **La durée, elle, correspond à quelque chose de réel** : les trois paliers tarifaires. `offersTier`
  répond depuis `pricing`, et l'écran dit combien de places proposent le tarif demandé — sans masquer
  les autres, même discipline que la proximité.

- **`AddressSearch` est piloté : il ne dispatche rien.**
  Il reçoit sa valeur et rend son choix, ce qui lui permet de servir l'accueil et la recherche. Le ✕
  efface le **champ**, pas la recherche — d'où son libellé « Effacer l'adresse ». Abandonner une
  recherche, c'est vider puis valider, comme dans n'importe quel formulaire. Un bouton qui promet plus
  que ce qu'il fait est un défaut, pas un raccourci.

- **Le vocabulaire des véhicules vient du contrat, pas du front.**
  `VEHICLE_TYPES` dans `SearchCriteria.ts` doit rester identique à l'énumération de l'api : c'est la
  même liste qui sert à déclarer et à chercher. `VEHICLE_ICON` est l'unique table d'icônes — publication,
  fiche et carte de résultat la lisent toutes, donc un vélo est le même dessin partout.

- **Le filtre véhicule met en avant, il ne masque pas.** `acceptsVehicle` rend `true` pour une place qui
  n'a rien déclaré, et `selectVehicleTally` rend **deux** nombres : combien acceptent explicitement, et
  combien se sont tues. L'écran dit les deux. Masquer les secondes ferait croire qu'elles n'existent pas ;
  les compter avec les premières ferait croire qu'elles ont été vérifiées.

- **Un `Partial<T>` rend chaque champ `undefined`-able, et l'étalement l'écrase.**
  `aListing({ box: 'X' })` effaçait `acceptedVehicles` parce que `...overrides` passe un `undefined`
  explicite. Dans un constructeur de fixture, réaffirmer les champs obligatoires **après** l'étalement.

- **`getByLabel('Voiture')` désigne aussi « Voiture électrique ».**
  La correspondance est par sous-chaîne : tout libellé qui en préfixe un autre exige
  `{ exact: true }`. Attrapé par le barreau `e2e`, en « strict mode violation ».

- **Trois pages, trois rôles — et l'accueil ne liste plus rien.**
  `/` est une page d'atterrissage : le hero, la barre de recherche, trois arguments. Elle charge quand
  même les annonces, mais pour un seul chiffre — le tarif d'appel doit être vrai. `/recherche` porte la
  liste **et** la carte, côte à côte ; `/place/:id` porte la fiche. Ne pas réintroduire une grille
  d'annonces sur l'accueil : elle dupliquerait la colonne gauche de la recherche, avec un tri différent.

- **La liste et la carte partagent la même donnée déjà classée.**
  `selectMappedListingsFromSearch` alimente les deux : ce que l'œil lit à gauche est dans le même ordre
  que ce que la main atteint à droite. Survoler une carte de résultat désigne son marqueur — le
  `focusedListingId` est un état local de la page, pas du store : il ne survit à rien et n'a pas à le faire.

- **Une clé de traduction orpheline est de la dette qui se propage.**
  Supprimer le panneau de filtres de l'accueil a laissé onze clés mortes dans les deux locales, que rien
  ne signalait. Après toute suppression d'écran, confronter les clés au code — et vérifier que `fr` et
  `en-US` restent à parité exacte, namespace par namespace.

- **Une rangée de champs s'aligne par sa structure, jamais par une marge calibrée.**
  `SearchBar` donne à chaque colonne la même forme — un libellé, puis un contrôle de 44 px — et la
  colonne du bouton porte une étiquette vide qui tient la place du libellé. Mesuré : les quatre
  contrôles partagent le même `top` au pixel.
  La version précédente s'appuyait sur `items-end` et sur un `lg:mb-[1.625rem]` réglé à la main : dès
  que l'aide de l'adresse passait sur deux lignes, la colonne grandissait, son contenu remontait, et
  toute la rangée se décalait de près de 50 px. Une marge magique se règle pour un texte donné, et se
  dérègle au premier changement de libellé ou de traduction.
  Corollaire : `AddressSearch` ne rend **ni l'aide ni l'adresse retenue** — c'est l'appelant qui les
  affiche sous la barre entière. Un texte de hauteur variable n'a rien à faire dans une cellule de
  grille alignée.

- **La liste de suggestions s'ancre en `top-full` sous l'entrée**, pas à un décalage codé en dur.
  Elle valait `top-[4.6rem]`, mesuré depuis le haut de la colonne — donc faux dès que la colonne
  changeait de hauteur.

- **La page `/recherche` s'appelait `/carte`.** Le composant de carte, lui, reste `ListingsMap` : c'est
  la page qui a changé de rôle, pas la carte.

## L'administration du site vit ici, et pas ailleurs

Une `apps/bo` séparée a existé le temps d'une session, puis a été repliée dans cette app :
les écrans de modération sont quatre onglets de `/compte`, sous une étiquette ambre
« Administration du site », et l'hexagone `src/app/back-office/` est un contexte comme
`listing` ou `rental`. Les quatre panneaux sont chargés par `lazy()` : leur code part dans
quatre fragments à part, qu'un conducteur ordinaire ne télécharge jamais.

- **L'api ne dit nulle part qu'un compte administre le site.**
  `POST /session` rend un jeton, rien de plus : pas de rôle, pas de drapeau. Le seul signal
  est `GET /admin/access`, qui répond 204 ou 403 sans corps — `AdminGuard` relit
  `back_office_admins` à chaque appel, si bien qu'une révocation prend effet immédiatement.
  `AccountPage` la sonde au montage, `RealBackOfficeGateway` traduit le statut HTTP en
  `BackOfficeError` porteuse d'un `kind`, et `BackOfficeSlice` fait basculer `access` en
  `denied` sur `forbidden` — jamais sur une panne réseau, qui laisse `unknown` : un câble
  débranché ne doit pas conclure qu'un administrateur n'en est pas un.
  Ne pas mettre ce droit dans le jeton pour économiser un appel : ce serait exactement le
  sursis que l'api refuse.

- **`DELETE /admin/accounts/:id/suspension` porte un corps.**
  Lever une suspension est une action de modération comme les trois autres, et l'api lui
  demande le même motif. C'est la seule raison pour laquelle `HttpClient.delete` prend un
  `body` : le retirer rendrait 400 sur la seule action qui lève une sanction.

- **Les quatre epics de modération sont en `concatMap`, et c'est délibéré.**
  `exhaustMap` — le défaut partout ailleurs — laisserait tomber la seconde dépublication sans
  rien dire, alors qu'elle porte sur une autre annonce. Prouvé par
  `unpublishListingEpic.unit.spec.ts` (« honore deux dépublications de suite »).

- **Chaque action de modération relit sa liste *et* le tableau de bord d'administration.**
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
  Même règle que le surlignage du combobox, et pour la même raison : `react-hooks/set-state-in-effect`
  refuse le second. `useModeration` compare le succès du store à l'identifiant de la cible
  ouverte, et la remise à zéro appartient aux deux gestes de l'utilisateur — ouvrir une autre
  modale, ou fermer celle-ci.

- **Un 401 déconnecte une fois, pas quatre.**
  Un onglet d'administration tire plusieurs lectures d'un coup ; un jeton expiré les renvoie
  toutes en 401. `dropExpiredSessionEpic` écoute le `kind: 'session-expired'` porté par
  n'importe quelle action d'échec et dispatche `logoutRequested`. Il ne réagit **qu'aux**
  échecs du back-office : les epics des autres contextes ne portent pas de `kind`.

- **Annuler une demande confirmée n'émet aucun remboursement**, parce que le produit ne sait
  pas encore encaisser. `admin:moderation.cancelRequest.body` le dit à celui qui annule.

- **`count` est un mot réservé d'i18next.** Passé en interpolation, il déclenche la recherche
  des clés plurielles `_one` / `_other` et rend la clé brute quand elles n'existent pas. Les
  sous-titres des trois listes d'administration interpolent donc `total`.

- **Dans `createReducer`, tout `addCase` doit précéder le premier `addMatcher`.**
  Le builder de RTK le refuse à l'exécution, et l'erreur ne sort qu'au premier dispatch — pas
  à la compilation. `BackOfficeSlice` groupe ses quatre actions de modération derrière trois
  `isAnyOf`, placés en dernier.

- **`MetricTile` prend un `tone`, plus un booléen `accent`.**
  Trois registres (`plain`, `accent`, `warn`) parce que le bloc « à surveiller » n'allume
  l'ambre que sur un compteur non nul — trois zéros sont une bonne nouvelle, et les peindre
  en rouge apprendrait à l'œil à ignorer la couleur.

- **`TableShell` est le seul élément autorisé à déborder horizontalement**, et il le fait dans
  son propre conteneur. Ses cellules sont en `px-3` et non `px-4` : mesuré à l'écran, la table
  des demandes — huit colonnes — atteignait 1360 px pour 1338 px de conteneur, et son dernier
  en-tête « Action » sortait du cadre.


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
