import { Invitation } from "@gymlabs/db";
import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";

import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
} from "../../errors";

export const acceptInvitation = async <T>(
  invitation: Invitation,
  acceptanceHandler: () => Promise<T>,
) => {
  if (!invitation) {
    throw new InvalidArgumentError("Invalid invitation type");
  }

  try {
    const result = await acceptanceHandler();

    try {
      await db.invitation.update({
        where: {
          token: invitation.token,
        },
        data: {
          status: "ACCEPTED",
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new NotFoundError(`${invitation.type} invitation not found`);
      } else {
        throw new InternalServerError();
      }
    }
    return result;
  } catch (e) {
    throw new InvalidArgumentError("Invalid invitation content");
  }
};
