/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// TODO: fix types
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

// type RecursivelyMapNullToUndefined and function mapNullToUndefined are both
// not perfect but should be enough for graphql args mapping

// https://github.com/apollographql/apollo-client/issues/2412#issuecomment-755449680

export type RecursivelyMapNullToUndefined<T> = T extends null
  ? undefined // Note: Add interfaces here of all GraphQL scalars that will be transformed into an object
  : T extends Date
  ? T
  : {
      [K in keyof T]: T[K] extends (infer U)[]
        ? RecursivelyMapNullToUndefined<U>[]
        : RecursivelyMapNullToUndefined<T[K]>;
    };

function isPlainObject(value: any): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

function mapValues<T>(
  object: Record<string, T>,
  iteratee: (value: T) => T,
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      // @ts-ignore
      result[key] = iteratee(object[key]);
    }
  }
  return result;
}

/**
 * recursivly maps all `null` values to `undefined`
 *
 * this can for example be used to convert gql args explicit nulls to undefined (= implicit nulls)
 */
export function mapNullToUndefined<T>(
  value: T,
): RecursivelyMapNullToUndefined<T> {
  if (isPlainObject(value)) {
    // @ts-ignore
    return mapValues(value, mapNullToUndefined);
  }
  if (isArray(value)) {
    // @ts-ignore
    return value.map(mapNullToUndefined);
  }
  if (value === null) {
    // @ts-ignore
    return undefined;
  }
  // @ts-ignore
  return value;
}
