# bookparking-e2e

Le barreau le plus haut : un vrai Chromium pilote un vrai front, qui parle à une
vraie api NestJS, qui écrit dans un vrai PostgreSQL démarré par testcontainers.
Rien n'est simulé entre eux. `page.route()` n'apparaît nulle part sous
`tests/real/`, et aucune spec n'ouvre de connexion `pg`.

## Things that will bite you

- **Les libellés français portent l'apostrophe typographique U+2019, pas U+0027.**
  `getByLabel("Consignes d'accès")` ne trouve rien ; `getByLabel('Consignes d’accès')`
  trouve. L'échec est une attente de 120 s sur un locator, et le message ne dit
  jamais qu'il s'agit d'un caractère invisible à l'œil. La règle du handbook — le
  nom accessible est le contrat, caractère pour caractère — se paie ici : c'est
  le page object qui s'aligne sur l'interface, jamais l'inverse, parce que
  l'apostrophe courbe est la forme correcte en français.

- **« Véhicule » et « Durée » ne sont plus des `<select>`.** Ce sont des combobox ARIA maison :
  `selectOption()` y échoue et `toHaveValue()` n'a rien à lire. `SearchPage` expose
  `chooseVehicle` / `chooseDuration` (ouvrir, puis cliquer l'option par son nom, `exact: true`) et
  `expectVehicle` / `expectDuration`, qui lisent le libellé affiché par le déclencheur. Les champs de
  date, eux, restent des `<input>` : `fill()` y écrit un jour ISO, que le front accepte comme saisie.

- **Toute la suite exige Stripe en mode test, depuis SPEC-004.** L'api refuse de démarrer sans
  `STRIPE_SECRET_KEY`, et `startLocalStack` la lit dans l'environnement ou dans `.env.stripe.local` à la
  racine (ignoré par git) — une clé qui ne commence pas par `sk_test_` est refusée. La stack lance
  `stripe listen`, qui relaie les événements de Stripe jusqu'à l'api locale ; il faut donc la CLI
  (`brew install stripe/stripe-cli/stripe`), sans `stripe login` : la clé lui est passée par
  `--api-key`. Le secret du webhook est celui que rend `stripe listen --print-secret`.

- **Une demande ne se voit du propriétaire qu'une fois payée, et il n'existe aucun raccourci.**
  `Seeder.paidRentalRequest` ouvre la vraie page Stripe, paie avec la carte `4242`, puis attend que
  l'événement relayé fasse passer la demande `PENDING`. C'est lent — une quinzaine de secondes — et c'est
  le prix du « rien n'est simulé ». Stripe refuse les domaines réservés comme `.test` : la page reçoit une
  adresse `@example.com`, sans lien avec le compte.

- **`StripeCheckoutPage` vise des identifiants de champ, pas des noms accessibles.** Ce n'est pas une
  page de ce dépôt : ses libellés ne sont pas un contrat que bookparking tient. Si Stripe change sa page,
  c'est ce page object seul qui casse.

- **Chaque parcours démarre avec le consentement déjà accepté.** La fixture `page` pose
  `bookparking.consent` (carte et polices permises) avant tout script, à chaque navigation.
  Sans cela, le bandeau collant masquerait des boutons en bas d'écran et la carte laisserait place
  à son encart : toutes les suites de carte échoueraient. Seul
  `tests/real/consent/` s'en retire par `test.use({ consent: 'undecided' })`. Si le front
  incrémente `CONSENT_VERSION`, la constante de `src/fixtures/test.ts` doit suivre ; sinon
  l'enregistrement posé ne vaut plus, et c'est toute la suite de carte qui le signale.

- **Le consentement se prouve par les requêtes, pas par l'écran.** `watchThirdParties` relève
  tout ce qui part vers `fonts.googleapis.com`, `fonts.gstatic.com` et `tile.openstreetmap.org`.
  Il se branche **avant** la première navigation : une requête partie avant l'écoute échapperait
  au relevé, et le test conclurait à tort qu'elle n'a pas eu lieu.

- **Playwright lit la signature des fixtures : le motif `{}` est obligatoire.**
  Une fixture qui ne consomme rien s'écrit `async ({}, use) => {}`. La remplacer
  par un paramètre nommé pour satisfaire `no-empty-pattern` fait échouer le
  chargement de toute la suite avec « First argument must use the object
  destructuring pattern », et `--list` rend alors `0 tests in 0 files`. La
  dérogation eslint est locale et commentée dans `src/fixtures/test.ts`.

- **`knexfile.js` de l'api lit ses migrations dans `dist/`, en `.js`.**
  `globalSetup` compile donc l'api avant de migrer. Sans ce build, `migrate:latest`
  ne trouve aucun fichier et répond « Already up to date » sur une base vide :
  l'api démarre, et chaque requête échoue sur une table absente.

- **Le port de l'api est fixe, pas tiré au sort.** La section `webServer` de
  `playwright.config.ts` est évaluée au chargement du fichier, donc *avant* que
  `globalSetup` ne s'exécute : elle ne peut pas lire un port choisi à ce
  moment-là. D'où `E2E_API_PORT` (3100) et `E2E_FRONT_PORT` (5174), et
  `--strictPort` pour qu'un port occupé échoue bruyamment.

- **Il n'y a pas d'endpoint d'amorçage.** Cette api n'expose aucun
  `/test-data` : `ApiClient` passe donc par les routes publiques réelles
  (`POST /account`, `POST /session`, `POST /listing`). La loi tient — par l'api,
  jamais par la base — et la suite resterait exécutable contre un environnement
  déployé. La contrepartie : aucune route ne supprime un compte, donc le
  nettoyage se limite aux annonces, dépubliées en ordre inverse. Les comptes
  restent, sans effet : chaque email est unique et la base est éphémère.

- **Le piège §9 du handbook s'applique au balayage de SPEC-004, et à lui seul.**
  L'api n'a ni outbox ni worker, mais `RentalSweepScheduler` expire les demandes et rend
  l'argent dû toutes les cinq minutes. Aucun parcours e2e n'attend son passage : l'expiration
  à 48 heures et la levée de l'empreinte sont prouvées au rung `unit`. Un parcours qui voudrait
  l'observer devrait régler `RENTAL_SWEEP_INTERVAL_IN_SECONDS` dans la stack — relire le §9
  avant de l'écrire.

- **Les binaires Playwright peuvent refuser de s'installer en session agent.**
  `playwright install` se fait interrompre et laisse un cache tronqué (~600 Ko),
  puis un verrou `__dirlock` qui bloque les tentatives suivantes. Le CDN, lui,
  répond parfaitement en `curl`. Repli : supprimer le verrou, puis télécharger et
  dézipper à la main depuis
  `https://cdn.playwright.dev/dbazure/download/playwright/builds/<produit>/<build>/<archive>`
  vers `~/Library/Caches/ms-playwright/`. Trois produits sont nécessaires :
  `chromium`, `chromium-headless-shell` et `ffmpeg` — ce dernier uniquement
  parce que `video: 'retain-on-failure'` est activé. Sur un poste normal,
  `pnpm --filter bookparking-e2e exec playwright install chromium` suffit.

## Commandes (formes sûres pour un agent)

| Intention | Commande |
|---|---|
| ce qui serait exécuté, sans rien démarrer | `pnpm --filter bookparking-e2e exec playwright test --list` |
| toute la suite, pile locale | `E2E_TARGET=local pnpm --filter bookparking-e2e exec playwright test` |
| une spec | `E2E_TARGET=local pnpm --filter bookparking-e2e exec playwright test tests/real/rental/pricing-estimate.spec.ts` |
| un test par son titre | `E2E_TARGET=local pnpm --filter bookparking-e2e exec playwright test -g 'weekly price'` |
| lint | `pnpm --filter bookparking-e2e exec eslint src tests` |
| typecheck | `pnpm --filter bookparking-e2e exec tsc --noEmit -p tsconfig.json` |

Jamais en session agent : `playwright test --ui` et `playwright show-report`
démarrent un serveur interactif qui ne rend jamais la main ; `--headed` réclame
un affichage.

`E2E_LOCAL_REUSE_STACK=true` rattache la suite à une api et un front déjà
démarrés sur ces ports, ce qui évite de reconstruire l'api à chaque itération.

## Ce qui n'a pas d'équivalent ici

Chaque spec porte en tête ce qu'elle couvre **et** ce qui n'a pas d'équivalent,
avec la raison. Confirmer une demande est atteignable depuis le tableau de bord
du loueur, puisque `GET /rental-request/received` rend l'identifiant des
demandes. Ce qui reste hors de ce barreau depuis SPEC-004 : l'expiration à
48 heures, le prélèvement refusé par la banque et l'annulation par
l'exploitant, qui demanderaient d'attendre deux jours ou une carte refusée au
moment précis de la confirmation — tous prouvés aux barreaux `unit` et
`int-repo` de l'api.
