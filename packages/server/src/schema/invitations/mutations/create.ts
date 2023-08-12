import { InvitationType } from "@gymlabs/db";
import { JsonObject } from "@gymlabs/db/dist/client/runtime/library";
import { nanoid } from "nanoid";
import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { jsonSchema } from "../../../lib/jsonValidationSchema";
import * as employmentInvitationService from "../../../services/invitation/employmentInvitationService";
import * as membershipInvitationService from "../../../services/invitation/membershipInvitationService";
import * as userInvitationService from "../../../services/invitation/userInvitationService";
import { builder } from "../../builder";

builder.mutationField("createInvitation", (t) =>
  t.withAuth({ authenticated: true }).fieldWithInput({
    type: "Boolean",
    description: "Accept an invitation",
    errors: {
      types: [
        ZodError,
        NotFoundError,
        UnauthorizedError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
      ],
    },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      type: t.input.string(),
      content: t.input.string(),
      inviter: t.input.string({ required: false }),
    },
    resolve: async (parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);

        const invitation = await db.invitation.create({
          data: {
            email: input.email,
            inviterId: ctx.viewer.user.id,
            type: input.type as InvitationType,
            status: "PENDING",
            content: JSON.parse(input.content) as JsonObject,
            token: nanoid(8),
            expiresAt: expiryDate,
          },
        });

        switch (invitation.type) {
          case "USER": {
            await userInvitationService.sendInvitation(
              invitation,
              `${ctx.viewer.user.firstName} ${ctx.viewer.user.lastName}`,
            );
            return true;
          }
          case "MEMBERSHIP": {
            await membershipInvitationService.sendInvitation(
              invitation,
              input.inviter ??
                `${ctx.viewer.user.firstName} ${ctx.viewer.user.lastName}`, // TODO: automatic handling via a session would be nice here
            );
            return true;
          }
          case "EMPLOYMENT": {
            await employmentInvitationService.sendInvitation(
              invitation,
              input.inviter ??
                `${ctx.viewer.user.firstName} ${ctx.viewer.user.lastName}`, // TODO: automatic handling via a session would be nice here
            );
            return true;
          }
          default:
            throw new InternalServerError();
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          email: z.string().email(),
          type: z.union([
            z.literal("USER"),
            z.literal("MEMBERSHIP"),
            z.literal("EMPLOYMENT"),
          ]),
          content: jsonSchema,
          inviter: z.string().min(4).optional(),
        }),
        input,
      );
    },
  }),
);