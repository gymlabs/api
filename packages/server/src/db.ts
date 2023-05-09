import { PrismaClient } from "@gymlabs/core.db";

import { config } from "./config";

let db: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db: PrismaClient | undefined;
}

if (config.nodeEnv === "production") {
  db = new PrismaClient();
} else {
  global.__db ??= new PrismaClient();
  db = global.__db;
}

export { db };