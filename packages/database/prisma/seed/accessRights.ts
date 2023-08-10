import type { PrismaClient } from "../../dist/client";
import { Category } from "../../dist/client";

export default async function seedAccessRights(prisma: PrismaClient) {
  try {
    const booleanValues = [true, false];

    console.log("🌱 Seeding access rights..");

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

    console.log("🌱 Seeding master roles..");

    const masterRights = await prisma.accessRight.findMany({
      where: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    });

    const gyms = await prisma.gym.findMany();

    for (const gym of gyms) {
      await prisma.role.create({
        data: {
          name: "Master",
          gymId: gym.id,
          accessRights: {
            connect: masterRights.map((right) => ({ id: right.id })),
          },
        },
      });
    }

    console.log("✅ Seeding master roles complete!");
  } catch (err) {
    console.error("❌ Error seeding access rights: ", err);
  }
}
