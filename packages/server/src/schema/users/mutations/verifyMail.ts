import { ZodError } from "zod";

import {
  InvalidEmailVerificationTokenError,
  InternalServerError,
} from "../../../errors";
import { hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("verifyMail", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidEmailVerificationTokenError,
        InternalServerError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: {
            emailVerificationToken: hashToken(input.token),
          },
        });

        if (!user) throw new InvalidEmailVerificationTokenError();

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
            emailVerificationToken: null,
          },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  })
);
