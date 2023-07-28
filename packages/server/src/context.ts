import { BaseContext } from "@apollo/server";
import { StandaloneServerContextFunctionArgument } from "@apollo/server/dist/esm/standalone";
import { AccessToken, User } from "@gymlabs/db";
import { parse } from "cookie";
import { SetNonNullable } from "type-fest";

import { db } from "./db";
import { extractBearerToken, hashToken } from "./lib/security";
import { InvalidAccessTokenError } from "./schema/errors";

export const getContext = async ({
  req,
  res,
}: BaseContext & StandaloneServerContextFunctionArgument) => {
  const prisma = db;
  const authorizationHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;

  let bearerToken: string | null = null;
  if (authorizationHeader) {
    bearerToken = extractBearerToken(authorizationHeader);
  } else if (cookieHeader) {
    const cookies = parse(cookieHeader);
    bearerToken = cookies["accessToken"] ?? null;
  }

  let viewer: Viewer;
  if (bearerToken && bearerToken.length > 0) {
    const hashedBearerToken = hashToken(bearerToken);

    const accessToken = await db.accessToken.findUnique({
      where: { token: hashedBearerToken },
      include: { user: true },
    });

    if (!accessToken) {
      throw new InvalidAccessTokenError();
    }

    const now = new Date();
    if (accessToken.expiresAt < now) {
      throw new InvalidAccessTokenError();
    }

    viewer = new Viewer({
      user: accessToken.user,
      accessToken,
    });
  } else {
    viewer = new Viewer();
  }

  return { prisma, viewer, accessToken: bearerToken, req, res };
};

export type Context = Awaited<ReturnType<typeof getContext>>;

type ViewerConstructorOptions = {
  user: User;
  accessToken: AccessToken;
};

export class Viewer {
  readonly user: User | null;
  readonly accessToken: AccessToken | null;

  /**
   * creates a new viewer instance. if options are not provided, the viewer is
   * considered anonymous.
   */
  constructor(options?: ViewerConstructorOptions) {
    this.user = options?.user ?? null;
    this.accessToken = options?.accessToken ?? null;
  }

  isAuthenticated(): this is SetNonNullable<Viewer, "user" | "accessToken"> {
    return this.user !== null;
  }

  isAnonymous(): this is Viewer & { user: null; accessToken: null } {
    return !this.isAuthenticated();
  }
}
