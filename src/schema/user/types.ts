import { builder } from "../builder";
import { ErrorInterface } from "../errors";

export const UserNodeRef = builder.prismaNode("User", {
  id: { field: "id" },
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", {
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    isEmailVerified: t.exposeBoolean("isEmailVerified", {
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    createdAt: t.expose("createdAt", {
      type: "Date",
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    updatedAt: t.expose("updatedAt", {
      type: "Date",
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
  }),
});

export const AccessTokenResponse = builder.simpleObject("AccessTokenResponse", {
  fields: (t) => ({
    accessToken: t.string(),
  }),
});

export class EmailAlreadyInUseError extends Error {
  email: string;

  constructor(email: string) {
    super(`Email already in use.`);

    this.email = email;
    this.name = "EmailAlreadyInUseError";
  }
}

builder.objectType(EmailAlreadyInUseError, {
  name: "EmailAlreadyInUseError",
  interfaces: [ErrorInterface],
  fields: (t) => ({
    email: t.exposeString("email"),
  }),
});

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

builder.objectType(InvalidCredentialsError, {
  name: "InvalidCredentialsError",
  interfaces: [ErrorInterface],
});

export class InvalidEmailVerificationTokenError extends Error {
  constructor() {
    super("Invalid email verification token.");
    this.name = "InvalidEmailVerificationTokenError";
  }
}

builder.objectType(InvalidEmailVerificationTokenError, {
  name: "InvalidEmailVerificationTokenError",
  interfaces: [ErrorInterface],
});

export class InvalidResetPasswordTokenError extends Error {
  constructor() {
    super("Invalid reset password token.");
    this.name = "InvalidResetPasswordTokenError";
  }
}

builder.objectType(InvalidResetPasswordTokenError, {
  name: "InvalidResetPasswordTokenError",
  interfaces: [ErrorInterface],
});

export class ResetPasswordTokenExpiredError extends Error {
  constructor() {
    super("Password reset token expired.");
    this.name = "ResetPasswordTokenExpiredError";
  }
}

builder.objectType(ResetPasswordTokenExpiredError, {
  name: "ResetPasswordTokenExpiredError",
  interfaces: [ErrorInterface],
});

export class ResetPasswordTokenAlreadyUsedError extends Error {
  constructor() {
    super("Password reset token already used.");
    this.name = "ResetPasswordTokenAlreadyUsedError";
  }
}

builder.objectType(ResetPasswordTokenAlreadyUsedError, {
  name: "ResetPasswordTokenAlreadyUsedError",
  interfaces: [ErrorInterface],
});
