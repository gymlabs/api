import { IncomingMessage, ServerResponse } from "node:http";

import { AccessToken, User } from "@prisma/client";
import cookie from "cookie";
import { YogaInitialContext } from "graphql-yoga";
import { SetNonNullable } from "type-fest";

import { db } from "~/db";
import { InvalidAccessTokenError } from "~/errors";
import { extractBearerToken, hashToken } from "~/lib/security";

export async function getContext({
  request,
  req,
  res,
}: YogaInitialContext & {
  req: IncomingMessage;
  res: ServerResponse;
}) {
  const authorizationHeader = request.headers.get("Authorization");
  const cookieHeader = request.headers.get("Cookie");

  let bearerToken: string | null = null;
  // prefer authorization header and fallback to "bearerToken" cookie
  if (authorizationHeader) {
    bearerToken = extractBearerToken(authorizationHeader);
  } else if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader);
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

    // check token expiration
    const now = new Date();
    if (accessToken.expiresAt < now) {
      throw new InvalidAccessTokenError();
    }

    // authenicated viewer
    viewer = new Viewer({
      user: accessToken.user,
      accessToken,
    });
  } else {
    // anonymous viewer
    viewer = new Viewer();
  }

  return { request, viewer, accessToken: bearerToken, req, res };
}

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
