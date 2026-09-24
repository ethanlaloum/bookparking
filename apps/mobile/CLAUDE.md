# bookparking-mobile

L'app iPhone de Bookparking : Expo SDK 57 (React Native 0.86, React 19.2), expo-router, testée
dans **Expo Go**. Même direction artistique que le site (« Signal Riviera »), mêmes textes,
même logique métier — qu'elle ne réécrit pas.

## Lancer l'app sur un iPhone

1. La base et l'api tournent sur le Mac (voir la pile de dev locale). L'api doit être joignable
   depuis le réseau local : NestJS écoute sur toutes les interfaces par défaut, rien à changer.
2. `pnpm mobile start` (ou `pnpm --filter bookparking-mobile start`), puis scanner le QR code
   avec l'appareil photo de l'iPhone. Le téléphone et le Mac sur **le même Wi-Fi**.
3. L'app trouve l'api toute seule : `src/lib/apiBaseUrl.ts` prend l'adresse du Mac dans
   `Constants.expoConfig.hostUri` (celle d'où Expo Go charge le bundle) et vise le port 3000.
   `EXPO_PUBLIC_API_BASE_URL` force une autre adresse (tunnel, autre machine).

## Architecture : un hexagone, deux côtés pilotants

- **`@front/*` pointe sur `apps/front/src`** (`tsconfig.json` + Metro, qui lit les `paths`).
  L'app importe entités, epics, reducers, sélecteurs, `FetchHttpClient`, passerelles et locales
  du site. Elle n'a ni slice, ni epic, ni règle à elle : `estimateRentalPriceInCents`,
  `cancellationTermsOf`, `moneyLabelOf`, `keepOrRenewIntent`… sont ceux du front, prouvés par
  la suite vitest du front. Une règle métier se change là-bas, jamais ici.
- **La racine de composition est `src/store/createMobileStore.ts`**, pendant de
  `apps/front/src/store/redux.ts`. Trois adaptateurs natifs remplacent ceux du navigateur :
  - `SecureStoreSessionStore` — le jeton dans le trousseau iOS (API synchrone
    d'`expo-secure-store`, parce que le port `SessionStore` est synchrone) ;
  - `InAppBrowserPaymentPageNavigator` — Stripe Checkout dans un SFSafariViewController ;
  - `NoThirdPartyConsentStore` — voir plus bas.
- **Écrans** : `src/app/` (expo-router). Quatre onglets (`(tabs)/` : accueil, recherche,
  réservations, compte), la fiche `place/[id]`, l'écran `paiement/[requestId]`, et trois
  feuilles modales (`connexion`, `inscription`, `publier`). Les quatre onglets
  d'administration du site n'existent pas ici : l'app le dit au compte administrateur.

## Things that will bite you

- **`metro.config.js` résout les paquets importés depuis `apps/front/src` comme s'ils l'étaient
  depuis `apps/mobile`.** pnpm installe deux copies de `@reduxjs/toolkit` (le front est en
  React 19.3, le mobile en 19.2 : les pairs diffèrent, donc les dossiers du store aussi). Sans
  la redirection, les `createAction` du front et le `configureStore` du mobile viendraient de
  deux instances. Vérifié par la source map du bundle iOS : une seule copie de RTK, de RxJS, de
  react-redux et de React. Ne pas retirer ce `resolveRequest` : rien ne casserait à la
  compilation, tout divergerait à l'exécution.
- **Tout paquet importé par un fichier du front réutilisé doit être une dépendance du mobile**
  (aujourd'hui : `@reduxjs/toolkit`, `redux-observable`, `rxjs`, `@noble/hashes`). La redirection ci-dessus le
  cherche dans `apps/mobile/node_modules` ; absent, Metro échoue au bundle.
- **Le retour de Stripe ne revient pas dans l'app, et ce n'est pas un bug.** L'adresse de retour
  est `FRONT_BASE_URL` (le site) : sur le téléphone, la page de Stripe finit sur une page que
  Safari ne sait pas joindre. L'écran de paiement relit la demande toutes les 2,5 s tant que la
  page est ouverte et **la referme lui-même** dès que l'empreinte est posée — c'est l'événement
  signé reçu par l'api qui tranche, comme sur le site. Fermée sans payer, la page laisse
  « Reprendre le paiement » (Stripe la garde trente minutes) ou « Abandonner la demande ». Il
  faut donc `stripe listen` pendant un essai de paiement, exactement comme pour le site.
  `openAuthSessionAsync` ne conviendrait pas : il n'intercepte qu'un schéma d'app, pas une
  adresse `http`.
- **Pas de bandeau de consentement, et c'est voulu.** Le site demande l'accord pour Google Fonts
  et les tuiles OpenStreetMap ; l'app embarque ses polices et affiche la carte du système
  (Plans, `react-native-maps` sans fournisseur). La Base Adresse Nationale est appelée pour le
  géocodage et la recherche d'adresse, comme sur le site — service demandé ou nécessaire à la
  carte. Le jour où l'app appelle un tiers de son propre chef, `NoThirdPartyConsentStore` doit
  céder la place à un vrai magasin et à un écran.
- **Les pages légales restent sur le site.** L'inscription ouvre `/conditions-d-utilisation` et
  `/donnees-personnelles` dans le navigateur intégré, à l'adresse de `resolveFrontBaseUrl()`.
  En dev, Vite n'écoute que sur le Mac : `pnpm front dev --host` pour les ouvrir du téléphone.
- **Les paramètres de route de la recherche portent les clés de l'URL du site** (`adresse`,
  `lat`, `lon`, `vehicule`, `duree`) et passent par `criteriaFromSearchParams` /
  `criteriaToSearchParams` : un lien du site et une route de l'app disent la même chose.
- **L'identifiant d'intention vient d'`expo-crypto`.** Hermes n'a pas `crypto.randomUUID()` ;
  `keepOrRenewIntent` reçoit `Crypto.randomUUID`. Revenir sur la fiche (focus) commence une
  nouvelle intention, comme un rechargement sur le site.
- **`intl-pluralrules` est importé en tête de `src/lib/i18n.ts`.** Sans `Intl.PluralRules`,
  i18next ne choisit pas entre `_one` et `_other`.
- **Les ombres sont des `boxShadow` et les transitions des propriétés CSS de Reanimated 4**
  (`transitionProperty`, `animationName`) : les deux exigent la nouvelle architecture, qu'Expo
  Go impose. Les dégradés radiaux de la surface d'encre sont un SVG (`InkSurface`), React
  Native n'en peignant pas.
- **`~/.expo` appartenait à `root` sur la machine de dev** (un ancien `sudo expo`) : `expo
  install` et `expo start` échouaient en `EACCES`. `sudo chown -R "$(whoami)" ~/.expo` règle le
  problème ; à défaut, `__UNSAFE_EXPO_HOME_DIRECTORY=<dossier inscriptible>`.

## Commandes

| Intention | Commande |
|---|---|
| lancer (QR code pour Expo Go) | `pnpm --filter bookparking-mobile start` |
| typecheck (app + fichiers du front importés) | `pnpm --filter bookparking-mobile typecheck` |
| bundle iOS sans téléphone (vérifie Metro) | `pnpm --filter bookparking-mobile exec expo export --platform ios --output-dir <dossier temporaire>` |
| ajouter un paquet natif | `pnpm --filter bookparking-mobile exec expo install <paquet>` — jamais `pnpm add` : `expo install` choisit la version que porte Expo Go |

Aucun test ici : la logique vit dans le front et s'y prouve. Ce dossier ne contient que ce qui
se rend — écrans, composants, adaptateurs natifs.
