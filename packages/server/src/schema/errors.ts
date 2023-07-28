import { GraphQLError } from "graphql";
import { ZodError, ZodFormattedError } from "zod";

import { builder } from "./builder";

// https://pothos-graphql.dev/docs/plugins/errors

/* ------------------------------- Interfaces ------------------------------- */

export const ErrorInterface = builder.interfaceRef<Error>("Error").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
});

/* ------------------------------- Base Error ------------------------------- */

// NOTE: never expose the default Error class to the client
// the default error and errors that are not explicitly registerd with objectType
// and {errors: { type: [MyError] }} should not be "real" gql errors and not exposed
// to the client
builder.objectType(Error, {
  name: "BaseError",
  interfaces: [ErrorInterface],
});

/* ---------------------------- Validation Error ---------------------------- */

function flattenErrors(
  error: ZodFormattedError<unknown>,
  path: string[]
): { path: string[]; message: string }[] {
  // eslint-disable-next-line no-underscore-dangle
  const errors = error._errors.map((message) => ({
    path,
    message,
  }));

  Object.keys(error).forEach((key) => {
    if (key !== "_errors") {
      errors.push(
        ...flattenErrors(
          (error as Record<string, unknown>)[key] as ZodFormattedError<unknown>,
          [...path, key]
        )
      );
    }
  });

  return errors;
}

// A type for the individual validation issues
export const ZodFieldError = builder
  .objectRef<{
    message: string;
    path: string[];
  }>("ValidationErrorField")
  .implement({
    fields: (t) => ({
      message: t.exposeString("message"),
      path: t.exposeStringList("path"),
    }),
  });

// The actual error type
builder.objectType(ZodError, {
  name: "ValidationError",
  interfaces: [ErrorInterface],
  fields: (t) => ({
    message: t.string({
      resolve: () => "A validation error occurred.",
    }),
    fieldErrors: t.field({
      type: [ZodFieldError],
      resolve: (err) => flattenErrors(err.format(), []),
    }),
  }),
});

/* ------------------------------- Other Errors ------------------------------ */

export class NotFoundError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Not found.", { extensions: { code: "NOT_FOUND" } });
    this.name = "NotFoundError";
  }
}

builder.objectType(NotFoundError, {
  name: "NotFoundError",
  interfaces: [ErrorInterface],
});

export class InternalServerError extends GraphQLError {
  constructor() {
    super("Internal server error.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
    this.name = "InternalServerError";
  }
}

builder.objectType(InternalServerError, {
  name: "InternalServerError",
  interfaces: [ErrorInterface],
});

export class InvalidArgumentError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Invalid argument.", {
      extensions: { code: "INVALID_ARGUMENT" },
    });
    this.name = "InvalidArgumentError";
  }
}

builder.objectType(InvalidArgumentError, {
  name: "InvalidArgumentError",
  interfaces: [ErrorInterface],
});

export class UnauthenticatedError extends GraphQLError {
  constructor() {
    super("Unauthenticated.", { extensions: { code: "UNAUTHENTICATED" } });
    this.name = "UnauthenticatedError";
  }
}

builder.objectType(UnauthenticatedError, {
  name: "UnauthenticatedError",
  interfaces: [ErrorInterface],
});

export class UnauthorizedError extends GraphQLError {
  constructor() {
    super("Unauthorized.", { extensions: { code: "UNAUTHORIZED" } });
    this.name = "UnauthorizedError";
  }
}

builder.objectType(UnauthorizedError, {
  name: "UnauthorizedError",
  interfaces: [ErrorInterface],
});

export class ForbiddenError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Forbidden.", { extensions: { code: "FORBIDDEN" } });
    this.name = "ForbiddenError";
  }
}

builder.objectType(ForbiddenError, {
  name: "ForbiddenError",
  interfaces: [ErrorInterface],
});

export class InvalidAccessTokenError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Invalid access token.", {
      extensions: { code: "INVALID_ACCESS_TOKEN" },
    });
    this.name = "InvalidAccessTokenError";
  }
}

builder.objectType(InvalidAccessTokenError, {
  name: "InvalidAccessTokenError",
  interfaces: [ErrorInterface],
});

/* ------------------------------- User/Core Errors ------------------------------ */

export class EmailAlreadyInUseError extends GraphQLError {
  email: string;

