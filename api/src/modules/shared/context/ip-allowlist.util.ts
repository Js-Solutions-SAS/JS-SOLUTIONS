function normalizeIp(raw: string): string {
  const value = raw.trim();

  if (value.startsWith('::ffff:')) {
    return value.replace('::ffff:', '');
  }

  return value;
}

function matchesPattern(ip: string, pattern: string): boolean {
  if (pattern === '*') {
    return true;
  }

  if (pattern.endsWith('*')) {
    return ip.startsWith(pattern.slice(0, -1));
  }

  return ip === pattern;
}

export function isIpAllowed(ip: string, allowlistRaw: string): boolean {
  const allowlist = allowlistRaw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return true;
  }

  const normalizedIp = normalizeIp(ip);

  return allowlist.some((pattern) => matchesPattern(normalizedIp, pattern));
}

export function extractRequestIp(input: {
  forwardedFor?: string | string[];
  remoteAddress?: string;
}): string {
  const forwarded = Array.isArray(input.forwardedFor)
    ? input.forwardedFor[0]
    : input.forwardedFor;

  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  return normalizeIp(input.remoteAddress || '');
}
