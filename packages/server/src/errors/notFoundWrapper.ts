import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";

import { NotFoundError } from ".";

/**
 * @function notFoundWrapper
 * @template T
 * @param {() => Promise<T>} toWrap - the prisma delete/update query to wrap.
 * @param {string} entity - the entity type to delete/update.
 * @returns {Promise<T>} The result of the prisma query.
 * @throws {NotFoundError} If the wrapped function throws a PrismaClientKnownRequestError with code "P2025".
 * @throws {Error} If the wrapped function throws any other error.
 */
export const notFoundWrapper = async <T>(
  toWrap: () => Promise<T>,
  entity: string,
): Promise<Exclude<T, null>> => {
  try {
    const result = await toWrap();
    if (!result) {
      throw new NotFoundError(entity);
    }
    return result as Exclude<T, null>;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      throw new NotFoundError(entity);
    }
    throw e;
  }
};
