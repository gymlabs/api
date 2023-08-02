import communicationClient from "@gymlabs/communication.grpc.client";

import { db } from "../../../db";
import {
  UserHasMembershipsOrEmploymentsError,
  InternalServerError,
  NotFoundError,
} from "../../../errors";
import { randomToken, hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("deleteAccount", (t) =>
  t.withAuth({ authenticated: true }).field({
    type: "Boolean",
    description: "Delete the current user account.",
    errors: {
      types: [
        UserHasMembershipsOrEmploymentsError,
        InternalServerError,
        NotFoundError,
      ],
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const userExists = await ctx.prisma.user.findUnique({
          where: { id: ctx.viewer.user.id },
        });

        if (!userExists) throw new NotFoundError("User not found.");

        const token = randomToken();
        const tokenHash = hashToken(token);
        // delete after 30 days
        const deleteAt: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

        const memberships = await db.membership.findMany({
          where: { userId: ctx.viewer.user.id },
          select: { id: true },
        });

        const employments = await db.employment.findMany({
          where: { userId: ctx.viewer.user.id },
          select: { id: true },
        });

        if (memberships || employments)
          throw new UserHasMembershipsOrEmploymentsError();

        const user = await ctx.prisma.user.update({
          where: { id: ctx.viewer.user.id },
          data: {
            deletedAt: deleteAt,
            reactivationToken: tokenHash,
          },
        });

        await new Promise((resolve, reject) => {
          communicationClient.SendReactivationEmail(
            {
              to: user.email,
              name: user.firstName,
              token,
              deleteAt: deleteAt.toDateString(),
            },
            (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            }
          );
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  })
);
