import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "../../../config";
import { InvalidCredentialsError, InternalServerError } from "../../../errors";
import { comparePassword, randomToken, hashToken } from "../../../lib/security";
import { builder } from "../../builder";
import { AccessTokenResponse } from "../types";

builder.mutationField("login", (t) =>
  t.fieldWithInput({
    type: AccessTokenResponse,
    errors: { types: [ZodError, InvalidCredentialsError, InternalServerError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      password: t.input.string(),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (!user || !(await comparePassword(input.password, user.password)))
          throw new InvalidCredentialsError();

        const token = randomToken();
        const tokenHash = hashToken(token);

        const expiresAt = addMilliseconds(
          new Date(),
          config.security.accessTokenLifetime,
        );

        await ctx.prisma.accessToken.create({
          data: {
            userId: user.id,
            token: tokenHash,
            expiresAt,
          },
        });

        return {
          // return unhashed token to the user
          accessToken: token,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
