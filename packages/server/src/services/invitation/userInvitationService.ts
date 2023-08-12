import { Invitation } from "@gymlabs/db";
import { z } from "zod";

import { acceptInvitation as baseAcceptInvitation } from "./baseService";
import { db } from "../../db";
import { InvalidArgumentError } from "../../errors";
import { sendUserInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  const acceptanceHandler = async () => {
    const registerUserData = z
      .object({
        firstName: z.string().min(3),
        lastName: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(12),
      })
      .parse(invitation.content);

    return await db.user.create({
      data: {
        ...registerUserData,
      },
    });
  };

  return await baseAcceptInvitation(invitation, acceptanceHandler);
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
