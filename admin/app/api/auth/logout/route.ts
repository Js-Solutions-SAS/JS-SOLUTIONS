import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { isSameOriginRequest } from "@/lib/auth/request";
import { revokeSession } from "@/lib/auth/session-revocation";
import { verifySessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request.headers)) {
    return NextResponse.json({ ok: false, error: "Solicitud invalida." }, { status: 403 });
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const session = await verifySessionToken(sessionToken);
    if (session) {
      revokeSession(session.sessionId, session.expiresAt);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
