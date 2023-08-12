import { Invitation } from "@gymlabs/db";
import { z } from "zod";

import { acceptInvitation as baseAcceptInvitation } from "./baseService";
import { db } from "../../db";
import { sendEmploymentInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  const acceptanceHandler = async () => {
    const { userId, gymId, roleId } = z
      .object({
        userId: z.string().uuid(),
        gymId: z.string().uuid(),
        roleId: z.string().uuid(),
      })
      .parse(invitation.content);

    return await db.employment.create({
      data: {
        user: {
          connect: { id: userId },
        },
        gym: {
          connect: { id: gymId },
        },
        role: {
          connect: { id: roleId },
        },
      },
    });
  };

  return await baseAcceptInvitation(invitation, acceptanceHandler);
};

export const sendInvitation = async (
  invitation: Invitation,
  inviter: string,
) => {
  await sendEmploymentInvitationEmail(
    invitation.email,
    inviter,
    invitation.token,
  );
};
