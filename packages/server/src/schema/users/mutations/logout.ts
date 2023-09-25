import { ZodError } from "zod";

import { InternalServerError } from "../../../errors";
import { hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("logout", (t) =>
  t.withAuth({ authenticated: true }).field({
    type: "Boolean",
    description: "Invalidate the current access token.",
    args: {
      all: t.arg.boolean({
        defaultValue: false,
        description: "Whether to invalidate all access tokens.",
      }),
    },
    errors: {
      types: [ZodError, InternalServerError],
    },
    resolve: async (parent, args, ctx) => {
      try {
        if (args.all) {
          await ctx.prisma.accessToken.deleteMany({
            where: { userId: ctx.viewer.user.id },
          });
        } else {
          await ctx.prisma.accessToken.delete({
            where: { token: hashToken(ctx.viewer.accessToken.token) },
          });
        }

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
