import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_AUTH_REDIRECT,
  LOGIN_PATH,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { isAuthConfigured } from "@/lib/auth/env";
import { sanitizeRedirectPath } from "@/lib/auth/request";
import { verifySessionToken } from "@/lib/auth/session";

function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH;
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const nextPath = sanitizeRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const loginUrl = new URL(LOGIN_PATH, request.url);

  if (nextPath !== LOGIN_PATH) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthConfigured()) {
    if (pathname === LOGIN_PATH) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;

  if (isPublicPath(pathname)) {
    if (!session) {
      return NextResponse.next();
    }

    const nextPath = sanitizeRedirectPath(
      request.nextUrl.searchParams.get("next") || DEFAULT_AUTH_REDIRECT,
    );

    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
