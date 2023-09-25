import { ZodError } from "zod";

import { EmailAlreadyInUseError, InternalServerError } from "../../../errors";
import { randomToken, hashPassword, hashToken } from "../../../lib/security";
import { sendWelcomeEmail } from "../../../services/mail/mailService";
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
          where: { email: input.email.toLowerCase() },
        });
        if (userExists) throw new EmailAlreadyInUseError(input.email);

        const verificationToken = randomToken();

        const user = await ctx.prisma.user.create({
          data: {
            ...input,
            email: input.email.toLowerCase(),
            password: await hashPassword(input.password),
            emailVerificationToken: hashToken(verificationToken),
          },
        });

        await sendWelcomeEmail(user.email, user.firstName, verificationToken);

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
