import { faker } from "@faker-js/faker";
import { hash } from "bcrypt";

import { AccessToken, PrismaClient, User } from "@gymlabs/core.db";

const prisma = new PrismaClient();

async function main() {
  const USER_COUNT = 1000;

  const users: Array<User> = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const email = faker.internet.email(firstName, lastName);

    const user = await prisma.user.upsert({
      where: { email: email },
      update: {},
      create: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        isEmailVerified: true,
        password: await hash(`${firstName}-${lastName}`, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(
      `Created user ${i + 1}/${USER_COUNT} with email: (${user.email})`
    );
    users.push(user);
  }

  // Seed AccessTokens
  const accessTokens: Array<AccessToken> = [];
  for (let i = 0; i < users.length; i++) {
    const token = `access_token${i}`;
    const saltRounds = 10;
    const hashedToken = await hash(token, saltRounds);

    const accessToken = await prisma.accessToken.upsert({
      where: { token: hashedToken },
      update: {},
      create: {
        userId: users[i]!.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(
      `Created access token ${i + 1}/${users.length} for user: ${
        users[i]!.email
      }`
    );
    accessTokens.push(accessToken);
  }
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
