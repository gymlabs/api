import { faker } from "@faker-js/faker";
import { hash } from "bcrypt";

import { Category, PrismaClient } from "@gymlabs/db";

export default async function (prisma: PrismaClient) {
  await pruneDatabase(prisma);

  const organization = await prisma.organization.create({
    data: {
      name: "GymLabs",
    },
  });

  [
    "Kevins Kniebeugenpalast",
    "Nicolas Nacken-Nest",
    "Consti's Curl-Castle",
  ].map(async (name) => {
    await prisma.gym.create({
      data: {
        name: name,
        description: faker.lorem.sentence(),
        street: faker.location.street(),
        postalCode: faker.location.zipCode(),
        city: faker.location.city(),
        country: faker.location.country(),
        organization: {
          connect: {
            id: organization.id,
          },
        },
      },
    });
  });

  const masterRights = await prisma.accessRight.findMany({
    where: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
  });

  // seed organization admin
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
  const gyms = await prisma.gym.findMany();
  const names = ["Kevin", "Nicolas", "Consti"];

  await Promise.all(
    names.map(async (name) => {
      const gymId = gyms.filter((gym) => gym.name.includes(name))[0].id;
      await prisma.employment.create({
        data: {
          role: {
            create: {
              name: "Admin",
              gym: {
                connect: {
                  id: gymId,
                },
              },
              accessRights: {
                connect: masterRights.map((right) => ({ id: right.id })),
              },
            },
          },
          user: {
            create: {
              firstName: name,
              lastName: "Gymlabs",
              email: `${name}@gymlabs.de`,
              password: await hash(`${name}-Gymlabs`, 10),
            },
          },
          gym: {
            connect: {
              id: gymId,
            },
          },
        },
      });
    }),
  );

  const contractNames = ["Base", "Premium", "Chad"];
  const contractDurations = [6, 12, 24];
  for (const gym of gyms) {
    for (const contractName of contractNames) {
      await prisma.contract.create({
        data: {
          name: contractName,
          description: `${contractName} contract for ${gym.name}`,
          monthlyCost: parseFloat(faker.finance.amount(20, 100)),
          contractDuration: faker.helpers.arrayElement(contractDurations),
          organization: {
            connect: {
              id: organization.id,
            },
          },
        },
      });
    }
  }

  const contracts = await prisma.contract.findMany();
  for (let i = 0; i < 10; i++) {
    for (const gym of gyms) {
      const contractId = faker.helpers.arrayElement(contracts).id;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({
        firstName,
        lastName,
        provider: "gymlabs",
      });
      const password = `${firstName}-${lastName}`;
      await prisma.membership.create({
        data: {
          isActive: true,
          gym: {
            connect: {
              id: gym.id,
            },
          },
          user: {
            create: {
              firstName: firstName,
              lastName: lastName,
              email: email,
              password: await hash(password, 10),
            },
          },
          contract: {
            connect: {
              id: contractId,
            },
          },
        },
      });
    }
  }

  const users = await prisma.user.findMany();
  users.map(async (user) => {
    const token = `access_token_${user.id}`;
    const saltRounds = 10;
    const hashedToken = await hash(token, saltRounds);

    await prisma.accessToken.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });
}

const pruneDatabase = async (prisma: PrismaClient) => {
  await prisma.workoutPlanItem.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.exerciseStep.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.resetRequest.deleteMany();
  await prisma.accessToken.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.role.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.accessRight.deleteMany();
  await prisma.user.deleteMany();
};
