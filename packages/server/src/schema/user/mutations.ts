import adminClient from "@gymlabs/admin.grpc.client";
import {
  Employments__Output,
  Gyms__Output,
  Memberships__Output,
  Organizations__Output,
} from "@gymlabs/admin.grpc.definition";
import communicationClient from "@gymlabs/communication.grpc.client";
import { addMilliseconds } from "date-fns";
import { ZodError } from "zod";

import { AccessTokenResponse } from "./types";
import { config } from "../../config";
import { db } from "../../db";
import {
  comparePassword,
  hashPassword,
  hashToken,
  randomToken,
} from "../../lib/security";
import { logger } from "../../logger";
import { builder } from "../builder";
import {
  InternalServerError,
  NotFoundError,
  ChangeMailTokenAlreadyUsedError,
  ChangeMailTokenExpiredError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidEmailVerificationTokenError,
  InvalidReactivationTokenError,
  InvalidResetPasswordTokenError,
  ReactivationTokenExpiredError,
  ResetPasswordTokenAlreadyUsedError,
  ResetPasswordTokenExpiredError,
  UserHasMembershipsOrEmploymentsError,
} from "../errors";

builder.mutationFields((t) => ({
  register: t.fieldWithInput({
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
    resolve: async (parent, { input }) => {
      try {
        const userExists = await db.user.findFirst({
          where: { email: input.email },
        });
        if (userExists) throw new EmailAlreadyInUseError(input.email);

        const verificationToken = randomToken();

        const user = await db.user.create({
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
                console.log(err);
                logger.warn("register mutation failed");
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
  }),

  login: t.fieldWithInput({
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
    resolve: async (parent, { input }, { res }) => {
      try {
        const user = await db.user.findUnique({
          where: { email: input.email },
        });

        if (!user || !(await comparePassword(input.password, user.password)))
          throw new InvalidCredentialsError();

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
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),

  verifyEmail: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidEmailVerificationTokenError,
        InternalServerError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }) => {
      try {
        const user = await db.user.findUnique({
          where: {
            emailVerificationToken: hashToken(input.token),
          },
        });

        if (!user) throw new InvalidEmailVerificationTokenError();

        await db.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
            emailVerificationToken: null,
          },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
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
    errors: {
      types: [ZodError, InternalServerError],
    },
    resolve: async (parent, args, context) => {
      try {
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
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),

  requestResetPassword: t.fieldWithInput({
    type: "Boolean",
    errors: { types: [ZodError, InternalServerError, NotFoundError] },
    input: {
      email: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }) => {
      try {
        const user = await db.user.findUnique({
          where: { email: input.email },
        });

        if (!user) throw new NotFoundError("User not found.");

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
  }),

  resetPassword: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidResetPasswordTokenError,
        ResetPasswordTokenAlreadyUsedError,
        ResetPasswordTokenExpiredError,
        InternalServerError,
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
      try {
        const resetPasswordRequest = await db.passwordResetRequest.findUnique({
          where: {
            token: hashToken(input.token),
          },
        });

        if (!resetPasswordRequest) throw new InvalidResetPasswordTokenError();

        if (resetPasswordRequest.usedAt)
          throw new ResetPasswordTokenAlreadyUsedError();

        const now = new Date();
        if (resetPasswordRequest.expiresAt < now)
          throw new ResetPasswordTokenExpiredError();

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
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),

  deleteAccount: t.withAuth({ authenticated: true }).field({
    type: "Boolean",
    description: "Delete the current user account.",
    errors: {
      types: [
        UserHasMembershipsOrEmploymentsError,
        InternalServerError,
        NotFoundError,
      ],
    },
    resolve: async (parent, { input }, context) => {
      try {
        const userExists = await db.user.findUnique({
          where: { id: context.viewer.user.id },
        });

        if (!userExists) throw new NotFoundError("User not found.");

        const token = randomToken();
        const tokenHash = hashToken(token);
        // delete after 30 days
        const deleteAt: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

        // check if user has memberships or employments
        const organizations: Organizations__Output = await new Promise(
          (resolve, reject) => {
            adminClient.GetOrganizations({}, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );

        if (organizations.organizations.length) {
          for (const organization of organizations.organizations) {
            const gyms: Gyms__Output = await new Promise((resolve, reject) => {
              adminClient.GetGyms(
                { organizationId: organization.id },
                (err, res) => {
                  if (err) {
                    reject(err);
                  } else if (res) {
                    resolve(res);
                  }
                }
              );
            });
            if (gyms.gyms.length) {
              for (const gym of gyms.gyms) {
                const memberships: Memberships__Output = await new Promise(
                  (resolve, reject) => {
                    adminClient.GetMemberships(
                      { gymId: gym.id },
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
                    adminClient.GetEmployments(
                      { gymId: gym.id },
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
  }),

  reactivateAccount: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidReactivationTokenError,
        ReactivationTokenExpiredError,
        InternalServerError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }, context) => {
      try {
        const user = await db.user.findUnique({
          where: {
            reactivationToken: hashToken(input.token),
          },
        });

        if (!user) throw new InvalidReactivationTokenError();

        const now = new Date();
        if (user.deletedAt && user.deletedAt < now)
          throw new ReactivationTokenExpiredError();

        await db.user.update({
          where: { id: user.id },
          data: {
            deletedAt: null,
            reactivationToken: null,
          },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),

  requestChangeMail: t.fieldWithInput({
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
      newMail: t.input.string({
        validate: {
          email: true,
        },
      }),
    },
    resolve: async (parent, { input }) => {
      try {
        const user = await db.user.findUnique({
          where: { email: input.email },
        });

        if (!user) throw new NotFoundError("User not found");

        const newMailUser = await db.user.findUnique({
          where: { email: input.newMail },
        });

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
  }),

  changeMail: t.fieldWithInput({
    type: "Boolean",
    errors: {
      types: [
        ZodError,
        InvalidEmailVerificationTokenError,
        ChangeMailTokenAlreadyUsedError,
        ChangeMailTokenExpiredError,
        InternalServerError,
      ],
    },
    input: { token: t.input.string() },
    resolve: async (parent, { input }, context) => {
      try {
        const changeMailRequest = await db.changeMailRequest.findUnique({
          where: {
            token: hashToken(input.token),
          },
        });

        if (!changeMailRequest) throw new InvalidEmailVerificationTokenError();

        if (changeMailRequest.usedAt)
          throw new ChangeMailTokenAlreadyUsedError();

        const now = new Date();
        if (changeMailRequest.expiresAt < now)
          throw new ChangeMailTokenExpiredError();

        await db.user.update({
          where: { id: changeMailRequest.userId },
          data: { email: changeMailRequest.newMail },
        });

        await db.changeMailRequest.update({
          where: { id: changeMailRequest.id },
          data: { usedAt: new Date() },
        });

        //sign out all
        await db.accessToken.deleteMany({
          where: { userId: changeMailRequest.userId },
        });

        return true;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
}));
