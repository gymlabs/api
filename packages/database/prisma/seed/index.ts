import seedDevDB from "./dev";
import seedProductionDB from "./production";
import { PrismaClient } from "../../dist/client";

const prisma = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === "production") {
    await seedProductionDB(prisma);
  } else {
    await seedDevDB(prisma);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
