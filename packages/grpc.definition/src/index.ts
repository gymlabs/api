import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import type { ProtoGrpcType } from "./types/service";

const PROTO_PATH = path.join(__dirname, "service.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const { core } = grpc.loadPackageDefinition(
  packageDefinition
) as unknown as ProtoGrpcType;

export { core };
export type * from "./types";
