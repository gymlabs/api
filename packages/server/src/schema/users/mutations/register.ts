import communicationClient from "@gymlabs/communication.grpc.client";
import { ZodError } from "zod";

import { EmailAlreadyInUseError, InternalServerError } from "../../../errors";
import { randomToken, hashPassword, hashToken } from "../../../lib/security";
import { builder } from "../../builder";

builder.mutationField("register", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError, EmailAlreadyInUseError, InternalServerError] },
    input: {
      firstName: t.input.string(),
      lastName: t.input.string(),
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      password: t.input.string({
        validate: {
          minLength: 12,
          maxLength: 128,
        },
      }),
    },
    resolve: async (parent, { input }, ctx) => {
      try {
        const userExists = await ctx.prisma.user.findFirst({
          where: { email: input.email },
        });
        if (userExists) throw new EmailAlreadyInUseError(input.email);

        const verificationToken = randomToken();

        const user = await ctx.prisma.user.create({
          data: {
            ...input,
            password: await hashPassword(input.password),
            emailVerificationToken: hashToken(verificationToken),
          },
        });

        await new Promise((resolve, reject) => {
          communicationClient.SendWelcomeEmail(
            {
              to: user.email,
              name: user.firstName,
              token: verificationToken,
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
