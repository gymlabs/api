import communicationClient from "@gymlabs/communication.grpc.client";
import { ResetType } from "@gymlabs/db";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "../../../config";
import {
  InternalServerError,
  NotFoundError,
  EmailAlreadyInUseError,
} from "../../../errors";
import { randomToken, hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("requestChangeMail", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InternalServerError,
        NotFoundError,
        EmailAlreadyInUseError,
      ],
    },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      newValue: t.input.string({
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

        if (!user) {
          throw new NotFoundError("User not found");
        }

        const newMailUser = await ctx.prisma.user.findUnique({
          where: { email: input.newValue },
        });

        if (newMailUser) {
          throw new EmailAlreadyInUseError("New Email already in use");
        }

        const token = randomToken();
        const tokenHash = hashToken(token);

        const expiresAt = addMilliseconds(
          new Date(),
          config.security.changeMailRequestLifetime
        );

        await ctx.prisma.resetRequest.create({
          data: {
            userId: user.id,
            token: tokenHash,
            type: ResetType.EMAIL,
            newValue: input.newValue,
            expiresAt,
          },
        });

        await new Promise((resolve, reject) => {
          communicationClient.SendEmailUpdateEmail(
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
