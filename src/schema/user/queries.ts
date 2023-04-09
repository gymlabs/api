import { db } from "~/db";

import { builder } from "../builder";



builder.queryFields((t) => ({
  me: t.prismaField({
    type: "User",
    nullable: true,
    resolve: async (query, parent, args, context) => {
      if (!context.viewer.isAuthenticated()) {
        return null;
      }
      return await db.user.findUnique({
        ...query,
        where: { id: context.viewer.user.id },
      });
    },
  }),
}));
