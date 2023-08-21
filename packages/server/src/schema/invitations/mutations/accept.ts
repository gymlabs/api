import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidCredentialsError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import * as employmentInvitationService from "../../../services/invitation/employmentInvitationService";
import * as membershipInvitationService from "../../../services/invitation/membershipInvitationService";
import * as userInvitationService from "../../../services/invitation/userInvitationService";
import { builder } from "../../builder";

builder.mutationField("acceptInvitation", (t) =>
  t.withAuth({ authenticated: true }).fieldWithInput({
    type: "Boolean",
    description: "Accept an invitation",
    errors: {
      types: [
        ZodError,
        InvalidCredentialsError,
        InternalServerError,
        UnauthenticatedError,
        NotFoundError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        const invitation = await db.invitation.findUnique({
          where: {
            token: input.token,
            status: "PENDING",
          },
        });

        if (!invitation) {
          throw new NotFoundError("Invitation not found");
        }

        switch (invitation.type) {
          case "USER": {
            const user = await userInvitationService.acceptInvitation(
              invitation,
            );
            return !!user;
          }
          case "MEMBERSHIP": {
            const membership =
              await membershipInvitationService.acceptInvitation(invitation);
            return !!membership;
          }
          case "EMPLOYMENT": {
            const employment =
              await employmentInvitationService.acceptInvitation(invitation);
            return !!employment;
          }
          default:
            throw new InternalServerError();
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          token: z.string(),
        }),
        input,
      );
    },
  }),
);
