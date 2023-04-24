import * as grpc from "@grpc/grpc-js";
import type {
  GetUserByIdInput__Output,
  User__Output,
} from "@gymlabs/core.grpc.definition";

import { db } from "../../db";

const getUserById = async (
  call: grpc.ServerUnaryCall<GetUserByIdInput__Output, User__Output>,
  callback: grpc.sendUnaryData<User__Output>
) => {
  try {
    const { id } = call.request;
    const user = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!user) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "User not found",
      });
    }
    callback(null, user);
  } catch (e) {
    console.log(e);
    callback({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
  }
};

export { getUserById };
