FROM node:16 AS builder

WORKDIR /app
COPY . . 
RUN npm ci && npm run prisma:generate && npm run build

FROM node:16

ARG NODE_ENV=production
ARG DATABASE_URL
ARG HOST=0.0.0.0

ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV HOST=${HOST}

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD [ "npm", "run", "start:migrate" ]
