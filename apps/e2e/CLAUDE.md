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

- **Le piège §9 du handbook ne s'applique pas ici.** Cette api n'a ni outbox, ni
  `@Cron`, ni worker : rien d'asynchrone à drainer, donc aucun exemple n'est à
  refouler vers le barreau `journey` pour cette raison. Si un outbox apparaît,
  relire le §9 avant d'écrire le moindre test qui attend un effet de bord.

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
avec la raison. Le cas le plus structurant : **confirmer une demande de
location**. L'api ne rend l'identifiant d'une demande sur aucune route et
n'en liste aucune, donc `POST /rental-request/:id/confirmation` est
inatteignable depuis un navigateur. L'exemple reste au barreau `int-http` tant
que le contrat n'expose pas cet identifiant.
