// @ts-check
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// L'app mobile réutilise l'hexagone du front tel quel (entités, epics, slices,
// sélecteurs, adaptateurs HTTP) : c'est l'alias `@front/*` du tsconfig.
//
// Un fichier de `apps/front/src` qui importe `@reduxjs/toolkit` le trouverait
// sinon dans `apps/front/node_modules` — une autre copie que celle du mobile,
// pnpm les distinguant par leurs pairs (React 19.3 d'un côté, 19.2 de
// l'autre). Deux instances de RTK, c'est deux `createAction` et deux
// `configureStore` qui ne se connaissent pas. Les paquets nus importés depuis
// le front se résolvent donc comme s'ils l'étaient depuis le mobile : une seule
// copie de chaque bibliothèque dans le bundle.
const FRONT_SOURCE = path.resolve(__dirname, '../front/src') + path.sep;
const FROM_MOBILE = path.join(__dirname, 'package.json');

const isBarePackage = (moduleName) =>
  !moduleName.startsWith('.') && !moduleName.startsWith('/') && !moduleName.startsWith('@/') && !moduleName.startsWith('@front/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isBarePackage(moduleName) && context.originModulePath.startsWith(FRONT_SOURCE)) {
    return context.resolveRequest({ ...context, originModulePath: FROM_MOBILE }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
