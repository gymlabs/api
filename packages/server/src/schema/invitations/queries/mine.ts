import {
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../errors";
import { builder } from "../../builder";

builder.queryField("myInvitations", (t) =>
  t.prismaField({
    type: ["Invitation"],
    errors: {
      types: [UnauthenticatedError, NotFoundError, InternalServerError],
    },
    resolve: async (query, parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const invitations = await ctx.prisma.invitation.findMany({
          ...query,
          where: {
            email: ctx.viewer.user.email,
          },
        });

        if (!invitations) throw new NotFoundError("No invitations found");

        return invitations;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
