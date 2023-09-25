import { ZodError } from "zod";

import {
  InvalidReactivationTokenError,
  ReactivationTokenExpiredError,
  InternalServerError,
} from "../../../errors";
import { hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("reactivateAccount", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidReactivationTokenError,
        ReactivationTokenExpiredError,
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
            reactivationToken: hashToken(input.token),
          },
        });

        if (!user) throw new InvalidReactivationTokenError();

        const now = new Date();
        if (user.deletedAt && user.deletedAt < now)
          throw new ReactivationTokenExpiredError();

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            deletedAt: null,
            reactivationToken: null,
          },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
