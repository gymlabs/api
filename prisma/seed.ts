import { AccessToken, PrismaClient, User } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Seed Users
  const users: Array<User> = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        firstName: `User${i}`,
        lastName: `LastName${i}`,
        email: `user${i}@example.com`,
        isEmailVerified: true,
        password: `hashedpassword${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    users.push(user);
  }

  // Seed AccessTokens
  const accessTokens: Array<AccessToken> = [];
  for (let i = 1; i <= 10; i++) {
    const token = `access_token${i}`;
    const saltRounds = 10;
    const hashedToken = await hash(token, saltRounds);

    const accessToken = await prisma.accessToken.upsert({
      where: { token: hashedToken },
      update: {},
      create: {
        userId: users[i - 1].id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
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
