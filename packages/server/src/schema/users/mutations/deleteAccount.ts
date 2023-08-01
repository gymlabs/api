// TODO: remove admin client
import adminClient from "@gymlabs/admin.grpc.client";
import { BooleanType__Output } from "@gymlabs/admin.grpc.definition";
import communicationClient from "@gymlabs/communication.grpc.client";

import {
  UserHasMembershipsOrEmploymentsError,
  InternalServerError,
  NotFoundError,
} from "../../../errors";
import { meta } from "../../../lib/metadata";
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

        // check if user has memberships or employments
        const hasMemberships: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            adminClient.HasMemberships(
              { userId: ctx.viewer.user.id },
              meta(ctx.viewer),
              (err, res) => {
                if (err) {
                  reject(err);
                } else if (res) {
                  resolve(res);
                }
              }
            );
          }
        );

        const hasEmployments: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            adminClient.HasEmployments(
              { userId: ctx.viewer.user.id },
              meta(ctx.viewer),
              (err, res) => {
                if (err) {
                  reject(err);
                } else if (res) {
                  resolve(res);
                }
              }
            );
          }
        );

        if (hasMemberships.value || hasEmployments.value)
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
