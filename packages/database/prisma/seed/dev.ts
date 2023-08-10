import { faker } from "@faker-js/faker";
import { hash } from "bcrypt";

import { Category, PrismaClient } from "@gymlabs/db";

export default async function (prisma: PrismaClient) {
  await pruneDatabase(prisma);

  console.log("🌱 Seeding organizations..");
  const ORGANIZATION_COUNT = 3;
  for (let i = 0; i < ORGANIZATION_COUNT; i++) {
    await prisma.organization.create({
      data: {
        name: faker.company.name(),
      },
    });
  }
  const organizations = await prisma.organization.findMany();
  console.log("✅ Seeding organizations complete!");
  console.log("----------------------------------");

  console.log("🌱 Seeding contracts..");
  organizations.forEach(async (organization) => {
    getRandomNumberArray(1, 4).map(async () => {
      await prisma.contract.create({
        data: {
          name: faker.color.human(),
          description: faker.lorem.sentence(),
          monthlyCost: parseFloat(faker.finance.amount(20, 100)),
          contractDuration: faker.helpers.arrayElement([6, 12, 24]),
          organization: {
            connect: {
              id: organization.id,
            },
          },
        },
      });
    });
  });
  console.log("✅ Seeding contracts complete!");
  console.log("----------------------------------");

  console.log("🌱 Seeding gyms..");
  organizations.forEach(async (organization) => {
    getRandomNumberArray(1, 10).map(async () => {
      await prisma.gym.create({
        data: {
          name: faker.company.name(),
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
  });
  const gyms = await prisma.gym.findMany();
  console.log("✅ Seeding gyms complete!");
  console.log("----------------------------------");

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
  console.log("----------------------------------");
  const accessRightIds = await prisma.accessRight.findMany({
    select: {
      id: true,
    },
  });

  console.log("🌱 Seeding employments..");
  gyms.forEach(async (gym) => {
    getRandomNumberArray(1, 10).map(async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({
        firstName,
        lastName,
        provider: "gymlabs.de",
      });

      const rightIds = getRandomNumberArray(5, 80).map(() => {
        return faker.helpers.arrayElement(accessRightIds).id;
      });

      await prisma.employment.create({
        data: {
          role: {
            create: {
              name: faker.person.jobTitle(),
              gym: {
                connect: {
                  id: gym.id,
                },
              },
              accessRights: {
                connect: rightIds.map((id) => ({ id })),
              },
            },
          },
          user: {
            create: {
              firstName: firstName,
              lastName: lastName,
              email: email.toLowerCase(),
              isEmailVerified: true,
              password: await hash(`${firstName}-${lastName}`, 10),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          gym: {
            connect: {
              id: gym.id,
            },
          },
        },
      });
    });
  });
  console.log("✅ Seeding employments complete!");
  console.log("----------------------------------");

  console.log("🌱 Seeding Master Employees..");
  const masterRights = await prisma.accessRight.findMany({
    where: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
  });

  gyms.forEach(async (gym) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({
      firstName,
      lastName,
      provider: "gymlabs.de",
    });

    await prisma.employment.create({
      data: {
        role: {
          create: {
            name: "Master",
            gymId: gym.id,
            accessRights: {
              connect: masterRights.map((right) => ({ id: right.id })),
            },
          },
        },
        user: {
          create: {
            firstName: firstName,
            lastName: lastName,
            email: email.toLowerCase(),
            isEmailVerified: true,
            password: await hash(`${firstName}-${lastName}`, 10),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        gym: {
          connect: {
            id: gym.id,
          },
        },
      },
    });
  });
  console.log("✅ Seeding Master Employees complete!");
  console.log("----------------------------------");

  console.log("🌱 Seeding memberships..");
  gyms.forEach(async (gym) => {
    const contracts = await prisma.contract.findMany({
      where: {
        organizationId: gym.organizationId,
      },
    });

    getRandomNumberArray(20, 120).map(async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({
        firstName,
        lastName,
        provider: "gymlabs.de",
      });

      await prisma.membership.create({
        data: {
          user: {
            create: {
              firstName: firstName,
              lastName: lastName,
              email: email.toLowerCase(),
              isEmailVerified: true,
              password: await hash(`${firstName}-${lastName}`, 10),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          gym: {
            connect: {
              id: gym.id,
            },
          },
          contract: {
            connect: {
              id: faker.helpers.arrayElement(contracts).id,
            },
          },
        },
      });
    });
  });
  console.log("✅ Seeding memberships complete!");
  console.log("----------------------------------");

  console.log("🌱 Seeding independent users..");
  const USER_COUNT = 24;
  for (let i = 0; i < USER_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({
      firstName,
      lastName,
      provider: "gymlabs.de",
    });

    await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        isEmailVerified: true,
        password: await hash(`${firstName}-${lastName}`, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  console.log("✅ Seeding independent users complete!");
  console.log("----------------------------------");
  const users = await prisma.user.findMany();

  console.log("🌱 Seeding access tokens..");
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
  console.log("✅ Seeding access tokens complete!");
  console.log("----------------------------------");
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

const getRandomNumberArray = (min: number, max: number): number[] => {
  const length = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array(length).fill(0);
};
