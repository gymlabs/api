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

  // TODO: rewrite this
  //   user: t.withAuth({ authenticated: true }).prismaField({
  //     type: "User",
  //     nullable: true,
  //     args: {
  //       id: t.arg.id({ required: true }),
  //     },
  //     resolve: async (query, parent, { id }, context) => {
  //       const staffGymIds = context.viewer.user.employments.map((e) => e.gymId);

  //       const targetMembership = await db.membership.findFirst({
  //         where: {
  //           userId: String(id),
  //           gymId: { in: staffGymIds },
  //         },
  //       });

  //       if (!targetMembership) {
  //         return null;
  //       }

  //       return await db.user.findUnique({
  //         ...query,
  //         where: { id: String(id) },
  //       });
  //     },
  //   }),
}));
