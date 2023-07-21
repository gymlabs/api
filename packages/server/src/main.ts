import http from "http";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import * as grpc from "@grpc/grpc-js";
import { CoreServiceHandlers, core } from "@gymlabs/core.grpc.definition";
import { json } from "body-parser";
import cors from "cors";
import express from "express";

import { config } from "./config";
import { Context, getContext } from "./context";
import { db } from "./db";
import { logger } from "./logger";
import { schema } from "./schema";
import { getUserById } from "./services/grpc/user";

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
      origin: config.server.corsOrigion,
      credentials: true,
    }),
    json(),
    expressMiddleware(apolloServer, {
      context: getContext,
    })
  );

  const { host, port } = config.server;
  await new Promise<void>((resolve) =>
    httpServer.listen({ host, port }, resolve)
  );

  logger.info(`🚀 Server ready at http://${host}:${port}/graphql`);
}

async function grpcMain() {
  logger.info(`Logging level: "${config.logging.level}"`);

  const server = new grpc.Server();

  logger.debug("Setting up core service..");
  const coreServiceHandler: CoreServiceHandlers = {
    GetUserById: getUserById,
  };

  server.addService(core.CoreService.service, coreServiceHandler);
  logger.debug("Service added ✅");

  const { host, grpcPort } = config.server;
  server.bindAsync(
    `${host}:${grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, grpcPort) => {
      if (err) {
        console.log(err);
      }
      logger.debug(`Server starting.. 🚀`);
      server.start();
      logger.info(`Server ready at grpc://${host}:${grpcPort}`);
    }
  );

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Closing grpc server due to received ${signal}..`);
      server.tryShutdown(async (err) => {
        if (err) {
          console.error(err);
        }
        logger.info("Grpc server closed ✅");
        logger.info("Disconnecting from database..");
        await db.$disconnect();
        logger.info("Disconnected from database ✅");
        logger.info("Exiting process..");
        process.exit(0);
      });
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

grpcMain().catch((error) => {
  console.error(error);
  process.exit(1);
});
