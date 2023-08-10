import http from "http";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { json } from "body-parser";
import cors from "cors";
import express from "express";

import { config } from "./config";
import { Context, getContext } from "./context";
import { db } from "./db";
import { logger } from "./logger";
import { schema } from "./schema";

async function main() {
  logger.info(`Log-Level: "${config.logging.level}"`);

  logger.debug("Connecting to database..");
  await db.$connect();
  logger.debug("Connected to database ✅");

  logger.info("Starting server.. 🚀");

  const app = express();
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer<Context>({
    schema,
    logger,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  app.use(
    "/",
    cors<cors.CorsRequest>({
      origin: config.server.corsOrigin,
      credentials: true,
    }),
    json(),
    expressMiddleware(apolloServer, {
      context: getContext,
    }),
  );

  const { host, port } = config.server;
  await new Promise<void>((resolve) =>
    httpServer.listen({ host, port }, resolve),
  );

  logger.info(`🚀 Server ready at http://${host}:${port}/graphql`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
