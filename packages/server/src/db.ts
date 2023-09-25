import { PrismaClient } from "@gymlabs/db";

import { config } from "./config";

let db: ExtendedPrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db: ExtendedPrismaClient | undefined;
}

function createPrismaClient() {
  const prisma = new PrismaClient().$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async delete({ model, args }) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          return await (prisma as any)[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
      },
    },
  }) as PrismaClient;
  return prisma;
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

if (config.nodeEnv === "production") {
  db = createPrismaClient();
} else {
  global.__db ??= createPrismaClient();
  db = global.__db;
}

export { db };
