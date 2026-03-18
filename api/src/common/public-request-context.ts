import type { Request } from 'express';

export type PublicRequestContext = {
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
  sourceUrl?: string;
  referrer?: string;
};

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex <= 0) return acc;
      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function resolveProtocol(req: Request): string {
  const forwarded = req.headers['x-forwarded-proto'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.protocol || 'https';
}

function resolveHost(req: Request): string {
  const forwardedHost = req.headers['x-forwarded-host'];
  if (typeof forwardedHost === 'string' && forwardedHost.trim()) {
    return forwardedHost.split(',')[0].trim();
  }
  const host = req.headers.host;
  return typeof host === 'string' ? host.trim() : '';
}

function resolveClientIp(req: Request): string | undefined {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || undefined;
  }

  return req.ip || undefined;
}

export function extractPublicRequestContext(req: Request): PublicRequestContext {
  const cookies = parseCookieHeader(req.headers.cookie);
  const protocol = resolveProtocol(req);
  const host = resolveHost(req);
  const sourceUrl =
    host && req.originalUrl ? `${protocol}://${host}${req.originalUrl}` : undefined;

  const userAgentHeader = req.headers['user-agent'];

  return {
    clientIpAddress: resolveClientIp(req),
    clientUserAgent:
      typeof userAgentHeader === 'string' ? userAgentHeader : undefined,
    fbc: cookies._fbc || undefined,
    fbp: cookies._fbp || undefined,
    sourceUrl,
    referrer:
      typeof req.headers.referer === 'string' ? req.headers.referer : undefined,
  };
}
