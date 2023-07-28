import seedAccessRights from "./accessRights";
import {
  createRandomContract,
  createRandomGym,
  createRandomOrganization,
} from "./factories";
import seedUsers from "./users";
import { PrismaClient } from "../../dist/client";

function getRandomNumberArray(min: number, max: number): number[] {
  const length = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array(length).fill(0);
}

const prisma = new PrismaClient();
async function main() {
  const ORGANIZATION_COUNT = 10;

  for (let i = 0; i < ORGANIZATION_COUNT; i++) {
    const organization = await prisma.organization.create({
      data: createRandomOrganization(),
    });
    console.log(`Created ${organization.name} with id: ${organization.id}`);

    const contracts = getRandomNumberArray(1, 4);
    contracts.map(
      async () =>
        await prisma.contract.create({
          data: createRandomContract(organization.id),
        })
    );
    console.log(`Created ${contracts.length} contracts`);

    const gyms = getRandomNumberArray(1, 10);
    gyms.map(
      async () =>
        await prisma.gym.create({
          data: createRandomGym(organization.id),
        })
    );
    console.log(`Created ${gyms.length} gyms`);
  }

  await seedUsers(prisma);
  await seedAccessRights(prisma);
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
