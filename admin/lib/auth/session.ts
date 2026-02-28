import { SignJWT, jwtVerify } from "jose";

import {
  REMEMBER_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/constants";
import { getAuthConfig } from "@/lib/auth/env";
import { isSessionRevoked } from "@/lib/auth/session-revocation";

const SESSION_ALGORITHM = "HS256";

export interface AuthSession {
  username: string;
  sessionId: string;
  remember: boolean;
  expiresAt: number;
}

interface IssueSessionInput {
  username: string;
  remember: boolean;
}

function getSessionSecret(): Uint8Array {
  const { sessionSecret } = getAuthConfig();
  return new TextEncoder().encode(sessionSecret);
}

export async function issueSessionToken(input: IssueSessionInput): Promise<{
  token: string;
  expiresAt: number;
}> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = input.remember
    ? REMEMBER_SESSION_TTL_SECONDS
    : SESSION_TTL_SECONDS;
  const expiresAt = nowSeconds + ttlSeconds;

  const token = await new SignJWT({
    sub: input.username,
    sid: crypto.randomUUID(),
    remember: input.remember,
  })
    .setProtectedHeader({ alg: SESSION_ALGORITHM, typ: "JWT" })
    .setIssuedAt(nowSeconds)
    .setNotBefore(nowSeconds)
    .setExpirationTime(expiresAt)
    .sign(getSessionSecret());

  return {
    token,
    expiresAt,
  };
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: [SESSION_ALGORITHM],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (isSessionRevoked(payload.sid)) {
      return null;
    }

    return {
      username: payload.sub,
      sessionId: payload.sid,
      remember: payload.remember === true,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
