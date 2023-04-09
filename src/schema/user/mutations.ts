import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { config } from "~/config";
import { db } from "~/db";
import { ForbiddenError, NotFoundError } from "~/errors";
import { mapNullToUndefined } from "~/lib/mapNullToUndefined";
import {
  comparePassword,
  hashPassword,
  hashToken,
  randomToken,
} from "~/lib/security";
import { sendMail } from "~/services/mail/sendMail";
import { EmailUpdatedEmail } from "~/services/mail/templates/EmailUpdatedEmail";
import { ResetPasswordRequestEmail } from "~/services/mail/templates/ResetPasswordRequestEmail";
import { WelcomeEmail } from "~/services/mail/templates/WelcomeEmail";

import {
  AccessTokenResponse,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidEmailVerificationTokenError,
  InvalidResetPasswordTokenError,
  ResetPasswordTokenAlreadyUsedError,
  ResetPasswordTokenExpiredError,
} from "./types";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  register: t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError, EmailAlreadyInUseError] },
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
    resolve: async (parent, { input }) => {
      const userExists = !!(await db.user.findFirst({
        where: { email: input.email },
      }));
      if (userExists) {
        throw new EmailAlreadyInUseError(input.email);
      }

      const verificationToken = randomToken();

      // TODO
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await db.user.create({
        data: {
          ...input,
          password: await hashPassword(input.password),
          emailVerificationToken: await hashToken(verificationToken),
        },
      });

      await sendMail(new WelcomeEmail(user.firstName, verificationToken), {
        to: user.email,
      });

      return true;
    },
  }),

  login: t.fieldWithInput({
    type: AccessTokenResponse,
    errors: { types: [ZodError, InvalidCredentialsError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      password: t.input.string(),
    },
    resolve: async (parent, { input }, { res }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !(await comparePassword(input.password, user.password))) {
        throw new InvalidCredentialsError();
      }

      const token = randomToken();
      const tokenHash = hashToken(token);

      const expiresAt = addMilliseconds(
        new Date(),
        config.security.accessTokenLifetime
      );

      await db.accessToken.create({
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
    },
  }),

  updateUser: t.withAuth({ authenticated: true }).prismaFieldWithInput({
    type: "User",
    errors: { types: [ZodError] },
    input: {
      id: t.input.id(),
      firstName: t.input.string({ required: false }),
      lastName: t.input.string({ required: false }),
      email: t.input.string({
        required: false,
        validate: {
          email: true,
        },
      }),
      password: t.input.string({
        required: false,
        validate: {
          minLength: 10,
          maxLength: 128,
        },
      }),
    },
    resolve: async (query, parent, { input: { id, ...input } }, context) => {
      const user = await db.user.findUnique({
        where: { id: context.viewer.user.id },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      if (context.viewer.user.id !== id) {
        throw new ForbiddenError("Cannot update another user.");
      }

      let password = input.password;
      if (password) {
        password = await hashPassword(password);
      }

      let emailData:
        | {
            emailVerificationToken: string;
            isEmailVerified: true;
          }
        | undefined = undefined;

      if (input.email) {
        const emailVerificationToken = randomToken();
        const emailVerificationTokenHash = await hashToken(
          emailVerificationToken
        );
        emailData = {
          emailVerificationToken: emailVerificationTokenHash,
          isEmailVerified: true,
        };
      }

      const updatedUser = await db.user.update({
        ...query,
        where: { id: String(id) },
        data: mapNullToUndefined({
          ...input,
          password,
          ...emailData,
        }),
      });

      if (emailData) {
        await sendMail(
          new EmailUpdatedEmail(
            updatedUser.firstName,
            emailData.emailVerificationToken
          ),
          {
            to: updatedUser.email,
          }
        );
      }

      return updatedUser;
    },
  }),

  verifyEmail: t.fieldWithInput({
    type: "Boolean",
    errors: { types: [InvalidEmailVerificationTokenError] },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }) => {
      // TODO: authentication required?

      const user = await db.user.findUnique({
        where: {
          emailVerificationToken: await hashToken(input.token),
        },
      });

      if (!user) {
        throw new InvalidEmailVerificationTokenError();
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });

      return true;
    },
  }),

  logout: t.withAuth({ authenticated: true }).field({
    type: "Boolean",
    errors: { types: [] },
    description: "Invalidate the current access token.",
    args: {
      all: t.arg.boolean({
        defaultValue: false,
        description: "Whether to invalidate all access tokens.",
      }),
    },
    resolve: async (parent, args, context) => {
      if (args.all) {
        await db.accessToken.deleteMany({
          where: { userId: context.viewer.user.id },
        });
      } else {
        await db.accessToken.delete({
          where: { token: hashToken(context.viewer.accessToken.token) },
        });
      }

      return true;
    },
  }),

  requestResetPassword: t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        return true;
      }

      const token = randomToken();
      const tokenHash = await hashToken(token);

      const expiresAt = addMilliseconds(
        new Date(),
        config.security.passwordResetRequestLifetime
      );

      await db.passwordResetRequest.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt,
        },
      });

      await sendMail(new ResetPasswordRequestEmail(user.firstName, token), {
        to: user.email,
      });

      return true;
    },
  }),

  resetPassword: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidResetPasswordTokenError,
        ResetPasswordTokenAlreadyUsedError,
        ResetPasswordTokenExpiredError,
      ],
    },
    input: {
      token: t.input.string(),
      password: t.input.string({
        validate: {
          minLength: 10,
          maxLength: 128,
        },
      }),
    },
    resolve: async (parent, { input }, context) => {
      const resetPasswordRequest = await db.passwordResetRequest.findUnique({
        where: {
          token: await hashToken(input.token),
        },
      });

      if (!resetPasswordRequest) {
        throw new InvalidResetPasswordTokenError();
      }

      if (resetPasswordRequest.usedAt) {
        throw new ResetPasswordTokenAlreadyUsedError();
      }

      const now = new Date();
      if (resetPasswordRequest.expiresAt < now) {
        throw new ResetPasswordTokenExpiredError();
      }

      const password = await hashPassword(input.password);

      await db.user.update({
        where: { id: resetPasswordRequest.userId },
        data: { password },
      });

      await db.passwordResetRequest.update({
        where: { id: resetPasswordRequest.id },
        data: { usedAt: new Date() },
      });

      //sign out all
      await db.accessToken.deleteMany({
        where: { userId: resetPasswordRequest.userId },
      });

      return true;
    },
  }),
}));
