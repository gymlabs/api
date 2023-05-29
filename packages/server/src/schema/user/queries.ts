import { db } from "../../db";
import { builder } from "../builder";
import {
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";

builder.queryFields((t) => ({
  me: t.prismaField({
    type: "User",
    errors: {
      types: [UnauthenticatedError, NotFoundError, InternalServerError],
    },
    resolve: async (query, parent, args, context) => {
      if (!context.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const user = await db.user.findUnique({
          ...query,
          where: { id: context.viewer.user.id },
        });

        if (!user) throw new NotFoundError("User not found");

        return user;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
}));
