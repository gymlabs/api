import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import type { CoreServiceHandlers } from "./types/core/CoreService";
import type {
  GetUserByIdInput,
  GetUserByIdInput__Output,
} from "./types/core/GetUserByIdInput";
import type { User, User__Output } from "./types/core/User";
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

export {
  core,
  User,
  User__Output,
  GetUserByIdInput,
  GetUserByIdInput__Output,
  ProtoGrpcType,
  CoreServiceHandlers,
};
