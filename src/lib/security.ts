import crypto from "node:crypto";

import { compare, hash } from "bcrypt";

import { config } from "../config";

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, config.security.bcryptSaltRounds);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await compare(password, hash);
}

export function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function compareToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

export function extractBearerToken(
  authorizationHeader: string | undefined | null
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  // ignore trailing whitespace, ignore extra whitespace between "Bearer" and the token
  const match = authorizationHeader.match(/^Bearer\s+(\S+)/);
  return match?.[1] ?? null;
}
