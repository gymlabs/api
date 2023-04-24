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
      resolve: () => "An validation error occurred.",
    }),
    fieldErrors: t.field({
      type: [ZodFieldError],
      resolve: (err) => flattenErrors(err.format(), []),
    }),
  }),
});
