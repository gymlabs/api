import { once } from "events";
import { createServer } from "node:http";

import { config } from "~/config";
import { db } from "~/db";
import { logger } from "~/logger";
import { yoga } from "~/yoga";

async function main() {
  logger.info(`Log-Level: "${config.logging.level}"`);

  logger.debug("Connecting to database..");
  await db.$connect();
  logger.debug("Connected to database ✅");

  const server = createServer(yoga);

  logger.info("Starting server.. 🚀");

  const { host, port } = config.server;
  server.listen(port, host);
  await once(server, "listening");

  logger.info(`Server ready at http://${host}:${port}`);

  // handle graceful shutdown
  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}..`);
      logger.info("Closing server..");
      server.close();
      await once(server, "close");
      server.closeAllConnections();
      logger.info("Server closed ✅");

      logger.info("Disconnecting from database..");
      await db.$disconnect();
      logger.info("Disconnected from database ✅");
      logger.info("Exiting process..");
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
