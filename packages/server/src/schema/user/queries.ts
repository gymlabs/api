import {
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../../errors";
import { builder } from "../builder";

builder.queryFields((t) => ({
  me: t.prismaField({
    type: "User",
    errors: {
      types: [UnauthenticatedError, NotFoundError, InternalServerError],
    },
    resolve: async (query, parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const user = await ctx.prisma.user.findUnique({
          ...query,
          where: { id: ctx.viewer.user.id },
        });

        if (!user) throw new NotFoundError("User not found");

        return user;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
}));
