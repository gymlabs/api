import { ZodError, ZodType } from "zod";

import {
  InternalServerError,
  InvalidArgumentError,
  UnauthorizedError,
} from ".";

const validationWrapper = async <T, U>(
  toWrap: () => Promise<U>,
  validator: ZodType<T>,
  input: object
) => {
  try {
    try {
      validator.parse(input);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new InvalidArgumentError(e.message);
      }
      throw e;
    }

    return await toWrap();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw new UnauthorizedError();
    throw new InternalServerError();
  }
};

export default validationWrapper;
