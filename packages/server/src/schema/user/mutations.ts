import client from "@gymlabs/admin.grpc.client";
import {
  Employments__Output,
  Gyms__Output,
  Memberships__Output,
  Organizations__Output,
} from "@gymlabs/admin.grpc.definition";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import {
  AccessTokenResponse,
  ChangeMailTokenAlreadyUsedError,
  ChangeMailTokenExpiredError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidEmailVerificationTokenError,
  InvalidReactivationTokenError,
  ReactivationTokenExpiredError,
  ResetPasswordTokenAlreadyUsedError,
  ResetPasswordTokenExpiredError,
  UserHasMembershipsOrEmploymentsError,
} from "./types";
import { config } from "../../config";
import { db } from "../../db";
import { NotFoundError } from "../../errors";
import {
  comparePassword,
  hashPassword,
  hashToken,
  randomToken,
} from "../../lib/security";
import { sendMail } from "../../services/mail/sendMail";
import { EmailUpdatedEmail } from "../../services/mail/templates/EmailUpdatedEmail";
import { ReactivationEmail } from "../../services/mail/templates/ReactivationEmail";
import { ResetPasswordRequestEmail } from "../../services/mail/templates/ResetPasswordRequestEmail";
import { WelcomeEmail } from "../../services/mail/templates/WelcomeEmail";
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
      const tokenHash = hashToken(token);

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
        InvalidReactivationTokenError,
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
          token: hashToken(input.token),
        },
      });

      if (!resetPasswordRequest) {
        throw new InvalidReactivationTokenError();
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

  deleteAccount: t.withAuth({ authenticated: true }).field({
    type: "Boolean",
    description: "Delete the current user account.",
    errors: { types: [UserHasMembershipsOrEmploymentsError] },
    resolve: async (parent, { input }, context) => {
      const token = randomToken();
      const tokenHash = hashToken(token);
      // delete after 30 days
      const deleteAt: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      // check if user has memberships or employments
      const organizations: Organizations__Output = await new Promise(
        (resolve, reject) => {
          client.GetOrganizations({}, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );

      if (organizations.organizations.length) {
        for (const organization of organizations.organizations) {
          const gyms: Gyms__Output = await new Promise((resolve, reject) => {
            client.GetGyms({ organizationId: organization.id }, (err, res) => {
              if (err || !res) {
                reject(err);
              } else {
                resolve(res);
              }
            });
          });
          if (gyms.gyms.length) {
            for (const gym of gyms.gyms) {
              const memberships: Memberships__Output = await new Promise(
                (resolve, reject) => {
                  client.GetMemberships({ gymId: gym.id }, (err, res) => {
                    if (err || !res) {
                      reject(err);
                    } else {
                      resolve(res);
                    }
                  });
                }
              );
              if (memberships.memberships.length) {
                const userMemberships = memberships.memberships.filter(
                  (membership) => membership.userId === context.viewer.user.id
                );
                if (userMemberships.length) {
                  throw new UserHasMembershipsOrEmploymentsError();
                }
              }
              const employments: Employments__Output = await new Promise(
                (resolve, reject) => {
                  client.GetEmployments({ gymId: gym.id }, (err, res) => {
                    if (err || !res) {
                      reject(err);
                    } else {
                      resolve(res);
                    }
                  });
                }
              );
              if (employments.employments.length) {
                const userEmployments = employments.employments.filter(
                  (employment) => employment.userId === context.viewer.user.id
                );
                if (userEmployments.length) {
                  throw new UserHasMembershipsOrEmploymentsError();
                }
              }
            }
          }
        }
      }

      const user = await db.user.update({
        where: { id: context.viewer.user.id },
        data: {
          deletedAt: deleteAt,
          reactivationToken: tokenHash,
        },
      });

      await sendMail(new ReactivationEmail(user.firstName, token, deleteAt), {
        to: user.email,
      });

      return true;
    },
  }),

  reactivateAccount: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidReactivationTokenError,
        ReactivationTokenExpiredError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }, context) => {
      const user = await db.user.findUnique({
        where: {
          reactivationToken: hashToken(input.token),
        },
      });

      if (!user) {
        throw new InvalidReactivationTokenError();
      }

      const now = new Date();
      if (user.deletedAt && user.deletedAt < now) {
        throw new ReactivationTokenExpiredError();
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          deletedAt: null,
          reactivationToken: null,
        },
      });

      return true;
    },
  }),

  requestChangeMail: t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
      newMail: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
      });

      const newMailUser = await db.user.findUnique({
        where: { email: input.newMail },
      });

      if (!user) throw new NotFoundError("User not found");
      if (newMailUser)
        throw new EmailAlreadyInUseError("New Email already in use");

      const token = randomToken();
      const tokenHash = hashToken(token);

      const expiresAt = addMilliseconds(
        new Date(),
        config.security.changeMailRequestLifetime
      );

      await db.changeMailRequest.create({
        data: {
          userId: user.id,
          token: tokenHash,
          newMail: input.newMail,
          expiresAt,
        },
      });

      await sendMail(new EmailUpdatedEmail(user.firstName, token), {
        to: user.email,
      });

      return true;
    },
  }),

  changeMail: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidEmailVerificationTokenError,
        ChangeMailTokenAlreadyUsedError,
        ChangeMailTokenExpiredError,
      ],
    },
    input: { token: t.input.string() },
    resolve: async (parent, { input }, context) => {
      const changeMailRequest = await db.changeMailRequest.findUnique({
        where: {
          token: hashToken(input.token),
        },
      });

      if (!changeMailRequest) {
        throw new InvalidEmailVerificationTokenError();
      }

      if (changeMailRequest.usedAt) {
        throw new ChangeMailTokenAlreadyUsedError();
      }

      const now = new Date();
      if (changeMailRequest.expiresAt < now) {
        throw new ChangeMailTokenExpiredError();
      }

      await db.user.update({
        where: { id: changeMailRequest.userId },
        data: { email: changeMailRequest.newMail },
      });

      await db.passwordResetRequest.update({
        where: { id: changeMailRequest.id },
        data: { usedAt: new Date() },
      });

      //sign out all
      await db.accessToken.deleteMany({
        where: { userId: changeMailRequest.userId },
      });

      return true;
    },
  }),
}));
