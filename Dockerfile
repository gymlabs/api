FROM node:18 AS base

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/server/package.json ./packages/server/
COPY .npmrc ./
RUN npm ci

FROM node:18 AS builder

WORKDIR /app
COPY packages/database ./packages/database
COPY packages/server ./packages/server
COPY package.json package-lock.json ./
COPY lerna.json ./
COPY package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
RUN npm run build

FROM node:18 AS production

ARG DATABASE_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV CORS_ORIGIN=http://localhost:3000
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


# DATABASE_URL=postgresql://dbmasteruser:"|d;Z^kW([%oP~7~&U3ou=pX[mgNxT+6A"@ls-240c9ccd59155f79942efdf0ccb13ac4816cefa6.cppwexrj6uef.eu-central-1.rds.amazonaws.com:5432 # e.g. postgresql://dbmasteruser:"|d;Z^kW([%oP~7~&U3ou=pX[mgNxT+6A"@ls-240c9ccd59155f79942efdf0ccb13ac4816cefa6.cppwexrj6uef.eu-central-1.rds.amazonaws.com:5432
# NODE_ENV=development # development | production
# HOST=0.0.0.0
# PORT=8000
# CORS_ORIGIN=localhost:3000 # e.g. http://localhost:3000
# DEBUG=true # true | false, setting this to true is recommended during development
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=

# COMMUNICATION_GRPC_HOST=localhost # 'localhost' if not specified otherwise
# COMMUNICATION_GRPC_PORT=8003 # if not specified otherwise
