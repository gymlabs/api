FROM node:18-alpine AS base 

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/server/package.json ./packages/server/
RUN npm ci

FROM node:18-alpine AS builder

WORKDIR /app
COPY packages/database ./packages/database
COPY packages/server ./packages/server
COPY package.json package-lock.json ./
COPY lerna.json ./
COPY package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS production

ARG DATABASE_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV CORS_ORIGIN=https://app.gymlabs.de
ENV DEBUG=false
ENV HOST=0.0.0.0
ENV PORT=8000

WORKDIR /app
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/server/build ./packages/server/build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/lerna.json ./lerna.json

EXPOSE 8000

CMD [ "npm", "run", "start" ]