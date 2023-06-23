import * as grpc from "@grpc/grpc-js";

import { Viewer } from "../../src/context";

const meta = (viewer: Viewer) => {
  const meta = new grpc.Metadata();
  meta.add("userId", viewer.user?.id ?? "");
  return meta;
};

export { meta };
