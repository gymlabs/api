import { ZodError } from "zod";

import {
  InvalidEmailVerificationTokenError,
  ChangeMailTokenAlreadyUsedError,
  ChangeMailTokenExpiredError,
  InternalServerError,
} from "../../../errors";
import { hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("changeMail", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidEmailVerificationTokenError,
        ChangeMailTokenAlreadyUsedError,
        ChangeMailTokenExpiredError,
        InternalServerError,
      ],
    },
    input: { token: t.input.string() },
    resolve: async (parent, { input }, ctx) => {
      try {
        const changeMailRequest = await ctx.prisma.resetRequest.findUnique({
          where: {
            token: hashToken(input.token),
          },
        });

        if (!changeMailRequest) throw new InvalidEmailVerificationTokenError();

        if (changeMailRequest.usedAt)
          throw new ChangeMailTokenAlreadyUsedError();

        const now = new Date();
        if (changeMailRequest.expiresAt < now)
          throw new ChangeMailTokenExpiredError();

        await ctx.prisma.user.update({
          where: { id: changeMailRequest.userId },
          data: { email: (changeMailRequest.newValue as string).toLowerCase() },
        });

        await ctx.prisma.resetRequest.update({
          where: { id: changeMailRequest.id },
          data: { usedAt: new Date() },
        });

        //sign out all
        await ctx.prisma.accessToken.deleteMany({
          where: { userId: changeMailRequest.userId },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  })
);
