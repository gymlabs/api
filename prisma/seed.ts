import { AccessToken, PrismaClient, User } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

const firstNames = [
  "Lukas",
  "Maximilian",
  "Johannes",
  "Benjamin",
  "Leon",
  "Finn",
  "Niklas",
  "David",
  "Paul",
  "Jan",
  "Sophie",
  "Maria",
  "Anna",
  "Emma",
  "Lena",
  "Laura",
  "Julia",
  "Lisa",
  "Hannah",
  "Sarah",
];

const lastNames = [
  "Müller",
  "Schmidt",
  "Schneider",
  "Fischer",
  "Weber",
  "Meyer",
  "Wagner",
  "Becker",
  "Hoffmann",
  "Schulz",
  "Koch",
  "Bauer",
  "Sauer",
  "Krause",
  "Huber",
  "Berger",
  "Kaiser",
  "Schreiber",
  "Bader",
  "Bender",
];

async function main() {
  // Seed Users
  const users: Array<User> = [];
  for (let i = 0; i < firstNames.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: `${firstNames[i]}@${lastNames[i]}.de` },
      update: {},
      create: {
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `${firstNames[i]}@${lastNames[i]}.de`.toLowerCase(),
        isEmailVerified: true,
        password: await hash(`${firstNames[i]}${lastNames[i]}`, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
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
        userId: users[i].id,
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
