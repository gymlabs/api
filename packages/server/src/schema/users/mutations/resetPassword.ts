import { ZodError } from "zod";

import {
  InvalidResetPasswordTokenError,
  ResetPasswordTokenAlreadyUsedError,
  ResetPasswordTokenExpiredError,
  InternalServerError,
} from "../../../errors";
import { hashToken, hashPassword } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("resetPassword", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidResetPasswordTokenError,
        ResetPasswordTokenAlreadyUsedError,
        ResetPasswordTokenExpiredError,
        InternalServerError,
      ],
    },
    input: {
      token: t.input.string(),
      password: t.input.string({
        validate: {
          minLength: 10,
          maxLength: 128,
        },
      }),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const resetPasswordRequest = await ctx.prisma.resetRequest.findUnique({
          where: {
            token: hashToken(input.token),
          },
        });

        if (!resetPasswordRequest) throw new InvalidResetPasswordTokenError();

        if (resetPasswordRequest.usedAt)
          throw new ResetPasswordTokenAlreadyUsedError();

        const now = new Date();
        if (resetPasswordRequest.expiresAt < now)
          throw new ResetPasswordTokenExpiredError();

        const password = await hashPassword(input.password);

        await ctx.prisma.user.update({
          where: { id: resetPasswordRequest.userId },
          data: { password },
        });

        await ctx.prisma.resetRequest.update({
          where: { id: resetPasswordRequest.id },
          data: { usedAt: new Date() },
        });

        //sign out all
        await ctx.prisma.accessToken.deleteMany({
          where: { userId: resetPasswordRequest.userId },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
