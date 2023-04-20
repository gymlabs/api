import ms from "ms";
import { z } from "zod";

const validatedEnv = z
  .object({
    NODE_ENV: z.enum(["development", "production", "client"]),
    DATABASE_URL:
      process.env.NODE_ENV === "client" ? z.string().optional() : z.string(),
    HOST: z.string().default("localhost"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.preprocess(Number, z.number().int()).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    PORT: z.preprocess(Number, z.number().int()).default(8000),
    DEBUG: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  // TODO: fix this - when you have the Muse
  // .refine(
  //   (env) => {
  //     if (env.NODE_ENV === "client") {
  //       return (
  //         !("DATABASE_URL" in env) &&
  //         !("SMTP_HOST" in env) &&
  //         !("SMTP_PORT" in env) &&
  //         !("SMTP_USER" in env) &&
  //         !("SMTP_PASSWORD" in env) &&
  //         !("SMTP_FROM" in env)
  //       );
  //     }
  //     return true;
  //   },
  //   {
  //     message:
  //       "Additional fields are required for NODE_ENV other than 'client'",
  //     path: [
  //       "DATABASE_URL",
  //       "SMTP_HOST",
  //       "SMTP_PORT",
  //       "SMTP_USER",
  //       "SMTP_PASSWORD",
  //       "SMTP_FROM",
  //     ],
  //   }
  // )
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
