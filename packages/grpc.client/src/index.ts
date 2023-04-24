import * as grpc from "@grpc/grpc-js";
import { core } from "@gymlabs/core.grpc.definition";

const client = new core.CoreService(
  `${process.env["GRPC_HOST"]}:${process.env["GRPC_PORT"]}`,
  grpc.credentials.createInsecure()
);

client.waitForReady(Date.now() + 5000, (error) => {
  if (error) {
    console.error(error);
  }
});

export default client;
