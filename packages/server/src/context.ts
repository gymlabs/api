import { IncomingMessage, ServerResponse } from "http";

import { AccessToken, User } from "@gymlabs/db";
import { parse } from "cookie";
import { SetNonNullable } from "type-fest";

import { db } from "./db";
import { extractBearerToken, hashToken } from "./lib/security";

// TODO: why does this not work
// interface ApplicationContext
//   extends BaseContext,
//     StandaloneServerContextFunctionArgument {}

export const getContext = async ({
  req,
  res,
}: {
  req: IncomingMessage;
  res: ServerResponse<IncomingMessage>;
}) => {
  const prisma = db;
  const authorizationHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;

  let bearerToken: string | null = null;
  if (authorizationHeader) {
    bearerToken = extractBearerToken(authorizationHeader);
  } else if (cookieHeader) {
    const cookies = parse(cookieHeader);
    bearerToken = cookies.accessToken ?? null;
  }

  let viewer: Viewer;
  if (bearerToken && bearerToken.length > 0) {
    const hashedBearerToken = hashToken(bearerToken);

    const accessToken = await db.accessToken.findUnique({
      where: { token: hashedBearerToken },
      include: { user: true },
    });

    const now = new Date();
    if (!accessToken) {
      viewer = new Viewer();
    } else if (accessToken.expiresAt < now) {
      viewer = new Viewer();
    } else {
      viewer = new Viewer({
        user: accessToken.user,
        accessToken,
      });
    }
  } else {
    viewer = new Viewer();
  }

  return { prisma, viewer, accessToken: bearerToken, req, res };
};

export type Context = Awaited<ReturnType<typeof getContext>>;

interface ViewerConstructorOptions {
  user: User;
  accessToken: AccessToken;
}

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