  constructor(email: string) {
    super(`Email already in use.`, {
      extensions: { code: "EMAIL_ALREADY_IN_USE" },
    });

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

export class InvalidCredentialsError extends GraphQLError {
  constructor() {
    super("Invalid email or password.", {
      extensions: { code: "INVALID_CREDENTIALS" },
    });
    this.name = "InvalidCredentialsError";
  }
}

builder.objectType(InvalidCredentialsError, {
  name: "InvalidCredentialsError",
  interfaces: [ErrorInterface],
});

export class InvalidEmailVerificationTokenError extends GraphQLError {
  constructor() {
    super("Invalid email verification token.", {
      extensions: { code: "INVALID_EMAIL_VERIFICATION_TOKEN" },
    });
    this.name = "InvalidEmailVerificationTokenError";
  }
}

builder.objectType(InvalidEmailVerificationTokenError, {
  name: "InvalidEmailVerificationTokenError",
  interfaces: [ErrorInterface],
});

export class InvalidResetPasswordTokenError extends GraphQLError {
  constructor() {
    super("Invalid reset password token.", {
      extensions: { code: "INVALID_RESET_PASSWORD_TOKEN" },
    });
    this.name = "InvalidResetPasswordTokenError";
  }
}

builder.objectType(InvalidResetPasswordTokenError, {
  name: "InvalidResetPasswordTokenError",
  interfaces: [ErrorInterface],
});

export class ResetPasswordTokenExpiredError extends GraphQLError {
  constructor() {
    super("Password reset token expired.", {
      extensions: { code: "RESET_PASSWORD_TOKEN_EXPIRED" },
    });
    this.name = "ResetPasswordTokenExpiredError";
  }
}

builder.objectType(ResetPasswordTokenExpiredError, {
  name: "ResetPasswordTokenExpiredError",
  interfaces: [ErrorInterface],
});

export class ResetPasswordTokenAlreadyUsedError extends GraphQLError {
  constructor() {
    super("Password reset token already used.", {
      extensions: { code: "RESET_PASSWORD_TOKEN_ALREADY_USED" },
    });
    this.name = "ResetPasswordTokenAlreadyUsedError";
  }
}

builder.objectType(ResetPasswordTokenAlreadyUsedError, {
  name: "ResetPasswordTokenAlreadyUsedError",
  interfaces: [ErrorInterface],
});

export class ChangeMailTokenExpiredError extends GraphQLError {
  constructor() {
    super("Change mail token expired.", {
      extensions: { code: "CHANGE_MAIL_TOKEN_EXPIRED" },
    });
    this.name = "ChangeMailTokenExpiredError";
  }
}

builder.objectType(ChangeMailTokenExpiredError, {
  name: "ChangeMailTokenExpiredError",
  interfaces: [ErrorInterface],
});

export class ChangeMailTokenAlreadyUsedError extends GraphQLError {
  constructor() {
    super("Change mail token already used.", {
      extensions: { code: "CHANGE_MAIL_TOKEN_ALREADY_USED" },
    });
    this.name = "ChangeMailTokenAlreadyUsedError";
  }
}

builder.objectType(ChangeMailTokenAlreadyUsedError, {
  name: "ChangeMailTokenAlreadyUsedError",
  interfaces: [ErrorInterface],
});

export class UserHasMembershipsOrEmploymentsError extends GraphQLError {
  constructor() {
    super("User has memberships or employments.", {
      extensions: { code: "USER_HAS_MEMBERSHIPS_OR_EMPLOYMENTS" },
    });
    this.name = "UserHasMembershipsOrEmploymentsError";
  }
}

builder.objectType(UserHasMembershipsOrEmploymentsError, {
  name: "UserHasMembershipsOrEmploymentsError",
  interfaces: [ErrorInterface],
});

export class InvalidReactivationTokenError extends GraphQLError {
  constructor() {
    super("Invalid reactivation token.", {
      extensions: { code: "INVALID_REACTIVATION_TOKEN" },
    });
    this.name = "InvalidReactivationTokenError";
  }
}

builder.objectType(InvalidReactivationTokenError, {
  name: "InvalidReactivationTokenError",
  interfaces: [ErrorInterface],
});

export class ReactivationTokenExpiredError extends GraphQLError {
  constructor() {
    super("Reactivation token expired.", {
      extensions: { code: "REACTIVATION_TOKEN_EXPIRED" },
    });
    this.name = "ReactivationTokenExpiredError";
  }
}

builder.objectType(ReactivationTokenExpiredError, {
  name: "ReactivationTokenExpiredError",
  interfaces: [ErrorInterface],
});
