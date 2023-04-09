import ms from "ms";
import { z } from "zod";

const validatedEnv = z
  .object({
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(["development", "production"]),
    HOST: z.string().default("localhost"),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.preprocess(Number, z.number().int()),
    SMTP_USER: z.string(),
    SMTP_PASSWORD: z.string(),
    SMTP_FROM: z.string(),
    PORT: z.number().default(8000),
    DEBUG: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  .safeParse(process.env);

if (!validatedEnv.success) {
  // cannot use logger here because it depends on config
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(validatedEnv.error.flatten().fieldErrors, null, 2)
  );
  process.exit(1);
}

const { data: env } = validatedEnv;

export const config = {
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  server: {
    host: env.HOST,
    port: env.PORT,
  },
  logging: {
    level: env.DEBUG ? "debug" : "info",
  },
  security: {
    passwordResetRequestLifetime: ms("1d"),
    accessTokenLifetime: ms("1y"),
    bcryptSaltRounds: 10,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    },
    from: env.SMTP_FROM,
  },
} as const;

// export type to for typesafe mocking
export type Config = typeof config;
