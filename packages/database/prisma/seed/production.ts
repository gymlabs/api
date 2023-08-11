import { Category, PrismaClient } from "@gymlabs/db";

export default async function (prisma: PrismaClient) {
  console.log("🌱 Seeding access rights..");
  const booleanValues = [true, false];
  for (const category in Category) {
    for (const create of booleanValues) {
      for (const read of booleanValues) {
        for (const update of booleanValues) {
          for (const del of booleanValues) {
            await prisma.accessRight.create({
              data: {
                category: category as Category,
                create,
                read,
                update,
                delete: del,
              },
            });
          }
        }
      }
    }
  }
  console.log("✅ Seeding access rights complete!");
}
