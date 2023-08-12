import { Invitation } from "@gymlabs/db";
import { z } from "zod";

import { acceptInvitation as baseAcceptInvitation } from "./baseService";
import { db } from "../../db";
import { UnauthorizedError } from "../../errors";
import { authenticateGymEntity } from "../../lib/authenticate";
import { sendMembershipInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  const acceptanceHandler = async () => {
    const { userId, gymId, contractId } = z
      .object({
        userId: z.string().uuid(),
        gymId: z.string().uuid(),
        contractId: z.string().uuid(),
      })
      .parse(invitation.content);

    if (
      !(await authenticateGymEntity(
        "MEMBERSHIP",
        "create",
        invitation.inviterId,
        gymId,
      ))
    ) {
      throw new UnauthorizedError();
    }

    return await db.membership.create({
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
  };

  return await baseAcceptInvitation(invitation, acceptanceHandler);
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
