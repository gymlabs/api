import { Invitation } from "@gymlabs/db";
import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
import { z } from "zod";

import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
} from "../../errors";
import { sendUserInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  if (!invitation) {
    throw new InvalidArgumentError("Invalid invitation type");
  }

  try {
    const registerUserData = z
      .object({
        firstName: z.string().min(3),
        lastName: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(12),
      })
      .parse(invitation.content);

    const user = await db.user.create({
      data: {
        ...registerUserData,
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

    return user;
  } catch (e) {
    throw new InvalidArgumentError("Invalid invitation content");
  }
};

export const sendInvitation = async (
  invitation: Invitation,
  inviter: string,
) => {
  const user = await db.user.findUnique({
    where: {
      email: invitation.email,
    },
  });

  if (user) {
    throw new InvalidArgumentError("User already exists");
  }

  await sendUserInvitationEmail(invitation.email, inviter, invitation.token);
};
