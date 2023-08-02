import communicationClient from "@gymlabs/communication.grpc.client";
import { ResetType } from "@gymlabs/db";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "../../../config";
import { InternalServerError, NotFoundError } from "../../../errors";
import { randomToken, hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("requestResetPassword", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError, InternalServerError, NotFoundError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });

        if (!user) throw new NotFoundError("User not found.");

        const token = randomToken();
        const tokenHash = hashToken(token);

        const expiresAt = addMilliseconds(
          new Date(),
          config.security.passwordResetRequestLifetime
        );

        await ctx.prisma.resetRequest.create({
          data: {
            userId: user.id,
            token: tokenHash,
            type: ResetType.PASSWORD,
            expiresAt,
          },
        });

        await new Promise((resolve, reject) => {
          communicationClient.SendResetPasswordRequestEmail(
            {
              to: user.email,
              name: user.firstName,
              token,
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
