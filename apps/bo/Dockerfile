# Le back-office sur Railway : le build Vite, servi par Caddy, qui relaie /api
# vers l'api sur le réseau privé — même origine pour le navigateur, comme le
# proxy de Vite en dev (l'api ne pose aucun en-tête CORS).
FROM node:22-slim AS build

WORKDIR /app
RUN npm install -g corepack@latest && corepack enable

COPY . .
# Le front aussi : les composants et l'hexagone que le back-office lui emprunte
# (`@front/*`) résolvent leurs paquets depuis apps/front/node_modules.
RUN pnpm install --frozen-lockfile --filter bookparking-bo... --filter bookparking-front...

RUN pnpm --filter bookparking-bo build

FROM caddy:2-alpine
COPY apps/bo/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/bo/dist /srv
