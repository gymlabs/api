import * as grpc from "@grpc/grpc-js";
import { core } from "@gymlabs/core.grpc.definition";
import z from "zod";

const validatedEnv = z
  .object({
    CORE_GRPC_HOST: z.string().default("localhost"),
    CORE_GRPC_PORT: z.preprocess(Number, z.number().int()).default(8001),
  })
  .safeParse(process.env);

if (!validatedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(validatedEnv.error.flatten().fieldErrors, null, 2)
  );
  process.exit(1);
}

const { data: env } = validatedEnv;

const client = new core.CoreService(
  `${env.CORE_GRPC_HOST}:${env.CORE_GRPC_PORT}`,
  grpc.credentials.createInsecure()
);

client.waitForReady(Date.now() + 5000, (error) => {
  if (error) {
    console.error(error);
  }
});

export default client;
