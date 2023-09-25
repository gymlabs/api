import { InvitationType } from "@gymlabs/db";
import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Invitation } from "../types";

builder.queryField("invitations", (t) =>
  t.fieldWithInput({
    type: [Invitation],
    input: {
      gymId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      try {
        const wrapped = async () => {
          const invitationTypes = [] as InvitationType[];

          const canReadMembershipInvitations = await authenticateGymEntity(
            "MEMBERSHIP_INVITATION",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          );

          const canReadEmploymentInvitations = await authenticateGymEntity(
            "EMPLOYMENT_INVITATION",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          );

          if (canReadMembershipInvitations) {
            invitationTypes.push("MEMBERSHIP");
          } else if (canReadEmploymentInvitations) {
            invitationTypes.push("EMPLOYMENT");
          } else {
            throw new UnauthorizedError();
          }

          return await db.invitation.findMany({
            where: {
              type: {
                in: invitationTypes,
              },
              content: {
                path: ["gymId"],
                equals: input.gymId,
              },
              status: "PENDING",
            },
            orderBy: {
              createdAt: "asc",
            },
          });
        };

        const invitations = await validationWrapper(
          wrapped,
          z.object({
            gymId: z.string().uuid(),
          }),
          input,
        );

        return invitations;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
