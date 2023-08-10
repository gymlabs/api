import { ResetType } from "@gymlabs/db";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "../../../config";
import { InternalServerError, NotFoundError } from "../../../errors";
import { randomToken, hashToken } from "../../../lib/security";
import { sendResetPasswordRequestEmail } from "../../../services/mail/mailService";
import { builder } from "../../builder";

builder.mutationField("requestResetPassword", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError, InternalServerError, NotFoundError] },
    input: {
      email: t.input.string({
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

        if (!user) throw new NotFoundError("User not found.");

        const token = randomToken();
        const tokenHash = hashToken(token);

        const expiresAt = addMilliseconds(
          new Date(),
          config.security.passwordResetRequestLifetime,
        );

        await ctx.prisma.resetRequest.create({
          data: {
            userId: user.id,
            token: tokenHash,
            type: ResetType.PASSWORD,
            expiresAt,
          },
        });

        sendResetPasswordRequestEmail(user.email, user.firstName, token);

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
