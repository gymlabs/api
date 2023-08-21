import { Invitation } from "@gymlabs/db";
import { z } from "zod";

import { acceptInvitation as baseAcceptInvitation } from "./baseService";
import { db } from "../../db";
import { InvalidArgumentError, UnauthorizedError } from "../../errors";
import { authenticateGymEntity } from "../../lib/authenticate";
import { sendMembershipInvitationEmail } from "../mail/mailService";

export const acceptInvitation = async (invitation: Invitation) => {
  const acceptanceHandler = async () => {
    const { userEmail, gymId, contractId } = z
      .object({
        userEmail: z.string().email(),
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

    const user = await db.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new InvalidArgumentError("User does not exist");
    }

    return await db.membership.create({
      data: {
        user: {
          connect: { id: user.id },
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
