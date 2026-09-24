# Le site sur Railway : le build Vite, servi par Caddy, qui relaie aussi /api
# vers l'api sur le réseau privé — même origine pour le navigateur, comme le
# proxy de Vite en dev (l'api ne pose aucun en-tête CORS).
FROM node:22-slim AS build

WORKDIR /app
RUN npm install -g corepack@latest && corepack enable

COPY . .
RUN pnpm install --frozen-lockfile --filter bookparking-front...

# Lue au build par Vite ; sans elle, le bouton de l'App Store dit « Bientôt ».
ARG VITE_APP_STORE_URL
RUN pnpm --filter bookparking-front build

FROM caddy:2-alpine
COPY apps/front/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/front/dist /srv
