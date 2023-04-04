import { GraphQLError } from "graphql";

export class ForbiddenError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Forbidden.", { extensions: { code: "FORBIDDEN" } });
    this.name = "ForbiddenError";
  }
}

export class AccessRightError extends ForbiddenError {
  constructor() {
    super("You don't have the required permissions to perform this action.");
    this.name = "AccessRightError";
  }
}

export class InvalidAccessTokenError extends GraphQLError {
  constructor(message?: string) {
    super(message ?? "Invalid access token.", {
      extensions: { code: "INVALID_ACCESS_TOKEN" },
    });
    this.name = "InvalidAccessTokenError";
  }
}
