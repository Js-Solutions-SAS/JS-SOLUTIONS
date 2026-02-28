interface HeaderReader {
  get(name: string): string | null;
}

export function getClientIp(headers: HeaderReader): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "0.0.0.0";
}

export function isSameOriginRequest(headers: HeaderReader): boolean {
  const originHeader = headers.get("origin");
  if (!originHeader) {
    return true;
  }

  const host = headers.get("x-forwarded-host") || headers.get("host");
  const protocol = headers.get("x-forwarded-proto") || "https";

  if (!host) {
    return false;
  }

  try {
    const origin = new URL(originHeader);
    return origin.host === host && origin.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
