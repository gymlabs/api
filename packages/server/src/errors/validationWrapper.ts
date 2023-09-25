import { ZodError, ZodType } from "zod";

import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthorizedError,
} from ".";

const validationWrapper = async <T, U>(
  toWrap: () => Promise<U>,
  validator: ZodType<T>,
  input: object,
) => {
  try {
    validator.parse(input);

    return await toWrap();
  } catch (err) {
    if (err instanceof ZodError) {
      throw new InvalidArgumentError(err.message);
    }
    if (err instanceof NotFoundError) {
      throw new NotFoundError(err.message);
    }
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError();
    }
    if (err instanceof InvalidArgumentError) {
      throw new InvalidArgumentError(err.message);
    }
    throw new InternalServerError();
  }
};

export default validationWrapper;
