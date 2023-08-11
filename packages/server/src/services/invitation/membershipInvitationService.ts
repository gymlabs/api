import { Invitation } from "@gymlabs/db";
import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
import { z } from "zod";

import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
} from "../../errors";
import { sendMembershipInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  if (!invitation) {
    throw new InvalidArgumentError("Invalid invitation type");
  }

  try {
    const { userId, gymId, contractId } = z
      .object({
        userId: z.string().uuid(),
        gymId: z.string().uuid(),
        contractId: z.string().uuid(),
      })
      .parse(invitation.content);

    const membership = await db.membership.create({
      data: {
        user: {
          connect: { id: userId },
        },
        gym: {
          connect: { id: gymId },
        },
        contract: {
          connect: { id: contractId },
        },
      },
    });

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
        throw new NotFoundError("User not found");
      } else {
        throw new InternalServerError();
      }
    }

    return membership;
  } catch (e) {
    throw new InvalidArgumentError("Invalid invitation content");
  }
};

export const sendInvitation = async (
  invitation: Invitation,
  inviter: string,
) => {
  await sendMembershipInvitationEmail(
    invitation.email,
    inviter,
    invitation.token,
  );
};
