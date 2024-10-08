import { ResetType } from "@gymlabs/db";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "../../../config";
import {
  InternalServerError,
  NotFoundError,
  EmailAlreadyInUseError,
} from "../../../errors";
import { randomToken, hashToken } from "../../../lib/security";
import { sendEmailUpdateEmail } from "../../../services/mail/mailService";
import { builder } from "../../builder";

builder.mutationField("requestChangeMail", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InternalServerError,
        NotFoundError,
        EmailAlreadyInUseError,
      ],
    },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      newValue: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (!user) {
          throw new NotFoundError("User not found");
        }

        const newMailUser = await ctx.prisma.user.findUnique({
          where: { email: input.newValue.toLowerCase() },
        });

        if (newMailUser) {
          throw new EmailAlreadyInUseError(input.newValue);
        }

        const token = randomToken();
        const tokenHash = hashToken(token);

        const expiresAt = addMilliseconds(
          new Date(),
          config.security.changeMailRequestLifetime,
        );

        await ctx.prisma.resetRequest.upsert({
          where: {
            newValue: input.newValue.toLowerCase(),
          },
          update: {
            userId: user.id,
            token: tokenHash,
            type: ResetType.EMAIL,
            expiresAt,
          },
          create: {
            userId: user.id,
            token: tokenHash,
            type: ResetType.EMAIL,
            newValue: input.newValue.toLowerCase(),
            expiresAt,
          },
        });

        await sendEmailUpdateEmail(user.email, user.firstName, token);

        return true;
      } catch (err) {
        console.error(err);
        if (err instanceof EmailAlreadyInUseError) {
          throw new EmailAlreadyInUseError(input.newValue);
        } else {
          throw new InternalServerError();
        }
      }
    },
  }),
);
