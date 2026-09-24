# L'api sur Railway. Le contexte est la racine du dépôt : pnpm a besoin du
# lockfile et du pnpm-workspace.yaml (allowBuilds) du monorepo.
FROM node:22-slim

WORKDIR /app
# Le corepack livré avec Node peut ne pas connaître les clés de signature
# récentes de pnpm : on prend le sien, puis le pnpm épinglé par packageManager.
RUN npm install -g corepack@latest && corepack enable

COPY . .
# L'api et elle seule : ni Expo, ni Playwright dans l'image.
RUN pnpm install --frozen-lockfile --filter bookparking-api...
RUN pnpm --filter bookparking-api build

WORKDIR /app/apps/api
ENV NODE_ENV=production
# PORT, DATABASE_URL et les autres viennent des variables du service Railway.
CMD ["node", "dist/main.js"]
