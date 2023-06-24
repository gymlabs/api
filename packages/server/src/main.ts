import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import * as grpc from "@grpc/grpc-js";
import { CoreServiceHandlers, core } from "@gymlabs/core.grpc.definition";

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

  const { host, port } = config.server;

  const apolloServer = new ApolloServer<Context>({
    schema,
    logger,
    stopOnTerminationSignals: false, // we handle that ourselves
  });

  const { url } = await startStandaloneServer(apolloServer, {
    context: getContext,
    listen: { host, port },
  });

  logger.info(`Server ready at ${url}`);

  // handle graceful shutdown ourselves to also disconnect from database
  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Closing http server due to received ${signal}..`);
      apolloServer.stop();
      logger.info("Http server closed ✅");
      logger.info("Disconnecting from database..");
      await db.$disconnect();
      logger.info("Disconnected from database ✅");
      logger.info("Exiting process..");
      process.exit(0);
    });
  });
}

async function grpcMain() {
  logger.info(`Logging level: "${config.logging.level}"`);

  const server = new grpc.Server();

  logger.debug("Setting up admin service..");
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
